import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  Driver,
  PartnerAccount,
  PublicDriverCard,
  RideBooking,
  RideDispatchSummary,
  UniversalRoutingConfig
} from '../types';
import { createDefaultRoutingConfig, INITIAL_SERVICE_LOCALITIES } from './hyperlocalRouting';
import { mergeRideDispatchWithBooking, toPublicDriverCard, toRideDispatchSummary } from './directorySanitizer';
import {
  ALLOWED_RIDE_VEHICLE_TYPES,
  MAX_RIDE_NEGOTIATION_ROUNDS,
  assertAgreedFareImmutable,
  buildNewRideRequestBundle,
  canTransitionRideStatus,
  getActionableRidesForAdmin,
  getActionableRidesForDriver,
  getPendingAlertSignature,
  getRideRemainingSeconds,
  isDriverEligibleForPendingRide,
  isRideOfferExpired,
  prepareCustomerAcceptOfferTransaction,
  prepareCustomerCounterBackPatch,
  prepareDriverAcceptTransaction,
  prepareDriverCounterOfferPatch,
  validateCounterOfferAmount
} from './rideLifecycle';
import { rideAlertAudio } from './rideAlertAudio';
import {
  RIDE_NOTIFICATION_CHANNEL_ID,
  buildRideDeepLinkUrl,
  parseRideDeepLinkFromUrl
} from './pushNotifications';

const ROOT_DIR = path.resolve(process.cwd());
const RULES_TEXT = fs.readFileSync(path.join(ROOT_DIR, 'firestore.rules'), 'utf8');

