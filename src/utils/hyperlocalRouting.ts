import {
  AssignmentAuditEntry,
  DeliveryPerson,
  Driver,
  LocalityInfo,
  LocalityRoutingRule,
  PartnerAccount,
  PartnerEligibilityReport,
  PartnerRoleType,
  Product,
  PublicDriverCard,
  PublicRiderCard,
  RoutingAlert,
  RoutingServiceCategory,
  ServiceProvider,
  Shop,
  UniversalRoutingConfig,
  VehicleType
} from '../types';
import { fromPublicDriverCard, fromPublicRiderCard } from './directorySanitizer';
export type { LocalityInfo };

export const CORE_HUB_LOCALITIES = ['Hasimara', 'Satali', 'Kalchini', 'Jaigaon'] as const;

/**
 * Standard default initial localities list for Satali / Hasimara / Kalchini / Jaigaon.
 * Centrally managed and synchronized with Firestore collection 'localities'.
 */
export const INITIAL_SERVICE_LOCALITIES: LocalityInfo[] = [
  // --- SATALI SERVICE AREA (PIN: 735214) ---
  {
    id: 'satali',
    name: 'Satali',
    pincode: '735214',
    parentArea: 'Satali',
    hubName: 'Satali Tea Garden & Mandi Hub',
    coordinates: { lat: 26.7214, lng: 89.3982 },
    popularLandmarks: ['Satali Chowk', 'Tea Division Gate', 'Satali Primary Health Centre', 'Weekly Haat Mandi'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Satali': 0,
      'Subhashini': 4.5,
      'Gurudwara': 6.2,
      'Basti Bazar': 5.5,
      'Malangi': 4.0,
      'Bhornabari': 7.0,
      'Madhu Bagan': 5.0,
      'Bech Bagan': 2.0,
      'Haldibari': 2.5,
      'Purba Satali': 1.8,
      'Satali Mandal Para': 1.2,
      'Hasimara': 6.0,
      'Kalchini': 10.0,
      'Jaigaon': 20.0
    }
  },
  {
    id: 'bech-bagan',
    name: 'Bech Bagan',
    pincode: '735214',
    parentArea: 'Satali',
    hubName: 'Bech Bagan Plantation Hub',
    coordinates: { lat: 26.7150, lng: 89.3880 },
    popularLandmarks: ['Bech Bagan Chowk', 'Shivalaya Mandir', 'Tea Shed', 'Labour Colony Gate'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Satali': 2.0,
      'Bech Bagan': 0,
      'Haldibari': 2.2,
      'Purba Satali': 2.8,
      'Satali Mandal Para': 1.5,
      'Hasimara': 5.0,
      'Kalchini': 9.5
    }
  },
  {
    id: 'haldibari',
    name: 'Haldibari',
    pincode: '735214',
    parentArea: 'Satali',
    hubName: 'Haldibari Rural Sector',
    coordinates: { lat: 26.7050, lng: 89.3950 },
    popularLandmarks: ['Haldibari Prathamik Vidyalaya', 'Haat Tola', 'River Bund Road', 'Fisheries More'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Satali': 2.5,
      'Haldibari': 0,
      'Bech Bagan': 2.2,
      'Purba Satali': 2.4,
      'Satali Mandal Para': 1.8,
      'Hasimara': 6.5,
      'Kalchini': 10.5
    }
  },
  {
    id: 'purba-satali',
    name: 'Purba Satali',
    pincode: '735214',
    parentArea: 'Satali',
    hubName: 'Purba Satali Gramin Sector',
    coordinates: { lat: 26.7250, lng: 89.4120 },
    popularLandmarks: ['Purba Satali Club', 'Jame Masjid', 'Panchayat Office Road', 'Khadimpara'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Satali': 1.8,
      'Purba Satali': 0,
      'Satali Mandal Para': 1.4,
      'Haldibari': 2.4,
      'Bech Bagan': 2.8,
      'Hasimara': 7.0,
      'Kalchini': 8.8
    }
  },
  {
    id: 'satali-mandal-para',
    name: 'Satali Mandal Para',
    pincode: '735214',
    parentArea: 'Satali',
    hubName: 'Satali Mandal Para Sector',
    coordinates: { lat: 26.7180, lng: 89.4020 },
    popularLandmarks: ['Mandal Para Chowk', 'Community Hall', 'Anganwadi Kendra', 'Banyan Tree Morh'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Satali': 1.2,
      'Satali Mandal Para': 0,
      'Purba Satali': 1.4,
      'Bech Bagan': 1.5,
      'Haldibari': 1.8,
      'Hasimara': 5.8,
      'Kalchini': 9.2
    }
  },

  // --- HASIMARA SERVICE AREA (PIN: 735215) ---
  {
    id: 'hasimara',
    name: 'Hasimara',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Hasimara Junction & Air Force Station Hub',
    coordinates: { lat: 26.7495, lng: 89.3496 },
    popularLandmarks: ['Hasimara Station Road', 'Air Force Gate', 'Railway Canteen', 'Old Hasimara Bazar'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Hasimara': 0,
      'Subhashini': 1.8,
      'Gurudwara': 1.2,
      'Basti Bazar': 1.5,
      'Malangi': 2.5,
      'Bhornabari': 3.0,
      'Madhu Bagan': 4.5,
      'Satali': 6.0,
      'Kalchini': 14.0,
      'Jaigaon': 18.0
    }
  },
  {
    id: 'subhashini',
    name: 'Subhashini',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Subhashini Tea Estate Hub',
    coordinates: { lat: 26.7410, lng: 89.3520 },
    popularLandmarks: ['Subhashini Factory Gate', 'Staff Quarters Line', 'Garden Hospital', 'Club Ground'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Subhashini': 0,
      'Hasimara': 1.8,
      'Gurudwara': 2.2,
      'Basti Bazar': 1.6,
      'Malangi': 2.0,
      'Satali': 4.5,
      'Bhornabari': 3.8
    }
  },
  {
    id: 'gurudwara',
    name: 'Gurudwara',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Hasimara Gurudwara Complex',
    coordinates: { lat: 26.7510, lng: 89.3450 },
    popularLandmarks: ['Gurudwara Sahib', 'Station Road Link', 'Army Camp Gate #2', 'Langar Hall Morh'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Gurudwara': 0,
      'Hasimara': 1.2,
      'Subhashini': 2.2,
      'Basti Bazar': 1.4,
      'Malangi': 2.8,
      'Bhornabari': 2.6,
      'Satali': 6.2
    }
  },
  {
    id: 'basti-bazar',
    name: 'Basti Bazar',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Hasimara Basti Local Market',
    coordinates: { lat: 26.7450, lng: 89.3480 },
    popularLandmarks: ['Basti Chowk', 'Kali Mandir', 'Daily Veggie Shed', 'Panchayat Bhavan'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Basti Bazar': 0,
      'Hasimara': 1.5,
      'Gurudwara': 1.4,
      'Subhashini': 1.6,
      'Malangi': 2.2,
      'Satali': 5.5,
      'Bhornabari': 3.2
    }
  },
  {
    id: 'malangi',
    name: 'Malangi',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Malangi River & Tea Division Hub',
    coordinates: { lat: 26.7350, lng: 89.3620 },
    popularLandmarks: ['Malangi Bridge', 'Tea Division Office', 'Primary School Line', 'Forest Beat Post'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Malangi': 0,
      'Hasimara': 2.5,
      'Subhashini': 2.0,
      'Basti Bazar': 2.2,
      'Satali': 4.0,
      'Bhornabari': 4.2
    }
  },
  {
    id: 'bhornabari',
    name: 'Bhornabari',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Bhornabari Tea Garden Sector',
    coordinates: { lat: 26.7620, lng: 89.3410 },
    popularLandmarks: ['Bhornabari Factory', 'Line No. 4', 'Tea Garden Football Ground', 'North Chowk'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Bhornabari': 0,
      'Hasimara': 3.0,
      'Gurudwara': 2.6,
      'Subhashini': 3.8,
      'Basti Bazar': 3.2,
      'Satali': 7.0
    }
  },
  {
    id: 'madhu-bagan',
    name: 'Madhu Bagan',
    pincode: '735215',
    parentArea: 'Hasimara',
    hubName: 'Madhu Tea Garden Sector',
    coordinates: { lat: 26.7120, lng: 89.4100 },
    popularLandmarks: ['Madhu Factory', 'Labour Line No. 2', 'Bazar More', 'Madhu Primary Health Unit'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Madhu Bagan': 0,
      'Hasimara': 4.5,
      'Satali': 5.0,
      'Subhashini': 4.0,
      'Kalchini': 8.0
    }
  },

  // --- KALCHINI SERVICE AREA (PIN: 735217) ---
  {
    id: 'kalchini',
    name: 'Kalchini',
    pincode: '735217',
    parentArea: 'Kalchini',
    hubName: 'Kalchini Block Headquarter & Torsa Valley',
    coordinates: { lat: 26.6983, lng: 89.4674 },
    popularLandmarks: ['Kalchini Main Market', 'Torsa Tea Estate Hospital', 'BDO Office Road', 'Kalchini Station Road'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Kalchini': 0,
      'Satali': 10.0,
      'Hasimara': 14.0,
      'Jaigaon': 22.0
    }
  },

  // --- JAIGAON SERVICE AREA (PIN: 735182) ---
  {
    id: 'jaigaon',
    name: 'Jaigaon',
    pincode: '735182',
    parentArea: 'Jaigaon',
    hubName: 'Jaigaon Border Commercial Market',
    coordinates: { lat: 26.8485, lng: 89.3807 },
    popularLandmarks: ['Bhutan Gate Area', 'Super Market', 'N.S. Road', 'Gopal Mandir Chowk'],
    isVerifiedPin: true,
    active: true,
    distanceTo: {
      'Jaigaon': 0,
      'Hasimara': 18.0,
      'Satali': 20.0,
      'Kalchini': 22.0
    }
  }
];

