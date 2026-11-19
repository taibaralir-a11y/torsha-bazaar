import {
  Shop,
  Doctor,
  ServiceProvider,
  Product,
  JobListing,
  DeliveryPerson,
  Driver,
  ScrapRequest,
  PublicShopCard,
  PublicDoctorCard,
  PublicServiceProviderCard,
  PublicProductCard,
  PublicJobCard,
  PublicRiderCard,
  PublicDriverCard,
  PublicScrapListing,
  PartnerAccountStatus,
  RideBooking,
  RideDispatchSummary
} from '../types';

/**
 * Strict allowlist sanitizer for publicShops collection.
 * Strips ownerId, ownerEmail, contactNumber, licenseNumber, hygieneCertificate,
 * totalRevenue, totalOrders, and gpsCoordinates.
 * Public contact is included ONLY when publishContact === true.
 */
export function toPublicShopCard(shop: Shop): PublicShopCard {
  const card: PublicShopCard = {
    id: shop.id,
    name: shop.name,
    locality: shop.locality,
    pincode: shop.pincode,
    imageUrl: shop.imageUrl,
    category: shop.category,
    shopType: shop.shopType,
    status: shop.status,
    isVerified: Boolean(shop.isVerified && shop.status === 'approved'),
    isOpen: Boolean(shop.isOpen),
    deliveryAreas: Array.isArray(shop.deliveryAreas) ? shop.deliveryAreas : [shop.locality],
    deliveryCharge: Number(shop.deliveryCharge || 0),
    deliveryRadiusKm: Number(shop.deliveryRadiusKm || 10),
    updatedAt: new Date().toISOString()
  };

  if (shop.description) card.description = shop.description;
  if (shop.freeDeliveryAbove !== undefined) card.freeDeliveryAbove = shop.freeDeliveryAbove;
  if (shop.rating !== undefined) card.rating = shop.rating;
  if (shop.businessHours) card.businessHours = shop.businessHours;
  if (shop.publishContact === true && shop.publicContactNumber) {
    card.publishContact = true;
    card.publicContactNumber = shop.publicContactNumber;
  }

  return card;
}

export function fromPublicShopCard(card: PublicShopCard): Shop {
  return {
    id: card.id,
    ownerId: '',
    name: card.name,
    address: `${card.locality}${card.pincode ? ` (${card.pincode})` : ''}`,
    locality: card.locality,
    pincode: card.pincode,
    contactNumber: card.publishContact && card.publicContactNumber ? card.publicContactNumber : '',
    imageUrl: card.imageUrl,
    description: card.description,
    category: card.category,
    shopType: card.shopType,
    status: card.status,
    isVerified: card.isVerified,
    isOpen: card.isOpen,
    deliveryAreas: card.deliveryAreas,
    deliveryCharge: card.deliveryCharge,
    freeDeliveryAbove: card.freeDeliveryAbove,
    deliveryRadiusKm: card.deliveryRadiusKm,
    rating: card.rating,
    businessHours: card.businessHours,
    publishContact: card.publishContact,
    publicContactNumber: card.publicContactNumber,
    updatedAt: card.updatedAt
  };
}

/**
 * Strict allowlist sanitizer for publicProducts collection.
 * Strictly strips ownerId from public product projections.
 */
export function toPublicProductCard(product: Product): PublicProductCard {
  const card: PublicProductCard = {
    id: product.id,
    name: product.name,
    price: Number(product.price || 0),
    unit: product.unit || '1 pc',
    image: product.image || '',
    category: product.category || 'General',
    rating: Number(product.rating || 4.8),
    inStock: product.inStock !== false,
    shopId: product.shopId || '',
    shopStatus: product.shopStatus || 'pending',
    updatedAt: new Date().toISOString()
  };

  if (product.shopName !== undefined) card.shopName = product.shopName;
  if (product.localName !== undefined) card.localName = product.localName;
  if (product.originalPrice !== undefined) card.originalPrice = product.originalPrice;
  if (product.categoryType !== undefined) card.categoryType = product.categoryType;
  if (product.stock !== undefined) card.stock = product.stock;
  if (product.isAvailable !== undefined) card.isAvailable = product.isAvailable;
  if (product.isDeal !== undefined) card.isDeal = product.isDeal;
  if (product.badge !== undefined) card.badge = product.badge;
  if (product.description !== undefined) card.description = product.description;
  if (product.brand !== undefined) card.brand = product.brand;
  if (product.isBrandNew !== undefined) card.isBrandNew = product.isBrandNew;
  if (product.specs !== undefined) card.specs = product.specs;
  if (product.warranty !== undefined) card.warranty = product.warranty;
  if (product.sellerName !== undefined) card.sellerName = product.sellerName;
  if (product.sellerLocality !== undefined) card.sellerLocality = product.sellerLocality;
  if (product.requiresPrescription !== undefined) card.requiresPrescription = product.requiresPrescription;
  if (product.expiryDate !== undefined) card.expiryDate = product.expiryDate;
  if (product.dosageForm !== undefined) card.dosageForm = product.dosageForm;
  if (product.manufacturer !== undefined) card.manufacturer = product.manufacturer;
  if (product.isWeightBased !== undefined) card.isWeightBased = product.isWeightBased;
  if (product.pricePerKg !== undefined) card.pricePerKg = product.pricePerKg;
  if (product.availableWeights !== undefined) card.availableWeights = product.availableWeights;
  if (product.dailyFresh !== undefined) card.dailyFresh = product.dailyFresh;
  if (product.createdAt !== undefined) card.createdAt = product.createdAt;

  return card;
}

