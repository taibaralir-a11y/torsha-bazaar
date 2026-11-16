import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_HUB_LOCALITIES,
  INITIAL_SERVICE_LOCALITIES,
  createDefaultRoutingConfig,
  syncPartnerIntoRoutingConfig,
  getEligiblePartnersForRequest,
  getEligibleDeliveryRidersForOrder,
  validateAndBuildAssignmentAudit,
  buildUnavailableLocalityAlert,
  resolveAreaKey
} from './hyperlocalRouting.ts';
import {
  INITIAL_SHOPS,
  INITIAL_DELIVERY_PERSONS,
  INITIAL_DRIVERS,
  INITIAL_SERVICE_PROVIDERS
} from '../data/mockData.ts';
import { PartnerAccount, UniversalRoutingConfig } from '../types.ts';

function buildBaseConfig(): UniversalRoutingConfig {
  return createDefaultRoutingConfig({
    localities: INITIAL_SERVICE_LOCALITIES,
    shops: INITIAL_SHOPS,
    deliveryPersons: INITIAL_DELIVERY_PERSONS,
    drivers: INITIAL_DRIVERS,
    serviceProviders: INITIAL_SERVICE_PROVIDERS
  });
}

test('Default routing config strictly isolates Hasimara, Satali, Kalchini, and Jaigaon across all 4 services', () => {
  const config = buildBaseConfig();

  assert.equal(config.globalCrossLocalityEnabled, false);
  for (const hub of CORE_HUB_LOCALITIES) {
    const rule = config.rulesByLocality[hub];
    assert.ok(rule, `Rule must exist for ${hub}`);
    assert.equal(rule.crossLocalityEnabled, false);
    assert.deepEqual(rule.nearbyLocalities, []);
  }

  // 1. Shop Order in Hasimara: only Hasimara shops eligible; Satali/Kalchini/Jaigaon shops blocked
  const shopRes = getEligiblePartnersForRequest({
    serviceCategory: 'shop_order',
    requestLocality: 'Hasimara',
    config,
    shops: INITIAL_SHOPS
  });
  assert.deepEqual(
    shopRes.eligible.map((r) => r.partnerId),
    ['shop-hasimara-medico-2']
  );
  assert.ok(shopRes.ineligible.some((r) => r.partnerId === 'shop-jaigaon-mobile-4'));
  assert.ok(shopRes.ineligible.some((r) => r.partnerId === 'shop-satali-mandi-6'));

  // 2. Parcel Delivery in Hasimara: only Subhasish (Hasimara) eligible; Jaigaon rider Dipak strictly blocked
  const deliveryRes = getEligiblePartnersForRequest({
    serviceCategory: 'delivery',
    requestLocality: 'Hasimara',
    config,
    deliveryPersons: INITIAL_DELIVERY_PERSONS
  });
  assert.deepEqual(
    deliveryRes.eligible.map((r) => r.partnerId),
    ['del-subhasish-2']
  );
  const dipakReport = deliveryRes.ineligible.find((r) => r.partnerId === 'del-dipak-4');
  assert.ok(dipakReport);
  assert.ok(dipakReport.reasons.some((reason) => reason.includes('cross-locality disabled')));

  // 4. Ride Booking (Toto) in Satali: only Sanjay Oraon (Satali Toto) eligible; Hasimara/Kalchini/Jaigaon blocked
  const rideRes = getEligiblePartnersForRequest({
    serviceCategory: 'ride',
    requestLocality: 'Satali',
    requestedVehicleType: 'toto',
    config,
    drivers: INITIAL_DRIVERS
  });
  assert.deepEqual(
    rideRes.eligible.map((r) => r.partnerId),
    ['drv-sanjay-satali-4']
  );

  // 5. Home Service (Electrician) in Hasimara: Bipul Das base locality is Hasimara
  const srvRes = getEligiblePartnersForRequest({
    serviceCategory: 'service',
    requestLocality: 'Hasimara',
    requestedServiceCategory: 'Electrician',
    config,
    serviceProviders: INITIAL_SERVICE_PROVIDERS
  });
  assert.deepEqual(
    srvRes.eligible.map((r) => r.partnerId),
    ['srv-bipul-1']
  );
  // Kalchini Electrician request blocks Hasimara provider unless cross-locality is enabled
  const kalchiniElectrician = getEligiblePartnersForRequest({
    serviceCategory: 'service',
    requestLocality: 'Kalchini',
    requestedServiceCategory: 'Electrician',
    config,
    serviceProviders: INITIAL_SERVICE_PROVIDERS
  });
  assert.equal(kalchiniElectrician.eligible.length, 0);
});