function createFixtureSetup() {
  const config: UniversalRoutingConfig = createDefaultRoutingConfig({
    localities: INITIAL_SERVICE_LOCALITIES
  });
  config.globalCrossLocalityEnabled = true;
  config.rulesByLocality['Satali'].rideDriverIds = [
    'drv-satali-1',
    'drv-satali-2',
    'drv-satali-offline',
    'drv-satali-suspended'
  ];
  config.rulesByLocality['Satali'].crossLocalityEnabled = true;
  config.rulesByLocality['Satali'].nearbyLocalities = ['Hasimara'];
  config.rulesByLocality['Hasimara'].rideDriverIds = ['drv-hasimara-1'];
  config.rulesByLocality['Jaigaon'].rideDriverIds = ['drv-jaigaon-1'];

  const drivers: Driver[] = [
    {
      id: 'drv-satali-1',
      ownerId: 'uid-drv-satali-1',
      name: 'Ramesh Toto',
      phone: '9800000001',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 A 1111',
      locality: 'Satali',
      currentLocation: 'Satali',
      servedLocalities: ['Satali'],
      status: 'approved',
      isOnline: true,
      totalRides: 42,
      rating: 4.9
    },
    {
      id: 'drv-satali-2',
      ownerId: 'uid-drv-satali-2',
      name: 'Suresh Toto',
      phone: '9800000002',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 A 2222',
      locality: 'Satali',
      currentLocation: 'Satali',
      servedLocalities: ['Satali'],
      status: 'approved',
      isOnline: true,
      totalRides: 31,
      rating: 4.8
    },
    {
      id: 'drv-satali-offline',
      ownerId: 'uid-drv-satali-offline',
      name: 'Offline Toto',
      phone: '9800000003',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 A 3333',
      locality: 'Satali',
      currentLocation: 'Satali',
      servedLocalities: ['Satali'],
      status: 'approved',
      isOnline: false,
      totalRides: 10,
      rating: 4.5
    },
    {
      id: 'drv-satali-suspended',
      ownerId: 'uid-drv-satali-suspended',
      name: 'Suspended Toto',
      phone: '9800000004',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 A 4444',
      locality: 'Satali',
      currentLocation: 'Satali',
      servedLocalities: ['Satali'],
      status: 'suspended',
      isOnline: true,
      totalRides: 15,
      rating: 4.4
    },
    {
      id: 'drv-hasimara-1',
      ownerId: 'uid-drv-hasimara-1',
      name: 'Hasimara Nearby Toto',
      phone: '9800000005',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 B 5555',
      locality: 'Hasimara',
      currentLocation: 'Hasimara',
      servedLocalities: ['Hasimara', 'Satali'],
      status: 'approved',
      isOnline: true,
      totalRides: 25,
      rating: 4.7
    },
    {
      id: 'drv-jaigaon-1',
      ownerId: 'uid-drv-jaigaon-1',
      name: 'Jaigaon Distant Toto',
      phone: '9800000006',
      vehicleType: 'toto',
      vehicleNumber: 'WB 70 C 6666',
      locality: 'Jaigaon',
      currentLocation: 'Jaigaon',
      servedLocalities: ['Jaigaon'],
      status: 'approved',
      isOnline: true,
      totalRides: 88,
      rating: 4.9
    }
  ];

  const partnerAccounts: PartnerAccount[] = [
    {
      uid: 'uid-drv-satali-1',
      role: 'driver',
      status: 'active',
      displayName: 'Ramesh Toto',
      loginEmail: 'ramesh@torsha.test',
      linkedEntityId: 'drv-satali-1',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      uid: 'uid-drv-satali-2',
      role: 'driver',
      status: 'active',
      displayName: 'Suresh Toto',
      loginEmail: 'suresh@torsha.test',
      linkedEntityId: 'drv-satali-2',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      uid: 'uid-drv-satali-offline',
      role: 'driver',
      status: 'active',
      displayName: 'Offline Toto',
      loginEmail: 'offline@torsha.test',
      linkedEntityId: 'drv-satali-offline',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      uid: 'uid-drv-satali-suspended',
      role: 'driver',
      status: 'suspended',
      displayName: 'Suspended Toto',
      loginEmail: 'suspended@torsha.test',
      linkedEntityId: 'drv-satali-suspended',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      uid: 'uid-drv-hasimara-1',
      role: 'driver',
      status: 'active',
      displayName: 'Hasimara Nearby Toto',
      loginEmail: 'hasimara@torsha.test',
      linkedEntityId: 'drv-hasimara-1',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      uid: 'uid-drv-jaigaon-1',
      role: 'driver',
      status: 'active',
      displayName: 'Jaigaon Distant Toto',
      loginEmail: 'jaigaon@torsha.test',
      linkedEntityId: 'drv-jaigaon-1',
      assignedBy: 'admin@torsha.test',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ];

  const publicDrivers: PublicDriverCard[] = drivers.map((d) => {
    const acc = partnerAccounts.find((a) => a.linkedEntityId === d.id);
    return toPublicDriverCard(d, acc?.status);
  });

  return { config, drivers, partnerAccounts, publicDrivers };
}

test('ride creation enforces vehicle allowlist, strict locality eligibility, and duplicate active ride prevention', () => {
  const { config, drivers, partnerAccounts, publicDrivers } = createFixtureSetup();
  const nowMs = 1_760_000_000_000;

  assert.deepEqual([...ALLOWED_RIDE_VEHICLE_TYPES], ['toto', 'auto', 'taxi']);

  // Disallow unsupported vehicle types (no bike taxi)
  assert.throws(
    () =>
      buildNewRideRequestBundle({
        rideId: 'ride-bike-blocked',
        customerId: 'cust-1',
        customerName: 'Asha Roy',
        customerPhone: '9000011111',
        vehicleType: 'bike' as unknown as Driver['vehicleType'],
        pickupLocation: 'Satali Main Stand',
        pickupLocality: 'Satali',
        dropLocation: 'Hasimara Station',
        dropLocality: 'Hasimara',
        distanceKm: 6,
        suggestedFare: 120,
        customerProposedFare: 110,
        publicDrivers,
        routingConfig: config,
        partnerAccounts,
        nowMs
      }),
    /Only Toto, Auto, or Taxi/
  );

  // Valid Satali Toto request
  const { booking, dispatch, eligibleDriverIds, routingStatus } = buildNewRideRequestBundle({
    rideId: 'ride-satali-101',
    customerId: 'cust-1',
    customerName: 'Asha Roy',
    customerPhone: '9000011111',
    vehicleType: 'toto',
    pickupLocation: 'Satali Mandir Lane',
    pickupLocality: 'Satali',
    pickupLandmark: 'Near Durga Temple',
    dropLocation: 'Hasimara Railway Gate',
    dropLocality: 'Hasimara',
    dropLandmark: 'Platform 1',
    distanceKm: 5.5,
    suggestedFare: 120,
    customerProposedFare: 110,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    nowMs
  });

  assert.equal(booking.status, 'OFFER_SENT');
  assert.equal(routingStatus, 'pending_admin_routing');
  assert.equal(booking.customerProposedFare, 110);
  assert.equal(booking.currentRound, 1);

  // Exact Satali active online approved + approved cross-locality Hasimara only; never offline, suspended, or distant Jaigaon
  assert.ok(eligibleDriverIds.includes('drv-satali-1'));
  assert.ok(eligibleDriverIds.includes('drv-satali-2'));
  assert.ok(eligibleDriverIds.includes('drv-hasimara-1'));
  assert.ok(!eligibleDriverIds.includes('drv-satali-offline'));
  assert.ok(!eligibleDriverIds.includes('drv-satali-suspended'));
  assert.ok(!eligibleDriverIds.includes('drv-jaigaon-1'));

  // Jaigaon driver must be rejected by runtime eligibility helper
  const jaigaonDriver = drivers.find((d) => d.id === 'drv-jaigaon-1')!;
  const jaigaonCheck = isDriverEligibleForPendingRide({
    ride: dispatch,
    driver: jaigaonDriver,
    routingConfig: config,
    partnerAccounts,
    nowMs
  });
  assert.equal(jaigaonCheck.eligible, false);

  // Duplicate active ride for same customer must be blocked while ride-satali-101 is unresolved
  assert.throws(
    () =>
      buildNewRideRequestBundle({
        rideId: 'ride-satali-102',
        customerId: 'cust-1',
        customerName: 'Asha Roy',
        customerPhone: '9000011111',
        vehicleType: 'auto',
        pickupLocation: 'Satali Bazar',
        pickupLocality: 'Satali',
        dropLocation: 'Hasimara',
        dropLocality: 'Hasimara',
        distanceKm: 5,
        suggestedFare: 150,
        customerProposedFare: 140,
        publicDrivers,
        routingConfig: config,
        partnerAccounts,
        existingRides: [booking],
        nowMs: nowMs + 5000
      }),
    /already have an active ride request/
  );
});

test('rideDispatch sanitizer strips all customer/driver PII while preserving dispatch & bidding metadata', () => {
  const { config, partnerAccounts, publicDrivers } = createFixtureSetup();
  const { booking, dispatch } = buildNewRideRequestBundle({
    rideId: 'ride-pii-check',
    customerId: 'cust-pii',
    customerName: 'Secret Passenger Name',
    customerPhone: '9876543210',
    vehicleType: 'toto',
    pickupLocation: 'House #14, Secret Lane, Satali',
    pickupLocality: 'Satali',
    pickupLandmark: 'Opposite Private Clinic',
    dropLocation: 'Quarter #8, Airforce Road, Hasimara',
    dropLocality: 'Hasimara',
    dropLandmark: 'Back Gate',
    distanceKm: 6,
    suggestedFare: 130,
    customerProposedFare: 120,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    nowMs: 1_760_000_100_000
  });

  const summary = toRideDispatchSummary(booking) as unknown as Record<string, unknown>;
  assert.equal(summary.id, dispatch.id);
  assert.equal('customerName' in summary, false);
  assert.equal('customerPhone' in summary, false);
  assert.equal('driverPhone' in summary, false);
  assert.equal('pickupLocation' in summary, false);
  assert.equal('dropLocation' in summary, false);
  assert.equal('pickupLandmark' in summary, false);
  assert.equal('dropLandmark' in summary, false);
  assert.equal(summary.pickupLocality, 'Satali');
  assert.equal(summary.dropLocality, 'Hasimara');

  const mergedForDriver = mergeRideDispatchWithBooking(dispatch, null);
  assert.equal(mergedForDriver.customerPhone, '');
  assert.equal(mergedForDriver.pickupLocation, 'Satali');
});

test('ride state machine enforces valid progression, counter-offer limits, and immutable agreedFare', () => {
  assert.equal(canTransitionRideStatus('REQUESTED', 'OFFER_SENT', 'system').allowed, true);
  assert.equal(canTransitionRideStatus('OFFER_SENT', 'COUNTER_OFFERED', 'driver').allowed, true);
  assert.equal(canTransitionRideStatus('COUNTER_OFFERED', 'CONFIRMED', 'customer').allowed, true);
  assert.equal(canTransitionRideStatus('CONFIRMED', 'PICKUP', 'driver').allowed, true);
  assert.equal(canTransitionRideStatus('PICKUP', 'IN_PROGRESS', 'driver').allowed, true);
  assert.equal(canTransitionRideStatus('IN_PROGRESS', 'COMPLETED', 'driver').allowed, true);

  // Customer cannot directly mark COMPLETED
  assert.equal(canTransitionRideStatus('IN_PROGRESS', 'COMPLETED', 'customer').allowed, false);
  // Terminal states cannot reopen
  assert.equal(canTransitionRideStatus('COMPLETED', 'CONFIRMED', 'admin').allowed, false);
  assert.equal(canTransitionRideStatus('EXPIRED', 'OFFER_SENT', 'driver').allowed, false);
  assert.equal(canTransitionRideStatus('CANCELLED', 'CONFIRMED', 'driver').allowed, false);

  // Counter-offer validation
  assert.equal(validateCounterOfferAmount({ amount: 5, currentRound: 2 }).valid, false);
  assert.equal(validateCounterOfferAmount({ amount: 20000, currentRound: 2 }).valid, false);
  assert.equal(validateCounterOfferAmount({ amount: 150, currentRound: MAX_RIDE_NEGOTIATION_ROUNDS }).valid, true);
  assert.equal(validateCounterOfferAmount({ amount: 150, currentRound: MAX_RIDE_NEGOTIATION_ROUNDS + 1 }).valid, false);

  // Agreed fare immutability guard
  assertAgreedFareImmutable({ agreedFare: undefined, status: 'OFFER_SENT' }, 135);
  assertAgreedFareImmutable({ agreedFare: 135, status: 'CONFIRMED' }, 135);
  assert.throws(
    () => assertAgreedFareImmutable({ agreedFare: 135, status: 'CONFIRMED' }, 160),
    /Fare Lock Violation/
  );
});

test('counter-offer negotiation loop + customer acceptance locks agreedFare and rejects competing driver offers', () => {
  const { config, drivers, partnerAccounts, publicDrivers } = createFixtureSetup();
  const baseNow = 1_760_000_200_000;
  const { booking: initialBooking, dispatch: initialDispatch } = buildNewRideRequestBundle({
    rideId: 'ride-nego-1',
    customerId: 'cust-nego',
    customerName: 'Bikash Das',
    customerPhone: '9000022222',
    vehicleType: 'toto',
    pickupLocation: 'Satali',
    pickupLocality: 'Satali',
    dropLocation: 'Hasimara',
    dropLocality: 'Hasimara',
    distanceKm: 7,
    suggestedFare: 140,
    customerProposedFare: 120,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    nowMs: baseNow
  });

  const driver1 = drivers[0];
  const driver2 = drivers[1];

  // Driver 1 counters ₹150 (round 2)
  const d1Patch = prepareDriverCounterOfferPatch({
    dispatch: initialDispatch,
    driver: driver1,
    counterAmount: 150,
    note: 'Bad road stretch',
    nowMs: baseNow + 10_000
  });
  let dispatchState: RideDispatchSummary = { ...initialDispatch, ...d1Patch };
  assert.equal(dispatchState.status, 'COUNTER_OFFERED');
  assert.equal(dispatchState.currentRound, 2);

  // Driver 2 counters ₹135 (round 3)
  const d2Patch = prepareDriverCounterOfferPatch({
    dispatch: dispatchState,
    driver: driver2,
    counterAmount: 135,
    note: 'I am 2 mins away',
    nowMs: baseNow + 15_000
  });
  dispatchState = { ...dispatchState, ...d2Patch };
  assert.equal(dispatchState.currentRound, 3);
  assert.equal(dispatchState.activeDriverOffers?.length, 2);

  // Customer accepts Driver 2's ₹135 offer
  const offerIdFromDriver2 = dispatchState.activeDriverOffers!.find((o) => o.driverId === driver2.id)!.id;
  const mergedRide = mergeRideDispatchWithBooking(dispatchState, initialBooking);

  const accepted = prepareCustomerAcceptOfferTransaction({
    ride: mergedRide,
    dispatch: dispatchState,
    offerId: offerIdFromDriver2,
    nowMs: baseNow + 20_000
  });

  assert.equal(accepted.winningDriverId, driver2.id);
  assert.equal(accepted.agreedFare, 135);
  assert.equal(accepted.bookingPatch.agreedFare, 135);
  assert.equal(accepted.dispatchPatch.confirmedDriverId, driver2.id);
  assert.equal(accepted.dispatchPatch.status, 'CONFIRMED');
  assert.equal(
    accepted.dispatchPatch.activeDriverOffers?.find((o) => o.driverId === driver2.id)?.status,
    'accepted'
  );
  assert.equal(
    accepted.dispatchPatch.activeDriverOffers?.find((o) => o.driverId === driver1.id)?.status,
    'rejected'
  );

  // Subsequent driver counter-offer or customer counter-back must fail after confirmation
  const lockedDispatch: RideDispatchSummary = { ...dispatchState, ...accepted.dispatchPatch };
  const lockedBooking: RideBooking = { ...mergedRide, ...accepted.bookingPatch };

  assert.throws(
    () =>
      prepareDriverCounterOfferPatch({
        dispatch: lockedDispatch,
        driver: driver1,
        counterAmount: 115,
        nowMs: baseNow + 25_000
      }),
    /already confirmed/i
  );

  assert.throws(
    () =>
      prepareCustomerCounterBackPatch({
        ride: lockedBooking,
        counterAmount: 100,
        nowMs: baseNow + 25_000
      }),
    /already confirmed/i
  );
});

test('concurrent multi-driver acceptance race resolves to exactly one winner via atomic transaction semantics', async () => {
  const { config, drivers, partnerAccounts, publicDrivers } = createFixtureSetup();
  const baseNow = 1_760_000_300_000;
  const { booking, dispatch } = buildNewRideRequestBundle({
    rideId: 'ride-race-999',
    customerId: 'cust-race',
    customerName: 'Neha Thapa',
    customerPhone: '9000033333',
    vehicleType: 'toto',
    pickupLocation: 'Satali Chowk',
    pickupLocality: 'Satali',
    dropLocation: 'Hasimara Market',
    dropLocality: 'Hasimara',
    distanceKm: 5,
    suggestedFare: 120,
    customerProposedFare: 120,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    nowMs: baseNow
  });

  // Simulated atomic Firestore runTransaction store with optimistic version locking
  let version = 1;
  let sharedDispatch: RideDispatchSummary = { ...dispatch };
  let sharedBooking: RideBooking = { ...booking };

  async function runSimulatedAcceptTransaction(driver: Driver): Promise<{ winner: string; fare: number }> {
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const readVersion = version;
      const snapshot = { ...sharedDispatch };

      // Simulate async network delay so both drivers read version=1 simultaneously before first commit
      await new Promise((resolve) => setTimeout(resolve, driver.id === 'drv-satali-1' ? 5 : 20));

      const prepared = prepareDriverAcceptTransaction({
        dispatch: snapshot,
        driver,
        nowMs: baseNow + 1000
      });

      if (readVersion !== version) {
        // Firestore runTransaction automatically retries handler against fresh document state
        continue;
      }

      // Atomic dual commit
      version += 1;
      sharedDispatch = { ...sharedDispatch, ...prepared.dispatchPatch };
      sharedBooking = { ...sharedBooking, ...prepared.bookingPatch };
      return { winner: driver.id, fare: prepared.agreedFare };
    }
    throw new Error('Transaction contention retry exhausted.');
  }

  const results = await Promise.allSettled([
    runSimulatedAcceptTransaction(drivers[0]),
    runSimulatedAcceptTransaction(drivers[1])
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(String((rejected[0] as PromiseRejectedResult).reason?.message), /RIDE_ALREADY_CONFIRMED/);
  assert.equal(sharedDispatch.confirmedDriverId, 'drv-satali-1');
  assert.equal(sharedBooking.driverId, 'drv-satali-1');
  assert.equal(sharedDispatch.agreedFare, 120);
  assert.equal(sharedBooking.agreedFare, 120);
});

test('automatic offer expiry blocks late driver acceptance and stops pending alert chimes immediately', () => {
  const { config, drivers, partnerAccounts, publicDrivers } = createFixtureSetup();
  const baseNow = 1_760_000_400_000;
  const ttlMs = 180_000;
  const { booking, dispatch } = buildNewRideRequestBundle({
    rideId: 'ride-expiry-1',
    customerId: 'cust-exp',
    customerName: 'Rohan Chetri',
    customerPhone: '9000044444',
    vehicleType: 'toto',
    pickupLocation: 'Satali',
    pickupLocality: 'Satali',
    dropLocation: 'Hasimara',
    dropLocality: 'Hasimara',
    distanceKm: 4,
    suggestedFare: 100,
    customerProposedFare: 100,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    ttlMs,
    nowMs: baseNow
  });

  // Active before expiry -> alerts active for driver 1 and admin
  assert.equal(isRideOfferExpired(booking, baseNow + 10_000), false);
  assert.equal(getRideRemainingSeconds(booking, baseNow + 170_000), 10);

  const driverActionableBefore = getActionableRidesForDriver({
    rides: [booking],
    driver: drivers[0],
    routingConfig: config,
    partnerAccounts,
    nowMs: baseNow + 10_000
  });
  const adminActionableBefore = getActionableRidesForAdmin([booking], baseNow + 10_000);
  assert.equal(driverActionableBefore.length, 1);
  assert.equal(adminActionableBefore.length, 1);
  assert.equal(getPendingAlertSignature(driverActionableBefore), 'ride-expiry-1:OFFER_SENT:1:100');

  // Counter offer changes signature cleanly without leaving stale hash
  const counteredPatch = prepareCustomerCounterBackPatch({
    ride: booking,
    counterAmount: 115,
    nowMs: baseNow + 20_000
  });
  const counteredRide: RideBooking = { ...booking, ...counteredPatch.bookingPatch };
  assert.equal(getPendingAlertSignature([counteredRide]), 'ride-expiry-1:COUNTER_OFFERED:2:115');

  // Past expiry window -> both driver accept and actionable sound selectors stop immediately
  const expiredNow = baseNow + ttlMs + 5_000;
  assert.equal(isRideOfferExpired(booking, expiredNow), true);
  assert.equal(getRideRemainingSeconds(booking, expiredNow), 0);

  assert.throws(
    () =>
      prepareDriverAcceptTransaction({
        dispatch,
        driver: drivers[0],
        nowMs: expiredNow
      }),
    /RIDE_EXPIRED/
  );

  const driverActionableExpired = getActionableRidesForDriver({
    rides: [booking],
    driver: drivers[0],
    routingConfig: config,
    partnerAccounts,
    nowMs: expiredNow
  });
  const adminActionableExpired = getActionableRidesForAdmin([booking], expiredNow);
  assert.equal(driverActionableExpired.length, 0);
  assert.equal(adminActionableExpired.length, 0);
  assert.equal(getPendingAlertSignature(driverActionableExpired), '');

  // Driver local decline also stops alerting for that driver without mutating global offer until last eligible rejects
  const declinedSet = new Set<string>(['ride-expiry-1']);
  const driverAfterDecline = getActionableRidesForDriver({
    rides: [booking],
    driver: drivers[0],
    routingConfig: config,
    partnerAccounts,
    localRejectedIds: declinedSet,
    nowMs: baseNow + 10_000
  });
  assert.equal(driverAfterDecline.length, 0);
  // Driver 2 and Admin still get alerted
  const driver2BeforeConfirm = getActionableRidesForDriver({
    rides: [booking],
    driver: drivers[1],
    routingConfig: config,
    partnerAccounts,
    nowMs: baseNow + 10_000
  });
  assert.equal(driver2BeforeConfirm.length, 1);

  // Confirming the ride silences BOTH driver and admin alert queues immediately
  const confirmedRide: RideBooking = { ...booking, status: 'CONFIRMED', driverId: 'drv-satali-2', agreedFare: 100 };
  assert.equal(
    getActionableRidesForDriver({
      rides: [confirmedRide],
      driver: drivers[1],
      routingConfig: config,
      partnerAccounts,
      nowMs: baseNow + 12_000
    }).length,
    0
  );
  assert.equal(getActionableRidesForAdmin([confirmedRide], baseNow + 12_000).length, 0);
  assert.equal(getPendingAlertSignature(getActionableRidesForAdmin([confirmedRide], baseNow + 12_000)), '');
});

test('firestore.rules enforces atomic ride locking, agreedFare immutability, expiry bounds, PII isolation, and push rules', () => {
  // 1. Strict non-PII validation on /rideDispatch
  const rideDispatchValidator = RULES_TEXT.slice(
    RULES_TEXT.indexOf('function isValidRideDispatchData('),
    RULES_TEXT.indexOf('function isValidNotificationTokenData(')
  );
  for (const bannedPiiField of [
    "!('customerName' in data)",
    "!('customerPhone' in data)",
    "!('driverPhone' in data)",
    "!('pickupLocation' in data)",
    "!('dropLocation' in data)",
    "!('pickupLandmark' in data)",
    "!('dropLandmark' in data)"
  ]) {
    assert.ok(rideDispatchValidator.includes(bannedPiiField), `Missing PII ban ${bannedPiiField}`);
  }

  // 2. rideBookings rules enforce immutable agreedFare, atomic getAfter on /rideDispatch, and expiry bounds
  const rideBookingsBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /rideBookings/{rideId}'),
    RULES_TEXT.indexOf('match /deliveryPersons/{personId}')
  );
  assert.ok(
    rideBookingsBlock.includes(
      "(!('agreedFare' in existing()) || existing().agreedFare <= 0 || (('agreedFare' in incoming()) && incoming().agreedFare == existing().agreedFare))"
    )
  );
  assert.ok(rideBookingsBlock.includes('existsAfter(/databases/$(database)/documents/rideDispatch/$(rideId))'));
  assert.ok(
    rideBookingsBlock.includes(
      'getAfter(/databases/$(database)/documents/rideDispatch/$(rideId)).data.confirmedDriverId == callerDriverId()'
    )
  );
  assert.ok(
    rideBookingsBlock.includes(
      'getAfter(/databases/$(database)/documents/rideDispatch/$(rideId)).data.agreedFare == incoming().agreedFare'
    )
  );

  // 3. rideDispatch rules enforce driver eligibility, dual-field lock (!('confirmedDriverId' in existing())), expiry timestamp guard, and fare immutability
  const rideDispatchBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /rideDispatch/{dispatchId}'),
    RULES_TEXT.indexOf('match /deliveryDispatch/{dispatchId}')
  );
  assert.ok(rideDispatchBlock.includes('isActiveApprovedDriver()'));
  assert.ok(rideDispatchBlock.includes('existing().vehicleType == callerDriverVehicleType()'));
  assert.ok(rideDispatchBlock.includes("!('confirmedDriverId' in existing())"));
  assert.ok(rideDispatchBlock.includes("!('assignedDriverId' in existing())"));
  assert.ok(rideDispatchBlock.includes('request.time.toMillis() <= existing().expiresAtMs'));
  assert.ok(rideDispatchBlock.includes('request.time.toMillis() > existing().expiresAtMs'));

  // 4. notificationTokens & rideNotificationLogs security
  const pushBlock = RULES_TEXT.slice(
    RULES_TEXT.indexOf('match /notificationTokens/{tokenId}')
  );
  assert.ok(pushBlock.includes('incoming().uid == request.auth.uid'));
  assert.ok(pushBlock.includes('isValidNotificationTokenData(incoming())'));
  assert.ok(pushBlock.includes('isValidRideNotificationLogData(incoming())'));
});