export function fromPublicProductCard(card: PublicProductCard): Product {
  return {
    ...card
  };
}

/**
 * Strict allowlist sanitizer for publicDoctors collection.
 * Strips ownerId, phone, email, clinicAddress, medicalCouncilRegNo,
 * councilRegistrationNumber, and documentUrl.
 */
export function toPublicDoctorCard(doctor: Doctor): PublicDoctorCard {
  const card: PublicDoctorCard = {
    id: doctor.id,
    name: doctor.name,
    qualification: doctor.qualification,
    specialization: doctor.specialization,
    consultationFee: Number(doctor.consultationFee || 350),
    status: doctor.status,
    rating: Number(doctor.rating || 4.8),
    updatedAt: new Date().toISOString()
  };

  if (doctor.experienceYears !== undefined) card.experienceYears = doctor.experienceYears;
  if (doctor.homeVisitFee !== undefined) card.homeVisitFee = doctor.homeVisitFee;
  if (doctor.localitiesServed) card.localitiesServed = doctor.localitiesServed;
  if (doctor.servedLocalities) card.servedLocalities = doctor.servedLocalities;
  if (doctor.parentArea) card.parentArea = doctor.parentArea;
  if (doctor.availableSchedule) card.availableSchedule = doctor.availableSchedule;
  if (doctor.isOnline !== undefined) card.isOnline = doctor.isOnline;
  if (doctor.isAvailable !== undefined) card.isAvailable = doctor.isAvailable;
  if (doctor.completedConsultations !== undefined) card.completedConsultations = doctor.completedConsultations;
  if (doctor.totalConsultations !== undefined) card.totalConsultations = doctor.totalConsultations;

  return card;
}

export function fromPublicDoctorCard(card: PublicDoctorCard): Doctor {
  return {
    id: card.id,
    name: card.name,
    phone: '',
    email: '',
    qualification: card.qualification,
    specialization: card.specialization,
    experienceYears: card.experienceYears,
    consultationFee: card.consultationFee,
    homeVisitFee: card.homeVisitFee,
    localitiesServed: card.localitiesServed,
    servedLocalities: card.servedLocalities,
    parentArea: card.parentArea,
    availableSchedule: card.availableSchedule,
    isOnline: card.isOnline,
    isAvailable: card.isAvailable,
    status: card.status,
    rating: card.rating,
    completedConsultations: card.completedConsultations,
    totalConsultations: card.totalConsultations,
    updatedAt: card.updatedAt
  };
}

/**
 * Strict allowlist sanitizer for publicServiceProviders collection.
 * Strips ownerId and private phone.
 */
export function toPublicServiceProviderCard(provider: ServiceProvider): PublicServiceProviderCard {
  return {
    id: provider.id,
    name: provider.name,
    category: provider.category,
    serviceArea: provider.serviceArea,
    description: provider.description,
    experienceYears: Number(provider.experienceYears || 0),
    hourlyRate: Number(provider.hourlyRate || 0),
    status: provider.status,
    isAvailable: Boolean(provider.isAvailable),
    rating: Number(provider.rating || 4.8),
    totalJobsCompleted: Number(provider.totalJobsCompleted || 0),
    updatedAt: new Date().toISOString()
  };
}

