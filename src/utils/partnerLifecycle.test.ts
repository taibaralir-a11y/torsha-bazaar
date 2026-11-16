import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAccountStatusSyncPlan,
  buildManualEntityStatusAccountPatch,
  canShopkeeperMutateCatalog,
  computeReactivatedEntityStatus,
  isEntityBlockedOrSuspended,
  isPartnerAccountOperational,
  resolvePartnerAccountStatusForEntityStatus,
  resolveShopTypeFromCategory
} from './partnerLifecycle.ts';
import { PartnerAccount, Shop } from '../types.ts';

function makePartnerAccount(overrides: Partial<PartnerAccount> = {}): PartnerAccount {
  return {
    uid: 'uid-partner-1',
    role: 'shopkeeper',
    displayName: 'Test Partner',
    loginEmail: 'partner@torshabazaar.in',
    linkedEntityId: 'shop-1',
    status: 'active',
    assignedBy: 'taibaralir@gmail.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'shop-1',
    ownerId: 'uid-partner-1',
    name: 'Satali Grocery Store',
    address: 'Satali Main Road',
    locality: 'Satali',
    pincode: '735214',
    contactNumber: '+919832000001',
    imageUrl: 'https://example.com/shop.jpg',
    category: 'Grocery & Ration',
    shopType: 'grocery',
    status: 'approved',
    isVerified: true,
    isOpen: true,
    deliveryAreas: ['Satali'],
    deliveryCharge: 20,
    deliveryRadiusKm: 8,
    ...overrides
  };
}

test('resolveShopTypeFromCategory maps all supported categories accurately', () => {
  assert.equal(resolveShopTypeFromCategory('Grocery & Ration'), 'grocery');
  assert.equal(resolveShopTypeFromCategory('Medical & Pharmacy'), 'medical');
  assert.equal(resolveShopTypeFromCategory('Meat, Chicken & Fish'), 'meat');
  assert.equal(resolveShopTypeFromCategory('New Mobile & Accessories'), 'mobile');
  assert.equal(resolveShopTypeFromCategory('General & Household'), 'general');
});

test('computeReactivatedEntityStatus restores approved, preserves rejected/pending, and never auto-approves unknown', () => {
  assert.equal(computeReactivatedEntityStatus('approved', 'suspended'), 'approved');
  assert.equal(computeReactivatedEntityStatus('pending', 'suspended'), 'pending');
  assert.equal(computeReactivatedEntityStatus('rejected', 'suspended'), 'rejected');
  assert.equal(computeReactivatedEntityStatus('approved', 'rejected'), 'rejected');
  assert.equal(computeReactivatedEntityStatus(undefined, 'approved'), 'approved');
  assert.equal(computeReactivatedEntityStatus(undefined, 'suspended'), 'pending');
});