// Alias for backwards compatibility
export const SERVICE_LOCALITIES: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES;

/**
 * Haversine formula to compute actual distance in km from GPS coordinates
 */
export function calculateGpsDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Normalizes locality query (including full addresses, landmarks, or "(PIN)" labels)
 * and matches against centrally managed localities.
 */
export function getLocalityByName(
  name: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): LocalityInfo {
  if (!name) return localitiesList[0];
  const normalized = name.toLowerCase().replace(/\(.*?\)/g, '').trim();
  if (!normalized) return localitiesList[0];

  // 1. Exact match on locality name
  const exact = localitiesList.find((loc) => loc.name.toLowerCase() === normalized);
  if (exact) return exact;

  // 2. Longest locality name contained in free-text address (e.g. "Hasimara Air Force Gate" -> Hasimara)
  const byLongestName = [...localitiesList].sort((a, b) => b.name.length - a.name.length);
  const containedInText = byLongestName.find((loc) =>
    normalized.includes(loc.name.toLowerCase())
  );
  if (containedInText) return containedInText;

  // 3. Partial prefix/contains where query is a substring of locality name
  const partialName = localitiesList.find((loc) =>
    loc.name.toLowerCase().includes(normalized)
  );
  if (partialName) return partialName;

  // 4. Landmark or pincode match
  const landmarkMatch = localitiesList.find(
    (loc) =>
      (loc.pincode && name.includes(loc.pincode)) ||
      loc.popularLandmarks?.some((lm) => normalized.includes(lm.toLowerCase()))
  );
  if (landmarkMatch) return landmarkMatch;

  // 5. Fallback to first locality
  return localitiesList[0];
}

/**
 * Resolves the canonical town / parent service area name ('Hasimara', 'Satali', 'Kalchini', 'Jaigaon', etc.)
 */
export function resolveAreaKey(
  localityOrAddress: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): string {
  const matched = getLocalityByName(localityOrAddress, localitiesList);
  return matched.parentArea || matched.name;
}

/**
 * Computes distance between two locality names using coordinates if available or fallback distance table
 */