export function fromPublicServiceProviderCard(card: PublicServiceProviderCard): ServiceProvider {
  return {
    id: card.id,
    name: card.name,
    phone: '',
    category: card.category,
    serviceArea: card.serviceArea,
    description: card.description,
    experienceYears: card.experienceYears,
    hourlyRate: card.hourlyRate,
    status: card.status,
    isAvailable: card.isAvailable,
    rating: card.rating,
    totalJobsCompleted: card.totalJobsCompleted,
    updatedAt: card.updatedAt
  };
}

/**
 * Strict allowlist sanitizer for publicJobs collection.
 * Strips employerId, employerName, and private employerPhone.
 * Exposes publicContactNumber ONLY if publishContact === true.
 */
export function toPublicJobCard(job: JobListing): PublicJobCard {
  const card: PublicJobCard = {
    id: job.id,
    title: job.title,
    company: job.company || job.employerName || 'Local Employer',
    category: job.category,
    location: job.location,
    salary: job.salary,
    jobType: job.jobType,
    description: job.description,
    vacancies: Number(job.vacancies || 1),
    applicantsCount: Number(job.applicantsCount || 0),
    status: job.status,
    posted: job.posted || 'Recently',
    updatedAt: new Date().toISOString()
  };

  if (job.publishContact === true && job.publicContactNumber) {
    card.publishContact = true;
    card.publicContactNumber = job.publicContactNumber;
  }

  return card;
}

export function fromPublicJobCard(card: PublicJobCard): JobListing {
  return {
    id: card.id,
    employerName: card.company,
    employerPhone: card.publishContact && card.publicContactNumber ? card.publicContactNumber : '',
    publishContact: card.publishContact,
    publicContactNumber: card.publicContactNumber,
    title: card.title,
    company: card.company,
    category: card.category,
    location: card.location,
    salary: card.salary,
    jobType: card.jobType,
    description: card.description,
    vacancies: card.vacancies,
    applicantsCount: card.applicantsCount,
    status: card.status,
    posted: card.posted
  };
}

/**
 * Strict allowlist sanitizer for publicRiders collection.
 * Strips ownerId, phone, and email so shopkeepers can select verified rider IDs
 * without exposing rider personal contact information.
 */
export function toPublicRiderCard(
  rider: DeliveryPerson,
  accountStatus?: PartnerAccountStatus
): PublicRiderCard {
  const card: PublicRiderCard = {
    id: rider.id,
    name: rider.name,
    locality: rider.locality,
    status: rider.status,
    isOnline: Boolean(rider.isOnline),
    rating: Number(rider.rating || 4.8),
    updatedAt: new Date().toISOString()
  };

  if (rider.currentLocation) card.currentLocation = rider.currentLocation;
  if (Array.isArray(rider.servedLocalities) && rider.servedLocalities.length > 0) {
    card.servedLocalities = rider.servedLocalities;
  }
  if (accountStatus) card.accountStatus = accountStatus;

  return card;
}

export function fromPublicRiderCard(card: PublicRiderCard): DeliveryPerson {
  return {
    id: card.id,
    name: card.name,
    phone: '',
    status: card.status,
    isOnline: card.isOnline,
    locality: card.locality,
    ...(card.currentLocation ? { currentLocation: card.currentLocation } : {}),
    ...(Array.isArray(card.servedLocalities) ? { servedLocalities: card.servedLocalities } : {}),
    totalDelivered: 0,
    rating: card.rating
  };
}

/**
 * Strict allowlist sanitizer for publicDrivers collection.
 * Strips ownerId, phone, email, licenseNumber, and vehicleNumber so customers
 * can verify live local driver availability without accessing driver PII.
 */
export function toPublicDriverCard(
  driver: Driver,
  accountStatus?: PartnerAccountStatus
): PublicDriverCard {
  const card: PublicDriverCard = {
    id: driver.id,
    name: driver.name,
    vehicleType: driver.vehicleType,
    locality: driver.locality || driver.currentLocation || 'Satali',
    status: driver.status,
    isOnline: Boolean(driver.isOnline),
    rating: Number(driver.rating || 4.8),
    totalRides: Number(driver.totalRides || 0),
    updatedAt: new Date().toISOString()
  };

  if (driver.currentLocation) card.currentLocation = driver.currentLocation;
  if (Array.isArray(driver.servedLocalities) && driver.servedLocalities.length > 0) {
    card.servedLocalities = driver.servedLocalities;
  }
  if (accountStatus) card.accountStatus = accountStatus;

  return card;
}

