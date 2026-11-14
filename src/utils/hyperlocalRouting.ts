import { LocalityInfo, Shop, Product } from '../types';
export type { LocalityInfo };

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
 * Normalizes locality query and matches against centrally managed localities
 */
export function getLocalityByName(
  name: string,
  localitiesList: LocalityInfo[] = INITIAL_SERVICE_LOCALITIES
): LocalityInfo {
  if (!name) return localitiesList[0];
  const normalized = name.toLowerCase().replace(/\(.*?\)/g, '').trim();

  // 1. Exact match
  const exact = localitiesList.find((loc) => loc.name.toLowerCase() === normalized);
  if (exact) return exact;

  // 2. Contains match
  const contains = localitiesList.find(
    (loc) => loc.name.toLowerCase().includes(normalized) || normalized.includes(loc.name.toLowerCase())
  );
  if (contains) return contains;

  // 3. Fallback to first locality
  return localitiesList[0];
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