test('Sub-localities resolve to parent hub rule for routing (e.g., Subhashini -> Hasimara, Purba Satali -> Satali)', () => {
  assert.equal(resolveAreaKey('Subhashini', INITIAL_SERVICE_LOCALITIES), 'Hasimara');
  assert.equal(resolveAreaKey('Purba Satali (735214)', INITIAL_SERVICE_LOCALITIES), 'Satali');

  const config = buildBaseConfig();
  const riderForSubhashini = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Subhashini',
    config,
    deliveryPersons: INITIAL_DELIVERY_PERSONS
  });
  assert.deepEqual(
    riderForSubhashini.eligible.map((r) => r.partnerId),
    ['del-subhasish-2']
  );
});

test('Cross-locality override requires BOTH globalCrossLocalityEnabled AND locality crossLocalityEnabled + approved nearby locality', () => {
  const base = buildBaseConfig();

  // Case A: Local toggle true, global false -> STILL BLOCKED
  const onlyLocalConfig: UniversalRoutingConfig = {
    ...base,
    globalCrossLocalityEnabled: false,
    rulesByLocality: {
      ...base.rulesByLocality,
      Hasimara: {
        ...base.rulesByLocality['Hasimara'],
        crossLocalityEnabled: true,
        nearbyLocalities: ['Jaigaon']
      }
    }
  };
  const caseARes = getEligiblePartnersForRequest({
    serviceCategory: 'ride',
    requestLocality: 'Hasimara',
    requestedVehicleType: 'taxi',
    config: onlyLocalConfig,
    drivers: INITIAL_DRIVERS
  });
  assert.equal(caseARes.eligible.length, 0);

  // Case B: Global true, Hasimara crossLocality true, Jaigaon approved in nearbyLocalities -> ALLOWED
  const approvedCrossConfig: UniversalRoutingConfig = {
    ...onlyLocalConfig,
    globalCrossLocalityEnabled: true
  };
  const caseBRes = getEligiblePartnersForRequest({
    serviceCategory: 'ride',
    requestLocality: 'Hasimara',
    requestedVehicleType: 'taxi',
    config: approvedCrossConfig,
    drivers: INITIAL_DRIVERS
  });
  assert.deepEqual(
    caseBRes.eligible.map((r) => r.partnerId),
    ['drv-debashis-3']
  );
  assert.equal(caseBRes.eligible[0].crossLocalityUsed, true);
  assert.equal(caseBRes.eligible[0].isApprovedNearbyLocality, true);

  // Delivery rider Dipak (Jaigaon) is also now eligible for Hasimara order dispatch
  const dispatchRes = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Hasimara',
    config: approvedCrossConfig,
    deliveryPersons: INITIAL_DELIVERY_PERSONS
  });
  assert.deepEqual(
    dispatchRes.eligible.map((r) => r.partnerId),
    ['del-subhasish-2', 'del-dipak-4']
  );
  // Exact locality rider sorts first
  assert.equal(dispatchRes.eligible[0].isExactLocality, true);
  assert.equal(dispatchRes.eligible[1].crossLocalityUsed, true);
});

