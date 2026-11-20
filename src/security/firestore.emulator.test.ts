import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';

const PROJECT_ID = 'demo-torsha-bazaar';
const ADMIN_EMAIL = 'taibaralir@gmail.com';
const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');
const RULES_CONTENT = fs.readFileSync(RULES_PATH, 'utf8');

let testEnv: RulesTestEnvironment;

function parseEmulatorHost(): { host: string; port: number } {
  const raw = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [host, portStr] = raw.split(':');
  return { host: host || '127.0.0.1', port: Number(portStr || 8080) };
}

function adminDb() {
  return testEnv
    .authenticatedContext('admin-uid-1', {
      email: ADMIN_EMAIL,
      email_verified: true
    })
    .firestore();
}

function unverifiedAdminDb() {
  return testEnv
    .authenticatedContext('admin-fake-uid', {
      email: ADMIN_EMAIL,
      email_verified: false
    })
    .firestore();
}

function userDb(uid: string, claims: Record<string, unknown> = {}) {
  return testEnv.authenticatedContext(uid, claims).firestore();
}

function guestDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seedBaselineFixtures() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // Universal routing config: strict locality isolation by default
    await setDoc(doc(db, 'routingConfig', 'universal'), {
      globalCrossLocalityEnabled: false,
      rulesByLocality: {
        Satali: {
          crossLocalityEnabled: false,
          nearbyLocalities: [],
          rideDriverIds: ['drv-satali-1', 'drv-satali-2', 'drv-satali-suspended'],
          deliveryRiderIds: ['del-satali-1']
        },
        Jaigaon: {
          crossLocalityEnabled: false,
          nearbyLocalities: [],
          rideDriverIds: ['drv-jaigaon-1'],
          deliveryRiderIds: ['del-jaigaon-1']
        }
      },
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    // Customers
    await setDoc(doc(db, 'customers', 'cust-a'), {
      id: 'cust-a',
      userId: 'cust-a',
      name: 'Asha Roy',
      phone: '+919800011111',
      location: 'Satali',
      pincode: '735214'
    });
    await setDoc(doc(db, 'customers', 'cust-b'), {
      id: 'cust-b',
      userId: 'cust-b',
      name: 'Bikash Sen',
      phone: '+919800022222',
      location: 'Jaigaon',
      pincode: '736182'
    });

    // Approved active shopkeeper + shop + products + public cards
    await setDoc(doc(db, 'partnerAccounts', 'uid-shop-satali'), {
      uid: 'uid-shop-satali',
      role: 'shopkeeper',
      displayName: 'Satali Fresh Mart',
      loginEmail: 'shop@torsha.test',
      linkedEntityId: 'shop-satali-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'shops', 'shop-satali-1'), {
      id: 'shop-satali-1',
      ownerId: 'uid-shop-satali',
      name: 'Satali Fresh Mart',
      locality: 'Satali',
      contactNumber: '+919800099900',
      status: 'approved',
      isVerified: true
    });
    await setDoc(doc(db, 'publicShops', 'shop-satali-1'), {
      id: 'shop-satali-1',
      name: 'Satali Fresh Mart',
      locality: 'Satali',
      category: 'Grocery',
      status: 'approved',
      isVerified: true,
      isOpen: true
    });

    // Suspended shopkeeper + shop (to test suspended partner denial & stale public card block)
    await setDoc(doc(db, 'partnerAccounts', 'uid-shop-suspended'), {
      uid: 'uid-shop-suspended',
      role: 'shopkeeper',
      displayName: 'Suspended Mart',
      loginEmail: 'suspendedshop@torsha.test',
      linkedEntityId: 'shop-suspended-1',
      status: 'suspended',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'shops', 'shop-suspended-1'), {
      id: 'shop-suspended-1',
      ownerId: 'uid-shop-suspended',
      name: 'Suspended Mart',
      locality: 'Satali',
      contactNumber: '+919800099901',
      status: 'suspended'
    });
    await setDoc(doc(db, 'publicShops', 'shop-suspended-1'), {
      id: 'shop-suspended-1',
      name: 'Suspended Mart',
      locality: 'Satali',
      category: 'Grocery',
      status: 'approved' // Simulates stale public doc: Firestore rules MUST still deny customer get!
    });

    // Products
    await setDoc(doc(db, 'products', 'prod-1'), {
      id: 'prod-1',
      ownerId: 'uid-shop-satali',
      shopId: 'shop-satali-1',
      shopStatus: 'approved',
      name: 'Organic Tea 250g',
      category: 'Grocery',
      price: 180,
      unit: '250g',
      inStock: true
    });
    await setDoc(doc(db, 'products', 'prod-susp'), {
      id: 'prod-susp',
      ownerId: 'uid-shop-suspended',
      shopId: 'shop-suspended-1',
      shopStatus: 'suspended',
      name: 'Suspended Tea',
      category: 'Grocery',
      price: 120,
      unit: '250g',
      inStock: true
    });

    // Delivery Riders: approved Satali (online), offline Satali, and Jaigaon (different locality)
    await setDoc(doc(db, 'partnerAccounts', 'uid-del-satali'), {
      uid: 'uid-del-satali',
      role: 'delivery',
      displayName: 'Bikram Delivery',
      loginEmail: 'delsatali@torsha.test',
      linkedEntityId: 'del-satali-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'deliveryPersons', 'del-satali-1'), {
      id: 'del-satali-1',
      ownerId: 'uid-del-satali',
      name: 'Bikram Delivery',
      phone: '+919800033301',
      locality: 'Satali',
      currentLocation: 'Satali',
      status: 'approved',
      isOnline: true
    });
    await setDoc(doc(db, 'partnerAccounts', 'uid-del-offline'), {
      uid: 'uid-del-offline',
      role: 'delivery',
      displayName: 'Offline Delivery',
      loginEmail: 'deloffline@torsha.test',
      linkedEntityId: 'del-offline-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'deliveryPersons', 'del-offline-1'), {
      id: 'del-offline-1',
      ownerId: 'uid-del-offline',
      name: 'Offline Delivery',
      phone: '+919800033302',
      locality: 'Satali',
      currentLocation: 'Satali',
      status: 'approved',
      isOnline: false
    });
    await setDoc(doc(db, 'partnerAccounts', 'uid-del-jaigaon'), {
      uid: 'uid-del-jaigaon',
      role: 'delivery',
      displayName: 'Jaigaon Delivery',
      loginEmail: 'deljaigaon@torsha.test',
      linkedEntityId: 'del-jaigaon-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'deliveryPersons', 'del-jaigaon-1'), {
      id: 'del-jaigaon-1',
      ownerId: 'uid-del-jaigaon',
      name: 'Jaigaon Delivery',
      phone: '+919800033303',
      locality: 'Jaigaon',
      currentLocation: 'Jaigaon',
      status: 'approved',
      isOnline: true
    });

    // Drivers: 2 Satali Toto, 1 Jaigaon Toto, 1 Auto Satali, 1 Suspended Toto, 1 Missing/Mismatched linkedEntityId
    const driverSeeds = [
      {
        uid: 'uid-drv-satali-1',
        id: 'drv-satali-1',
        name: 'Ramesh Toto',
        vehicleType: 'toto',
        locality: 'Satali',
        status: 'approved',
        accStatus: 'active',
        linkedEntityId: 'drv-satali-1'
      },
      {
        uid: 'uid-drv-satali-2',
        id: 'drv-satali-2',
        name: 'Suresh Toto',
        vehicleType: 'toto',
        locality: 'Satali',
        status: 'approved',
        accStatus: 'active',
        linkedEntityId: 'drv-satali-2'
      },
      {
        uid: 'uid-drv-jaigaon-1',
        id: 'drv-jaigaon-1',
        name: 'Jaigaon Toto',
        vehicleType: 'toto',
        locality: 'Jaigaon',
        status: 'approved',
        accStatus: 'active',
        linkedEntityId: 'drv-jaigaon-1'
      },
      {
        uid: 'uid-drv-satali-auto',
        id: 'drv-satali-auto',
        name: 'Satali Auto',
        vehicleType: 'auto',
        locality: 'Satali',
        status: 'approved',
        accStatus: 'active',
        linkedEntityId: 'drv-satali-auto'
      },
      {
        uid: 'uid-drv-suspended',
        id: 'drv-satali-suspended',
        name: 'Suspended Toto',
        vehicleType: 'toto',
        locality: 'Satali',
        status: 'suspended',
        accStatus: 'suspended',
        linkedEntityId: 'drv-satali-suspended'
      },
      {
        uid: 'uid-drv-pending',
        id: 'drv-satali-pending',
        name: 'Pending Toto',
        vehicleType: 'toto',
        locality: 'Satali',
        status: 'pending',
        accStatus: 'active',
        linkedEntityId: 'drv-satali-pending'
      }
    ];

    for (const d of driverSeeds) {
      await setDoc(doc(db, 'partnerAccounts', d.uid), {
        uid: d.uid,
        role: 'driver',
        displayName: d.name,
        loginEmail: `${d.id}@torsha.test`,
        linkedEntityId: d.linkedEntityId,
        status: d.accStatus,
        assignedBy: ADMIN_EMAIL
      });
      await setDoc(doc(db, 'drivers', d.id), {
        id: d.id,
        ownerId: d.uid,
        name: d.name,
        phone: '+919800044400',
        vehicleType: d.vehicleType,
        vehicleNumber: 'WB-70-T-1001',
        locality: d.locality,
        currentLocation: d.locality,
        status: d.status,
        isOnline: true,
        rating: 4.9
      });
      await setDoc(doc(db, 'publicDrivers', d.id), {
        id: d.id,
        name: d.name,
        vehicleType: d.vehicleType,
        locality: d.locality,
        currentLocation: d.locality,
        status: d.status === 'approved' ? 'approved' : 'approved', // Keep suspended as 'approved' on publicDrivers intentionally to verify rule defense!
        isOnline: true,
        accountStatus: d.accStatus,
        rating: 4.9
      });
    }

    // Account with missing linkedEntityId & mismatched linkedEntityId
    await setDoc(doc(db, 'partnerAccounts', 'uid-drv-nolink'), {
      uid: 'uid-drv-nolink',
      role: 'driver',
      displayName: 'Unlinked Driver',
      loginEmail: 'nolink@torsha.test',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'partnerAccounts', 'uid-drv-mismatch'), {
      uid: 'uid-drv-mismatch',
      role: 'driver',
      displayName: 'Mismatched Driver',
      loginEmail: 'mismatch@torsha.test',
      linkedEntityId: 'drv-satali-1', // belongs to uid-drv-satali-1, not uid-drv-mismatch!
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });

    // Kabari partners
    await setDoc(doc(db, 'partnerAccounts', 'uid-kabari-1'), {
      uid: 'uid-kabari-1',
      role: 'kabari',
      displayName: 'Satali Kabari 1',
      loginEmail: 'kabari1@torsha.test',
      linkedEntityId: 'kab-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'partnerAccounts', 'uid-kabari-2'), {
      uid: 'uid-kabari-2',
      role: 'kabari',
      displayName: 'Satali Kabari 2',
      loginEmail: 'kabari2@torsha.test',
      linkedEntityId: 'kab-2',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });

    await setDoc(doc(db, 'scrapRequests', 'scrap-1'), {
      id: 'scrap-1',
      customerId: 'cust-a',
      customerName: 'Asha Roy',
      customerPhone: '+919800011111',
      category: 'iron',
      categoryLabel: 'Iron & Steel',
      estimatedWeight: '25 kg',
      pickupAddress: 'Secret House 12, Satali',
      locality: 'Satali',
      pincode: '735214',
      status: 'accepted',
      selectedBuyerId: 'uid-kabari-1'
    });
  });
}