export function getDistanceBetween(
  localityA: string,
  localityB: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): number {
  const locA = getLocalityByName(localityA, localitiesList);
  const locB = getLocalityByName(localityB, localitiesList);
  if (locA.id === locB.id || locA.name.toLowerCase() === locB.name.toLowerCase()) return 0;

  // Real GPS calculation if both have coordinates
  if (locA.coordinates?.lat && locB.coordinates?.lat) {
    const gpsDist = calculateGpsDistance(
      locA.coordinates.lat,
      locA.coordinates.lng,
      locB.coordinates.lat,
      locB.coordinates.lng
    );
    if (gpsDist > 0) return gpsDist;
  }

  // Precomputed matrix check
  if (locA.distanceTo && locA.distanceTo[locB.name] !== undefined) {
    return locA.distanceTo[locB.name];
  }
  if (locB.distanceTo && locB.distanceTo[locA.name] !== undefined) {
    return locB.distanceTo[locA.name];
  }

  // Default regional estimate based on parent area
  if (locA.parentArea && locB.parentArea && locA.parentArea === locB.parentArea) {
    return 3.5;
  }
  return 10.0;
}

export function getEstimatedDeliveryMinutes(distanceKm: number): string {
  if (distanceKm === 0) return '15-25 mins (Local)';
  if (distanceKm <= 3) return '20-30 mins';
  if (distanceKm <= 7) return '35-45 mins';
  if (distanceKm <= 15) return '45-60 mins';
  return '60-80 mins';
}

export interface HyperlocalShopMatch {
  shop: Shop;
  isSameLocality: boolean;
  isServedDeliveryZone: boolean;
  distanceKm: number;
  deliveryTime: string;
  deliveryCharge: number;
  isDeliverable: boolean;
}

/**
 * Prioritizes shops strictly by customer locality:
 * 1. Exact same locality shops first.
 * 2. Shops having customer locality explicitly in their deliveryAreas second.
 * 3. Nearest shops by GPS distance third.
 */
export function rankShopsForCustomer(
  shops: Shop[],
  customerLocality: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): HyperlocalShopMatch[] {
  const customerLoc = getLocalityByName(customerLocality, localitiesList);
  const normCustomerName = customerLoc.name.toLowerCase();

  return shops.map((shop) => {
    const shopLoc = getLocalityByName(shop.locality, localitiesList);
    const normShopName = shopLoc.name.toLowerCase();
    const isSameLocality = normShopName === normCustomerName;

    // Check if shopkeeper explicitly marked customer locality in deliveryAreas
    const isServedDeliveryZone = Array.isArray(shop.deliveryAreas) && shop.deliveryAreas.some((area) => {
      const areaNorm = area.toLowerCase().replace(/\(.*?\)/g, '').trim();
      return areaNorm === normCustomerName || areaNorm === customerLoc.parentArea.toLowerCase();
    });

    const distanceKm = getDistanceBetween(customerLoc.name, shopLoc.name, localitiesList);
    const maxRadius = shop.deliveryRadiusKm || 15;
    const isDeliverable = isSameLocality || isServedDeliveryZone || distanceKm <= maxRadius;

    const baseCharge = shop.deliveryCharge || 20;
    const deliveryCharge = isSameLocality ? baseCharge : Math.round(baseCharge + distanceKm * 2);

    return {
      shop,
      isSameLocality,
      isServedDeliveryZone,
      distanceKm,
      deliveryTime: getEstimatedDeliveryMinutes(distanceKm),
      deliveryCharge,
      isDeliverable
    };
  }).sort((a, b) => {
    // 1. Exact same locality first
    if (a.isSameLocality && !b.isSameLocality) return -1;
    if (!a.isSameLocality && b.isSameLocality) return 1;

    // 2. Explicitly selected delivery zone
    if (a.isServedDeliveryZone && !b.isServedDeliveryZone) return -1;
    if (!a.isServedDeliveryZone && b.isServedDeliveryZone) return 1;

    // 3. Deliverable before undeliverable
    if (a.isDeliverable && !b.isDeliverable) return -1;
    if (!a.isDeliverable && b.isDeliverable) return 1;

    // 4. Closest GPS distance
    return a.distanceKm - b.distanceKm;
  });
}

/**
 * Checks whether checkout items require customer approval for cross-locality delivery.
 * Requirement: "Never send an order to another locality without customer approval."
 */
export function checkRequiresCrossLocalityApproval(
  cartShopIds: string[],
  shops: Shop[],
  customerLocality: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): {
  requiresApproval: boolean;
  crossLocalityShops: { shopName: string; shopLocality: string; distanceKm: number }[];
} {
  const customerLoc = getLocalityByName(customerLocality, localitiesList);
  const normCustomerName = customerLoc.name.toLowerCase();

  const crossLocalityShops: { shopName: string; shopLocality: string; distanceKm: number }[] = [];

  const uniqueShopIds = Array.from(new Set(cartShopIds));
  uniqueShopIds.forEach((shopId) => {
    const shop = shops.find((s) => s.id === shopId);
    if (shop) {
      const shopLoc = getLocalityByName(shop.locality, localitiesList);
      if (shopLoc.name.toLowerCase() !== normCustomerName) {
        const distanceKm = getDistanceBetween(customerLoc.name, shopLoc.name, localitiesList);
        crossLocalityShops.push({
          shopName: shop.name,
          shopLocality: shopLoc.name,
          distanceKm
        });
      }
    }
  });

  return {
    requiresApproval: crossLocalityShops.length > 0,
    crossLocalityShops
  };
}

/**
 * Filter products according to customer locality:
 * Local products from exact locality first, then delivery-zone served shops.
 */