export function fromPublicDriverCard(card: PublicDriverCard): Driver {
  return {
    id: card.id,
    name: card.name,
    phone: '',
    vehicleType: card.vehicleType,
    vehicleNumber: '',
    locality: card.locality,
    ...(card.currentLocation ? { currentLocation: card.currentLocation } : {}),
    ...(Array.isArray(card.servedLocalities) ? { servedLocalities: card.servedLocalities } : {}),
    status: card.status,
    approvalStatus: card.status,
    isOnline: card.isOnline,
    totalRides: Number(card.totalRides || 0),
    rating: card.rating,
    updatedAt: card.updatedAt
  };
}

/**
 * Strict allowlist sanitizer for publicScrapListings collection.
 * Strips customerId, customerName, customerPhone, pickupAddress,
 * selectedOfferId, selectedBuyerId, selectedBuyerName, selectedBuyerPhone,
 * and finalPaidAmount so unauthorized kabari buyers cannot read customer PII.
 */
export function toPublicScrapListing(req: ScrapRequest): PublicScrapListing {
  return {
    id: req.id,
    category: req.category,
    categoryLabel: req.categoryLabel,
    estimatedWeight: req.estimatedWeight,
    ...(req.approxWeightKg !== undefined ? { approxWeightKg: req.approxWeightKg } : {}),
    description: req.description,
    photos: Array.isArray(req.photos) ? req.photos : [],
    locality: req.locality,
    pincode: req.pincode,
    status: req.status,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt || new Date().toISOString()
  };
}

export function fromPublicScrapListing(card: PublicScrapListing): ScrapRequest {
  return {
    id: card.id,
    customerId: '',
    customerName: 'Verified Local Seller',
    customerPhone: '',
    category: card.category,
    categoryLabel: card.categoryLabel,
    estimatedWeight: card.estimatedWeight,
    ...(card.approxWeightKg !== undefined ? { approxWeightKg: card.approxWeightKg } : {}),
    description: card.description,
    photos: Array.isArray(card.photos) ? card.photos : [],
    pickupAddress: `${card.locality} (${card.pincode}) — Address disclosed to assigned buyer after confirmation`,
    locality: card.locality,
    pincode: card.pincode,
    status: card.status,
    offers: [],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt
  };
}

/**
 * Strict PII-free allowlist projection for /rideDispatch/{rideId}.
 * NEVER includes customerName, customerPhone, driverPhone, pickupLocation street landmark,
 * pickupLandmark, dropLocation street landmark, or dropLandmark.
 */
export function toRideDispatchSummary(booking: RideBooking): RideDispatchSummary {
  const createdAt = booking.createdAt || new Date().toISOString();
  const expiresAtMs =
    typeof booking.expiresAtMs === 'number'
      ? booking.expiresAtMs
      : booking.expiresAt
      ? Date.parse(booking.expiresAt) || Date.now() + 3 * 60 * 1000
      : Date.now() + 3 * 60 * 1000;

  const summary: RideDispatchSummary = {
    id: booking.id,
    rideId: booking.id,
    vehicleType: booking.vehicleType,
    pickupLocality: booking.pickupLocality || booking.pickupLocation || 'Satali',
    dropLocality: booking.dropLocality || booking.dropLocation || 'Hasimara',
    estimatedFare: Number(booking.estimatedFare || booking.suggestedFare || 0),
    status: booking.status,
    createdAt,
    updatedAt: booking.updatedAt || new Date().toISOString(),
    expiresAtMs,
    expiresAt: booking.expiresAt || new Date(expiresAtMs).toISOString()
  };

  if (booking.customerId) summary.customerId = booking.customerId;
  if (typeof booking.distanceKm === 'number') summary.distanceKm = booking.distanceKm;
  if (typeof booking.suggestedFare === 'number') summary.suggestedFare = booking.suggestedFare;
  if (typeof booking.customerProposedFare === 'number') summary.customerProposedFare = booking.customerProposedFare;
  if (typeof booking.agreedFare === 'number') summary.agreedFare = booking.agreedFare;
  if (booking.agreedAt) summary.agreedAt = booking.agreedAt;
  if (booking.confirmedAt) summary.confirmedAt = booking.confirmedAt;
  if (booking.routingStatus) summary.routingStatus = booking.routingStatus;
  if (booking.driverId) {
    summary.assignedDriverId = booking.driverId;
    summary.confirmedDriverId = booking.driverId;
  }
  if (booking.driverName) summary.driverName = booking.driverName;
  if (booking.vehicleNumber) summary.vehicleNumber = booking.vehicleNumber;
  if (typeof booking.driverRating === 'number') summary.driverRating = booking.driverRating;
  if (Array.isArray(booking.eligibleDriverIds)) summary.eligibleDriverIds = booking.eligibleDriverIds;
  if (Array.isArray(booking.rejectedDriverIds)) summary.rejectedDriverIds = booking.rejectedDriverIds;
  if (Array.isArray(booking.activeDriverOffers)) {
    summary.activeDriverOffers = booking.activeDriverOffers.map(({ driverPhone: _dp, ...rest }) => rest);
  }
  if (Array.isArray(booking.negotiationHistory)) {
    summary.negotiationHistory = booking.negotiationHistory.map(({ driverPhone: _dp, ...rest }) => rest);
  }
  if (typeof booking.currentRound === 'number') summary.currentRound = booking.currentRound;
  if (typeof booking.maxNegotiationRounds === 'number') summary.maxNegotiationRounds = booking.maxNegotiationRounds;

  return summary;
}