test('Suspended partner account, offline toggle, live location drift, vehicle mismatch, and Rider vs Driver separation', () => {
  const config = buildBaseConfig();
  const partnerAccounts: PartnerAccount[] = [
    {
      uid: 'acc-subhasish',
      role: 'delivery',
      displayName: 'Subhasish Barman',
      loginEmail: 'subhasish.del@gmail.com',
      linkedEntityId: 'del-subhasish-2',
      status: 'suspended',
      assignedBy: 'taibaralir@gmail.com',
      createdAt: '2026-10-08T09:00:00Z'
    }
  ];

  // Suspended rider is blocked
  const suspendedCheck = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Hasimara',
    config,
    deliveryPersons: INITIAL_DELIVERY_PERSONS,
    partnerAccounts
  });
  assert.equal(suspendedCheck.eligible.length, 0);
  const subhasishReport = suspendedCheck.ineligible.find((r) => r.partnerId === 'del-subhasish-2');
  assert.ok(subhasishReport?.reasons.some((r) => r.toLowerCase().includes('suspended')));

  // Offline rider & moved live currentLocation
  const modifiedRiders = INITIAL_DELIVERY_PERSONS.map((d) => {
    if (d.id === 'del-bikash-1') return { ...d, isOnline: false };
    if (d.id === 'del-prakash-3') return { ...d, currentLocation: 'Jaigaon' };
    return d;
  });
  const kalchiniOffline = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Kalchini',
    config,
    deliveryPersons: modifiedRiders
  });
  assert.equal(kalchiniOffline.eligible.length, 0);
  assert.ok(kalchiniOffline.ineligible.find((r) => r.partnerId === 'del-bikash-1')?.reasons.includes('Rider is Offline'));

  const sataliDrifted = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Satali',
    config,
    deliveryPersons: modifiedRiders
  });
  assert.equal(sataliDrifted.eligible.length, 0);
  assert.ok(
    sataliDrifted.ineligible
      .find((r) => r.partnerId === 'del-prakash-3')
      ?.reasons.some((r) => r.includes('Active location is Jaigaon'))
  );

  // Vehicle type mismatch: Hasimara Toto driver cannot receive Auto ride request
  const autoInHasimara = getEligiblePartnersForRequest({
    serviceCategory: 'ride',
    requestLocality: 'Hasimara',
    requestedVehicleType: 'auto',
    config,
    drivers: INITIAL_DRIVERS
  });
  assert.equal(autoInHasimara.eligible.length, 0);
  const rameshAutoCheck = autoInHasimara.ineligible.find((r) => r.partnerId === 'drv-ramesh-1');
  assert.ok(rameshAutoCheck?.reasons.some((r) => r.includes('Vehicle type mismatch')));

  // Ride Driver IDs passed as deliveryPersons cannot match because they are not delivery riders mapped in config
  const driverAsDelivery = getEligibleDeliveryRidersForOrder({
    pickupLocality: 'Hasimara',
    config,
    deliveryPersons: [
      {
        id: 'drv-ramesh-1',
        name: 'Ramesh Oraon',
        phone: '+91 98324 55198',
        status: 'approved',
        isOnline: true,
        locality: 'Hasimara',
        totalDelivered: 0,
        rating: 4.9
      }
    ]
  });
  assert.equal(driverAsDelivery.eligible.length, 0);
});

test('syncPartnerIntoRoutingConfig, validateAndBuildAssignmentAudit, and buildUnavailableLocalityAlert produce valid audit trails & open alerts', () => {
  const base = buildBaseConfig();
  const updated = syncPartnerIntoRoutingConfig(
    base,
    'shop',
    'shop-new-hasimara-99',
    'Hasimara',
    INITIAL_SERVICE_LOCALITIES
  );
  assert.ok(updated.rulesByLocality['Hasimara'].shopIds.includes('shop-new-hasimara-99'));

  // Attempt blocked cross-locality assignment: Jaigaon rider on Hasimara delivery
  const deliveryCheck = getEligiblePartnersForRequest({
    serviceCategory: 'delivery',
    requestLocality: 'Hasimara',
    config: base,
    deliveryPersons: INITIAL_DELIVERY_PERSONS
  });
  const jaigaonRiderReport = deliveryCheck.ineligible.find((r) => r.partnerId === 'del-dipak-4');
  const blockedAudit = validateAndBuildAssignmentAudit({
    requestId: 'TB-DEL-901',
    serviceCategory: 'delivery',
    requestLocality: 'Hasimara',
    report: jaigaonRiderReport,
    partnerRole: 'delivery',
    assignedBy: 'taibaralir@gmail.com'
  });
  assert.equal(blockedAudit.allowed, false);
  assert.equal(blockedAudit.auditEntry.action, 'blocked_cross_locality');
  assert.ok(blockedAudit.errorMessage?.includes('Assignment blocked'));

  // Allowed local reassignment
  const localReport = deliveryCheck.eligible.find((r) => r.partnerId === 'del-subhasish-2');
  const allowedAudit = validateAndBuildAssignmentAudit({
    requestId: 'TB-DEL-901',
    serviceCategory: 'delivery',
    requestLocality: 'Hasimara',
    report: localReport,
    partnerRole: 'delivery',
    assignedBy: 'taibaralir@gmail.com',
    isReassignment: true
  });
  assert.equal(allowedAudit.allowed, true);
  assert.equal(allowedAudit.auditEntry.action, 'reassigned');
  assert.equal(allowedAudit.auditEntry.crossLocalityApproved, false);

  // Unavailable locality alert creation
  const alert = buildUnavailableLocalityAlert({
    requestId: 'TB-RIDE-999',
    serviceCategory: 'ride',
    requestLocality: 'Hasimara',
    vehicleType: 'taxi'
  });
  assert.equal(alert.status, 'open');
  assert.equal(alert.requestLocality, 'Hasimara');
  assert.ok(alert.message.includes('Pending Admin Routing'));
});