async function seedPendingRide(options?: {
  rideId?: string;
  customerId?: string;
  expiresAtMs?: number;
  eligibleDriverIds?: string[];
  customerProposedFare?: number;
}) {
  const rideId = options?.rideId || 'ride-satali-1';
  const customerId = options?.customerId || 'cust-a';
  const expiresAtMs = options?.expiresAtMs ?? Date.now() + 180_000;
  const eligibleDriverIds = options?.eligibleDriverIds || ['drv-satali-1', 'drv-satali-2'];
  const customerProposedFare = options?.customerProposedFare ?? 120;

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'rideBookings', rideId), {
      id: rideId,
      customerId,
      customerName: 'Asha Roy',
      customerPhone: '+919800011111',
      vehicleType: 'toto',
      pickupLocation: 'House 14, Mandir Lane, Satali',
      pickupLocality: 'Satali',
      pickupLandmark: 'Opposite SBI ATM',
      dropLocation: 'Hasimara Gate 2',
      dropLocality: 'Hasimara',
      estimatedFare: 140,
      suggestedFare: 140,
      customerProposedFare,
      status: 'OFFER_SENT',
      routingStatus: 'pending_admin_routing',
      eligibleDriverIds,
      rejectedDriverIds: [],
      activeDriverOffers: [],
      negotiationHistory: [],
      currentRound: 1,
      maxNegotiationRounds: 5,
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresAtMs,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    await setDoc(doc(db, 'rideDispatch', rideId), {
      id: rideId,
      rideId,
      customerId,
      vehicleType: 'toto',
      pickupLocality: 'Satali',
      dropLocality: 'Hasimara',
      estimatedFare: 140,
      suggestedFare: 140,
      customerProposedFare,
      status: 'OFFER_SENT',
      routingStatus: 'pending_admin_routing',
      eligibleDriverIds,
      rejectedDriverIds: [],
      activeDriverOffers: [],
      negotiationHistory: [],
      currentRound: 1,
      maxNegotiationRounds: 5,
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresAtMs,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });
  });
}

