export type PortalMode = 
  | 'customer' 
  | 'shopkeeper' 
  | 'admin' 
  | 'driver' 
  | 'delivery' 
  | 'service_provider' 
  | 'employer'
  | 'kabari' // Kabari Buyer Portal
  | 'doctor'; // Emergency Doctor & Home Visit Partner Portal

export type PartnerRoleType =
  | 'shopkeeper'
  | 'driver'
  | 'delivery'
  | 'doctor'
  | 'service_provider'
  | 'employer'
  | 'kabari';

export type PartnerAccountStatus = 'active' | 'suspended';

export interface PartnerAccount {
  uid: string;
  role: PartnerRoleType;
  businessPartnerType?: string;
  displayName: string;
  loginEmail: string;
  phone?: string;
  linkedEntityId?: string;
  status: PartnerAccountStatus;
  suspendedEntityPreviousStatus?: ShopApprovalStatus;
  assignedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePartnerAccountInput {
  role: PartnerRoleType;
  displayName: string;
  loginEmail: string;
  phone?: string;
  password: string;
  sendPasswordReset?: boolean;
  locality: string;
  pincode?: string;
  linkExistingEntityId?: string;
  // Shopkeeper provisioning fields
  shopName?: string;
  shopCategory?: string;
  shopAddress?: string;
  shopContactPhone?: string;
  deliveryAreas?: string[];
  // Driver provisioning fields (toto | auto | taxi only)
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  licenseNumber?: string;
  // Shared multi-locality field (driver, delivery, doctor, service_provider)
  servedLocalities?: string[];
  // Doctor provisioning fields
  qualification?: string;
  specialization?: DoctorSpecialization;
  medicalCouncilRegNo?: string;
  clinicAddress?: string;
  consultationFee?: number;
  homeVisitFee?: number;
  experienceYears?: number;
  // Service Provider provisioning fields
  serviceCategory?: ServiceCategoryType;
  hourlyRate?: number;
  serviceDescription?: string;
}

export interface AdminShopUpdateInput {
  name: string;
  category: string;
  shopType?: ShopCategoryType;
  address: string;
  locality: string;
  pincode: string;
  contactNumber: string;
  publishContact?: boolean;
  publicContactNumber?: string;
  businessHours?: string;
  description?: string;
  imageUrl?: string;
  deliveryAreas: string[];
  deliveryCharge: number;
  freeDeliveryAbove?: number;
  deliveryRadiusKm: number;
  isOpen: boolean;
  status: ShopApprovalStatus;
}

export interface PhoneAuthLookup {
  loginEmail: string;
  updatedAt: string;
}

export type AppTab = 'home' | 'categories' | 'orders' | 'account' | 'more';

export type ServiceType = 
  | 'shopping' 
  | 'grocery'
  | 'medical'
  | 'meat'
  | 'mobile'
  | 'scrap'
  | 'taxi' 
  | 'auto' 
  | 'toto' 
  | 'delivery' 
  | 'services' 
  | 'jobs' 
  | 'phones'
  | 'emergency_doctor';

export type LanguageCode = 'en' | 'hi' | 'bn';

export type ShopApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ShopCategoryType = 'grocery' | 'medical' | 'meat' | 'mobile' | 'general';

export interface Shop {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  name: string;
  address: string;
  locality: string; // Hasimara, Kalchini, Jaigaon, Satali
  pincode: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  contactNumber: string;
  imageUrl: string;
  description?: string;
  category: string;
  shopType: ShopCategoryType;
  status: ShopApprovalStatus;
  isVerified: boolean;
  isOpen: boolean;
  deliveryAreas: string[]; // e.g. ['Hasimara', 'Satali']
  servedLocalities?: string[];
  deliveryCharge: number;
  freeDeliveryAbove?: number;
  deliveryRadiusKm: number;
  licenseNumber?: string;
  hygieneCertificate?: string;
  rating?: number;
  totalOrders?: number;
  totalRevenue?: number;
  publishContact?: boolean;
  publicContactNumber?: string;
  businessHours?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicShopCard {
  id: string;
  name: string;
  locality: string;
  pincode: string;
  imageUrl: string;
  description?: string;
  category: string;
  shopType: ShopCategoryType;
  status: ShopApprovalStatus;
  isVerified: boolean;
  isOpen: boolean;
  deliveryAreas: string[];
  deliveryCharge: number;
  freeDeliveryAbove?: number;
  deliveryRadiusKm: number;
  rating?: number;
  businessHours?: string;
  publishContact?: boolean;
  publicContactNumber?: string;
  updatedAt?: string;
}

export type OrderStatus = 
  | 'placed' 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready_for_dispatch' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled' 
  | 'rejected'
  | 'packed';

export type ProductType = 'grocery' | 'medical' | 'meat' | 'mobile' | 'accessories' | 'general';

export interface Product {
  id: string;
  shopId?: string;
  shopName?: string;
  shopStatus?: ShopApprovalStatus;
  ownerId?: string;
  name: string;
  localName?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  category: string;
  categoryType?: ProductType;
  rating: number;
  inStock: boolean;
  stock?: number;
  isAvailable?: boolean;
  isDeal?: boolean;
  badge?: string;
  description?: string;
  