test('end-to-end Customer -> Nearby Rider -> Admin -> Confirmation -> Ride Completion workflow satisfies firestore.rules contracts', () => {
  const { config, drivers, partnerAccounts, publicDrivers } = createFixtureSetup();
  const baseNow = 1_760_000_500_000;

  // Step 1: Customer creates ride in Satali
  const { booking, dispatch, eligibleDriverIds } = buildNewRideRequestBundle({
    rideId: 'ride-e2e-full',
    customerId: 'cust-e2e',
    customerName: 'Suman Rai',
    customerPhone: '9832000001',
    vehicleType: 'toto',
    pickupLocation: 'Satali Tea Garden Gate',
    pickupLocality: 'Satali',
    pickupLandmark: 'Near Clock Tower',
    dropLocation: 'Hasimara Air Force Gate',
    dropLocality: 'Hasimara',
    dropLandmark: 'Main Barrier',
    distanceKm: 6.2,
    suggestedFare: 140,
    customerProposedFare: 120,
    publicDrivers,
    routingConfig: config,
    partnerAccounts,
    nowMs: baseNow
  });

  // Nearby eligible riders & Admin actionable queue both see the ride
  assert.ok(eligibleDriverIds.includes('drv-satali-1'));
  assert.ok(eligibleDriverIds.includes('drv-hasimara-1'));
  assert.equal(getActionableRidesForAdmin([booking], baseNow + 1000).length, 1);

  // Verify initial rideBookings & rideDispatch fields conform to firestore.rules bans
  assert.equal('agreedFare' in booking, false);
  assert.equal('driverId' in booking, false);
  assert.equal('customerName' in (dispatch as unknown as Record<string, unknown>), false);
  assert.equal('customerPhone' in (dispatch as unknown as Record<string, unknown>), false);

  // Step 2: Eligible nearby rider sends counter offer ₹135
  const d1 = drivers.find((d) => d.id === 'drv-hasimara-1')!;
  const counterPatch = prepareDriverCounterOfferPatch({
    dispatch,
    driver: d1,
    counterAmount: 135,
    note: 'Morning traffic at level crossing',
    nowMs: baseNow + 15_000
  });
  const counterPatchKeys = Object.keys(counterPatch);
  for (const key of counterPatchKeys) {
    assert.ok(
      ['status', 'currentRound', 'activeDriverOffers', 'negotiationHistory', 'expiresAt', 'expiresAtMs', 'updatedAt'].includes(key),
      `Unexpected driver counter key for firestore.rules: ${key}`
    );
  }
  const counteredDispatch: RideDispatchSummary = { ...dispatch, ...counterPatch };
  const mergedForCustomer = mergeRideDispatchWithBooking(counteredDispatch, booking);

  // Step 3: Customer accepts driver's counter-offer -> CONFIRMED with agreedFare=135 locked
  const offerId = counteredDispatch.activeDriverOffers![0].id;
  const acceptTx = prepareCustomerAcceptOfferTransaction({
    ride: mergedForCustomer,
    dispatch: counteredDispatch,
    offerId,
    nowMs: baseNow + 25_000
  });
  for (const key of Object.keys(acceptTx.bookingPatch)) {
    assert.ok(
      [
        'status', 'routingStatus', 'driverId', 'driverName', 'driverPhone',
        'vehicleNumber', 'driverRating', 'agreedFare', 'agreedAt', 'confirmedAt',
        'activeDriverOffers', 'negotiationHistory', 'updatedAt'
      ].includes(key),
      `Unexpected customer accept booking key: ${key}`
    );
  }
  for (const key of Object.keys(acceptTx.dispatchPatch)) {
    assert.ok(
      [
        'status', 'routingStatus', 'assignedDriverId', 'confirmedDriverId',
        'driverName', 'vehicleNumber', 'driverRating', 'agreedFare', 'agreedAt',
        'confirmedAt', 'activeDriverOffers', 'negotiationHistory', 'updatedAt'
      ].includes(key),
      `Unexpected customer accept dispatch key: ${key}`
    );
  }

  const confirmedRide: RideBooking = { ...mergedForCustomer, ...acceptTx.bookingPatch };
  assert.equal(confirmedRide.agreedFare, 135);
  assert.equal(confirmedRide.status, 'CONFIRMED');

  // Pending alerts for both Driver and Admin silence immediately
  assert.equal(getActionableRidesForDriver({ rides: [confirmedRide], driver: d1, routingConfig: config, partnerAccounts, nowMs: baseNow + 26_000 }).length, 0);
  assert.equal(getActionableRidesForAdmin([confirmedRide], baseNow + 26_000).length, 0);

  // Step 4: Sequential driver progression strictly enforced (CONFIRMED -> PICKUP -> IN_PROGRESS -> COMPLETED)
  assert.equal(canTransitionRideStatus('CONFIRMED', 'IN_PROGRESS', 'driver').allowed, false);
  assert.equal(canTransitionRideStatus('CONFIRMED', 'COMPLETED', 'driver').allowed, false);
  assert.equal(canTransitionRideStatus('CONFIRMED', 'PICKUP', 'driver').allowed, true);
  assert.equal(canTransitionRideStatus('PICKUP', 'IN_PROGRESS', 'driver').allowed, true);
  assert.equal(canTransitionRideStatus('IN_PROGRESS', 'COMPLETED', 'driver').allowed, true);

  // Mutating agreedFare post-confirmation is strictly blocked
  assert.throws(() => assertAgreedFareImmutable(confirmedRide, 180), /Fare Lock Violation/);
});