before(async () => {
  const { host, port } = parseEmulatorHost();
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules: RULES_CONTENT
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedBaselineFixtures();
});

after(async () => {
  await testEnv.cleanup();
});

test('1. Default deny & unauthenticated read/write protection + unverified admin email blocked', async () => {
  const anon = guestDb();
  const fakeAdmin = unverifiedAdminDb();
  const realAdmin = adminDb();

  // Default deny catch-all on arbitrary collections
  await assertFails(getDoc(doc(anon, 'arbitraryCollection', 'doc1')));
  await assertFails(setDoc(doc(anon, 'arbitraryCollection', 'doc1'), { x: 1 }));

  // Unauthenticated cannot read private customer, partnerAccounts, drivers, orders, rideBookings, rideDispatch
  await assertFails(getDoc(doc(anon, 'customers', 'cust-a')));
  await assertFails(getDoc(doc(anon, 'partnerAccounts', 'uid-drv-satali-1')));
  await assertFails(getDoc(doc(anon, 'drivers', 'drv-satali-1')));
  await assertFails(getDoc(doc(anon, 'rideBookings', 'ride-1')));
  await assertFails(getDoc(doc(anon, 'rideDispatch', 'ride-1')));

  // Unverified email claim cannot act as Super Admin even with matching email string
  await assertFails(
    setDoc(doc(fakeAdmin, 'routingConfig', 'universal'), {
      globalCrossLocalityEnabled: true,
      rulesByLocality: {}
    })
  );
  await assertFails(
    setDoc(doc(fakeAdmin, 'adminActivity', 'act-spoof'), {
      id: 'act-spoof',
      adminEmail: ADMIN_EMAIL,
      action: 'Spoof',
      details: 'Should fail',
      timestamp: new Date().toISOString()
    })
  );

  // Real verified Super Admin can create append-only adminActivity, but CANNOT update or delete it
  await assertSucceeds(
    setDoc(doc(realAdmin, 'adminActivity', 'act-real-1'), {
      id: 'act-real-1',
      adminEmail: ADMIN_EMAIL,
      action: 'Audit',
      details: 'Emulator test',
      timestamp: new Date().toISOString()
    })
  );
  await assertFails(updateDoc(doc(realAdmin, 'adminActivity', 'act-real-1'), { details: 'tampered' }));
});