  // Brand New Mobile & Accessories fields
  brand?: string; // Apple, Samsung, Vivo, Oppo, Realme, Redmi, Motorola, OnePlus
  isBrandNew?: boolean; // True for all smartphones
  specs?: string[];
  warranty?: string;
  sellerName?: string;
  sellerLocality?: string;

  // Medical fields
  requiresPrescription?: boolean;
  expiryDate?: string;
  dosageForm?: string;
  manufacturer?: string;

  // Meat & Chicken fields (Weight-based)
  isWeightBased?: boolean;
  pricePerKg?: number;
  availableWeights?: number[]; // e.g. [250, 500, 1000]
  dailyFresh?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProductCard {
  id: string;
  shopId?: string;
  shopName?: string;
  shopStatus?: ShopApprovalStatus;
  name: string;
  localName?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  category: string;
  categoryType?: ProductType;
  rating: number;
  inStock: boolean;
  stock?: number;
  isAvailable?: boolean;
  isDeal?: boolean;
  badge?: string;
  description?: string;
  brand?: string;
  isBrandNew?: boolean;
  specs?: string[];
  warranty?: string;
  sellerName?: string;
  sellerLocality?: string;
  requiresPrescription?: boolean;
  expiryDate?: string;
  dosageForm?: string;
  manufacturer?: string;
  isWeightBased?: boolean;
  pricePerKg?: number;
  availableWeights?: number[];
  dailyFresh?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeightGrams?: number; // for meat (250, 500, 1000 or custom)
  customWeightGrams?: number;
  prescriptionUrl?: string; // for prescription medicines
  prescriptionNotes?: string;
}

export type ReturnReason = 'Damaged or defective items' | 'Wrong items delivered';

export type ReturnRequestStatus = 'pending_review' | 'approved' | 'rejected';

export interface OrderReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  shopId?: string;
  shopName?: string;
  reason: ReturnReason;
  description?: string;
  photoEvidenceUrl?: string;
  status: ReturnRequestStatus;
  reviewNotes?: string;
  reviewedBy?: 'admin' | 'shopkeeper';
  requestedAt: string;
  reviewedAt?: string;
}

export interface Order {
  id: string;
  shopId?: string;
  shopOwnerId?: string;
  shopName?: string;
  shopLocality?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  date: string;
  deliveryAddress: string;
  locality?: string;
  pickupLocality?: string;
  pincode?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderLocality?: string;
  routingStatus?: RequestRoutingStatus;
  assignmentHistory?: AssignmentAuditEntry[];
  estimatedDelivery: string;
  paymentMethod: string;
  prescriptionUrl?: string;
  isWeightAdjusted?: boolean;
  finalWeightGrams?: number;
  confirmedByShopkeeper?: boolean;
  rejectionReason?: string;
  returnRequest?: OrderReturnRequest;
  createdAt?: string;
  updatedAt?: string;
}

// KABARI / SCRAP SELLING MARKETPLACE
export type ScrapCategory = 
  | 'iron' 
  | 'steel' 
  | 'plastic' 
  | 'paper' 
  | 'cardboard' 
  | 'aluminium' 
  | 'copper' 
  | 'e_waste' 
  | 'other';

export type ScrapRequestStatus = 
  | 'open' 
  | 'offers_received' 
  | 'accepted' 
  | 'pickup_scheduled' 
  | 'picked_up' 
  | 'completed' 
  | 'cancelled';

export interface ScrapOffer {
  id: string;
  scrapRequestId: string;
  requestId?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  pricePerKg?: number;
  totalOfferAmount: number;
  pickupTimeEstimate: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface ScrapRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  category: ScrapCategory;
  categoryLabel: string;
  estimatedWeight: string; // e.g. "15-20 kg"
  approxWeightKg?: number;
  description: string;
  photos: string[];
  pickupAddress: string;
  locality: string; // Hasimara, Kalchini, Jaigaon, Satali
  pincode: string;
  status: ScrapRequestStatus;
  offers: ScrapOffer[];
  selectedOfferId?: string;
  selectedBuyerId?: string;
  selectedBuyerName?: string;
  selectedBuyerPhone?: string;
  finalPaidAmount?: number;
  paymentMethod?: 'Cash on Pickup' | 'UPI Transfer';
  createdAt: string;
  updatedAt?: string;
}

export interface PublicScrapListing {
  id: string;
  category: ScrapCategory;
  categoryLabel: string;
  estimatedWeight: string;
  approxWeightKg?: number;
  description: string;
  photos: string[];
  locality: string;
  pincode: string;
  status: ScrapRequestStatus;
  myOffer?: ScrapOffer;
  createdAt: string;
  updatedAt?: string;
}

// HYPERLOCAL LOCATION & SERVICE AREA
export interface LocalityInfo {
  id: string;
  name: string; // Exact locality name e.g. Satali, Subhashini, Gurudwara, etc.
  pincode: string; // 735215, 735214, 735217, 735182
  parentArea: string; // "Satali", "Hasimara", "Kalchini", "Jaigaon"
  hubName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  popularLandmarks: string[];
  distanceTo?: Record<string, number>; // distance in km between localities
  isVerifiedPin?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// DRIVER & RIDE (Taxi, Auto, Toto ONLY - No bike taxi)
export type VehicleType = 'taxi' | 'auto' | 'toto';

export type RideStatus = 
  | 'REQUESTED' 
  | 'OFFER_SENT' 
  | 'COUNTER_OFFERED' 
  | 'CUSTOMER_ACCEPTED' 
  | 'RIDER_ACCEPTED' 
  | 'CONFIRMED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'CANCELLED' 
  | 'PICKUP' 
  | 'IN_PROGRESS' 
  | 'COMPLETED'
  // Backward compatibility with lowercase statuses:
  | 'requested' 
  | 'searching' 
  | 'accepted' 
  | 'driver_arriving' 
  | 'ride_started' 
  | 'completed' 
  | 'cancelled';

export interface FareOffer {
  id: string;
  offeredBy: 'customer' | 'driver';
  amount: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  driverVehicle?: string;
  driverPlate?: string;
  note?: string;
  action?: RideStatus;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  timestamp: string;
  roundNumber: number;
  expiresAt?: string;
  expiresAtMs?: number;
}

export interface RideOption {
  id: VehicleType;
  name: string;
  icon: string;
  description: string;
  baseFare: number;
  perKm: number;
  capacity: string;
  badge?: string;
}

export interface Driver {
  id: string;
  ownerId?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  locality?: string;
  currentLocation?: string;
  servedLocalities?: string[];
  licenseNumber?: string;
  status: ShopApprovalStatus;
  approvalStatus?: ShopApprovalStatus;
  isOnline: boolean;
  totalRides: number;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicDriverCard {
  id: string;
  name: string;
  vehicleType: VehicleType;
  locality: string;
  currentLocation?: string;
  servedLocalities?: string[];
  status: ShopApprovalStatus;
  isOnline: boolean;
  accountStatus?: PartnerAccountStatus;
  rating: number;
  totalRides?: number;
  updatedAt?: string;
}

export interface RideBooking {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  vehicleType: VehicleType;
  pickupLocation: string;
  pickupLocality?: string;
  pickupLandmark?: string;
  dropLocation: string;
  dropLocality?: string;
  dropLandmark?: string;
  distanceKm?: number;
  estimatedFare: number; // Guidance / suggested base fare
  suggestedFare?: number;
  customerProposedFare?: number;
  agreedFare?: number;
  agreedAt?: string;
  confirmedAt?: string;
  status: RideStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocality?: string;
  vehicleNumber?: string;
  driverRating?: number;
  routingStatus?: RequestRoutingStatus;
  eligibleDriverIds?: string[];
  rejectedDriverIds?: string[];
  assignmentHistory?: AssignmentAuditEntry[];
  negotiationHistory?: FareOffer[];
  activeDriverOffers?: FareOffer[];
  maxNegotiationRounds?: number;
  currentRound?: number;
  expiresAt?: string;
  expiresAtMs?: number;
  expiredAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'customer' | 'driver' | 'admin';
  completedAt?: string;
  notificationSummary?: {
    eligibleCount: number;
    onlineTokensCount?: number;
    adminNotifiedAt?: string;
    lastAlertAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ActiveRide {
  id: string;
  vehicleType: VehicleType;
  pickup: string;
  drop: string;
  fare: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: 'searching' | 'driver_assigned' | 'arriving' | 'on_trip' | 'completed';
  etaMinutes: number;
}

// LOCAL PARCEL DELIVERY FLEET
export type DeliveryStatus = 
  | 'pending_assignment' 
  | 'assigned' 
  | 'accepted' 
  | 'picked_up' 
  | 'on_the_way' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export interface DeliveryPerson {
  id: string;
  ownerId?: string;
  name: string;
  phone: string;
  email?: string;
  status: ShopApprovalStatus;
  isOnline: boolean;
  locality: string;
  currentLocation?: string;
  servedLocalities?: string[];
  totalDelivered: number;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicRiderCard {
  id: string;
  name: string;
  locality: string;
  currentLocation?: string;
  servedLocalities?: string[];
  status: ShopApprovalStatus;
  isOnline: boolean;
  accountStatus?: PartnerAccountStatus;
  rating: number;
  updatedAt?: string;
}

export interface DeliveryRequest {
  id: string;
  customerId?: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  pickupLocality?: string;
  senderLandmark?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  dropLocality?: string;
  receiverLandmark?: string;
  parcelDescription: string;
  weightCategory: string;
  estimatedPrice: number;
  status: DeliveryStatus;
  assignedDeliveryPersonId?: string;
  assignedDeliveryPersonName?: string;
  assignedDeliveryPersonPhone?: string;
  assignedDeliveryPersonLocality?: string;
  routingStatus?: RequestRoutingStatus;
  assignmentHistory?: AssignmentAuditEntry[];
  createdAt?: string;
  updatedAt?: string;
}

// LOCAL HOME SERVICES
export type ServiceCategoryType = 
  | 'Electrician' 
  | 'Plumber' 
  | 'Carpenter' 
  | 'Mechanic' 
  | 'Painter' 
  | 'AC Repair' 
  | 'Computer Repair'
  | 'Home Cleaning'
  | 'Mobile Repair' 
  | 'Home Repair' 
  | 'Other Services';

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  startingPrice: number;
  popularFor: string;
}

export interface ServiceProvider {
  id: string;
  ownerId?: string;
  name: string;
  phone: string;
  category: ServiceCategoryType;
  serviceArea: string;
  currentLocation?: string;
  servedLocalities?: string[];
  description: string;
  experienceYears: number;
  hourlyRate: number;
  status: ShopApprovalStatus;
  isAvailable: boolean;
  rating: number;
  totalJobsCompleted: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicServiceProviderCard {
  id: string;
  name: string;
  category: ServiceCategoryType;
  serviceArea: string;
  description: string;
  experienceYears: number;
  hourlyRate: number;
  status: ShopApprovalStatus;
  isAvailable: boolean;
  rating: number;
  totalJobsCompleted: number;
  updatedAt?: string;
}

export type ServiceRequestStatus = 
  | 'requested' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface ServiceRequest {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  category: ServiceCategoryType;
  providerId?: string;
  providerOwnerId?: string;
  providerName?: string;
  providerLocality?: string;
  address: string;
  locality?: string;
  preferredDate: string;
  preferredTime: string;
  issueDescription: string;
  estimatedFee: number;
  finalFee?: number;
  status: ServiceRequestStatus;
  routingStatus?: RequestRoutingStatus;
  assignmentHistory?: AssignmentAuditEntry[];
  createdAt?: string;
  updatedAt?: string;
}

// LOCAL EMPLOYMENT & JOBS
export type JobCategoryType = 
  | 'Shop Jobs' 
  | 'Tea Garden Jobs' 
  | 'Hotel Jobs' 
  | 'Driver Jobs' 
  | 'Delivery Jobs' 
  | 'Office Jobs' 
  | 'Daily Labour' 
  | 'Other Jobs';

export interface JobListing {
  id: string;
  employerId?: string;
  employerName: string;
  employerPhone: string;
  publishContact?: boolean;
  publicContactNumber?: string;
  title: string;
  company?: string;
  category: JobCategoryType;
  location: string;
  salary: string;
  jobType: 'Full-time' | 'Part-time' | 'Urgent' | 'Flexible';
  description: string;
  vacancies: number;
  applicantsCount: number;
  status: 'pending' | 'approved' | 'rejected';
  posted?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicJobCard {
  id: string;
  title: string;
  company: string;
  category: JobCategoryType;
  location: string;
  salary: string;
  jobType: 'Full-time' | 'Part-time' | 'Urgent' | 'Flexible';
  description: string;
  vacancies: number;
  applicantsCount: number;
  status: 'pending' | 'approved' | 'rejected';
  posted?: string;
  publishContact?: boolean;
  publicContactNumber?: string;
  updatedAt?: string;
}

export interface LocalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: 'Full-time' | 'Part-time' | 'Urgent' | 'Flexible';
  posted: string;
  description: string;
  contactNumber: string;
  verified: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  employerId?: string;
  applicantId?: string;
  jobTitle: string;
  companyName?: string;
  applicantName: string;
  applicantPhone: string;
  applicantNotes: string;
  status: 'pending' | 'shortlisted' | 'hired' | 'rejected';
  appliedDate: string;
  updatedAt?: string;
}

// NOTIFICATIONS & GRIEVANCES
export interface AppNotification {
  id: string;
  targetRole: PortalMode | 'all';
  title: string;
  message: string;
  type: 'order' | 'ride' | 'delivery' | 'service' | 'job' | 'scrap' | 'system';
  read: boolean;
  timestamp: string;
}

export interface Complaint {
  id: string;
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  userName?: string;
  userPhone?: string;
  targetId?: string;
  targetName?: string;
  category?: string;
  type?: 'order' | 'rider' | 'shop' | 'service' | 'return_request';
  subject?: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  resolutionNotes?: string;
  orderId?: string;
  shopId?: string;
  shopName?: string;
  shopOwnerId?: string;
  returnReason?: ReturnReason;
  returnStatus?: ReturnRequestStatus;
  customerDescription?: string;
  photoEvidenceUrl?: string;
  reviewedBy?: 'admin' | 'shopkeeper';
  reviewedAt?: string;
  createdAt: string;
}

export interface AdminActivity {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface UserProfile {
  id?: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  state?: string; // West Bengal
  district?: string; // Alipurduar
  block?: string; // Kalchini
  address: string;
  location: string; // Locality: Satali, Subhashini, Hasimara, etc.
  pincode: string;
  language: 'English' | 'Hindi' | 'Bengali' | LanguageCode;
  shopId?: string;
  wishlist?: string[]; // Product IDs
  emergencyContact?: string | { name: string; phone: string };
  isVerified?: boolean;
  isSessionAuthenticated?: boolean;
  isPhoneVerified?: boolean;
  authMethod?: 'anonymous' | 'google' | 'email' | 'phone' | 'none';
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
}

// ==========================================
// EMERGENCY DOCTOR & HEALTHCARE PARTNER SYSTEM
// ==========================================
export type DoctorSpecialization = 
  | 'General Physician'
  | 'Pediatrician (Child Specialist)'
  | 'Pediatrician'
  | 'Gynecologist'
  | 'Orthopedic'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'ENT Specialist'
  | 'Emergency Medicine'
  | 'Ayurveda & General'
  | 'Homeopathy'
  | 'Emergency Medical Officer';

export interface Doctor {
  id: string;
  ownerId?: string;
  name: string;
  phone: string;
  email: string;
  qualification: string; // MBBS, MD, BAMS, BHMS, etc.
  medicalCouncilRegNo?: string; // WBMC or State Council Reg No
  councilRegistrationNumber?: string; // alias
  specialization: DoctorSpecialization;
  experienceYears?: number;
  consultationFee: number;
  homeVisitFee?: number;
  localitiesServed?: string[]; // e.g. ['Satali', 'Hasimara', 'Kalchini', 'Jaigaon']
  servedLocalities?: string[]; // alias
  parentArea?: string;
  availableSchedule?: string;
  isOnline?: boolean;
  isAvailable?: boolean; // alias
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  documentUrl?: string; // Registration Certificate proof
  clinicAddress?: string;
  rating: number;
  completedConsultations?: number;
  totalConsultations?: number; // alias
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicDoctorCard {
  id: string;
  name: string;
  qualification: string;
  specialization: DoctorSpecialization;
  experienceYears?: number;
  consultationFee: number;
  homeVisitFee?: number;
  localitiesServed?: string[];
  servedLocalities?: string[];
  parentArea?: string;
  availableSchedule?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  completedConsultations?: number;
  totalConsultations?: number;
  updatedAt?: string;
}

export type EmergencyDoctorPriority = 'urgent' | 'normal' | 'critical' | 'high' | 'medium';
export type EmergencyDoctorRequestType = 'home_visit' | 'phone_consultation';
export type EmergencyDoctorStatus = 
  | 'searching' 
  | 'pending'
  | 'accepted' 
  | 'doctor_on_the_way' 
  | 'on_the_way'
  | 'completed' 
  | 'cancelled';

export interface EmergencyDoctorRequest {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  symptoms: string;
  locality: string;
  pincode: string;
  address?: string;
  patientAddress?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  priority: EmergencyDoctorPriority;
  requestType: EmergencyDoctorRequestType;
  status: EmergencyDoctorStatus;
  patientUserId?: string;
  customerId?: string;
  doctorId?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedDoctorPhone?: string;
  assignedDoctorQualification?: string;
  doctorFee?: number;
  consultationFee?: number;
  crossLocalityApproved?: boolean;
  estimatedArrivalMinutes?: number;
  cancellationReason?: string;
  doctorNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NearbyHospital {
  id: string;
  name: string;
  locality: string;
  address: string;
  phone: string;
  distance: string;
  hasEmergency24x7: boolean;
  hasAmbulance: boolean;
  type: 'Government BPHC / RH' | 'District Hospital' | 'State General Hospital' | 'Military / Air Force Unit' | 'Private Health Clinic';
}

// ==========================================
// NON-PII SAFE DISPATCH SUMMARY PROJECTIONS
// (Created/assigned via trusted backend Cloud Function; no customer/patient PII)
// ==========================================
export interface RideDispatchSummary {
  id: string;
  rideId: string;
  customerId?: string;
  vehicleType: VehicleType;
  pickupLocality: string;
  dropLocality: string;
  distanceKm?: number;
  estimatedFare: number;
  suggestedFare?: number;
  customerProposedFare?: number;
  agreedFare?: number;
  agreedAt?: string;
  confirmedAt?: string;
  status: RideStatus;
  routingStatus?: RequestRoutingStatus;
  assignedDriverId?: string;
  confirmedDriverId?: string;
  driverName?: string;
  vehicleNumber?: string;
  driverRating?: number;
  eligibleDriverIds?: string[];
  rejectedDriverIds?: string[];
  activeDriverOffers?: FareOffer[];
  negotiationHistory?: FareOffer[];
  currentRound?: number;
  maxNegotiationRounds?: number;
  expiresAt?: string;
  expiresAtMs?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryDispatchSummary {
  id: string;
  deliveryId: string;
  pickupLocality: string;
  dropLocality: string;
  parcelCategory: string;
  weightCategory: string;
  estimatedPrice: number;
  status: DeliveryStatus;
  assignedDeliveryPersonId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmergencyDispatchSummary {
  id: string;
  requestId: string;
  locality: string;
  pincode: string;
  priority: EmergencyDoctorPriority;
  requestType: EmergencyDoctorRequestType;
  consultationFee?: number;
  crossLocalityApproved?: boolean;
  status: EmergencyDoctorStatus;
  assignedDoctorId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// UNIVERSAL LOCALITY-BASED ADMIN ROUTING
// ==========================================
export type RoutingServiceCategory =
  | 'shop_order'
  | 'delivery'
  | 'ride'
  | 'service';

export type RequestRoutingStatus =
  | 'pending_admin_routing'
  | 'assigned'
  | 'unavailable_in_locality';

export interface AssignmentAuditEntry {
  id: string;
  requestId: string;
  serviceCategory: RoutingServiceCategory;
  requestLocality: string;
  partnerId?: string;
  partnerName?: string;
  partnerRole: PartnerRoleType;
  partnerBaseLocality?: string;
  partnerCurrentLocation?: string;
  action:
    | 'assigned'
    | 'reassigned'
    | 'blocked_cross_locality'
    | 'blocked_ineligible'
    | 'no_eligible_partner';
  reason?: string;
  assignedBy: string;
  timestamp: string;
  crossLocalityApproved?: boolean;
}

export interface LocalityRoutingRule {
  localityName: string;
  crossLocalityEnabled: boolean;
  nearbyLocalities: string[];
  shopIds: string[];
  deliveryRiderIds: string[];
  rideDriverIds: string[];
  serviceProviderIds: string[];
  updatedAt?: string;
}

export interface UniversalRoutingConfig {
  globalCrossLocalityEnabled: boolean;
  rulesByLocality: Record<string, LocalityRoutingRule>;
  updatedBy?: string;
  updatedAt?: string;
}

export interface PartnerEligibilityReport {
  partnerId: string;
  partnerName: string;
  partnerRole: PartnerRoleType;
  baseLocality: string;
  currentLocation: string;
  isEligible: boolean;
  reasons: string[];
  isExactLocality: boolean;
  isApprovedNearbyLocality: boolean;
  crossLocalityUsed: boolean;
  vehicleType?: VehicleType;
  category?: string;
}

export interface RoutingAlert {
  id: string;
  requestId: string;
  serviceCategory: RoutingServiceCategory;
  requestLocality: string;
  vehicleType?: VehicleType;
  serviceRequired?: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// SMART RIDE ALERTS & FCM NOTIFICATION TOKENS
// ==========================================
export type NotificationChannelMode = 'fcm' | 'pwa_local' | 'in_app';

export interface NotificationTokenRecord {
  id: string;
  uid: string;
  role: PortalMode;
  entityId?: string;
  vehicleType?: VehicleType;
  locality?: string;
  token: string;
  fcmEnabled: boolean;
  permissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
  platform: 'android_pwa' | 'web' | 'ios_pwa';
  channelId: string;
  active: boolean;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RideNotificationLog {
  id: string;
  rideId: string;
  recipientRole: 'driver' | 'admin' | 'customer';
  recipientId?: string;
  recipientLabel?: string;
  locality: string;
  vehicleType: VehicleType;
  channel: NotificationChannelMode;
  eventType:
    | 'RIDE_REQUESTED'
    | 'COUNTER_OFFERED'
    | 'CONFIRMED'
    | 'REMINDER'
    | 'REJECTED'
    | 'EXPIRED'
    | 'CANCELLED'
    | 'STATUS_CHANGED';
  deliveryStatus: 'dispatched' | 'seen' | 'clicked' | 'muted' | 'failed';
  dedupKey: string;
  timestamp: string;
  details?: string;
}


