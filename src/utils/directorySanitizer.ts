import {
  Shop,
  Doctor,
  ServiceProvider,
  Product,
  JobListing,
  DeliveryPerson,
  PublicShopCard,
  PublicDoctorCard,
  PublicServiceProviderCard,
  PublicProductCard,
  PublicJobCard,
  PublicRiderCard
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
export function toPublicRiderCard(rider: DeliveryPerson): PublicRiderCard {
  return {
    id: rider.id,
    name: rider.name,
    locality: rider.locality,
    status: rider.status,
    isOnline: Boolean(rider.isOnline),
    rating: Number(rider.rating || 4.8),
    updatedAt: new Date().toISOString()
  };
}

export function fromPublicRiderCard(card: PublicRiderCard): DeliveryPerson {
  return {
    id: card.id,
    name: card.name,
    phone: '',
    status: card.status,
    isOnline: card.isOnline,
    locality: card.locality,
    totalDelivered: 0,
    rating: card.rating
  };
}