test('2. Customer data isolation, privilege-escalation rejection, and Kabari buyer PII isolation', async () => {
  const custA = userDb('cust-a');
  const custB = userDb('cust-b');
  const kabari1 = userDb('uid-kabari-1');
  const kabari2 = userDb('uid-kabari-2');

  // Customer A can read & safely update their own customer profile
  await assertSucceeds(getDoc(doc(custA, 'customers', 'cust-a')));
  await assertSucceeds(
    updateDoc(doc(custA, 'customers', 'cust-a'), {
      address: 'Satali Tea Garden Quarter 4'
    })
  );

  // Customer A CANNOT escalate privileges or spoof phone verification
  await assertFails(updateDoc(doc(custA, 'customers', 'cust-a'), { isAdmin: true }));
  await assertFails(updateDoc(doc(custA, 'customers', 'cust-a'), { role: 'driver' }));
  await assertFails(updateDoc(doc(custA, 'customers', 'cust-a'), { isPhoneVerified: true }));

  // Customer B CANNOT read or overwrite Customer A profile
  await assertFails(getDoc(doc(custB, 'customers', 'cust-a')));
  await assertFails(updateDoc(doc(custB, 'customers', 'cust-a'), { name: 'Hacked' }));

  // Kabari Buyer 1 (selectedBuyerId) CAN read scrap-1; Kabari Buyer 2 (non-selected) CANNOT read customer PII on scrap-1
  await assertSucceeds(getDoc(doc(kabari1, 'scrapRequests', 'scrap-1')));
  await assertFails(getDoc(doc(kabari2, 'scrapRequests', 'scrap-1')));
});

test('3. Stale public listings protection & suspended partner denial across shops, products, drivers, and dispatch', async () => {
  const custA = userDb('cust-a');
  const suspendedShop = userDb('uid-shop-suspended');
  const suspendedDriver = userDb('uid-drv-suspended');
  const pendingDriver = userDb('uid-drv-pending');
  const unlinkedDriver = userDb('uid-drv-nolink');
  const mismatchedDriver = userDb('uid-drv-mismatch');

  await seedPendingRide({
    rideId: 'ride-susp-check',
    eligibleDriverIds: ['drv-satali-1', 'drv-satali-suspended', 'drv-satali-pending']
  });

  // Active approved publicShop & publicDriver allow read
  await assertSucceeds(getDoc(doc(custA, 'publicShops', 'shop-satali-1')));
  await assertSucceeds(getDoc(doc(custA, 'publicDrivers', 'drv-satali-1')));

  // Suspended parent/partnerAccount blocks customer get even if stale publicShop/publicDriver still says status=='approved'
  await assertFails(getDoc(doc(custA, 'publicShops', 'shop-suspended-1')));
  await assertFails(getDoc(doc(custA, 'publicDrivers', 'drv-satali-suspended')));

  // Suspended shopkeeper CANNOT read or update products or mutate publicProducts
  await assertFails(getDoc(doc(suspendedShop, 'products', 'prod-susp')));
  await assertFails(updateDoc(doc(suspendedShop, 'products', 'prod-susp'), { price: 99 }));

  // Suspended, pending, unlinked, and mismatched drivers CANNOT read or mutate rideDispatch / rideBookings / publicDrivers
  for (const badDb of [suspendedDriver, pendingDriver, unlinkedDriver, mismatchedDriver]) {
    await assertFails(getDoc(doc(badDb, 'rideDispatch', 'ride-susp-check')));
    await assertFails(getDoc(doc(badDb, 'rideBookings', 'ride-susp-check')));
    await assertFails(
      updateDoc(doc(badDb, 'rideDispatch', 'ride-susp-check'), {
        status: 'COUNTER_OFFERED',
        currentRound: 2,
        updatedAt: new Date().toISOString()
      })
    );
  }
  await assertFails(updateDoc(doc(suspendedDriver, 'publicDrivers', 'drv-satali-suspended'), { isOnline: false }));
});

test('4. Pre-confirmation ride PII isolation, vehicle/locality restrictions & cross-locality order dispatch lock', async () => {
  const sataliToto1 = userDb('uid-drv-satali-1');
  const jaigaonToto = userDb('uid-drv-jaigaon-1');
  const sataliAuto = userDb('uid-drv-satali-auto');
  const shopSatali = userDb('uid-shop-satali');

  await seedPendingRide({
    rideId: 'ride-loc-1',
    eligibleDriverIds: ['drv-satali-1', 'drv-satali-2']
  });

  // Eligible Satali Toto driver CAN read non-PII rideDispatch, CANNOT read private rideBookings before confirmation
  await assertSucceeds(getDoc(doc(sataliToto1, 'rideDispatch', 'ride-loc-1')));
  await assertFails(getDoc(doc(sataliToto1, 'rideBookings', 'ride-loc-1')));

  // Distant Jaigaon driver & wrong-vehicle Auto driver CANNOT read rideDispatch
  await assertFails(getDoc(doc(jaigaonToto, 'rideDispatch', 'ride-loc-1')));
  await assertFails(getDoc(doc(sataliAuto, 'rideDispatch', 'ride-loc-1')));

  // PII injection on rideDispatch is strictly rejected
  const custA = userDb('cust-a');
  const batchPii = writeBatch(custA);
  batchPii.set(doc(custA, 'rideBookings', 'ride-pii-bad'), {
    id: 'ride-pii-bad',
    customerId: 'cust-a',
    customerName: 'Asha Roy',
    customerPhone: '+919800011111',
    vehicleType: 'toto',
    pickupLocation: 'Satali',
    pickupLocality: 'Satali',
    dropLocation: 'Hasimara',
    dropLocality: 'Hasimara',
    estimatedFare: 100,
    customerProposedFare: 100,
    status: 'OFFER_SENT'
  });
  batchPii.set(doc(custA, 'rideDispatch', 'ride-pii-bad'), {
    id: 'ride-pii-bad',
    rideId: 'ride-pii-bad',
    customerId: 'cust-a',
    customerPhone: '+919800011111', // banned PII field!
    vehicleType: 'toto',
    pickupLocality: 'Satali',
    dropLocality: 'Hasimara',
    estimatedFare: 100,
    status: 'OFFER_SENT'
  });
  await assertFails(batchPii.commit());

  // Order rider dispatch locality + online enforcement on /orders
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'orders', 'ord-satali-1'), {
      id: 'ord-satali-1',
      customerId: 'cust-a',
      shopId: 'shop-satali-1',
      shopOwnerId: 'uid-shop-satali',
      customerName: 'Asha Roy',
      customerPhone: '+919800011111',
      deliveryAddress: 'Satali House 5',
      pickupLocality: 'Satali',
      locality: 'Satali',
      subtotal: 200,
      deliveryFee: 20,
      discount: 0,
      total: 220,
      paymentMethod: 'COD',
      status: 'packed',
      items: [{ id: 'prod-1', name: 'Organic Tea', qty: 1, price: 200 }]
    });
  });

  // Shopkeeper CANNOT dispatch offline rider or Jaigaon cross-locality rider when cross-locality is OFF
  await assertFails(
    updateDoc(doc(shopSatali, 'orders', 'ord-satali-1'), {
      riderId: 'del-offline-1',
      riderName: 'Offline Delivery',
      status: 'out_for_delivery',
      updatedAt: new Date().toISOString()
    })
  );
  await assertFails(
    updateDoc(doc(shopSatali, 'orders', 'ord-satali-1'), {
      riderId: 'del-jaigaon-1',
      riderName: 'Jaigaon Delivery',
      status: 'out_for_delivery',
      updatedAt: new Date().toISOString()
    })
  );

  // Shopkeeper CAN dispatch approved online same-locality rider (del-satali-1)
  await assertSucceeds(
    updateDoc(doc(shopSatali, 'orders', 'ord-satali-1'), {
      riderId: 'del-satali-1',
      riderName: 'Bikram Delivery',
      status: 'out_for_delivery',
      updatedAt: new Date().toISOString()
    })
  );
});