export function mergeRideDispatchWithBooking(
  dispatch: RideDispatchSummary,
  booking?: RideBooking | null
): RideBooking {
  if (booking) {
    const dispatchUpdated = Date.parse(dispatch.updatedAt || dispatch.createdAt || '') || 0;
    const bookingUpdated = Date.parse(booking.updatedAt || booking.createdAt || '') || 0;
    const useDispatchState = dispatchUpdated >= bookingUpdated;
    return {
      ...booking,
      status: useDispatchState ? dispatch.status : booking.status,
      agreedFare: booking.agreedFare ?? dispatch.agreedFare,
      agreedAt: booking.agreedAt || dispatch.agreedAt,
      confirmedAt: booking.confirmedAt || dispatch.confirmedAt,
      customerProposedFare: dispatch.customerProposedFare ?? booking.customerProposedFare,
      driverId: booking.driverId || dispatch.confirmedDriverId || dispatch.assignedDriverId,
      driverName: booking.driverName || dispatch.driverName,
      vehicleNumber: booking.vehicleNumber || dispatch.vehicleNumber,
      driverRating: booking.driverRating ?? dispatch.driverRating,
      eligibleDriverIds: dispatch.eligibleDriverIds ?? booking.eligibleDriverIds,
      rejectedDriverIds: dispatch.rejectedDriverIds ?? booking.rejectedDriverIds,
      activeDriverOffers: dispatch.activeDriverOffers ?? booking.activeDriverOffers,
      negotiationHistory: dispatch.negotiationHistory ?? booking.negotiationHistory,
      currentRound: dispatch.currentRound ?? booking.currentRound,
      maxNegotiationRounds: dispatch.maxNegotiationRounds ?? booking.maxNegotiationRounds,
      expiresAt: dispatch.expiresAt ?? booking.expiresAt,
      expiresAtMs: dispatch.expiresAtMs ?? booking.expiresAtMs,
      routingStatus: dispatch.routingStatus ?? booking.routingStatus,
      updatedAt: useDispatchState ? dispatch.updatedAt : booking.updatedAt
    };
  }

  return {
    id: dispatch.rideId || dispatch.id,
    customerId: dispatch.customerId,
    customerName: 'Local Passenger (Verified)',
    customerPhone: '',
    vehicleType: dispatch.vehicleType,
    pickupLocation: dispatch.pickupLocality,
    pickupLocality: dispatch.pickupLocality,
    dropLocation: dispatch.dropLocality,
    dropLocality: dispatch.dropLocality,
    distanceKm: dispatch.distanceKm,
    estimatedFare: dispatch.estimatedFare,
    suggestedFare: dispatch.suggestedFare,
    customerProposedFare: dispatch.customerProposedFare,
    agreedFare: dispatch.agreedFare,
    agreedAt: dispatch.agreedAt,
    confirmedAt: dispatch.confirmedAt,
    status: dispatch.status,
    routingStatus: dispatch.routingStatus,
    driverId: dispatch.confirmedDriverId || dispatch.assignedDriverId,
    driverName: dispatch.driverName,
    vehicleNumber: dispatch.vehicleNumber,
    driverRating: dispatch.driverRating,
    eligibleDriverIds: dispatch.eligibleDriverIds,
    rejectedDriverIds: dispatch.rejectedDriverIds,
    activeDriverOffers: dispatch.activeDriverOffers,
    negotiationHistory: dispatch.negotiationHistory,
    currentRound: dispatch.currentRound,
    maxNegotiationRounds: dispatch.maxNegotiationRounds,
    expiresAt: dispatch.expiresAt,
    expiresAtMs: dispatch.expiresAtMs,
    createdAt: dispatch.createdAt,
    updatedAt: dispatch.updatedAt
  };
}