export function filterProductsByLocality(
  products: Product[],
  shops: Shop[],
  customerLocality: string,
  allowExpandedSearch: boolean = false,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): {
  localProducts: Product[];
  nearbyProducts: Product[];
  missingLocallyCount: number;
} {
  const customerLoc = getLocalityByName(customerLocality, localitiesList);
  const normCustomerName = customerLoc.name.toLowerCase();
  const shopMap = new Map<string, Shop>();
  shops.forEach((s) => shopMap.set(s.id, s));

  const localProducts: Product[] = [];
  const nearbyProducts: Product[] = [];

  products.forEach((prod) => {
    const shop = prod.shopId ? shopMap.get(prod.shopId) : undefined;
    const shopLocName = shop?.locality 
      ? getLocalityByName(shop.locality, localitiesList).name.toLowerCase() 
      : normCustomerName;

    const isExact = shopLocName === normCustomerName;
    const isServed = shop?.deliveryAreas?.some(
      (area) => area.toLowerCase().replace(/\(.*?\)/g, '').trim() === normCustomerName
    );

    if (isExact || isServed) {
      localProducts.push(prod);
    } else {
      nearbyProducts.push(prod);
    }
  });

  return {
    localProducts,
    nearbyProducts: allowExpandedSearch ? nearbyProducts : [],
    missingLocallyCount: nearbyProducts.length
  };
}

// =========================================================================
// UNIVERSAL LOCALITY-BASED ADMIN ROUTING ENGINE (All 5 Service Categories)
// =========================================================================

/**
 * Normalizes home service category aliases between UI cards and provider profiles
 * e.g. "AC & Fridge Repair" <-> "AC Repair"
 */
export function normalizeServiceCategory(category: string): string {
  const norm = (category || '').toLowerCase().trim();
  if (!norm) return '';
  if (norm.includes('ac') || norm.includes('fridge')) return 'ac repair';
  if (norm.includes('computer') || norm.includes('printer')) return 'computer repair';
  if (norm.includes('clean')) return 'home cleaning';
  if (norm.includes('electric')) return 'electrician';
  if (norm.includes('plumb')) return 'plumber';
  if (norm.includes('carpent')) return 'carpenter';
  if (norm.includes('mechan')) return 'mechanic';
  if (norm.includes('paint')) return 'painter';
  if (norm.includes('mobile')) return 'mobile repair';
  return norm;
}

/**
 * Builds the default strict locality routing configuration.
 * By default:
 * - globalCrossLocalityEnabled is false
 * - Each hub locality (Hasimara, Satali, Kalchini, Jaigaon, plus sub-localities) has crossLocalityEnabled = false and nearbyLocalities = []
 * - Partners are auto-mapped strictly to the town/parentArea matching their base locality (never cross-town by default).
 */