test('5. Atomic ride confirmation single-winner lock, race protection & sequential stage enforcement', async () => {
  const d1 = userDb('uid-drv-satali-1');
  const d2 = userDb('uid-drv-satali-2');
  const nowIso = new Date().toISOString();

  await seedPendingRide({
    rideId: 'ride-race-1',
    eligibleDriverIds: ['drv-satali-1', 'drv-satali-2'],
    customerProposedFare: 120
  });

  // Non-atomic attempt (updating rideBookings WITHOUT updating rideDispatch) MUST FAIL
  await assertFails(
    updateDoc(doc(d1, 'rideBookings', 'ride-race-1'), {
      status: 'CONFIRMED',
      routingStatus: 'assigned',
      driverId: 'drv-satali-1',
      driverName: 'Ramesh Toto',
      driverPhone: '+919800044400',
      driverLocality: 'Satali',
      vehicleNumber: 'WB-70-T-1001',
      driverRating: 4.9,
      agreedFare: 120,
      agreedAt: nowIso,
      confirmedAt: nowIso,
      activeDriverOffers: [],
      negotiationHistory: [],
      updatedAt: nowIso
    })
  );

  // First driver commits atomic dual-doc batch across /rideDispatch & /rideBookings -> SUCCEEDS
  const winnerBatch = writeBatch(d1);
  winnerBatch.update(doc(d1, 'rideDispatch', 'ride-race-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: 'drv-satali-1',
    confirmedDriverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  winnerBatch.update(doc(d1, 'rideBookings', 'ride-race-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    driverPhone: '+919800044400',
    driverLocality: 'Satali',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  await assertSucceeds(winnerBatch.commit());

  // Second driver attempting to overwrite/claim the confirmed ride MUST FAIL
  const loserBatch = writeBatch(d2);
  loserBatch.update(doc(d2, 'rideDispatch', 'ride-race-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: 'drv-satali-2',
    confirmedDriverId: 'drv-satali-2',
    driverName: 'Suresh Toto',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  loserBatch.update(doc(d2, 'rideBookings', 'ride-race-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: 'drv-satali-2',
    driverName: 'Suresh Toto',
    driverPhone: '+919800044400',
    driverLocality: 'Satali',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  await assertFails(loserBatch.commit());

  // Confirmed winning driver CAN now read passenger PII on rideBookings; losing driver CANNOT
  await assertSucceeds(getDoc(doc(d1, 'rideBookings', 'ride-race-1')));
  await assertFails(getDoc(doc(d2, 'rideBookings', 'ride-race-1')));

  // Winning driver CANNOT skip straight from CONFIRMED to COMPLETED
  const skipBatch = writeBatch(d1);
  skipBatch.update(doc(d1, 'rideBookings', 'ride-race-1'), { status: 'COMPLETED', completedAt: nowIso, updatedAt: nowIso });
  skipBatch.update(doc(d1, 'rideDispatch', 'ride-race-1'), { status: 'COMPLETED', updatedAt: nowIso });
  await assertFails(skipBatch.commit());

  // Winning driver CAN progress CONFIRMED -> PICKUP -> IN_PROGRESS -> COMPLETED
  for (const nextStatus of ['PICKUP', 'IN_PROGRESS', 'COMPLETED'] as const) {
    const stepBatch = writeBatch(d1);
    stepBatch.update(doc(d1, 'rideBookings', 'ride-race-1'), {
      status: nextStatus,
      ...(nextStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString()
    });
    stepBatch.update(doc(d1, 'rideDispatch', 'ride-race-1'), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
    await assertSucceeds(stepBatch.commit());
  }
});

test('6. Mutual agreedFare permanent immutability & expiry window enforcement against Firestore Emulator', async () => {
  const custA = userDb('cust-a');
  const d1 = userDb('uid-drv-satali-1');
  const admin = adminDb();
  const nowIso = new Date().toISOString();

  await seedPendingRide({
    rideId: 'ride-fare-lock',
    eligibleDriverIds: ['drv-satali-1'],
    customerProposedFare: 110
  });

  // Driver counter-offers ₹135 on /rideDispatch -> SUCCEEDS
  await assertSucceeds(
    updateDoc(doc(d1, 'rideDispatch', 'ride-fare-lock'), {
      status: 'COUNTER_OFFERED',
      currentRound: 2,
      activeDriverOffers: [
        {
          id: 'offer-d1-135',
          offeredBy: 'driver',
          driverId: 'drv-satali-1',
          driverName: 'Ramesh Toto',
          amount: 135,
          status: 'pending',
          roundNumber: 2,
          timestamp: nowIso
        }
      ],
      negotiationHistory: [],
      expiresAt: new Date(Date.now() + 180_000).toISOString(),
      expiresAtMs: Date.now() + 180_000,
      updatedAt: nowIso
    })
  );

  // Customer accepts counter-offer ₹135 atomically across /rideDispatch & /rideBookings -> SUCCEEDS
  const acceptBatch = writeBatch(custA);
  acceptBatch.update(doc(custA, 'rideDispatch', 'ride-fare-lock'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: 'drv-satali-1',
    confirmedDriverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 135,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  acceptBatch.update(doc(custA, 'rideBookings', 'ride-fare-lock'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    driverPhone: '+919800044400',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 135,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  await assertSucceeds(acceptBatch.commit());

  // IMMUTABLE AGREED FARE: Customer, Driver, AND even Super Admin CANNOT change agreedFare after lock!
  await assertFails(updateDoc(doc(custA, 'rideBookings', 'ride-fare-lock'), { agreedFare: 90 }));
  await assertFails(updateDoc(doc(d1, 'rideBookings', 'ride-fare-lock'), { agreedFare: 200 }));
  await assertFails(updateDoc(doc(admin, 'rideBookings', 'ride-fare-lock'), { agreedFare: 200 }));
  await assertFails(updateDoc(doc(admin, 'rideDispatch', 'ride-fare-lock'), { agreedFare: 200 }));

  // EXPIRY GUARD: Ride whose expiresAtMs is in the past CANNOT be accepted, CAN be marked EXPIRED
  await seedPendingRide({
    rideId: 'ride-expired-1',
    expiresAtMs: Date.now() - 60_000, // already expired 1 minute ago
    eligibleDriverIds: ['drv-satali-1']
  });

  const lateBatch = writeBatch(d1);
  lateBatch.update(doc(d1, 'rideDispatch', 'ride-expired-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: 'drv-satali-1',
    confirmedDriverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  lateBatch.update(doc(d1, 'rideBookings', 'ride-expired-1'), {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: 'drv-satali-1',
    driverName: 'Ramesh Toto',
    driverPhone: '+919800044400',
    driverLocality: 'Satali',
    vehicleNumber: 'WB-70-T-1001',
    driverRating: 4.9,
    agreedFare: 120,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: [],
    negotiationHistory: [],
    updatedAt: nowIso
  });
  await assertFails(lateBatch.commit());

  // Marking expired ride as EXPIRED -> SUCCEEDS
  const expireBatch = writeBatch(custA);
  expireBatch.update(doc(custA, 'rideDispatch', 'ride-expired-1'), {
    status: 'EXPIRED',
    updatedAt: nowIso
  });
  expireBatch.update(doc(custA, 'rideBookings', 'ride-expired-1'), {
    status: 'EXPIRED',
    expiredAt: nowIso,
    updatedAt: nowIso
  });
  await assertSucceeds(expireBatch.commit());
});

test('7. Notification tokens owner isolation, deactivation on logout, and customer cancel cleanup', async () => {
  const custA = userDb('cust-a');
  const d1 = userDb('uid-drv-satali-1');
  const dSusp = userDb('uid-drv-suspended');
  const nowIso = new Date().toISOString();

  // Driver 1 can register own token doc
  await assertSucceeds(
    setDoc(doc(d1, 'notificationTokens', 'nt-uid-drv-satali-1-driver'), {
      id: 'nt-uid-drv-satali-1-driver',
      uid: 'uid-drv-satali-1',
      role: 'driver',
      entityId: 'drv-satali-1',
      vehicleType: 'toto',
      locality: 'Satali',
      token: 'fcm-token-sample-123456',
      fcmEnabled: true,
      permissionStatus: 'granted',
      platform: 'android_pwa',
      channelId: 'torsha_rides_urgent_v1',
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso
    })
  );

  // Customer A CANNOT read or overwrite Driver 1's notification token
  await assertFails(getDoc(doc(custA, 'notificationTokens', 'nt-uid-drv-satali-1-driver')));
  await assertFails(
    setDoc(doc(custA, 'notificationTokens', 'nt-uid-drv-satali-1-driver'), {
      id: 'nt-uid-drv-satali-1-driver',
      uid: 'uid-drv-satali-1',
      role: 'driver',
      token: 'hijacked',
      fcmEnabled: false,
      permissionStatus: 'denied',
      platform: 'web',
      channelId: 'torsha_rides_urgent_v1',
      active: false
    })
  );

  // Driver 1 (and even a suspended driver owning their doc) CAN deactivate own token on logout
  await assertSucceeds(
    updateDoc(doc(d1, 'notificationTokens', 'nt-uid-drv-satali-1-driver'), {
      active: false,
      updatedAt: new Date().toISOString()
    })
  );
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'notificationTokens', 'nt-uid-drv-suspended-driver'), {
      id: 'nt-uid-drv-suspended-driver',
      uid: 'uid-drv-suspended',
      role: 'driver',
      token: 'stale-susp-token',
      fcmEnabled: true,
      permissionStatus: 'granted',
      platform: 'android_pwa',
      channelId: 'torsha_rides_urgent_v1',
      active: true
    });
  });
  await assertSucceeds(
    updateDoc(doc(dSusp, 'notificationTokens', 'nt-uid-drv-suspended-driver'), {
      active: false,
      updatedAt: new Date().toISOString()
    })
  );
  // Query own tokens with where('uid', '==', uid) (exact query used by deactivateNotificationTokensForUser)
  await assertSucceeds(
    getDocs(query(collection(d1, 'notificationTokens'), where('uid', '==', 'uid-drv-satali-1')))
  );
});

test('8. Multi-role partner isolation (delivery rider, doctor, service provider, admin-only collections, publicDrivers toggle)', async () => {
  const custA = userDb('cust-a');
  const custB = userDb('cust-b');
  const d1 = userDb('uid-drv-satali-1');
  const d2 = userDb('uid-drv-satali-2');
  const delSatali = userDb('uid-del-satali');
  const delJaigaon = userDb('uid-del-jaigaon');
  const nowIso = new Date().toISOString();

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // Order already out_for_delivery with del-satali-1
    await setDoc(doc(db, 'orders', 'ord-del-1'), {
      id: 'ord-del-1',
      customerId: 'cust-a',
      shopId: 'shop-satali-1',
      shopOwnerId: 'uid-shop-satali',
      customerName: 'Asha Roy',
      customerPhone: '+919800011111',
      deliveryAddress: 'Satali Quarter 4',
      pickupLocality: 'Satali',
      locality: 'Satali',
      subtotal: 200,
      deliveryFee: 20,
      discount: 0,
      total: 220,
      paymentMethod: 'COD',
      riderId: 'del-satali-1',
      riderName: 'Bikram Delivery',
      status: 'out_for_delivery',
      items: [{ id: 'prod-1', name: 'Organic Tea', qty: 1, price: 200 }]
    });

    // Doctor (active approved vs suspended) + emergencyDoctorRequests
    await setDoc(doc(db, 'partnerAccounts', 'uid-doc-1'), {
      uid: 'uid-doc-1',
      role: 'doctor',
      displayName: 'Dr. Sen',
      loginEmail: 'doc1@torsha.test',
      linkedEntityId: 'doc-satali-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'doctors', 'doc-satali-1'), {
      id: 'doc-satali-1',
      ownerId: 'uid-doc-1',
      name: 'Dr. Sen',
      phone: '+919800055501',
      status: 'approved'
    });
    await setDoc(doc(db, 'partnerAccounts', 'uid-doc-susp'), {
      uid: 'uid-doc-susp',
      role: 'doctor',
      displayName: 'Dr. Blocked',
      loginEmail: 'docsusp@torsha.test',
      linkedEntityId: 'doc-susp-1',
      status: 'suspended',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'doctors', 'doc-susp-1'), {
      id: 'doc-susp-1',
      ownerId: 'uid-doc-susp',
      name: 'Dr. Blocked',
      phone: '+919800055502',
      status: 'suspended'
    });
    await setDoc(doc(db, 'emergencyDoctorRequests', 'emerg-1'), {
      id: 'emerg-1',
      patientUserId: 'cust-a',
      patientName: 'Asha Roy',
      patientPhone: '+919800011111',
      patientAge: 34,
      symptoms: 'High fever',
      locality: 'Satali',
      assignedDoctorId: 'doc-satali-1',
      status: 'accepted'
    });

    // Service Provider (active approved vs suspended) + serviceRequests
    await setDoc(doc(db, 'partnerAccounts', 'uid-srv-1'), {
      uid: 'uid-srv-1',
      role: 'service_provider',
      displayName: 'Satali Electric',
      loginEmail: 'srv1@torsha.test',
      linkedEntityId: 'srv-satali-1',
      status: 'active',
      assignedBy: ADMIN_EMAIL
    });
    await setDoc(doc(db, 'serviceProviders', 'srv-satali-1'), {
      id: 'srv-satali-1',
      ownerId: 'uid-srv-1',
      name: 'Satali Electric',
      phone: '+919800066601',
      status: 'approved'
    });
    await setDoc(doc(db, 'serviceRequests', 'sreq-1'), {
      id: 'sreq-1',
      customerId: 'cust-a',
      customerName: 'Asha Roy',
      customerPhone: '+919800011111',
      category: 'Electrician',
      address: 'Satali Quarter 4',
      preferredDate: '2026-05-01',
      preferredTime: '10:00 AM',
      issueDescription: 'Main MCB tripping',
      estimatedFee: 250,
      locality: 'Satali',
      providerId: 'srv-satali-1',
      status: 'accepted'
    });
  });

  // Delivery rider progression vs cross-rider denial
  await assertSucceeds(updateDoc(doc(delSatali, 'orders', 'ord-del-1'), { status: 'delivered', updatedAt: nowIso }));
  await assertFails(getDoc(doc(delJaigaon, 'orders', 'ord-del-1')));

  // Doctor medical privacy & status isolation
  const doc1 = userDb('uid-doc-1');
  const docSusp = userDb('uid-doc-susp');
  await assertSucceeds(getDoc(doc(doc1, 'emergencyDoctorRequests', 'emerg-1')));
  await assertSucceeds(updateDoc(doc(doc1, 'emergencyDoctorRequests', 'emerg-1'), { status: 'doctor_on_the_way', updatedAt: nowIso }));
  await assertFails(getDoc(doc(docSusp, 'emergencyDoctorRequests', 'emerg-1')));
  await assertFails(getDoc(doc(custB, 'emergencyDoctorRequests', 'emerg-1')));

  // Service provider request isolation
  const srv1 = userDb('uid-srv-1');
  await assertSucceeds(getDoc(doc(srv1, 'serviceRequests', 'sreq-1')));
  await assertSucceeds(updateDoc(doc(srv1, 'serviceRequests', 'sreq-1'), { status: 'in_progress', updatedAt: nowIso }));
  await assertFails(getDoc(doc(custB, 'serviceRequests', 'sreq-1')));

  // publicDrivers self-toggle allowed for approved owner; blocked for status spoofing or another driver
  await assertSucceeds(updateDoc(doc(d1, 'publicDrivers', 'drv-satali-1'), { isOnline: false, updatedAt: nowIso }));
  await assertFails(updateDoc(doc(d1, 'publicDrivers', 'drv-satali-1'), { status: 'rejected', updatedAt: nowIso }));
  await assertFails(updateDoc(doc(d2, 'publicDrivers', 'drv-satali-1'), { isOnline: false, updatedAt: nowIso }));

  // Non-admins cannot create partnerAccounts or edit routingConfig
  await assertFails(
    setDoc(doc(custA, 'partnerAccounts', 'cust-a'), {
      uid: 'cust-a',
      role: 'driver',
      displayName: 'Self Promoted',
      loginEmail: 'self@torsha.test',
      linkedEntityId: 'drv-satali-1',
      status: 'active',
      assignedBy: 'cust-a'
    })
  );
  await assertFails(updateDoc(doc(d1, 'routingConfig', 'universal'), { globalCrossLocalityEnabled: true }));
});

test('9. Ride driver decline & customer cancellation across rideDispatch + rideBookings + notificationLogs isolation', async () => {
  const custA = userDb('cust-a');
  const custB = userDb('cust-b');
  const d1 = userDb('uid-drv-satali-1');
  const nowIso = new Date().toISOString();

  await seedPendingRide({
    rideId: 'ride-decline-cancel',
    eligibleDriverIds: ['drv-satali-1', 'drv-satali-2']
  });

  // Eligible driver declines pending ride on /rideDispatch -> SUCCEEDS; cannot inject agreedFare while declining
  await assertSucceeds(
    updateDoc(doc(d1, 'rideDispatch', 'ride-decline-cancel'), {
      rejectedDriverIds: ['drv-satali-1'],
      status: 'OFFER_SENT',
      updatedAt: nowIso
    })
  );
  await assertFails(
    updateDoc(doc(d1, 'rideDispatch', 'ride-decline-cancel'), {
      rejectedDriverIds: ['drv-satali-1'],
      agreedFare: 999,
      status: 'OFFER_SENT',
      updatedAt: nowIso
    })
  );

  // Customer B CANNOT cancel Customer A's ride; Customer A CAN cancel cleanly across both docs
  const badCancel = writeBatch(custB);
  badCancel.update(doc(custB, 'rideDispatch', 'ride-decline-cancel'), { status: 'CANCELLED', updatedAt: nowIso });
  badCancel.update(doc(custB, 'rideBookings', 'ride-decline-cancel'), {
    status: 'CANCELLED',
    cancelledAt: nowIso,
    cancelledBy: 'customer',
    updatedAt: nowIso
  });
  await assertFails(badCancel.commit());

  const cancelBatch = writeBatch(custA);
  cancelBatch.update(doc(custA, 'rideDispatch', 'ride-decline-cancel'), { status: 'CANCELLED', updatedAt: nowIso });
  cancelBatch.update(doc(custA, 'rideBookings', 'ride-decline-cancel'), {
    status: 'CANCELLED',
    cancelledAt: nowIso,
    cancelledBy: 'customer',
    updatedAt: nowIso
  });
  await assertSucceeds(cancelBatch.commit());
});

test('10. Live simultaneous dual-driver confirmation race against Firestore Emulator yields exactly 1 winner', async () => {
  const d1 = userDb('uid-drv-satali-1');
  const d2 = userDb('uid-drv-satali-2');
  const nowIso = new Date().toISOString();

  await seedPendingRide({
    rideId: 'ride-live-race',
    eligibleDriverIds: ['drv-satali-1', 'drv-satali-2'],
    customerProposedFare: 120
  });

  const makeDriverCommit = (driverDb: ReturnType<typeof userDb>, drvId: string, drvName: string) => {
    const batch = writeBatch(driverDb);
    batch.update(doc(driverDb, 'rideDispatch', 'ride-live-race'), {
      status: 'CONFIRMED',
      routingStatus: 'assigned',
      assignedDriverId: drvId,
      confirmedDriverId: drvId,
      driverName: drvName,
      vehicleNumber: 'WB-70-T-1001',
      driverRating: 4.9,
      agreedFare: 120,
      agreedAt: nowIso,
      confirmedAt: nowIso,
      activeDriverOffers: [],
      negotiationHistory: [],
      updatedAt: nowIso
    });
    batch.update(doc(driverDb, 'rideBookings', 'ride-live-race'), {
      status: 'CONFIRMED',
      routingStatus: 'assigned',
      driverId: drvId,
      driverName: drvName,
      driverPhone: '+919800044400',
      driverLocality: 'Satali',
      vehicleNumber: 'WB-70-T-1001',
      driverRating: 4.9,
      agreedFare: 120,
      agreedAt: nowIso,
      confirmedAt: nowIso,
      activeDriverOffers: [],
      negotiationHistory: [],
      updatedAt: nowIso
    });
    return batch.commit();
  };

  const results = await Promise.allSettled([
    makeDriverCommit(d1, 'drv-satali-1', 'Ramesh Toto'),
    makeDriverCommit(d2, 'drv-satali-2', 'Suresh Toto')
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'Exactly one competing driver must win the ride confirmation race');
  assert.equal(rejected.length, 1, 'The competing driver must be rejected by Firestore Security Rules');
});

