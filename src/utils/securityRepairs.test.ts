import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { deleteField, serverTimestamp } from 'firebase/firestore';
import {
  buildUnavailableLocalityAlert,
  createDefaultRoutingConfig,
  evaluatePublicRiderCardsForOrder,
  INITIAL_SERVICE_LOCALITIES
} from './hyperlocalRouting.ts';
import { cleanForFirestore } from './firestoreClean.ts';
import { PublicRiderCard } from '../types.ts';

const ROOT_DIR = path.resolve(process.cwd());
const RULES_TEXT = fs.readFileSync(path.join(ROOT_DIR, 'firestore.rules'), 'utf8');
const APP_TEXT = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');

test('firestore.rules enforces strict linkedEntityId and removes all optional linkedEntityId or UID fallbacks', () => {
  const hasPartnerForEntityBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('function hasPartnerAccountForEntity('),
    RULES_TEXT.indexOf('function isApprovedShopOwner(')
  );
  assert.ok(hasPartnerForEntityBlock.includes("('linkedEntityId' in get(/databases/$(database)/documents/partnerAccounts/$(request.auth.uid)).data)"));
  assert.ok(!hasPartnerForEntityBlock.includes("!('linkedEntityId' in"));
  assert.ok(!RULES_TEXT.includes('shopOwnerId == request.auth.uid'));
  assert.ok(!RULES_TEXT.includes('driverOwnerId == request.auth.uid'));
  assert.ok(!RULES_TEXT.includes('providerOwnerId == request.auth.uid'));
  assert.ok(!RULES_TEXT.includes('doctorOwnerId == request.auth.uid'));
  assert.ok(!RULES_TEXT.includes('resolvePartnerRole'));
});

test('firestore.rules protects products, scrapRequests, public directories, adminActivity, routingAlerts, and customer cancel stages', () => {
  // Products owner read requires isApprovedShopOwner
  const productsBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /products/{productId}'),
    RULES_TEXT.indexOf('match /publicProducts/{productId}')
  );
  assert.ok(productsBlock.includes('isApprovedShopOwner(existing().shopId)'));

  // Scrap requests selectedBuyerId requires hasPartnerRole(['kabari'])
  const scrapBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /scrapRequests/{requestId}'),
    RULES_TEXT.indexOf('match /doctors/{doctorId}')
  );
  assert.ok(scrapBlock.includes("hasPartnerRole(['kabari']) && 'selectedBuyerId' in existing()"));

  // Admin activity is append-only (no update/delete)
  const activityBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /adminActivity/{activityId}'),
    RULES_TEXT.indexOf('match /admins/{adminId}')
  );
  assert.ok(activityBlock.includes('allow update, delete: if false;'));

  // Public shops/riders/doctors/providers/jobs enforce isAfter*ApprovedWithActiveOwner and live get checks
  assert.ok(RULES_TEXT.includes('isAfterShopApprovedWithActiveOwner(shopId, incoming().status)'));
  assert.ok(RULES_TEXT.includes('isAfterRiderApprovedWithActiveOwner(riderId, incoming().status)'));
  assert.ok(RULES_TEXT.includes('isAfterDoctorApprovedWithActiveOwner(doctorId, incoming().status)'));
  assert.ok(RULES_TEXT.includes('isAfterProviderApprovedWithActiveOwner(providerId, incoming().status)'));
  assert.ok(RULES_TEXT.includes('isAfterJobApprovedWithActiveOwner(jobId, incoming().status)'));

  // Orders enforce active/online/locality checks on rider dispatch & customer cancel up to preparing
  const ordersBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /orders/{orderId}'),
    RULES_TEXT.indexOf('match /localities/{localityId}')
  );
  assert.ok(ordersBlock.includes("existing().status in ['pending', 'placed', 'confirmed', 'preparing', 'packed', 'ready_for_dispatch']"));
  assert.ok(ordersBlock.includes('isEligibleOnlineDeliveryRiderForShop'));

  // Routing alerts require deterministic rt-alert-<requestId> and existsAfter/getAfter match
  assert.ok(RULES_TEXT.includes("data.id == ('rt-alert-' + data.requestId)"));
  assert.ok(RULES_TEXT.includes('existsAfter(/databases/$(database)/documents/orders/$(data.requestId))'));
});