test('buildAccountStatusSyncPlan handles suspend, double-suspend, and reactivation cleanly with clearSuspendedPreviousStatus', () => {
  const activeAcc = makePartnerAccount({ status: 'active', role: 'shopkeeper' });

  // First suspension records prior 'approved' status
  const suspendPlan = buildAccountStatusSyncPlan({
    account: activeAcc,
    targetStatus: 'suspended',
    currentEntityStatus: 'approved',
    now: '2026-02-01T10:00:00.000Z'
  });
  assert.equal(suspendPlan.accountPatch.status, 'suspended');
  assert.equal(suspendPlan.accountPatch.suspendedEntityPreviousStatus, 'approved');
  assert.equal(suspendPlan.nextEntityStatus, 'suspended');
  assert.equal(suspendPlan.clearSuspendedPreviousStatus, false);

  // Double-suspend preserves the original prior 'approved' status (never overwrites with 'suspended')
  const suspendedAcc = makePartnerAccount({
    ...activeAcc,
    status: 'suspended',
    suspendedEntityPreviousStatus: 'approved'
  });
  const doubleSuspendPlan = buildAccountStatusSyncPlan({
    account: suspendedAcc,
    targetStatus: 'suspended',
    currentEntityStatus: 'suspended',
    now: '2026-02-02T10:00:00.000Z'
  });
  assert.equal(doubleSuspendPlan.accountPatch.suspendedEntityPreviousStatus, 'approved');
  assert.equal(doubleSuspendPlan.nextEntityStatus, 'suspended');
  assert.equal(doubleSuspendPlan.clearSuspendedPreviousStatus, false);

  // Reactivation restores 'approved' and clears suspendedEntityPreviousStatus
  const reactivateApproved = buildAccountStatusSyncPlan({
    account: suspendedAcc,
    targetStatus: 'active',
    currentEntityStatus: 'suspended',
    now: '2026-02-03T10:00:00.000Z'
  });
  assert.equal(reactivateApproved.accountPatch.status, 'active');
  assert.equal(reactivateApproved.nextEntityStatus, 'approved');
  assert.equal(reactivateApproved.clearSuspendedPreviousStatus, true);

  // Reactivating a previously rejected entity keeps it rejected
  const rejectedSuspendedAcc = makePartnerAccount({
    ...activeAcc,
    status: 'suspended',
    suspendedEntityPreviousStatus: 'rejected'
  });
  const reactivateRejected = buildAccountStatusSyncPlan({
    account: rejectedSuspendedAcc,
    targetStatus: 'active',
    currentEntityStatus: 'suspended'
  });
  assert.equal(reactivateRejected.accountPatch.status, 'active');
  assert.equal(reactivateRejected.nextEntityStatus, 'rejected');
  assert.equal(reactivateRejected.clearSuspendedPreviousStatus, true);

  // Reactivating a previously pending entity keeps it pending
  const pendingSuspendedAcc = makePartnerAccount({
    ...activeAcc,
    status: 'suspended',
    suspendedEntityPreviousStatus: 'pending'
  });
  const reactivatePending = buildAccountStatusSyncPlan({
    account: pendingSuspendedAcc,
    targetStatus: 'active',
    currentEntityStatus: 'suspended'
  });
  assert.equal(reactivatePending.nextEntityStatus, 'pending');
  assert.equal(reactivatePending.clearSuspendedPreviousStatus, true);
});

test('buildAccountStatusSyncPlan supports account-only roles without entities (employer, kabari)', () => {
  const employerAcc = makePartnerAccount({
    uid: 'uid-emp-1',
    role: 'employer',
    linkedEntityId: undefined,
    status: 'active'
  });
  const suspendPlan = buildAccountStatusSyncPlan({
    account: employerAcc,
    targetStatus: 'suspended',
    currentEntityStatus: undefined
  });
  assert.equal(suspendPlan.accountPatch.status, 'suspended');
  assert.equal(suspendPlan.nextEntityStatus, undefined);

  const reactivatePlan = buildAccountStatusSyncPlan({
    account: { ...employerAcc, status: 'suspended' },
    targetStatus: 'active',
    currentEntityStatus: undefined
  });
  assert.equal(reactivatePlan.accountPatch.status, 'active');
  assert.equal(reactivatePlan.nextEntityStatus, undefined);
  assert.equal(reactivatePlan.clearSuspendedPreviousStatus, true);
});