test('rideAlertAudio controller starts ringing on pending rides, respects mute/snooze, and stops immediately on resolution', () => {
  rideAlertAudio.stopAllForPanel('driver');
  rideAlertAudio.stopAllForPanel('admin');
  rideAlertAudio.setMuted('driver', false);
  rideAlertAudio.clearSnooze('driver');
  rideAlertAudio.setMuted('admin', false);
  rideAlertAudio.clearSnooze('admin');

  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, false);
  assert.equal(rideAlertAudio.getPanelStatus('admin').isRinging, false);

  // Pending ride arrives for driver & admin -> both ring
  rideAlertAudio.syncPendingRides('driver', ['ride-sound-1:OFFER_SENT:1:120'], true);
  rideAlertAudio.syncPendingRides('admin', ['ride-sound-1:OFFER_SENT:1:120'], false);
  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, true);
  assert.equal(rideAlertAudio.getPanelStatus('driver').activeCount, 1);
  assert.equal(rideAlertAudio.getPanelStatus('admin').isRinging, true);

  // Counter-offer updates round -> keeps ringing
  rideAlertAudio.syncPendingRides('driver', ['ride-sound-1:COUNTER_OFFERED:2:135'], true);
  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, true);

  // Snooze pauses ringing temporarily without losing active count
  rideAlertAudio.snooze('driver', 60_000);
  assert.equal(rideAlertAudio.getPanelStatus('driver').snoozed, true);
  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, false);
  assert.equal(rideAlertAudio.getPanelStatus('driver').activeCount, 1);
  rideAlertAudio.clearSnooze('driver');
  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, true);

  // Resolved (CONFIRMED / EXPIRED / CANCELLED / REJECTED) -> stops immediately
  rideAlertAudio.syncPendingRides('driver', [], true);
  rideAlertAudio.syncPendingRides('admin', [], false);
  assert.equal(rideAlertAudio.getPanelStatus('driver').isRinging, false);
  assert.equal(rideAlertAudio.getPanelStatus('driver').activeCount, 0);
  assert.equal(rideAlertAudio.getPanelStatus('admin').isRinging, false);
  assert.equal(rideAlertAudio.getPanelStatus('admin').activeCount, 0);
});