test('cleanForFirestore preserves Firestore FieldValue sentinels and Date while stripping undefined plain keys', () => {
  const delSentinel = deleteField();
  const tsSentinel = serverTimestamp();
  const nowDate = new Date('2026-03-01T00:00:00.000Z');
  const cleaned = cleanForFirestore({
    status: 'active',
    optionalUndefined: undefined,
    suspendedEntityPreviousStatus: delSentinel,
    serverTs: tsSentinel,
    createdDate: nowDate,
    nested: { keep: 1, drop: undefined }
  }) as Record<string, unknown>;

  assert.equal(cleaned.status, 'active');
  assert.equal('optionalUndefined' in cleaned, false);
  assert.equal(cleaned.suspendedEntityPreviousStatus, delSentinel);
  assert.equal(cleaned.serverTs, tsSentinel);
  assert.equal(cleaned.createdDate, nowDate);
  assert.deepEqual(cleaned.nested, { keep: 1 });
});

test('evaluatePublicRiderCardsForOrder respects live PublicRiderCard availability, locality, and accountStatus', () => {
  const config = createDefaultRoutingConfig({ localities: INITIAL_SERVICE_LOCALITIES });
  config.rulesByLocality['Satali'].deliveryRiderIds = ['del-satali-online', 'del-satali-suspended-acc'];
  config.rulesByLocality['Jaigaon'].deliveryRiderIds = ['del-jaigaon-online'];
  const cards: PublicRiderCard[] = [
    {
      id: 'del-satali-online',
      name: 'Bikram',
      locality: 'Satali',
      currentLocation: 'Satali',
      servedLocalities: ['Satali'],
      status: 'approved',
      isOnline: true,
      accountStatus: 'active',
      rating: 4.9
    },
    {
      id: 'del-satali-suspended-acc',
      name: 'Raju',
      locality: 'Satali',
      currentLocation: 'Satali',
      status: 'approved',
      isOnline: true,
      accountStatus: 'suspended',
      rating: 4.7
    },
    {
      id: 'del-jaigaon-online',
      name: 'Nabin',
      locality: 'Jaigaon',
      currentLocation: 'Jaigaon',
      servedLocalities: ['Jaigaon'],
      status: 'approved',
      isOnline: true,
      accountStatus: 'active',
      rating: 4.8
    }
  ];

  const evalSatali = evaluatePublicRiderCardsForOrder({
    pickupLocality: 'Satali',
    config,
    approvedRiders: cards,
    localities: INITIAL_SERVICE_LOCALITIES
  });
  assert.deepEqual(evalSatali.eligible.map((e) => e.partnerId), ['del-satali-online']);
  assert.equal(
    evalSatali.ineligible.some((r) => r.partnerId === 'del-satali-suspended-acc'),
    true
  );
  assert.equal(
    evalSatali.ineligible.some((r) => r.partnerId === 'del-jaigaon-online'),
    true
  );
});

test('buildUnavailableLocalityAlert preserves exact sub-locality string so firestore.rules getAfter check passes', () => {
  const alert = buildUnavailableLocalityAlert({
    requestId: 'TB-9012',
    serviceCategory: 'shop_order',
    requestLocality: 'Purba Satali'
  });
  assert.equal(alert.id, 'rt-alert-TB-9012');
  assert.equal(alert.requestLocality, 'Purba Satali');
});

test('App.tsx eliminates demo mock data seeds and respects <= 8 chunk sizes on Firestore IN queries', () => {
  assert.ok(!APP_TEXT.includes('INITIAL_SHOPS'));
  assert.ok(!APP_TEXT.includes('ALL_PRODUCTS'));
  assert.ok(!APP_TEXT.includes('INITIAL_DRIVERS'));
  assert.ok(!APP_TEXT.includes('INITIAL_DELIVERY_PERSONS'));
  assert.ok(!APP_TEXT.includes('INITIAL_DOCTORS'));
  assert.ok(!APP_TEXT.includes('INITIAL_SERVICE_PROVIDERS'));
  assert.ok(!APP_TEXT.includes('INITIAL_JOB_LISTINGS'));
  assert.ok(APP_TEXT.includes('uniqueShopIds.slice(i, i + 8)'));
  assert.ok(APP_TEXT.includes('ownedJobIds.slice(i, i + 8)'));
});