test('buildManualEntityStatusAccountPatch clears stale prior approval and tracks pending transitions safely', () => {
  const suspendedAccWithPriorApproved = makePartnerAccount({
    status: 'suspended',
    suspendedEntityPreviousStatus: 'approved'
  });

  // Moving a suspended shop manually to 'rejected' must clear prior 'approved' memory
  const rejectedPatch = buildManualEntityStatusAccountPatch({
    entityStatus: 'rejected',
    currentAccount: suspendedAccWithPriorApproved,
    previousEntityStatus: 'suspended'
  });
  assert.equal(rejectedPatch.status, 'suspended');
  assert.equal(rejectedPatch.clearSuspendedPreviousStatus, true);

  // Moving a suspended shop manually to 'pending' keeps account suspended & sets prior memory to 'pending'
  const pendingPatch = buildManualEntityStatusAccountPatch({
    entityStatus: 'pending',
    currentAccount: suspendedAccWithPriorApproved,
    previousEntityStatus: 'suspended'
  });
  assert.equal(pendingPatch.status, 'suspended');
  assert.equal(pendingPatch.suspendedEntityPreviousStatus, 'pending');
  assert.equal(pendingPatch.clearSuspendedPreviousStatus, false);

  // Manually approving reactivates account and clears prior memory
  const approvedPatch = buildManualEntityStatusAccountPatch({
    entityStatus: 'approved',
    currentAccount: suspendedAccWithPriorApproved,
    previousEntityStatus: 'suspended'
  });
  assert.equal(approvedPatch.status, 'active');
  assert.equal(approvedPatch.clearSuspendedPreviousStatus, true);
});

test('resolvePartnerAccountStatusForEntityStatus keeps bidirectional sync consistent', () => {
  assert.equal(resolvePartnerAccountStatusForEntityStatus('suspended', 'active'), 'suspended');
  assert.equal(resolvePartnerAccountStatusForEntityStatus('rejected', 'active'), 'suspended');
  assert.equal(resolvePartnerAccountStatusForEntityStatus('approved', 'suspended'), 'active');
  assert.equal(resolvePartnerAccountStatusForEntityStatus('pending', 'active'), 'active');
});

test('isPartnerAccountOperational & canShopkeeperMutateCatalog enforce strict active role, non-empty linkedEntityId & approval checks', () => {
  const activeShopAcc = makePartnerAccount({ role: 'shopkeeper', status: 'active', linkedEntityId: 'shop-1' });
  const missingLinkAcc = makePartnerAccount({ role: 'shopkeeper', status: 'active', linkedEntityId: undefined });
  const suspendedShopAcc = makePartnerAccount({ role: 'shopkeeper', status: 'suspended', linkedEntityId: 'shop-1' });
  const approvedShop = makeShop({ id: 'shop-1', status: 'approved' });
  const suspendedShop = makeShop({ id: 'shop-1', status: 'suspended' });
  const otherShop = makeShop({ id: 'shop-999', status: 'approved' });

  assert.equal(isPartnerAccountOperational(activeShopAcc, 'shopkeeper', 'approved'), true);
  assert.equal(isPartnerAccountOperational(suspendedShopAcc, 'shopkeeper', 'approved'), false);
  assert.equal(isPartnerAccountOperational(activeShopAcc, 'shopkeeper', 'suspended'), false);
  assert.equal(isPartnerAccountOperational(activeShopAcc, 'driver', 'approved'), false);

  assert.equal(canShopkeeperMutateCatalog({ isAdmin: false, account: activeShopAcc, shop: approvedShop }), true);
  assert.equal(canShopkeeperMutateCatalog({ isAdmin: false, account: missingLinkAcc, shop: approvedShop }), false);
  assert.equal(canShopkeeperMutateCatalog({ isAdmin: false, account: suspendedShopAcc, shop: approvedShop }), false);
  assert.equal(canShopkeeperMutateCatalog({ isAdmin: false, account: activeShopAcc, shop: suspendedShop }), false);
  assert.equal(canShopkeeperMutateCatalog({ isAdmin: false, account: activeShopAcc, shop: otherShop }), false);
  assert.equal(canShopkeeperMutateCatalog({ isAdmin: true, account: null, shop: suspendedShop }), true);

  assert.equal(isEntityBlockedOrSuspended(approvedShop, suspendedShopAcc), true);
  assert.equal(isEntityBlockedOrSuspended(suspendedShop, activeShopAcc), true);
  assert.equal(isEntityBlockedOrSuspended(approvedShop, activeShopAcc), false);
});