test('deep-linking, service worker notification handlers, and logout token cleanup contracts are wired correctly', () => {
  const driverUrl = buildRideDeepLinkUrl({ portal: 'driver', rideId: 'TB-RIDE-7741' });
  const adminUrl = buildRideDeepLinkUrl({ portal: 'admin', rideId: 'TB-RIDE-7741' });
  const custUrl = buildRideDeepLinkUrl({ portal: 'customer', rideId: 'TB-RIDE-7741' });

  assert.equal(driverUrl, '/?portal=driver&rideId=TB-RIDE-7741');
  assert.equal(adminUrl, '/?portal=admin&rideId=TB-RIDE-7741');
  assert.equal(custUrl, '/?portal=customer&rideId=TB-RIDE-7741');

  assert.deepEqual(parseRideDeepLinkFromUrl(driverUrl.slice(1)), { portal: 'driver', rideId: 'TB-RIDE-7741' });
  assert.deepEqual(parseRideDeepLinkFromUrl(adminUrl.slice(1)), { portal: 'admin', rideId: 'TB-RIDE-7741' });
  assert.deepEqual(parseRideDeepLinkFromUrl('?portal=invalid&rideId=X'), { portal: undefined, rideId: 'X' });

  // Verify Service Worker push + notificationclick handlers
  const swText = fs.readFileSync(path.join(ROOT_DIR, 'public/sw-ride-notifications.js'), 'utf8');
  const fcmSwText = fs.readFileSync(path.join(ROOT_DIR, 'public/firebase-messaging-sw.js'), 'utf8');
  assert.ok(swText.includes("addEventListener('push'"));
  assert.ok(swText.includes("addEventListener('notificationclick'"));
  assert.ok(swText.includes("type: 'TORSHA_NAVIGATE_RIDE'"));
  assert.ok(fcmSwText.includes("importScripts('/sw-ride-notifications.js')"));
  assert.equal(RIDE_NOTIFICATION_CHANNEL_ID, 'torsha_rides_urgent_v1');

  // Verify pushNotifications.ts & App.tsx token registration + logout cleanup + suspended partner deactivation
  const pushText = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/pushNotifications.ts'), 'utf8');
  const appText = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');
  assert.ok(pushText.includes('VITE_FIREBASE_VAPID_KEY'));
  assert.ok(pushText.includes('getToken(messaging'));
  assert.ok(pushText.includes('deleteToken(messaging)'));
  assert.ok(pushText.includes('deactivateNotificationTokensForUser'));
  assert.ok(appText.includes("portalMode === 'driver' && activePartnerAccount?.status === 'suspended'"));
  assert.ok(appText.includes('await deactivateNotificationTokensForUser(auth.currentUser?.uid)'));
});

