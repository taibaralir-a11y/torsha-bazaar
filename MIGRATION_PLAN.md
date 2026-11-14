# TORSHA BAZAAR — Safe Migration & Staging Rollout Plan (Phase 3)

> **Important:** This plan does **not** automatically modify or delete any existing Firestore records. Execute only under verified Super Admin control (`taibaralir@gmail.com`) or via an offline Admin SDK script against a staging backup first.

---

## 1. Public Non-PII Directory & Catalog Projections (Non-Destructive)

Existing private/partner collections (`shops`, `products`, `doctors`, `serviceProviders`, `jobs`, `deliveryPersons`) restrict reads/writes to owners (`ownerId`/`employerId == request.auth.uid`) and verified Super Admin. Public & signed-in directory queries consume strict allowlisted projections (`directorySanitizer.ts`):

1. **`/shops/{shopId}` → `/publicShops/{shopId}`** (`toPublicShopCard`)
   - **Keep:** `id`, `name`, `locality`, `pincode`, `imageUrl`, `description`, `category`, `shopType`, `status`, `isVerified`, `isOpen`, `deliveryAreas`, `deliveryCharge`, `freeDeliveryAbove`, `deliveryRadiusKm`, `rating`, `businessHours`, `updatedAt`, and optionally `publishContact` + `publicContactNumber` ONLY if explicitly opted in (`publishContact === true`).
   - **Strip completely:** `ownerId`, `ownerEmail`, `contactNumber`, `totalRevenue`, `totalOrders`, `licenseNumber`, `hygieneCertificate`, `gpsCoordinates`.

2. **`/products/{productId}` → `/publicProducts/{productId}`** (`toPublicProductCard`)
   - **Keep:** Catalog fields (`id`, `shopId`, `shopName`, `shopStatus`, `name`, `localName`, `price`, `originalPrice`, `unit`, `image`, `category`, `categoryType`, `rating`, `inStock`, `stock`, `isAvailable`, `isDeal`, `badge`, `description`, `brand`, `isBrandNew`, `specs`, `warranty`, `sellerName`, `sellerLocality`, `requiresPrescription`, `expiryDate`, `dosageForm`, `manufacturer`, `isWeightBased`, `pricePerKg`, `availableWeights`, `dailyFresh`, `createdAt`, `updatedAt`).
   - **Strip completely:** `ownerId` (rules explicitly forbid `'ownerId' in data`).
   - **Rule Alignment:** Public reads require BOTH `existing().shopStatus == 'approved'` AND `isShopApproved(existing().shopId)`. Client queries chunk `shopId in [...]` in slices of `<= 10` so `get(/shops/$(shopId))` never exceeds Firestore's 10-document rule evaluation limit.

3. **`/doctors/{doctorId}` → `/publicDoctors/{doctorId}`** (`toPublicDoctorCard`)
   - **Strip completely:** `ownerId`, `phone`, `email`, `clinicAddress`, `medicalCouncilRegNo`, `councilRegistrationNumber`, `documentUrl`.

4. **`/serviceProviders/{providerId}` → `/publicServiceProviders/{providerId}`** (`toPublicServiceProviderCard`)
   - **Strip completely:** `ownerId`, `phone`.

5. **`/jobs/{jobId}` → `/publicJobs/{jobId}`** (`toPublicJobCard`)
   - **Strip completely:** `employerId`, `employerName`, private `employerPhone` (only expose `publishContact: true` + `publicContactNumber` when employer explicitly opts in).

6. **`/deliveryPersons/{personId}` → `/publicRiders/{riderId}`** (`toPublicRiderCard`)
   - **Keep:** `id`, `name`, `locality`, `status`, `isOnline`, `rating`, `updatedAt` (readable by signed-in users & shopkeepers for verified rider assignment).
   - **Strip completely:** `ownerId`, `phone`, `email`.

---

## 2. Denormalized `shopStatus` & Relational Backfill Requirements

Before deploying updated `firestore.rules`:
1. **Products & `publicProducts` Backfill:**
   - Query all `/products` documents as Admin.
   - Lookup parent `/shops/{product.shopId}` (`status` must match `'approved' | 'pending' | 'rejected' | 'suspended'`).
   - Update `products/{id}.shopStatus` AND write sanitized `publicProducts/{id}` via `toPublicProductCard(product)`.
2. **Service Requests (`providerId` vs `providerOwnerId`):**
   - Convention: `serviceRequests.providerId` always stores `/serviceProviders/{providerId}` document ID; `serviceRequests.providerOwnerId` stores that provider's Firebase Auth UID (`serviceProviders/{providerId}.ownerId`).
   - Backfill `providerOwnerId` on any previously assigned `/serviceRequests` records so assigned technicians can list their own assigned jobs via `where('providerOwnerId', '==', uid)`.
3. **Job Applications (`employerId` consistency):**
   - Verify existing `/jobApplications/{appId}` documents reference an existing `/jobs/{jobId}` and match `jobs/{jobId}.employerId` if `employerId` is populated.
4. **Customer Phone E.164 Normalization & Verification Flags (`phone`, `isPhoneVerified`, `isVerified`, `authMethod`):**
   - Normalize all `/customers/{customerId}.phone` values to E.164 (`+91XXXXXXXXXX`) so any future Firebase Phone Auth matches `request.auth.token.phone_number` cleanly.
   - Audit existing `/customers/{customerId}` docs: only records backed by real Firebase Phone Auth with matching `token.phone_number == data.phone` should have `isPhoneVerified: true` / `authMethod: 'phone'`. Any anonymous/guest records must have `isPhoneVerified: false`.
5. **Legacy Non-UID Identity Mapping:**
   - Inventory seed/demo IDs (`cust-taibar-001`, `merchant-taibar-001`, `drv-ramesh-1`, `doc-1`, `dp-1`, `sp-1`, `job-1`) whose `ownerId`/`customerId`/`employerId` is not a real Firebase Auth UID and migrate legitimate partner/customer accounts upon Firebase Auth onboarding.

---

## 3. Rollout Sequence (Before Deploying Rules)

1. Export/backup all existing Firestore collections before touching any data.
2. Execute non-destructive Admin backfill scripts for `publicShops`, `publicProducts`, `publicDoctors`, `publicServiceProviders`, `publicJobs`, `publicRiders`, `products.shopStatus`, and `serviceRequests.providerOwnerId`.
3. Run automated security rule tests in the Firebase Rules Emulator (requires JDK 11+ installed in staging/CI; not present in this container).
4. **Only after emulator security tests pass and all backfills are verified:** deploy `firestore.rules`.
5. When upgrading beyond Spark (₹0) to Cloud Functions / Cloud Run (`BACKEND REQUIRED` features):
   - Authoritative server-side order pricing & catalog unit-price verification + atomic stock decrement.
   - Atomic first-claim arbitration & cross-account notifications for `rideBookings`, `deliveries`, `emergencyDoctorRequests`, `serviceRequests`, and `scrapRequests` buyer quotes/offer acceptance.
   - Automated triggers syncing `rideDispatch`, `deliveryDispatch`, and `emergencyDispatch` strictly with non-PII summaries.