export function createDefaultRoutingConfig(params: {
  localities?: LocalityInfo[];
  shops?: Shop[];
  deliveryPersons?: DeliveryPerson[];
  drivers?: Driver[];
  serviceProviders?: ServiceProvider[];
}): UniversalRoutingConfig {
  const localities = params.localities?.length ? params.localities : INITIAL_SERVICE_LOCALITIES;
  const rulesByLocality: Record<string, LocalityRoutingRule> = {};

  // Always seed canonical hub keys plus every locality name
  const uniqueRuleKeys = Array.from(
    new Set([
      ...CORE_HUB_LOCALITIES,
      ...localities.map((l) => l.parentArea || l.name),
      ...localities.map((l) => l.name)
    ])
  );

  uniqueRuleKeys.forEach((locName) => {
    const targetAreaKey = resolveAreaKey(locName, localities).toLowerCase();

    const shopIds = (params.shops || [])
      .filter((s) => resolveAreaKey(s.locality, localities).toLowerCase() === targetAreaKey)
      .map((s) => s.id);

    const deliveryRiderIds = (params.deliveryPersons || [])
      .filter((d) => resolveAreaKey(d.locality, localities).toLowerCase() === targetAreaKey)
      .map((d) => d.id);

    const rideDriverIds = (params.drivers || [])
      .filter((d) => resolveAreaKey(d.locality || d.currentLocation || '', localities).toLowerCase() === targetAreaKey)
      .map((d) => d.id);

    const serviceProviderIds = (params.serviceProviders || [])
      .filter((sp) => {
        const spArea = sp.serviceArea || '';
        const primaryArea = spArea.split(/[,&]/)[0]?.trim() || spArea;
        return resolveAreaKey(primaryArea, localities).toLowerCase() === targetAreaKey;
      })
      .map((sp) => sp.id);

    rulesByLocality[locName] = {
      localityName: locName,
      crossLocalityEnabled: false,
      nearbyLocalities: [],
      shopIds,
      deliveryRiderIds,
      rideDriverIds,
      serviceProviderIds,
      updatedAt: new Date().toISOString()
    };
  });

  return {
    globalCrossLocalityEnabled: false,
    rulesByLocality,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Ensures a newly created or synced partner is registered inside its base locality's routing rule
 * without overwriting Admin customizations for other localities.
 */
export function syncPartnerIntoRoutingConfig(
  config: UniversalRoutingConfig,
  role: 'shop' | 'delivery' | 'driver' | 'service_provider',
  partnerId: string,
  baseLocality: string,
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): UniversalRoutingConfig {
  const canonicalKey = resolveAreaKey(baseLocality, localities);
  const existingRule = config.rulesByLocality[canonicalKey] || {
    localityName: canonicalKey,
    crossLocalityEnabled: false,
    nearbyLocalities: [],
    shopIds: [],
    deliveryRiderIds: [],
    rideDriverIds: [],
    serviceProviderIds: []
  };

  const fieldMap: Record<typeof role, keyof Pick<LocalityRoutingRule, 'shopIds' | 'deliveryRiderIds' | 'rideDriverIds' | 'serviceProviderIds'>> = {
    shop: 'shopIds',
    delivery: 'deliveryRiderIds',
    driver: 'rideDriverIds',
    service_provider: 'serviceProviderIds'
  };

  const field = fieldMap[role];
  const currentList = existingRule[field] || [];
  if (currentList.includes(partnerId)) return config;

  return {
    ...config,
    rulesByLocality: {
      ...config.rulesByLocality,
      [canonicalKey]: {
        ...existingRule,
        [field]: [...currentList, partnerId],
        updatedAt: new Date().toISOString()
      }
    },
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves the Admin routing rule governing a given request locality
 * (prefers exact locality rule if configured, otherwise parent hub area rule).
 */
export function getRuleForLocality(
  config: UniversalRoutingConfig,
  requestLocality: string,
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): LocalityRoutingRule | undefined {
  const matched = getLocalityByName(requestLocality, localities);
  return (
    config.rulesByLocality[matched.name] ||
    config.rulesByLocality[matched.parentArea] ||
    config.rulesByLocality[requestLocality]
  );
}

/**
 * Helper to look up whether a partner's PartnerAccount is suspended.
 */
export function isPartnerAccountSuspended(
  partnerId: string,
  ownerId: string | undefined,
  partnerAccounts: PartnerAccount[] = []
): boolean {
  const acc = partnerAccounts.find(
    (a) => a.linkedEntityId === partnerId || (ownerId && a.uid === ownerId)
  );
  return acc?.status === 'suspended';
}

interface LocalityMatchEvaluation {
  localityEligible: boolean;
  isExactLocality: boolean;
  isApprovedNearbyLocality: boolean;
  crossLocalityUsed: boolean;
  reason?: string;
}

function evaluateLocalityAccess(params: {
  requestLocality: string;
  partnerId: string;
  baseLocality: string;
  liveLocation: string;
  mappedPartnerIds: string[];
  partnerServedLocalities?: string[];
  rule?: LocalityRoutingRule;
  config: UniversalRoutingConfig;
  localities: LocalityInfo[];
}): LocalityMatchEvaluation {
  const {
    requestLocality,
    partnerId,
    baseLocality,
    liveLocation,
    mappedPartnerIds,
    partnerServedLocalities = [],
    rule,
    config,
    localities
  } = params;

  const reqArea = resolveAreaKey(requestLocality, localities);
  const reqAreaLower = reqArea.toLowerCase();
  const baseArea = resolveAreaKey(baseLocality, localities);
  const liveArea = resolveAreaKey(liveLocation || baseLocality, localities);

  const isMappedInRule = mappedPartnerIds.includes(partnerId);
  const isBaseInRequestArea = baseArea.toLowerCase() === reqAreaLower;
  const isLiveInRequestArea = liveArea.toLowerCase() === reqAreaLower;

  // Same-locality eligible path: partner lives/operates in request area AND is mapped to that area (not removed by Admin)
  if (isBaseInRequestArea && isLiveInRequestArea) {
    if (!isMappedInRule) {
      return {
        localityEligible: false,
        isExactLocality: true,
        isApprovedNearbyLocality: false,
        crossLocalityUsed: false,
        reason: `Unmapped from ${reqArea} by Admin Locality Routing`
      };
    }
    return {
      localityEligible: true,
      isExactLocality: true,
      isApprovedNearbyLocality: false,
      crossLocalityUsed: false
    };
  }

  // Partner belongs to request area, is mapped, but live location moved outside request area
  if (isBaseInRequestArea && !isLiveInRequestArea) {
    const crossEnabledForReturn =
      config.globalCrossLocalityEnabled && Boolean(rule?.crossLocalityEnabled);
    const liveAllowedAsNearby =
      crossEnabledForReturn &&
      (rule?.nearbyLocalities || []).some(
        (n) => resolveAreaKey(n, localities).toLowerCase() === liveArea.toLowerCase()
      );
    if (liveAllowedAsNearby && isMappedInRule) {
      return {
        localityEligible: true,
        isExactLocality: false,
        isApprovedNearbyLocality: true,
        crossLocalityUsed: true
      };
    }
    return {
      localityEligible: false,
      isExactLocality: false,
      isApprovedNearbyLocality: false,
      crossLocalityUsed: false,
      reason: `Active location is ${liveArea} (outside ${reqArea})`
    };
  }

  // Partner is from ANOTHER area (e.g. Jaigaon rider on Hasimara request):
  // STRICTLY require BOTH globalCrossLocalityEnabled AND rule.crossLocalityEnabled AND explicit Admin approval
  const crossAllowedByAdmin =
    config.globalCrossLocalityEnabled && Boolean(rule?.crossLocalityEnabled);

  if (!crossAllowedByAdmin) {
    return {
      localityEligible: false,
      isExactLocality: false,
      isApprovedNearbyLocality: false,
      crossLocalityUsed: false,
      reason: `Outside Admin-approved locality (${liveArea} partner; cross-locality disabled for ${reqArea})`
    };
  }

  const isInApprovedNearby = (rule?.nearbyLocalities || []).some(
    (n) =>
      resolveAreaKey(n, localities).toLowerCase() === liveArea.toLowerCase() ||
      resolveAreaKey(n, localities).toLowerCase() === baseArea.toLowerCase()
  );
  const hasPartnerExplicitArea = partnerServedLocalities.some(
    (s) => resolveAreaKey(s, localities).toLowerCase() === reqAreaLower
  );

  // Partner must be either explicitly mapped into this locality rule OR from an Admin-approved nearby locality (with optional servedLocalities support)
  if (isMappedInRule || (isInApprovedNearby && (partnerServedLocalities.length === 0 || hasPartnerExplicitArea))) {
    return {
      localityEligible: true,
      isExactLocality: false,
      isApprovedNearbyLocality: true,
      crossLocalityUsed: true
    };
  }

  return {
    localityEligible: false,
    isExactLocality: false,
    isApprovedNearbyLocality: false,
    crossLocalityUsed: false,
    reason: `${liveArea} is not approved by Admin to serve ${reqArea}`
  };
}

export function evaluateShopEligibility(
  requestLocality: string,
  shop: Shop,
  config: UniversalRoutingConfig,
  partnerAccounts: PartnerAccount[] = [],
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): PartnerEligibilityReport {
  const rule = getRuleForLocality(config, requestLocality, localities);
  const reasons: string[] = [];

  if (shop.status !== 'approved') {
    reasons.push(`Shop status is ${shop.status} (must be approved)`);
  }
  if (isPartnerAccountSuspended(shop.id, shop.ownerId, partnerAccounts)) {
    reasons.push('Partner account is suspended');
  }
  if (!shop.isOpen) {
    reasons.push('Shop is currently closed');
  }

  const locEval = evaluateLocalityAccess({
    requestLocality,
    partnerId: shop.id,
    baseLocality: shop.locality,
    liveLocation: shop.locality,
    mappedPartnerIds: rule?.shopIds || [],
    partnerServedLocalities: shop.servedLocalities || shop.deliveryAreas || [],
    rule,
    config,
    localities
  });
  if (!locEval.localityEligible && locEval.reason) {
    reasons.push(locEval.reason);
  }

  return {
    partnerId: shop.id,
    partnerName: shop.name,
    partnerRole: 'shopkeeper',
    baseLocality: resolveAreaKey(shop.locality, localities),
    currentLocation: resolveAreaKey(shop.locality, localities),
    isEligible: reasons.length === 0,
    reasons,
    isExactLocality: locEval.isExactLocality,
    isApprovedNearbyLocality: locEval.isApprovedNearbyLocality,
    crossLocalityUsed: locEval.crossLocalityUsed,
    category: shop.category
  };
}

export function evaluateDeliveryRiderEligibility(
  requestLocality: string,
  rider: DeliveryPerson,
  config: UniversalRoutingConfig,
  partnerAccounts: PartnerAccount[] = [],
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): PartnerEligibilityReport {
  const rule = getRuleForLocality(config, requestLocality, localities);
  const reasons: string[] = [];
  const baseLoc = resolveAreaKey(rider.locality, localities);
  const liveLoc = resolveAreaKey(rider.currentLocation || rider.locality, localities);

  if (rider.status !== 'approved') {
    reasons.push(`Delivery rider status is ${rider.status} (not approved)`);
  }
  if (isPartnerAccountSuspended(rider.id, rider.ownerId, partnerAccounts)) {
    reasons.push('Partner account suspended');
  }
  if (!rider.isOnline) {
    reasons.push('Rider is Offline');
  }

  const locEval = evaluateLocalityAccess({
    requestLocality,
    partnerId: rider.id,
    baseLocality: baseLoc,
    liveLocation: liveLoc,
    mappedPartnerIds: rule?.deliveryRiderIds || [],
    partnerServedLocalities: rider.servedLocalities || [],
    rule,
    config,
    localities
  });
  if (!locEval.localityEligible && locEval.reason) {
    reasons.push(locEval.reason);
  }

  return {
    partnerId: rider.id,
    partnerName: rider.name,
    partnerRole: 'delivery',
    baseLocality: baseLoc,
    currentLocation: liveLoc,
    isEligible: reasons.length === 0,
    reasons,
    isExactLocality: locEval.isExactLocality,
    isApprovedNearbyLocality: locEval.isApprovedNearbyLocality,
    crossLocalityUsed: locEval.crossLocalityUsed
  };
}

export function evaluateRideDriverEligibility(
  requestLocality: string,
  requestedVehicleType: VehicleType,
  driver: Driver,
  config: UniversalRoutingConfig,
  partnerAccounts: PartnerAccount[] = [],
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): PartnerEligibilityReport {
  const rule = getRuleForLocality(config, requestLocality, localities);
  const reasons: string[] = [];
  const baseLoc = resolveAreaKey(driver.locality || driver.currentLocation || '', localities);
  const liveLoc = resolveAreaKey(driver.currentLocation || driver.locality || '', localities);

  if (driver.status !== 'approved') {
    reasons.push(`Driver status is ${driver.status} (not approved)`);
  }
  if (isPartnerAccountSuspended(driver.id, driver.ownerId, partnerAccounts)) {
    reasons.push('Partner account suspended');
  }
  if (!driver.isOnline) {
    reasons.push('Driver is Offline');
  }
  if (driver.vehicleType !== requestedVehicleType) {
    reasons.push(`Vehicle type mismatch (${driver.vehicleType.toUpperCase()} vs ${requestedVehicleType.toUpperCase()})`);
  }

  const locEval = evaluateLocalityAccess({
    requestLocality,
    partnerId: driver.id,
    baseLocality: baseLoc,
    liveLocation: liveLoc,
    mappedPartnerIds: rule?.rideDriverIds || [],
    partnerServedLocalities: driver.servedLocalities || [],
    rule,
    config,
    localities
  });
  if (!locEval.localityEligible && locEval.reason) {
    reasons.push(locEval.reason);
  }

  return {
    partnerId: driver.id,
    partnerName: driver.name,
    partnerRole: 'driver',
    baseLocality: baseLoc,
    currentLocation: liveLoc,
    isEligible: reasons.length === 0,
    reasons,
    isExactLocality: locEval.isExactLocality,
    isApprovedNearbyLocality: locEval.isApprovedNearbyLocality,
    crossLocalityUsed: locEval.crossLocalityUsed,
    vehicleType: driver.vehicleType
  };
}

export function evaluateServiceProviderEligibility(
  requestLocality: string,
  requestedCategory: string,
  provider: ServiceProvider,
  config: UniversalRoutingConfig,
  partnerAccounts: PartnerAccount[] = [],
  localities: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): PartnerEligibilityReport {
  const rule = getRuleForLocality(config, requestLocality, localities);
  const reasons: string[] = [];
  const baseAreaToken = (provider.serviceArea || '').split(/[,&]/)[0]?.trim() || provider.serviceArea;
  const baseLoc = resolveAreaKey(baseAreaToken, localities);
  const liveLoc = resolveAreaKey(provider.currentLocation || baseAreaToken, localities);

  if (provider.status !== 'approved') {
    reasons.push(`Service provider status is ${provider.status}`);
  }
  if (isPartnerAccountSuspended(provider.id, provider.ownerId, partnerAccounts)) {
    reasons.push('Partner account suspended');
  }
  if (!provider.isAvailable) {
    reasons.push('Provider is currently Unavailable / Offline');
  }
  if (
    requestedCategory &&
    normalizeServiceCategory(provider.category) !== normalizeServiceCategory(requestedCategory)
  ) {
    reasons.push(`Category mismatch (${provider.category} vs ${requestedCategory})`);
  }

  const servedTokens = (provider.servedLocalities && provider.servedLocalities.length > 0
    ? provider.servedLocalities
    : (provider.serviceArea || '').split(/[,&]/).map((s) => s.trim()).filter(Boolean));

  const locEval = evaluateLocalityAccess({
    requestLocality,
    partnerId: provider.id,
    baseLocality: baseLoc,
    liveLocation: liveLoc,
    mappedPartnerIds: rule?.serviceProviderIds || [],
    partnerServedLocalities: servedTokens,
    rule,
    config,
    localities
  });
  if (!locEval.localityEligible && locEval.reason) {
    reasons.push(locEval.reason);
  }

  return {
    partnerId: provider.id,
    partnerName: provider.name,
    partnerRole: 'service_provider',
    baseLocality: baseLoc,
    currentLocation: liveLoc,
    isEligible: reasons.length === 0,
    reasons,
    isExactLocality: locEval.isExactLocality,
    isApprovedNearbyLocality: locEval.isApprovedNearbyLocality,
    crossLocalityUsed: locEval.crossLocalityUsed,
    category: provider.category
  };
}

/**
 * Evaluates all candidates for any of the 4 routed service categories and splits them cleanly into
 * `eligible` vs `ineligible` (with exact rejection reasons for Admin visibility).
 */
export function getEligiblePartnersForRequest(params: {
  serviceCategory: RoutingServiceCategory;
  requestLocality: string;
  requestedVehicleType?: VehicleType;
  requestedServiceCategory?: string;
  config: UniversalRoutingConfig;
  shops?: Shop[];
  deliveryPersons?: DeliveryPerson[];
  drivers?: Driver[];
  serviceProviders?: ServiceProvider[];
  partnerAccounts?: PartnerAccount[];
  localities?: LocalityInfo[];
}): {
  eligible: PartnerEligibilityReport[];
  ineligible: PartnerEligibilityReport[];
} {
  const localities = params.localities || INITIAL_SERVICE_LOCALITIES;
  const partnerAccounts = params.partnerAccounts || [];
  let reports: PartnerEligibilityReport[] = [];

  if (params.serviceCategory === 'shop_order') {
    // Merchant & local delivery dispatch check: for order delivery rider dispatch, deliveryPersons are checked via getEligibleDeliveryRidersForOrder
    reports = (params.shops || []).map((shop) =>
      evaluateShopEligibility(params.requestLocality, shop, params.config, partnerAccounts, localities)
    );
  } else if (params.serviceCategory === 'delivery') {
    reports = (params.deliveryPersons || []).map((rider) =>
      evaluateDeliveryRiderEligibility(params.requestLocality, rider, params.config, partnerAccounts, localities)
    );
  } else if (params.serviceCategory === 'ride') {
    const vType = params.requestedVehicleType || 'toto';
    reports = (params.drivers || []).map((drv) =>
      evaluateRideDriverEligibility(params.requestLocality, vType, drv, params.config, partnerAccounts, localities)
    );
  } else if (params.serviceCategory === 'service') {
    reports = (params.serviceProviders || []).map((sp) =>
      evaluateServiceProviderEligibility(
        params.requestLocality,
        params.requestedServiceCategory || '',
        sp,
        params.config,
        partnerAccounts,
        localities
      )
    );
  }

  const eligible = reports
    .filter((r) => r.isEligible)
    .sort((a, b) => Number(b.isExactLocality) - Number(a.isExactLocality));
  const ineligible = reports.filter((r) => !r.isEligible);
  return { eligible, ineligible };
}

/**
 * Evaluates eligible Delivery Riders specifically for dispatching a Shop Order
 * strictly separate from Ride Drivers.
 */
export function getEligibleDeliveryRidersForOrder(params: {
  pickupLocality: string;
  config: UniversalRoutingConfig;
  deliveryPersons: DeliveryPerson[];
  partnerAccounts?: PartnerAccount[];
  localities?: LocalityInfo[];
}): {
  eligible: PartnerEligibilityReport[];
  ineligible: PartnerEligibilityReport[];
} {
  const localities = params.localities || INITIAL_SERVICE_LOCALITIES;
  const reports = params.deliveryPersons.map((rider) =>
    evaluateDeliveryRiderEligibility(
      params.pickupLocality,
      rider,
      params.config,
      params.partnerAccounts || [],
      localities
    )
  );
  return {
    eligible: reports
      .filter((r) => r.isEligible)
      .sort((a, b) => Number(b.isExactLocality) - Number(a.isExactLocality)),
    ineligible: reports.filter((r) => !r.isEligible)
  };
}

/**
 * Evaluates eligible Delivery Riders from non-PII `publicRiders` cards combined with `routingConfig`
 * (used in Shopkeeper dispatch UI where private `deliveryPersons` PII is not readable).
 */
export function evaluatePublicRiderCardsForOrder(params: {
  pickupLocality: string;
  config: UniversalRoutingConfig;
  approvedRiders: PublicRiderCard[];
  partnerAccounts?: PartnerAccount[];
  localities?: LocalityInfo[];
}): {
  eligible: PartnerEligibilityReport[];
  ineligible: PartnerEligibilityReport[];
} {
  const mappedPersons = params.approvedRiders.map(fromPublicRiderCard);
  const mergedAccounts: PartnerAccount[] = [...(params.partnerAccounts || [])];
  params.approvedRiders.forEach((card) => {
    if (
      card.accountStatus === 'suspended' &&
      !mergedAccounts.some((a) => a.linkedEntityId === card.id)
    ) {
      mergedAccounts.push({
        uid: `public-card-acc-${card.id}`,
        role: 'delivery',
        displayName: card.name,
        loginEmail: '',
        linkedEntityId: card.id,
        status: 'suspended',
        assignedBy: 'system',
        createdAt: ''
      });
    }
  });

  return getEligibleDeliveryRidersForOrder({
    pickupLocality: params.pickupLocality,
    config: params.config,
    deliveryPersons: mappedPersons,
    partnerAccounts: mergedAccounts,
    localities: params.localities
  });
}

/**
 * Evaluates eligible Ride Drivers (toto / auto / taxi) from non-PII `publicDrivers` cards
 * combined with `routingConfig` for customer ride booking without exposing private driver PII.
 */
export function evaluatePublicDriverCardsForRide(params: {
  pickupLocality: string;
  requestedVehicleType: VehicleType;
  config: UniversalRoutingConfig;
  approvedDrivers: PublicDriverCard[];
  partnerAccounts?: PartnerAccount[];
  localities?: LocalityInfo[];
}): {
  eligible: PartnerEligibilityReport[];
  ineligible: PartnerEligibilityReport[];
} {
  const mappedDrivers = params.approvedDrivers.map(fromPublicDriverCard);
  const mergedAccounts: PartnerAccount[] = [...(params.partnerAccounts || [])];
  params.approvedDrivers.forEach((card) => {
    if (
      card.accountStatus === 'suspended' &&
      !mergedAccounts.some((a) => a.linkedEntityId === card.id)
    ) {
      mergedAccounts.push({
        uid: `public-drv-acc-${card.id}`,
        role: 'driver',
        displayName: card.name,
        loginEmail: '',
        linkedEntityId: card.id,
        status: 'suspended',
        assignedBy: 'system',
        createdAt: ''
      });
    }
  });

  const localities = params.localities || INITIAL_SERVICE_LOCALITIES;
  const reports = mappedDrivers.map((drv) =>
    evaluateRideDriverEligibility(
      params.pickupLocality,
      params.requestedVehicleType,
      drv,
      params.config,
      mergedAccounts,
      localities
    )
  );
  return {
    eligible: reports
      .filter((r) => r.isEligible)
      .sort((a, b) => Number(b.isExactLocality) - Number(a.isExactLocality)),
    ineligible: reports.filter((r) => !r.isEligible)
  };
}

/**
 * Validates an attempted assignment/reassignment and generates a timestamped AssignmentAuditEntry.
 */
export function validateAndBuildAssignmentAudit(params: {
  requestId: string;
  serviceCategory: RoutingServiceCategory;
  requestLocality: string;
  report: PartnerEligibilityReport | undefined;
  partnerRole: PartnerRoleType;
  assignedBy: string;
  isReassignment?: boolean;
}): {
  allowed: boolean;
  errorMessage?: string;
  auditEntry: AssignmentAuditEntry;
} {
  const timestamp = new Date().toISOString();
  const { report } = params;

  if (!report) {
    return {
      allowed: false,
      errorMessage: 'Selected partner was not found in the active registry.',
      auditEntry: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        requestId: params.requestId,
        serviceCategory: params.serviceCategory,
        requestLocality: params.requestLocality,
        partnerRole: params.partnerRole,
        action: 'blocked_ineligible',
        reason: 'Partner record missing',
        assignedBy: params.assignedBy,
        timestamp
      }
    };
  }

  if (!report.isEligible) {
    const reasonText = report.reasons.join('; ');
    const isCrossLocalityBlock = report.reasons.some(
      (r) => r.toLowerCase().includes('locality') || r.toLowerCase().includes('outside') || r.toLowerCase().includes('approved')
    );
    return {
      allowed: false,
      errorMessage: `Assignment blocked for ${report.partnerName}: ${reasonText}`,
      auditEntry: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        requestId: params.requestId,
        serviceCategory: params.serviceCategory,
        requestLocality: params.requestLocality,
        partnerId: report.partnerId,
        partnerName: report.partnerName,
        partnerRole: params.partnerRole,
        partnerBaseLocality: report.baseLocality,
        partnerCurrentLocation: report.currentLocation,
        action: isCrossLocalityBlock ? 'blocked_cross_locality' : 'blocked_ineligible',
        reason: reasonText,
        assignedBy: params.assignedBy,
        timestamp,
        crossLocalityApproved: false
      }
    };
  }

  return {
    allowed: true,
    auditEntry: {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestId: params.requestId,
      serviceCategory: params.serviceCategory,
      requestLocality: params.requestLocality,
      partnerId: report.partnerId,
      partnerName: report.partnerName,
      partnerRole: params.partnerRole,
      partnerBaseLocality: report.baseLocality,
      partnerCurrentLocation: report.currentLocation,
      action: params.isReassignment ? 'reassigned' : 'assigned',
      reason: report.crossLocalityUsed
        ? `Admin-approved cross-locality assignment from ${report.currentLocation} to ${params.requestLocality}`
        : `Exact locality match in ${params.requestLocality}`,
      assignedBy: params.assignedBy,
      timestamp,
      crossLocalityApproved: report.crossLocalityUsed
    }
  };
}

/**
 * Creates a RoutingAlert when zero eligible local partners exist for a newly created request.
 */
export function buildUnavailableLocalityAlert(params: {
  requestId: string;
  serviceCategory: RoutingServiceCategory;
  requestLocality: string;
  vehicleType?: VehicleType;
  serviceRequired?: string;
}): RoutingAlert {
  const area = resolveAreaKey(params.requestLocality);
  const canonicalLocality = (params.requestLocality || '').trim() || area;
  const labelMap: Record<RoutingServiceCategory, string> = {
    shop_order: 'Shop Order Delivery',
    delivery: 'Parcel Delivery Request',
    ride: `${(params.vehicleType || 'Ride').toUpperCase()} Ride Request`,
    service: `${params.serviceRequired || 'Home Service'} Request`
  };
  return {
    id: `rt-alert-${params.requestId}`,
    requestId: params.requestId,
    serviceCategory: params.serviceCategory,
    requestLocality: canonicalLocality,
    vehicleType: params.vehicleType,
    serviceRequired: params.serviceRequired,
    message: `No eligible online ${labelMap[params.serviceCategory]} partner available in ${area}. Request ${params.requestId} kept Pending Admin Routing.`,
    status: 'open',
    createdAt: new Date().toISOString()
  };
}

