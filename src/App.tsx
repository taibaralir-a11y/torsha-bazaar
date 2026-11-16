/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { CategoriesView } from './components/CategoriesView';
import { RideBookingView } from './components/RideBookingView';
import { DeliveryView } from './components/DeliveryView';
import { ServicesView } from './components/ServicesView';
import { JobsView } from './components/JobsView';
import { PhonesView } from './components/PhonesView';
import { OrdersView } from './components/OrdersView';
import { AccountView } from './components/AccountView';
import { MoreView } from './components/MoreView';

import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { LocationModal } from './components/LocationModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SideDrawer } from './components/SideDrawer';
import { PosterModal } from './components/PosterModal';

// Dedicated Specialized Marketplace Views
import { MobileShopView } from './components/mobile/MobileShopView';
import { MedicalShopView } from './components/medical/MedicalShopView';
import { MeatShopView } from './components/meat/MeatShopView';
import { ScrapMarketplaceView } from './components/scrap/ScrapMarketplaceView';
import { HyperlocalPromptModal } from './components/common/HyperlocalPromptModal';

// Dedicated Dashboards & Shared Modals
import { ShopkeeperDashboard } from './components/shopkeeper/ShopkeeperDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { ServiceProviderDashboard } from './components/service_provider/ServiceProviderDashboard';
import { EmployerDashboard } from './components/employer/EmployerDashboard';
import { PortalSwitcherModal } from './components/common/PortalSwitcherModal';
import { UniversalQrModal } from './components/common/UniversalQrModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

// Doctor & Auth Modals
import { EmergencyDoctorModal } from './components/doctor/EmergencyDoctorModal';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { CustomerAuthModal } from './components/customer/CustomerAuthModal';
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { PartnerAuthModal } from './components/common/PartnerAuthModal';

import { INITIAL_NOTIFICATIONS } from './data/mockData';
import { 
  SERVICE_LOCALITIES, 
  INITIAL_SERVICE_LOCALITIES, 
  rankShopsForCustomer, 
  filterProductsByLocality,
  getLocalityByName,
  resolveAreaKey,
  createDefaultRoutingConfig,
  syncPartnerIntoRoutingConfig,
  getEligiblePartnersForRequest,
  getEligibleDeliveryRidersForOrder,
  evaluatePublicRiderCardsForOrder,
  evaluatePublicDriverCardsForRide,
  validateAndBuildAssignmentAudit,
  buildUnavailableLocalityAlert
} from './utils/hyperlocalRouting';

import {
  computeShopOrderPricing,
  getCustomerCancelBlockedReason,
  isCustomerOrderCancellable,
  planSplitCartOrders,
  validateOrderItemsMatchShop
} from './utils/checkoutOrder';
import { reconcileScopedRemoteSlice } from './utils/stateLifecycle';

import { 
  Product, 
  CartItem, 
  Order, 
  UserProfile, 
  AppTab, 
  ServiceType, 
  PortalMode, 
  Shop, 
  OrderStatus, 
  ShopApprovalStatus,
  Driver,
  RideBooking,
  RideStatus,
  FareOffer,
  DeliveryPerson,
  DeliveryRequest,
  DeliveryStatus,
  ServiceProvider,
  ServiceRequest,
  ServiceRequestStatus,
  JobListing,
  JobApplication,
  Complaint,
  AdminActivity,
  LanguageCode,
  ScrapRequest,
  ScrapOffer,
  PublicScrapListing,
  LocalityInfo,
  AppNotification,
  ReturnReason,
  OrderReturnRequest,
  Doctor,
  EmergencyDoctorRequest,
  EmergencyDoctorStatus,
  PublicShopCard,
  PublicProductCard,
  PublicDoctorCard,
  PublicServiceProviderCard,
  PublicJobCard,
  PublicRiderCard,
  PublicDriverCard,
  PartnerRoleType,
  PartnerAccountStatus,
  PartnerAccount,
  CreatePartnerAccountInput,
  AdminShopUpdateInput,
  UniversalRoutingConfig,
  RoutingAlert,
  RoutingServiceCategory
} from './types';

import {
  buildAccountStatusSyncPlan,
  buildManualEntityStatusAccountPatch,
  canShopkeeperMutateCatalog,
  ChunkedProductSyncResult,
  resolveShopTypeFromCategory
} from './utils/partnerLifecycle';

import {
  toPublicShopCard,
  fromPublicShopCard,
  toPublicProductCard,
  fromPublicProductCard,
  toPublicDoctorCard,
  fromPublicDoctorCard,
  toPublicServiceProviderCard,
  fromPublicServiceProviderCard,
  toPublicJobCard,
  fromPublicJobCard,
  toPublicRiderCard,
  toPublicDriverCard,
  fromPublicDriverCard,
  toPublicScrapListing
} from './utils/directorySanitizer';

import { 
  db, 
  auth, 
  cleanForFirestore,
  safeSetDoc, 
  safeUpdateDoc,
  ensureAuthSession, 
  handleAuthSignOut, 
  provisionPartnerAuthWithFirestore,
  buildSyntheticPartnerEmail,
  hashPhoneForLookup
} from './firebase';
import { onAuthStateChanged, getRedirectResult, signOut, User } from 'firebase/auth';
import { doc, deleteDoc, deleteField, collection, onSnapshot, query, where, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { normalizePhoneE164, phonesMatchNormalized } from './utils/phone';

const isAdminUrlPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.replace(/\/+$/, '').toLowerCase();
  return path === '/admin' || hash === '#/admin' || hash === '#admin';
};

const createGuestUserProfile = (
  location = 'Satali',
  pincode = '735214',
  language: UserProfile['language'] = 'en'
): UserProfile => ({
  id: '',
  userId: '',
  name: 'Guest Customer',
  phone: '',
  email: '',
  address: '',
  location,
  pincode,
  language,
  wishlist: [],
  isSessionAuthenticated: false,
  isPhoneVerified: false,
  isVerified: false,
  authMethod: 'none'
});

const CUSTOMER_LOCAL_STORAGE_KEYS = [
  'tb_orders',
  'tb_cart',
  'tb_complaints',
  'tb_ride_bookings',
  'tb_deliveries',
  'tb_service_requests',
  'tb_scrap_requests',
  'tb_emergency_requests',
  'tb_user'
];

const PARTNER_AND_CATALOG_LOCAL_STORAGE_KEYS = [
  'tb_shop',
  'tb_shops',
  'tb_products',
  'tb_drivers',
  'tb_delivery_persons',
  'tb_service_providers',
  'tb_job_listings',
  'tb_job_applications',
  'tb_doctors',
  'tb_admin_activities',
  'tb_routing_config',
  'tb_routing_alerts',
  'tb_localities'
];

const EMPTY_SHOP: Shop = {
  id: '',
  ownerId: '',
  name: '',
  address: '',
  locality: 'Satali',
  pincode: '735214',
  contactNumber: '',
  imageUrl: '',
  category: 'Grocery & Ration',
  shopType: 'grocery',
  status: 'pending',
  isVerified: false,
  isOpen: false,
  deliveryAreas: [],
  deliveryCharge: 20,
  deliveryRadiusKm: 8
};

const EMPTY_DRIVER: Driver = {
  id: '',
  ownerId: '',
  name: '',
  phone: '',
  vehicleType: 'toto',
  vehicleNumber: '',
  locality: 'Satali',
  servedLocalities: [],
  status: 'pending',
  isOnline: false,
  rating: 0,
  totalRides: 0
};

const EMPTY_RIDER: DeliveryPerson = {
  id: '',
  ownerId: '',
  name: '',
  phone: '',
  status: 'pending',
  isOnline: false,
  locality: 'Satali',
  servedLocalities: [],
  totalDelivered: 0,
  rating: 0
};

const EMPTY_PROVIDER: ServiceProvider = {
  id: '',
  ownerId: '',
  name: '',
  phone: '',
  category: 'Electrician',
  serviceArea: 'Satali',
  servedLocalities: [],
  description: '',
  experienceYears: 0,
  hourlyRate: 0,
  status: 'pending',
  isAvailable: false,
  rating: 0,
  totalJobsCompleted: 0
};

const EMPTY_DOCTOR: Doctor = {
  id: '',
  ownerId: '',
  name: '',
  phone: '',
  email: '',
  qualification: '',
  specialization: 'General Physician',
  consultationFee: 0,
  status: 'pending',
  isOnline: false,
  isAvailable: false,
  localitiesServed: [],
  servedLocalities: [],
  rating: 0
};

export default function App() {
  // Portal Mode: customer, shopkeeper, admin, driver, delivery, service_provider, employer
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    if (isAdminUrlPath()) {
      return 'admin';
    }
    try {
      const saved = localStorage.getItem('tb_portal_mode') as PortalMode | null;
      if (saved && saved !== 'admin') {
        return saved;
      }
      return 'customer';
    } catch {
      return 'customer';
    }
  });

  // Navigation State
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [activeServiceView, setActiveServiceView] = useState<ServiceType | null>(null);

  // Shopkeeper & Shops State (live Firestore only; never seeded from mock data or shared localStorage)
  const [shop, setShop] = useState<Shop>(() => ({ ...EMPTY_SHOP }));
  const [shops, setShops] = useState<Shop[]>([]);

  // Products State (live Firestore only)
  const [products, setProducts] = useState<Product[]>([]);

  // Customer Cart State (never restored from shared global localStorage)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer-only Orders State (strictly isolated by authenticated Firebase UID)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Partner & Admin Orders State (isolated from customer UI)
  const [orders, setOrders] = useState<Order[]>([]);

  // DRIVERS STATE (Taxi, Auto, Toto ONLY - No bike taxi)
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentDriver, setCurrentDriver] = useState<Driver>(() => ({ ...EMPTY_DRIVER }));

  // RIDE BOOKINGS STATE (never seeded from demo bookings or shared localStorage)
  const [rideBookings, setRideBookings] = useState<RideBooking[]>([]);

  // DELIVERY FLEET STATE
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [currentRider, setCurrentRider] = useState<DeliveryPerson>(() => ({ ...EMPTY_RIDER }));

  // Approved non-PII fleet rider & driver cards (for dispatch selection & customer ride availability)
  const [approvedRiders, setApprovedRiders] = useState<PublicRiderCard[]>([]);
  const [approvedDrivers, setApprovedDrivers] = useState<PublicDriverCard[]>([]);
  const [publicScrapListings, setPublicScrapListings] = useState<PublicScrapListing[]>([]);
  const [approvedPublicShopIds, setApprovedPublicShopIds] = useState<string[]>([]);
  const [publicCatalogEpoch, setPublicCatalogEpoch] = useState<number>(0);
  const [isPublicCatalogLoading, setIsPublicCatalogLoading] = useState<boolean>(true);
  const syncedRemoteShopIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteProductIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteDoctorIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteProviderIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteJobIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteDriverIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteRiderIdsRef = useRef<boolean>(false);

  // PARCEL DELIVERIES (never seeded from demo data or shared localStorage)
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);

  // SERVICE PROVIDERS
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<ServiceProvider>(() => ({ ...EMPTY_PROVIDER }));

  // SERVICE REQUESTS (never seeded from demo data or shared localStorage)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // JOB LISTINGS & APPLICATIONS
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);

  // COMPLAINTS & GRIEVANCES (never seeded from demo data or shared localStorage)
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // ADMIN AUDIT LOGS
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);

  // APP NOTIFICATIONS
  const [notifications, setNotifications] = useState<AppNotification[]>(() => INITIAL_NOTIFICATIONS);

  // Customer User Profile (never restored from stale localStorage or INITIAL_USER)
  const [user, setUser] = useState<UserProfile>(() => createGuestUserProfile());

  // Language state: 'en' | 'hi' | 'bn'
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('tb_language');
      return (saved as LanguageCode) || 'en';
    } catch {
      return 'en';
    }
  });

  // Hyperlocal location & PIN code (Default: Satali 735214 / Hasimara 735215)
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tb_locality');
      return saved || 'Satali';
    } catch {
      return 'Satali';
    }
  });

  const [currentPincode, setCurrentPincode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tb_pincode');
      return saved || '735214';
    } catch {
      return '735214';
    }
  });

  // CENTRALLY MANAGED FIRESTORE LOCALITIES COLLECTION
  const [localities, setLocalities] = useState<LocalityInfo[]>(() => INITIAL_SERVICE_LOCALITIES);

  // Scrap Marketplace Requests (never seeded from demo data or shared localStorage)
  const [scrapRequests, setScrapRequests] = useState<ScrapRequest[]>([]);

  // DOCTORS STATE
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor>(() => ({ ...EMPTY_DOCTOR }));

  // EMERGENCY DOCTOR REQUESTS (never seeded from demo data or shared localStorage)
  const [emergencyDoctorRequests, setEmergencyDoctorRequests] = useState<EmergencyDoctorRequest[]>([]);

  // UNIVERSAL LOCALITY ROUTING CONFIG & ALERTS (live Firestore only)
  const [routingConfig, setRoutingConfig] = useState<UniversalRoutingConfig>(() =>
    createDefaultRoutingConfig({
      localities: INITIAL_SERVICE_LOCALITIES
    })
  );
  const [routingAlerts, setRoutingAlerts] = useState<RoutingAlert[]>([]);

  const previousAuthUidRef = useRef<string | null>(auth.currentUser?.uid || null);
  const wasAdminAuthenticatedRef = useRef<boolean>(false);
  const syncedShopOrderIdsRef = useRef<Set<string>>(new Set());
  const syncedRiderOrderIdsRef = useRef<Set<string>>(new Set());
  const syncedRiderDeliveryIdsRef = useRef<Set<string>>(new Set());
  const customerServiceRequestsRef = useRef<ServiceRequest[]>([]);
  const providerServiceRequestsRef = useRef<ServiceRequest[]>([]);
  const customerScrapRequestsRef = useRef<ScrapRequest[]>([]);
  const kabariScrapRequestsRef = useRef<ScrapRequest[]>([]);
  const scrapOffersByReqRef = useRef<Map<string, ScrapOffer[]>>(new Map());
  const kabariOwnOfferByReqRef = useRef<Map<string, ScrapOffer>>(new Map());

  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isPortalSwitcherOpen, setIsPortalSwitcherOpen] = useState(false);
  const [isUniversalQrOpen, setIsUniversalQrOpen] = useState(false);
  const [isEmergencyDoctorModalOpen, setIsEmergencyDoctorModalOpen] = useState(false);
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [customerAuthError, setCustomerAuthError] = useState('');
  const [customerAuthInitialStep, setCustomerAuthInitialStep] = useState<'login' | 'register' | 'forgot' | 'complete_profile'>('login');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const isAdminAuthModalOpenRef = useRef(isAdminAuthModalOpen);
  isAdminAuthModalOpenRef.current = isAdminAuthModalOpen;
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminCustomers, setAdminCustomers] = useState<UserProfile[]>([]);
  const [adminPartnerAccounts, setAdminPartnerAccounts] = useState<PartnerAccount[]>([]);
  const [activePartnerAccount, setActivePartnerAccount] = useState<PartnerAccount | null>(null);
  const [isPartnerAccountResolved, setIsPartnerAccountResolved] = useState<boolean>(false);
  const [isPartnerAuthModalOpen, setIsPartnerAuthModalOpen] = useState(false);
  const [partnerAuthExpectedRole, setPartnerAuthExpectedRole] = useState<PartnerRoleType | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const ADMIN_EMAIL = 'taibaralir@gmail.com';
  const isAdminAuthenticated = Boolean(
    firebaseUser &&
    firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    firebaseUser.emailVerified === true
  );
  const isAuthorizedKabariPartner = Boolean(
    activePartnerAccount &&
    activePartnerAccount.status === 'active' &&
    activePartnerAccount.role === 'kabari'
  );
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist non-admin portalMode & synchronize /admin URL path
  useEffect(() => {
    try {
      if (portalMode !== 'admin') {
        localStorage.setItem('tb_portal_mode', portalMode);
      }
    } catch (e) {
      console.warn(e);
    }

    try {
      const onAdminPath = isAdminUrlPath();
      if (portalMode === 'admin' && !onAdminPath) {
        window.history.replaceState(null, '', '/admin');
      } else if (portalMode !== 'admin' && onAdminPath) {
        window.history.replaceState(null, '', '/');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [portalMode]);

  // Listen to browser navigation / hash changes for direct /admin URL routing
  useEffect(() => {
    const handleRouteChange = () => {
      if (isAdminUrlPath()) {
        try {
          sessionStorage.removeItem('tb_admin_manual_switch');
        } catch {
          // ignore
        }
        setPortalMode('admin');
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const getAuthFlags = (fbUser: User | null, profilePhone?: string) => {
    if (!fbUser) {
      return {
        isSessionAuthenticated: false,
        isPhoneVerified: false,
        isVerified: false,
        authMethod: 'none' as const
      };
    }
    const cleanPhone = normalizePhoneE164(profilePhone) || profilePhone?.trim();
    const hasExactPhoneMatch = phonesMatchNormalized(fbUser.phoneNumber, cleanPhone);
    const isPhoneVerified = hasExactPhoneMatch;
    const isVerified = Boolean(isPhoneVerified || fbUser.emailVerified);
    const isGoogleProvider = fbUser.providerData?.some((p) => p.providerId === 'google.com');
    const authMethod: UserProfile['authMethod'] = hasExactPhoneMatch
      ? 'phone'
      : fbUser.email
        ? (isGoogleProvider ? 'google' : 'email')
        : (fbUser.isAnonymous ? 'anonymous' : 'none');
    return {
      isSessionAuthenticated: true,
      isPhoneVerified,
      isVerified,
      authMethod
    };
  };

  const resolveAuthUid = async (): Promise<string | null> => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    const fbUser = await ensureAuthSession(true);
    return fbUser?.uid || null;
  };

  const mergeById = <T extends { id: string }>(localList: T[], remoteList: T[]): T[] => {
    if (remoteList.length === 0) return localList;
    const remoteMap = new Map(remoteList.map((item) => [item.id, item]));
    const updatedLocal = localList.map((item) => remoteMap.get(item.id) || item);
    const newRemote = remoteList.filter((item) => !localList.some((l) => l.id === item.id));
    return [...newRemote, ...updatedLocal];
  };

  const mergeWithRemoteEviction = <T extends { id: string }>(
    localList: T[],
    remoteList: T[],
    syncedRef: React.MutableRefObject<Set<string>>
  ): T[] => {
    const nextRemoteIds = new Set(remoteList.map((item) => item.id));
    const removedRemoteIds = new Set(
      Array.from(syncedRef.current).filter((id) => !nextRemoteIds.has(id))
    );
    syncedRef.current = nextRemoteIds;
    const retained = localList.filter((item) => !removedRemoteIds.has(item.id));
    if (remoteList.length === 0) return retained;
    return mergeById(retained, remoteList);
  };

  const clearCustomerScopedState = () => {
    setCustomerOrders([]);
    setOrders([]);
    setTrackedOrder(null);
    setCart([]);
    setComplaints([]);
    setRideBookings([]);
    setDeliveries([]);
    setServiceRequests([]);
    setScrapRequests([]);
    setEmergencyDoctorRequests([]);
    customerServiceRequestsRef.current = [];
    providerServiceRequestsRef.current = [];
    syncedShopOrderIdsRef.current.clear();
    syncedRiderOrderIdsRef.current.clear();
    syncedRiderDeliveryIdsRef.current.clear();
    try {
      CUSTOMER_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }
  };

  const clearPartnerScopedState = () => {
    setShop({ ...EMPTY_SHOP });
    setCurrentDriver({ ...EMPTY_DRIVER });
    setCurrentRider({ ...EMPTY_RIDER });
    setCurrentProvider({ ...EMPTY_PROVIDER });
    setCurrentDoctor({ ...EMPTY_DOCTOR });
    setAdminPartnerAccounts([]);
    setAdminCustomers([]);
    setAdminActivities([]);
    setShops([]);
    setProducts([]);
    setDrivers([]);
    setDeliveryPersons([]);
    setDoctors([]);
    setServiceProviders([]);
    setJobListings([]);
    setJobApplications([]);
    setRoutingAlerts([]);
    setOrders([]);
    setRideBookings([]);
    setDeliveries([]);
    setServiceRequests([]);
    setScrapRequests([]);
    setPublicScrapListings([]);
    setComplaints([]);
    setEmergencyDoctorRequests([]);
    setApprovedRiders([]);
    setApprovedDrivers([]);
    setApprovedPublicShopIds([]);
    syncedRemoteShopIdsRef.current.clear();
    syncedRemoteProductIdsRef.current.clear();
    syncedRemoteDoctorIdsRef.current.clear();
    syncedRemoteProviderIdsRef.current.clear();
    syncedRemoteJobIdsRef.current.clear();
    syncedRemoteDriverIdsRef.current.clear();
    syncedRemoteRiderIdsRef.current = false;
    syncedShopOrderIdsRef.current.clear();
    syncedRiderOrderIdsRef.current.clear();
    syncedRiderDeliveryIdsRef.current.clear();
    customerServiceRequestsRef.current = [];
    providerServiceRequestsRef.current = [];
    customerScrapRequestsRef.current = [];
    kabariScrapRequestsRef.current = [];
    scrapOffersByReqRef.current.clear();
    kabariOwnOfferByReqRef.current.clear();
    setPublicCatalogEpoch((epoch) => epoch + 1);
    try {
      PARTNER_AND_CATALOG_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }
  };

  // Clear any legacy globally shared customer/partner localStorage keys on initial mount
  useEffect(() => {
    try {
      CUSTOMER_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      PARTNER_AND_CATALOG_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Synchronize Firebase Auth session across app reloads (Spark ₹0 plan)
  // Never assume authentication solely from localStorage or INITIAL_USER.
  // Clear all customer-scoped state whenever Firebase UID changes or logs out.
  useEffect(() => {
    // Process Google Sign-In redirect result (mobile PWA fallback when popups are blocked)
    getRedirectResult(auth)
      .then(async (res) => {
        if (!res?.user) return;
        const email = res.user.email?.toLowerCase();
        const isPendingAdminRedirect = (() => {
          try {
            return sessionStorage.getItem('tb_admin_login_pending') === 'true';
          } catch {
            return false;
          }
        })();
        const isPendingCustomerRedirect = (() => {
          try {
            return sessionStorage.getItem('tb_customer_google_pending') === 'true';
          } catch {
            return false;
          }
        })();

        if (isPendingCustomerRedirect) {
          try {
            sessionStorage.removeItem('tb_customer_google_pending');
            sessionStorage.removeItem('tb_explicit_logout');
          } catch {
            // ignore
          }
          try {
            const snap = await getDoc(doc(db, 'customers', res.user.uid));
            const data = snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
            if (!data?.name || !data?.phone) {
              setCustomerAuthError('');
              setCustomerAuthInitialStep('complete_profile');
              setIsCustomerAuthModalOpen(true);
            }
          } catch {
            setCustomerAuthInitialStep('complete_profile');
            setIsCustomerAuthModalOpen(true);
          }
          return;
        }

        if (email === ADMIN_EMAIL.toLowerCase() && res.user.emailVerified === true) {
          try {
            sessionStorage.removeItem('tb_admin_login_pending');
            sessionStorage.removeItem('tb_admin_manual_switch');
          } catch {
            // ignore
          }
          setAdminAuthError('');
          setIsAdminAuthModalOpen(false);
          setPortalMode('admin');
        } else if (isPendingAdminRedirect || isAdminUrlPath()) {
          try {
            sessionStorage.removeItem('tb_admin_login_pending');
          } catch {
            // ignore
          }
          await signOut(auth).catch(() => {});
          setAdminAuthError(
            `Access denied. Account ${res.user.email || 'unknown'} is not verified as the authorized Super Admin (${ADMIN_EMAIL}).`
          );
          setPortalMode('admin');
        }
      })
      .catch((err: any) => {
        try {
          if (sessionStorage.getItem('tb_admin_login_pending') === 'true') {
            sessionStorage.removeItem('tb_admin_login_pending');
            setAdminAuthError(`Google Auth verification failed: ${err?.message || 'Unauthorized'}`);
          } else if (sessionStorage.getItem('tb_customer_google_pending') === 'true') {
            sessionStorage.removeItem('tb_customer_google_pending');
            setCustomerAuthError(`Google sign-in failed: ${err?.message || 'Unauthorized'}`);
            setCustomerAuthInitialStep('login');
            setIsCustomerAuthModalOpen(true);
          }
        } catch {
          // ignore
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      const nextUid = fbUser?.uid || null;
      const uidChanged = previousAuthUidRef.current !== nextUid;
      previousAuthUidRef.current = nextUid;

      if (uidChanged || !fbUser) {
        clearCustomerScopedState();
        setActivePartnerAccount(null);
      }

      setFirebaseUser(fbUser);
      if (fbUser) {
        if (fbUser.isAnonymous) {
          setActivePartnerAccount(null);
          setIsPartnerAccountResolved(true);
        }
        const isVerifiedAdminUser =
          fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          fbUser.emailVerified === true;

        if (isVerifiedAdminUser) {
          setAdminAuthError('');
          let manualSwitch = false;
          let adminLoginPending = false;
          try {
            manualSwitch = sessionStorage.getItem('tb_admin_manual_switch') === 'true';
            adminLoginPending = sessionStorage.getItem('tb_admin_login_pending') === 'true';
            if (adminLoginPending) {
              sessionStorage.removeItem('tb_admin_login_pending');
            }
          } catch {
            // ignore
          }
          if (
            isAdminUrlPath() ||
            adminLoginPending ||
            isAdminAuthModalOpenRef.current ||
            !manualSwitch
          ) {
            setIsAdminAuthModalOpen(false);
            setPortalMode('admin');
          }
        }

        let remoteProfile: Partial<UserProfile> | null = null;
        try {
          const snap = await getDoc(doc(db, 'customers', fbUser.uid));
          if (snap.exists()) {
            remoteProfile = snap.data() as Partial<UserProfile>;
          }
        } catch (err) {
          console.warn('Customer profile fetch notice:', (err as Error)?.message);
        }
        setUser((prev) => {
          const isSameUid = Boolean(prev.id && prev.id === fbUser.uid);
          const guestBase = createGuestUserProfile(currentLocation, currentPincode, prev.language || 'en');
          const cleanBase: UserProfile = remoteProfile
            ? { ...(isSameUid ? prev : guestBase), ...remoteProfile }
            : isSameUid
              ? prev
              : {
                  ...guestBase,
                  id: fbUser.uid,
                  userId: fbUser.uid,
                  name: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Shopper' : 'Customer'),
                  phone: fbUser.phoneNumber || '',
                  email: fbUser.email || ''
                };
          const rawPhone = remoteProfile?.phone || cleanBase.phone || fbUser.phoneNumber || '';
          const effectivePhone = normalizePhoneE164(rawPhone) || rawPhone;
          const flags = getAuthFlags(fbUser, effectivePhone);
          return {
            ...cleanBase,
            name: remoteProfile?.name || cleanBase.name || fbUser.displayName || 'Customer',
            email: remoteProfile?.email || cleanBase.email || fbUser.email || '',
            phone: effectivePhone,
            id: fbUser.uid,
            userId: fbUser.uid,
            ...flags
          };
        });
      } else {
        setAdminCustomers([]);
        setAdminPartnerAccounts([]);
        setActivePartnerAccount(null);
        setIsPartnerAccountResolved(true);
        setUser((prev) => createGuestUserProfile(currentLocation, currentPincode, prev.language || 'en'));
      }
    });

    ensureAuthSession(false).then((currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync active shop profile changes to Firestore only when authenticated as linked approved owner or verified admin
  useEffect(() => {
    if (
      firebaseUser &&
      portalMode === 'shopkeeper' &&
      shop.id &&
      (
        isAdminAuthenticated ||
        (shop.ownerId === firebaseUser.uid &&
          shop.status === 'approved' &&
          activePartnerAccount?.status === 'active' &&
          activePartnerAccount.role === 'shopkeeper' &&
          activePartnerAccount.linkedEntityId === shop.id)
      )
    ) {
      const payload = {
        ...shop,
        updatedAt: new Date().toISOString()
      };
      if (isAdminAuthenticated) {
        safeSetDoc(doc(db, 'shops', shop.id), payload, { merge: true }).catch((err) =>
          console.warn('Firestore shop sync info:', err.message)
        );
      } else {
        // Approved active shop owners may only update non-privileged fields
        const { status: _s, isVerified: _v, ownerId: _o, ...safeShopFields } = payload;
        safeUpdateDoc(doc(db, 'shops', shop.id), safeShopFields).catch((err) =>
          console.warn('Firestore shop update info:', err.message)
        );
      }
    }
  }, [
    shop,
    firebaseUser,
    portalMode,
    isAdminAuthenticated,
    activePartnerAccount?.status,
    activePartnerAccount?.role,
    activePartnerAccount?.linkedEntityId
  ]);

  const persistRoutingConfigToFirestore = (cfg: UniversalRoutingConfig) => {
    if (!isAdminAuthenticated) return;
    safeSetDoc(doc(db, 'routingConfig', 'universal'), cfg, { merge: true }).catch((err) =>
      console.warn('Firestore routingConfig sync:', err.message)
    );
  };

  // Real-time Firestore sync for universal locality routing configuration
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'routingConfig', 'universal'),
      (snap) => {
        if (snap.exists()) {
          setRoutingConfig(snap.data() as UniversalRoutingConfig);
        } else if (isAdminAuthenticated) {
          const initialCfg = createDefaultRoutingConfig({
            localities,
            shops,
            deliveryPersons,
            drivers,
            serviceProviders
          });
          safeSetDoc(doc(db, 'routingConfig', 'universal'), initialCfg, { merge: true }).catch((err) =>
            console.warn('Firestore routingConfig seed notice:', err.message)
          );
        }
      },
      (err) => console.warn('Firestore routingConfig listener:', err.message)
    );
    return () => unsub();
  }, [isAdminAuthenticated]);

  // Clear sensitive admin-only and private partner arrays when verified Admin session signs out
  useEffect(() => {
    const wasAdmin = wasAdminAuthenticatedRef.current;
    wasAdminAuthenticatedRef.current = isAdminAuthenticated;
    if (wasAdmin && !isAdminAuthenticated) {
      clearPartnerScopedState();
    } else if (!isAdminAuthenticated) {
      setAdminCustomers([]);
      setAdminPartnerAccounts([]);
      setAdminActivities([]);
      setRoutingAlerts([]);
    }
  }, [isAdminAuthenticated]);

  // Listen to signed-in non-anonymous partner role record from Firestore (/partnerAccounts/{uid})
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid || firebaseUser?.isAnonymous) {
      setActivePartnerAccount(null);
      setIsPartnerAccountResolved(true);
      return;
    }
    setIsPartnerAccountResolved(false);
    const unsub = onSnapshot(
      doc(db, 'partnerAccounts', uid),
      (snap) => {
        if (snap.exists()) {
          setActivePartnerAccount({ uid: snap.id, ...snap.data() } as PartnerAccount);
        } else {
          setActivePartnerAccount(null);
        }
        setIsPartnerAccountResolved(true);
      },
      (err) => {
        console.warn('Partner role lookup notice:', err.message);
        setActivePartnerAccount(null);
        setIsPartnerAccountResolved(true);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid, firebaseUser?.isAnonymous]);

  const combinedPartnerAccounts = adminPartnerAccounts;

  // Bind Admin-linked entity record to active partner dashboard state
  useEffect(() => {
    if (!activePartnerAccount || activePartnerAccount.status !== 'active' || !activePartnerAccount.linkedEntityId) {
      return;
    }
    const eid = activePartnerAccount.linkedEntityId;
    if (activePartnerAccount.role === 'shopkeeper') {
      const found = shops.find((s) => s.id === eid);
      if (found && shop.id !== found.id) setShop(found);
    } else if (activePartnerAccount.role === 'driver') {
      const found = drivers.find((d) => d.id === eid);
      if (found && currentDriver.id !== found.id) setCurrentDriver(found);
    } else if (activePartnerAccount.role === 'delivery') {
      const found = deliveryPersons.find((p) => p.id === eid);
      if (found && currentRider.id !== found.id) setCurrentRider(found);
    } else if (activePartnerAccount.role === 'doctor') {
      const found = doctors.find((d) => d.id === eid);
      if (found && currentDoctor.id !== found.id) setCurrentDoctor(found);
    } else if (activePartnerAccount.role === 'service_provider') {
      const found = serviceProviders.find((p) => p.id === eid);
      if (found && currentProvider.id !== found.id) setCurrentProvider(found);
    }
  }, [activePartnerAccount, shops, drivers, deliveryPersons, doctors, serviceProviders]);

  const handleSelectPortalMode = (mode: PortalMode) => {
    if (mode === 'admin') {
      try {
        sessionStorage.removeItem('tb_admin_manual_switch');
      } catch {
        // ignore
      }
      setAdminAuthError('');
      setPortalMode('admin');
      if (!isAdminAuthenticated) {
        setIsAdminAuthModalOpen(true);
      }
      return;
    }

    if (mode === 'customer') {
      if (isAdminAuthenticated) {
        try {
          sessionStorage.setItem('tb_admin_manual_switch', 'true');
        } catch {
          // ignore
        }
      }
      setPortalMode('customer');
      return;
    }

    if (isAdminAuthenticated) {
      try {
        sessionStorage.setItem('tb_admin_manual_switch', 'true');
      } catch {
        // ignore
      }
      setPortalMode(mode);
      return;
    }

    if (activePartnerAccount && activePartnerAccount.status === 'active' && activePartnerAccount.role === mode) {
      setPortalMode(mode);
      return;
    }

    // Require Admin-issued Partner Credentials for any restricted portal
    setPartnerAuthExpectedRole(mode as PartnerRoleType);
    setIsPartnerAuthModalOpen(true);
  };

  const handlePartnerLoginSuccess = (account: PartnerAccount) => {
    setActivePartnerAccount(account);
    setIsPartnerAccountResolved(true);
    setIsPartnerAuthModalOpen(false);
    setPartnerAuthExpectedRole(null);
    setPortalMode(account.role);
  };

  const handlePartnerLogout = async () => {
    setActivePartnerAccount(null);
    setIsPartnerAccountResolved(true);
    setIsPartnerAuthModalOpen(false);
    setPartnerAuthExpectedRole(null);
    try {
      localStorage.removeItem('tb_portal_mode');
    } catch {
      // ignore
    }
    clearPartnerScopedState();
    clearCustomerScopedState();
    await handleAuthSignOut();
    setUser(createGuestUserProfile(currentLocation, currentPincode, language));
    setPortalMode('customer');
  };

  const handleAdminLogout = async () => {
    try {
      sessionStorage.removeItem('tb_admin_manual_switch');
      sessionStorage.removeItem('tb_admin_login_pending');
      localStorage.removeItem('tb_portal_mode');
    } catch {
      // ignore
    }
    setAdminAuthError('');
    setIsAdminAuthModalOpen(false);
    clearPartnerScopedState();
    clearCustomerScopedState();
    await handleAuthSignOut();
    setUser(createGuestUserProfile(currentLocation, currentPincode, language));
    setPortalMode('customer');
  };

  // Build & log append-only admin activity records (verified Super Admin only)
  const createAdminActivityRecord = (action: string, details: string, timestamp = new Date().toISOString()): AdminActivity => ({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminEmail: firebaseUser?.email || ADMIN_EMAIL,
    action,
    details,
    timestamp
  });

  const logAdminAction = (action: string, details: string) => {
    if (!isAdminAuthenticated) return;
    const act = createAdminActivityRecord(action, details);
    setAdminActivities((prev) => [act, ...prev]);
    safeSetDoc(doc(db, 'adminActivity', act.id), act).catch((err) =>
      console.warn('Firestore adminActivity sync:', err.message)
    );
  };

  // Firestore sync for centrally managed localities collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'localities'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: LocalityInfo[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as LocalityInfo);
          });
          setLocalities(list);
        } else if (isAdminAuthenticated) {
          // Only verified Super Admin seeds initial localities to Firestore
          INITIAL_SERVICE_LOCALITIES.forEach((loc) => {
            safeSetDoc(doc(db, 'localities', loc.id), loc, { merge: true }).catch((err) => console.warn(err));
          });
        }
      },
      (err) => {
        console.warn('Firestore localities listener:', err);
      }
    );
    return () => unsub();
  }, [isAdminAuthenticated]);

  // Rule-compatible Firestore listeners for public non-PII approved catalogs
  useEffect(() => {
    const unsubPublicShops = onSnapshot(
      query(collection(db, 'publicShops'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteShops = snapshot.docs.map((d) =>
          fromPublicShopCard({ id: d.id, ...d.data() } as PublicShopCard)
        );
        const nextRemoteShopIds = new Set(remoteShops.map((s) => s.id));
        const removedShopIds = new Set(
          Array.from(syncedRemoteShopIdsRef.current).filter((id) => !nextRemoteShopIds.has(id))
        );
        setShops((prev) => mergeWithRemoteEviction(prev, remoteShops, syncedRemoteShopIdsRef));
        setApprovedPublicShopIds(remoteShops.map((s) => s.id));
        if (removedShopIds.size > 0) {
          setProducts((prev) => prev.filter((p) => !p.shopId || !removedShopIds.has(p.shopId)));
        }
        if (snapshot.empty) {
          setIsPublicCatalogLoading(false);
        }
      },
      (err) => {
        console.warn('Firestore publicShops listener:', err.message);
        setIsPublicCatalogLoading(false);
      }
    );

    const unsubPublicDoctors = onSnapshot(
      query(collection(db, 'publicDoctors'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteDoctors = snapshot.docs.map((d) =>
          fromPublicDoctorCard({ id: d.id, ...d.data() } as PublicDoctorCard)
        );
        setDoctors((prev) => mergeWithRemoteEviction(prev, remoteDoctors, syncedRemoteDoctorIdsRef));
      },
      (err) => console.warn('Firestore publicDoctors listener:', err.message)
    );

    const unsubPublicProviders = onSnapshot(
      query(collection(db, 'publicServiceProviders'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteProviders = snapshot.docs.map((d) =>
          fromPublicServiceProviderCard({ id: d.id, ...d.data() } as PublicServiceProviderCard)
        );
        setServiceProviders((prev) =>
          mergeWithRemoteEviction(prev, remoteProviders, syncedRemoteProviderIdsRef)
        );
      },
      (err) => console.warn('Firestore publicServiceProviders listener:', err.message)
    );

    const unsubPublicJobs = onSnapshot(
      query(collection(db, 'publicJobs'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteJobs = snapshot.docs.map((d) =>
          fromPublicJobCard({ id: d.id, ...d.data() } as PublicJobCard)
        );
        setJobListings((prev) => mergeWithRemoteEviction(prev, remoteJobs, syncedRemoteJobIdsRef));
      },
      (err) => console.warn('Firestore publicJobs listener:', err.message)
    );

    const unsubPublicDrivers = onSnapshot(
      query(collection(db, 'publicDrivers'), where('status', '==', 'approved')),
      (snapshot) => {
        const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PublicDriverCard));
        setApprovedDrivers((prev) => mergeWithRemoteEviction(prev, cards, syncedRemoteDriverIdsRef));
      },
      (err) => console.warn('Firestore publicDrivers listener:', err.message)
    );

    return () => {
      unsubPublicShops();
      unsubPublicDoctors();
      unsubPublicProviders();
      unsubPublicJobs();
      unsubPublicDrivers();
    };
  }, [publicCatalogEpoch]);

  // Chunked publicProducts listener (<= 8 approved shopIds per query so isShopApproved() rule stays under Firestore's 10-get limit)
  useEffect(() => {
    const uniqueShopIds = Array.from(new Set(approvedPublicShopIds.filter(Boolean)));
    if (uniqueShopIds.length === 0) {
      if (syncedRemoteProductIdsRef.current.size > 0) {
        const remoteIdsToEvict = new Set(syncedRemoteProductIdsRef.current);
        syncedRemoteProductIdsRef.current.clear();
        setProducts((prev) => prev.filter((p) => !remoteIdsToEvict.has(p.id)));
      }
      setIsPublicCatalogLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];
    for (let i = 0; i < uniqueShopIds.length; i += 8) {
      const chunk = uniqueShopIds.slice(i, i + 8);
      const chunkShopSet = new Set(chunk);
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'publicProducts'),
            where('shopStatus', '==', 'approved'),
            where('shopId', 'in', chunk)
          ),
          (snapshot) => {
            const remoteProducts = snapshot.docs.map((d) =>
              fromPublicProductCard({ id: d.id, ...d.data() } as PublicProductCard)
            );
            const presentIds = new Set(remoteProducts.map((p) => p.id));
            setProducts((prev) => {
              const evictedForChunk = new Set(
                prev
                  .filter(
                    (p) =>
                      Boolean(p.shopId) &&
                      chunkShopSet.has(p.shopId as string) &&
                      syncedRemoteProductIdsRef.current.has(p.id) &&
                      !presentIds.has(p.id)
                  )
                  .map((p) => p.id)
              );
              evictedForChunk.forEach((id) => syncedRemoteProductIdsRef.current.delete(id));
              presentIds.forEach((id) => syncedRemoteProductIdsRef.current.add(id));
              const retained = prev.filter((p) => !evictedForChunk.has(p.id));
              return mergeById(retained, remoteProducts);
            });
            setIsPublicCatalogLoading(false);
          },
          (err) => {
            console.warn('Firestore publicProducts listener:', err.message);
            setIsPublicCatalogLoading(false);
          }
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [approvedPublicShopIds]);

  // Helper to merge customer + assigned kabari scrap requests & subcollection offers
  const rebuildCombinedScrapRequests = () => {
    const map = new Map<string, ScrapRequest>();
    customerScrapRequestsRef.current.forEach((r) => map.set(r.id, r));
    if (isAuthorizedKabariPartner) {
      kabariScrapRequestsRef.current.forEach((r) => map.set(r.id, r));
    }
    const merged = Array.from(map.values()).map((r) => {
      const subOffers = scrapOffersByReqRef.current.get(r.id);
      if (subOffers && subOffers.length > 0) {
        return { ...r, offers: subOffers };
      }
      return r;
    });
    setScrapRequests(merged);
  };

  // Authenticated user-scoped listeners (strictly filtered by request.auth.uid to satisfy firestore.rules)
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) {
      setApprovedRiders([]);
      syncedRemoteRiderIdsRef.current = false;
      customerScrapRequestsRef.current = [];
      kabariScrapRequestsRef.current = [];
      scrapOffersByReqRef.current.clear();
      kabariOwnOfferByReqRef.current.clear();
      setScrapRequests([]);
      setPublicScrapListings([]);
      return;
    }

    const unsubs: (() => void)[] = [
      onSnapshot(
        query(collection(db, 'publicRiders'), where('status', '==', 'approved')),
        (snap) => {
          const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicRiderCard));
          syncedRemoteRiderIdsRef.current = true;
          setApprovedRiders(cards);
        },
        (err) => console.warn('Firestore publicRiders listener:', err.message)
      ),
      // Strictly isolated customer orders listener (replaces directly from UID's Firestore snapshot, even when empty)
      onSnapshot(
        query(collection(db, 'orders'), where('customerId', '==', uid)),
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          setCustomerOrders(docs);
        },
        (err) => {
          console.warn('Customer orders listener:', err.message);
          setCustomerOrders([]);
        }
      )
    ];

    if (isAdminAuthenticated) {
      unsubs.push(
        onSnapshot(collection(db, 'customers'), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, userId: d.id, ...d.data() } as UserProfile));
          setAdminCustomers(list);
        }, (err) => console.warn('Admin customers listener:', err.message)),
        onSnapshot(collection(db, 'partnerAccounts'), (snap) => {
          const list = snap.docs
            .map((d) => ({ uid: d.id, ...d.data() } as PartnerAccount))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setAdminPartnerAccounts(list);
        }, (err) => console.warn('Admin partnerAccounts listener:', err.message)),
        onSnapshot(collection(db, 'adminActivity'), (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as AdminActivity))
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAdminActivities(list);
        }, (err) => console.warn('Admin activity listener:', err.message)),
        onSnapshot(collection(db, 'orders'), (snap) => {
          setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        }, (err) => console.warn('Admin orders listener:', err.message)),
        onSnapshot(collection(db, 'complaints'), (snap) => {
          setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint)));
        }, (err) => console.warn('Admin complaints listener:', err.message)),
        onSnapshot(collection(db, 'emergencyDoctorRequests'), (snap) => {
          setEmergencyDoctorRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyDoctorRequest)));
        }, (err) => console.warn('Admin emergency requests listener:', err.message)),
        onSnapshot(collection(db, 'shops'), (snap) => {
          setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)));
        }, (err) => console.warn('Admin shops listener:', err.message)),
        onSnapshot(collection(db, 'products'), (snap) => {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
        }, (err) => console.warn('Admin products listener:', err.message)),
        onSnapshot(collection(db, 'drivers'), (snap) => {
          setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver)));
        }, (err) => console.warn('Admin drivers listener:', err.message)),
        onSnapshot(collection(db, 'deliveryPersons'), (snap) => {
          setDeliveryPersons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPerson)));
        }, (err) => console.warn('Admin deliveryPersons listener:', err.message)),
        onSnapshot(collection(db, 'doctors'), (snap) => {
          setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor)));
        }, (err) => console.warn('Admin doctors listener:', err.message)),
        onSnapshot(collection(db, 'serviceProviders'), (snap) => {
          setServiceProviders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceProvider)));
        }, (err) => console.warn('Admin serviceProviders listener:', err.message)),
        onSnapshot(collection(db, 'serviceRequests'), (snap) => {
          setServiceRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest)));
        }, (err) => console.warn('Admin serviceRequests listener:', err.message)),
        onSnapshot(collection(db, 'jobs'), (snap) => {
          setJobListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing)));
        }, (err) => console.warn('Admin jobs listener:', err.message)),
        onSnapshot(collection(db, 'jobApplications'), (snap) => {
          setJobApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication)));
        }, (err) => console.warn('Admin jobApplications listener:', err.message)),
        onSnapshot(collection(db, 'scrapRequests'), (snap) => {
          setScrapRequests(
            snap.docs.map((d) => {
              const req = { id: d.id, ...d.data() } as ScrapRequest;
              const subOffers = scrapOffersByReqRef.current.get(req.id);
              return subOffers && subOffers.length > 0 ? { ...req, offers: subOffers } : req;
            })
          );
        }, (err) => console.warn('Admin scrapRequests listener:', err.message)),
        onSnapshot(collection(db, 'publicScrapListings'), (snap) => {
          setPublicScrapListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicScrapListing)));
        }, (err) => console.warn('Admin publicScrapListings listener:', err.message)),
        onSnapshot(collection(db, 'rideBookings'), (snap) => {
          setRideBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RideBooking)));
        }, (err) => console.warn('Admin rideBookings listener:', err.message)),
        onSnapshot(collection(db, 'deliveries'), (snap) => {
          setDeliveries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest)));
        }, (err) => console.warn('Admin deliveries listener:', err.message)),
        onSnapshot(collection(db, 'routingAlerts'), (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as RoutingAlert))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setRoutingAlerts(list);
        }, (err) => console.warn('Admin routingAlerts listener:', err.message))
      );
    }

    const isPartnerActive = activePartnerAccount?.status === 'active';
    const isActiveRole = (role: PartnerRoleType) =>
      isPartnerActive && activePartnerAccount?.role === role;

    if (!isAdminAuthenticated) {
      const combineServiceRequests = () => {
        const map = new Map<string, ServiceRequest>();
        customerServiceRequestsRef.current.forEach((r) => map.set(r.id, r));
        if (isActiveRole('service_provider')) {
          providerServiceRequestsRef.current.forEach((r) => map.set(r.id, r));
        }
        setServiceRequests(Array.from(map.values()));
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'complaints'), where('userId', '==', uid)),
          (snap) => {
            setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint)));
          },
          (err) => console.warn('Customer complaints listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'emergencyDoctorRequests'), where('patientUserId', '==', uid)),
          (snap) => {
            setEmergencyDoctorRequests(
              snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyDoctorRequest))
            );
          },
          (err) => console.warn('Customer emergency requests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'rideBookings'), where('customerId', '==', uid)),
          (snap) => {
            setRideBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RideBooking)));
          },
          (err) => console.warn('Customer rides listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'deliveries'), where('customerId', '==', uid)),
          (snap) => {
            setDeliveries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest)));
          },
          (err) => console.warn('Customer deliveries listener:', err.message)
        ),
        // Customer reads ONLY their own private scrapRequests (never unfiltered)
        onSnapshot(
          query(collection(db, 'scrapRequests'), where('customerId', '==', uid)),
          (snap) => {
            customerScrapRequestsRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScrapRequest));
            rebuildCombinedScrapRequests();
          },
          (err) => console.warn('Customer scrapRequests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'serviceRequests'), where('customerId', '==', uid)),
          (snap) => {
            customerServiceRequestsRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
            combineServiceRequests();
          },
          (err) => console.warn('Customer serviceRequests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'jobApplications'), where('applicantId', '==', uid)),
          (snap) => {
            const remoteDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
            setJobApplications((prev) =>
              reconcileScopedRemoteSlice(prev, remoteDocs, (a) => a.applicantId === uid)
            );
          },
          (err) => console.warn('Applicant jobApplications listener:', err.message)
        ),
        // Always allow partner owners to observe their own entity status (e.g. 'suspended' vs 'approved')
        onSnapshot(
          query(collection(db, 'shops'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
              setShops((prev) => mergeById(prev, owned));
              const preferred = owned.find((s) => s.id === activePartnerAccount?.linkedEntityId) || owned[0];
              setShop(preferred);
            } else {
              setShop({ ...EMPTY_SHOP });
            }
          },
          (err) => console.warn('Owner shops listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'doctors'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor));
              setDoctors((prev) => mergeById(prev, owned));
              const preferred = owned.find((d) => d.id === activePartnerAccount?.linkedEntityId) || owned[0];
              setCurrentDoctor(preferred);
            } else {
              setCurrentDoctor({ ...EMPTY_DOCTOR });
            }
          },
          (err) => console.warn('Owner doctors listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'drivers'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver));
              setDrivers((prev) => mergeById(prev, owned));
              const preferred = owned.find((d) => d.id === activePartnerAccount?.linkedEntityId) || owned[0];
              setCurrentDriver(preferred);
            } else {
              setCurrentDriver({ ...EMPTY_DRIVER });
            }
          },
          (err) => console.warn('Owner drivers listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'deliveryPersons'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPerson));
              setDeliveryPersons((prev) => mergeById(prev, owned));
              const preferred = owned.find((p) => p.id === activePartnerAccount?.linkedEntityId) || owned[0];
              setCurrentRider(preferred);
            } else {
              setCurrentRider({ ...EMPTY_RIDER });
            }
          },
          (err) => console.warn('Owner deliveryPersons listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'serviceProviders'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceProvider));
              setServiceProviders((prev) => mergeById(prev, owned));
              const preferred = owned.find((p) => p.id === activePartnerAccount?.linkedEntityId) || owned[0];
              setCurrentProvider(preferred);
            } else {
              setCurrentProvider({ ...EMPTY_PROVIDER });
            }
          },
          (err) => console.warn('Owner serviceProviders listener:', err.message)
        )
      );

      if (isAuthorizedKabariPartner) {
        unsubs.push(
          onSnapshot(
            collection(db, 'publicScrapListings'),
            (snap) => {
              setPublicScrapListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicScrapListing)));
            },
            (err) => console.warn('Kabari publicScrapListings listener:', err.message)
          ),
          onSnapshot(
            query(collection(db, 'scrapRequests'), where('selectedBuyerId', '==', uid)),
            (snap) => {
              kabariScrapRequestsRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScrapRequest));
              rebuildCombinedScrapRequests();
            },
            (err) => console.warn('Kabari assigned scrapRequests listener:', err.message)
          )
        );
      } else {
        setPublicScrapListings([]);
        kabariScrapRequestsRef.current = [];
        rebuildCombinedScrapRequests();
      }

      if (
        isActiveRole('service_provider') &&
        activePartnerAccount?.linkedEntityId &&
        currentProvider.id === activePartnerAccount.linkedEntityId &&
        currentProvider.ownerId === uid &&
        currentProvider.status === 'approved'
      ) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'serviceRequests'), where('providerId', '==', activePartnerAccount.linkedEntityId)),
            (snap) => {
              providerServiceRequestsRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
              combineServiceRequests();
            },
            (err) => console.warn('Provider serviceRequests listener:', err.message)
          )
        );
      } else {
        providerServiceRequestsRef.current = [];
        combineServiceRequests();
      }

      if (
        isActiveRole('shopkeeper') &&
        activePartnerAccount?.linkedEntityId &&
        shop.id === activePartnerAccount.linkedEntityId &&
        shop.ownerId === uid &&
        shop.status === 'approved'
      ) {
        unsubs.push(
          onSnapshot(
            query(
              collection(db, 'products'),
              where('shopId', '==', activePartnerAccount.linkedEntityId),
              where('ownerId', '==', uid)
            ),
            (snap) => {
              const ownedShopProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
              setProducts((prev) => {
                const others = prev.filter((p) => p.shopId !== activePartnerAccount.linkedEntityId);
                return [...ownedShopProducts, ...others];
              });
            },
            (err) => console.warn('Owner products listener:', err.message)
          )
        );
      }

      if (isActiveRole('employer')) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'jobs'), where('employerId', '==', uid)),
            (snap) => {
              const remoteJobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing));
              setJobListings((prev) =>
                reconcileScopedRemoteSlice(prev, remoteJobs, (j) => j.employerId === uid)
              );
            },
            (err) => console.warn('Employer jobs listener:', err.message)
          )
        );
      }
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    firebaseUser?.uid,
    isAdminAuthenticated,
    isAuthorizedKabariPartner,
    activePartnerAccount?.status,
    activePartnerAccount?.role,
    activePartnerAccount?.linkedEntityId,
    shop.id,
    shop.ownerId,
    shop.status,
    currentProvider.id,
    currentProvider.ownerId,
    currentProvider.status
  ]);

  // Listen to isolated /scrapRequests/{requestId}/offers subcollections for authorized owners/buyers/admin
  const watchedScrapRequestIdsKey = scrapRequests.map((r) => r.id).sort().join(',');
  const watchedPublicScrapIdsKey = publicScrapListings.map((l) => l.id).sort().join(',');
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) return;
    const unsubs: (() => void)[] = [];

    const reqIds = watchedScrapRequestIdsKey ? watchedScrapRequestIdsKey.split(',').filter(Boolean) : [];
    reqIds.forEach((reqId) => {
      unsubs.push(
        onSnapshot(
          collection(db, 'scrapRequests', reqId, 'offers'),
          (snap) => {
            const subOffers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScrapOffer));
            scrapOffersByReqRef.current.set(reqId, subOffers);
            setScrapRequests((prev) =>
              prev.map((r) => (r.id === reqId && subOffers.length > 0 ? { ...r, offers: subOffers } : r))
            );
          },
          (err) => console.warn('Scrap offers subcollection listener:', err.message)
        )
      );
    });

    if (isAuthorizedKabariPartner && !isAdminAuthenticated) {
      const listingIds = watchedPublicScrapIdsKey ? watchedPublicScrapIdsKey.split(',').filter(Boolean) : [];
      listingIds.forEach((listingId) => {
        const deterministicOfferId = `${listingId}_${uid}`;
        unsubs.push(
          onSnapshot(
            doc(db, 'scrapRequests', listingId, 'offers', deterministicOfferId),
            (snap) => {
              if (snap.exists()) {
                const offer = { id: snap.id, ...snap.data() } as ScrapOffer;
                kabariOwnOfferByReqRef.current.set(listingId, offer);
                setPublicScrapListings((prev) =>
                  prev.map((l) => (l.id === listingId ? { ...l, myOffer: offer } : l))
                );
              }
            },
            (err) => console.warn('Kabari own offer doc listener:', err.message)
          )
        );
      });
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser?.uid, isAdminAuthenticated, isAuthorizedKabariPartner, watchedScrapRequestIdsKey, watchedPublicScrapIdsKey]);

  // Scoped shopkeeper orders, approved rider orders/deliveries, & employer jobApplications listeners (active role accounts only)
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid || isAdminAuthenticated || activePartnerAccount?.status !== 'active') return;

    const unsubs: (() => void)[] = [];
    if (
      activePartnerAccount.role === 'shopkeeper' &&
      activePartnerAccount.linkedEntityId &&
      shop.id === activePartnerAccount.linkedEntityId &&
      shop.ownerId === uid &&
      shop.status === 'approved'
    ) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'orders'), where('shopId', '==', activePartnerAccount.linkedEntityId)),
          (snap) => {
            const remoteShopOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
            setOrders((prev) => mergeWithRemoteEviction(prev, remoteShopOrders, syncedShopOrderIdsRef));
          },
          (err) => console.warn('Shopkeeper orders listener:', err.message)
        )
      );
    }

    if (
      activePartnerAccount.role === 'delivery' &&
      activePartnerAccount.linkedEntityId &&
      currentRider.id === activePartnerAccount.linkedEntityId &&
      currentRider.ownerId === uid &&
      currentRider.status === 'approved'
    ) {
      const linkedRiderId = activePartnerAccount.linkedEntityId;
      unsubs.push(
        onSnapshot(
          query(collection(db, 'deliveries'), where('assignedDeliveryPersonId', '==', linkedRiderId)),
          (snap) => {
            const remoteDeliveries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest));
            setDeliveries((prev) => mergeWithRemoteEviction(prev, remoteDeliveries, syncedRiderDeliveryIdsRef));
          },
          (err) => console.warn('Rider deliveries listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'orders'), where('riderId', '==', linkedRiderId)),
          (snap) => {
            const remoteRiderOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
            setOrders((prev) => mergeWithRemoteEviction(prev, remoteRiderOrders, syncedRiderOrderIdsRef));
          },
          (err) => console.warn('Rider assigned orders listener:', err.message)
        )
      );
    }

    if (activePartnerAccount.role === 'employer') {
      const ownedJobIds = jobListings.filter((j) => j.employerId === uid).map((j) => j.id);
      for (let i = 0; i < ownedJobIds.length; i += 8) {
        const chunk = ownedJobIds.slice(i, i + 8);
        const chunkJobSet = new Set(chunk);
        unsubs.push(
          onSnapshot(
            query(collection(db, 'jobApplications'), where('jobId', 'in', chunk)),
            (snap) => {
              const remoteChunkApps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
              setJobApplications((prev) =>
                reconcileScopedRemoteSlice(prev, remoteChunkApps, (a) => chunkJobSet.has(a.jobId))
              );
            },
            (err) => console.warn('Employer jobApplications listener:', err.message)
          )
        );
      }
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    firebaseUser?.uid,
    isAdminAuthenticated,
    activePartnerAccount?.status,
    activePartnerAccount?.role,
    activePartnerAccount?.linkedEntityId,
    shop.id,
    shop.ownerId,
    shop.status,
    currentRider.id,
    currentRider.ownerId,
    currentRider.status,
    jobListings
  ]);

  // --- LOCALITY HANDLERS ---
  const handleAddLocality = (newLoc: LocalityInfo) => {
    if (!isAdminAuthenticated) return;
    setLocalities((prev) => {
      if (prev.some((l) => l.name.toLowerCase() === newLoc.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newLoc];
    });
    safeSetDoc(doc(db, 'localities', newLoc.id), newLoc, { merge: true }).catch((err) => console.warn(err));
    logAdminAction('Locality Added', `Added ${newLoc.name} (PIN: ${newLoc.pincode}) under ${newLoc.parentArea}`);
  };

  const handleUpdateLocality = (localityId: string, updated: Partial<LocalityInfo>) => {
    if (!isAdminAuthenticated) return;
    setLocalities((prev) =>
      prev.map((l) => (l.id === localityId ? { ...l, ...updated, updatedAt: new Date().toISOString() } : l))
    );
    safeUpdateDoc(doc(db, 'localities', localityId), {
      ...updated,
      updatedAt: new Date().toISOString()
    }).catch((err) => console.warn(err));
    logAdminAction('Locality Updated', `Updated locality ${localityId}`);
  };

  const handleDeleteLocality = (localityId: string) => {
    if (!isAdminAuthenticated) return;
    setLocalities((prev) => prev.filter((l) => l.id !== localityId));
    deleteDoc(doc(db, 'localities', localityId)).catch((err) => console.warn(err));
    logAdminAction('Locality Deleted', `Deleted locality ${localityId}`);
  };

  // --- CART & ORDER HANDLERS ---
  const handleAddToCart = (product: Product, prescriptionUrl?: string, selectedWeightGrams?: number) => {
    const parentShop = product.shopId ? shops.find((s) => s.id === product.shopId) : undefined;
    if (
      !product.shopId ||
      !parentShop ||
      parentShop.status !== 'approved' ||
      (product.shopStatus && product.shopStatus !== 'approved')
    ) {
      console.warn('Blocked adding item from suspended or unapproved shop.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => 
        item.product.id === product.id && 
        item.selectedWeightGrams === selectedWeightGrams
      );
      if (existing) {
        return prev.map((item) =>
          item === existing
            ? { ...item, quantity: item.quantity + 1, prescriptionUrl: prescriptionUrl || item.prescriptionUrl }
            : item
        );
      }
      return [...prev, { product, quantity: 1, prescriptionUrl, selectedWeightGrams }];
    });
  };

  // --- KABARI / SCRAP MARKETPLACE HANDLERS ---
  const handleAddScrapRequest = async (req: ScrapRequest): Promise<{ ok: boolean; error?: string }> => {
    const authUid = await resolveAuthUid();
    if (!authUid) {
      return { ok: false, error: 'Please sign in to post a scrap pickup request.' };
    }
    const {
      offers: _ignoredOffers,
      selectedOfferId: _ignoredSelOffer,
      selectedBuyerId: _ignoredSelBuyer,
      selectedBuyerName: _ignoredBuyerName,
      selectedBuyerPhone: _ignoredBuyerPhone,
      finalPaidAmount: _ignoredFinalAmount,
      ...restReq
    } = req;

    const enrichedReq: ScrapRequest = {
      ...restReq,
      status: 'open',
      customerId: authUid
    };
    const publicListing = toPublicScrapListing(enrichedReq);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'scrapRequests', enrichedReq.id), cleanForFirestore(enrichedReq));
      batch.set(doc(db, 'publicScrapListings', publicListing.id), cleanForFirestore(publicListing));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to submit scrap pickup request.' };
    }

    customerScrapRequestsRef.current = [
      enrichedReq,
      ...customerScrapRequestsRef.current.filter((r) => r.id !== enrichedReq.id)
    ];
    rebuildCombinedScrapRequests();
    setPublicScrapListings((prev) => [publicListing, ...prev.filter((l) => l.id !== publicListing.id)]);
    return { ok: true };
  };

  const handleSendScrapOffer = async (offer: ScrapOffer): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated && !isAuthorizedKabariPartner) {
      return {
        ok: false,
        error: 'Scrap offer submission requires verified Super Admin or active Kabari Buyer credentials.'
      };
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return { ok: false, error: 'Authentication session is required to submit a scrap offer.' };
    }
    const targetId = offer.requestId || offer.scrapRequestId;
    if (!targetId) {
      return { ok: false, error: 'Missing target scrap listing ID.' };
    }

    const updatedAt = new Date().toISOString();
    const deterministicOfferId = isAuthorizedKabariPartner && !isAdminAuthenticated
      ? `${targetId}_${uid}`
      : (offer.id || `${targetId}_${uid}`);

    const enrichedOffer: ScrapOffer = {
      ...offer,
      id: deterministicOfferId,
      requestId: targetId,
      buyerId: uid,
      buyerName: activePartnerAccount?.displayName || offer.buyerName,
      status: 'pending',
      createdAt: offer.createdAt || updatedAt,
      updatedAt
    };

    try {
      await safeSetDoc(
        doc(db, 'scrapRequests', targetId, 'offers', deterministicOfferId),
        cleanForFirestore(enrichedOffer)
      );
      if (isAdminAuthenticated) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'scrapRequests', targetId), cleanForFirestore({ status: 'offers_received', updatedAt }));
        batch.update(doc(db, 'publicScrapListings', targetId), cleanForFirestore({ status: 'offers_received', updatedAt }));
        await batch.commit();
      }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to submit scrap offer.' };
    }

    const prevSub = scrapOffersByReqRef.current.get(targetId) || [];
    scrapOffersByReqRef.current.set(targetId, [
      ...prevSub.filter((o) => o.id !== deterministicOfferId),
      enrichedOffer
    ]);
    kabariOwnOfferByReqRef.current.set(targetId, enrichedOffer);
    setPublicScrapListings((prev) =>
      prev.map((l) =>
        l.id === targetId
          ? {
              ...l,
              ...(isAdminAuthenticated ? { status: 'offers_received' as const } : {}),
              myOffer: enrichedOffer,
              updatedAt
            }
          : l
      )
    );
    setScrapRequests((prev) =>
      prev.map((req) =>
        req.id === targetId
          ? {
              ...req,
              offers: scrapOffersByReqRef.current.get(targetId) || [enrichedOffer],
              ...(isAdminAuthenticated ? { status: 'offers_received' as const } : {}),
              updatedAt
            }
          : req
      )
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Customer offer acceptance & atomic buyer assignment require Cloud Functions.
  const handleAcceptScrapOffer = async (
    requestId: string,
    offerId: string,
    buyerName: string,
    buyerPhone: string,
    amount: number,
    buyerId?: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Accepting a Kabari quote and assigning buyer contact details require Cloud Functions on Blaze plan.'
      };
    }

    const req = scrapRequests.find((r) => r.id === requestId);
    const matchedOffer =
      (req?.offers || []).find((o) => o.id === offerId) ||
      (scrapOffersByReqRef.current.get(requestId) || []).find((o) => o.id === offerId);
    const resolvedBuyerId = buyerId || matchedOffer?.buyerId || '';
    const updatedAt = new Date().toISOString();

    try {
      const batch = writeBatch(db);
      batch.update(
        doc(db, 'scrapRequests', requestId),
        cleanForFirestore({
          status: 'accepted',
          selectedOfferId: offerId,
          ...(resolvedBuyerId ? { selectedBuyerId: resolvedBuyerId } : {}),
          selectedBuyerName: buyerName,
          selectedBuyerPhone: buyerPhone,
          finalPaidAmount: amount,
          updatedAt
        })
      );
      batch.update(
        doc(db, 'publicScrapListings', requestId),
        cleanForFirestore({ status: 'accepted', updatedAt })
      );
      batch.update(
        doc(db, 'scrapRequests', requestId, 'offers', offerId),
        cleanForFirestore({ status: 'accepted', updatedAt })
      );
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to accept scrap offer.' };
    }

    setPublicScrapListings((prev) =>
      prev.map((l) => (l.id === requestId ? { ...l, status: 'accepted', updatedAt } : l))
    );
    setScrapRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'accepted' as const,
              selectedOfferId: offerId,
              ...(resolvedBuyerId ? { selectedBuyerId: resolvedBuyerId } : {}),
              selectedBuyerName: buyerName,
              selectedBuyerPhone: buyerPhone,
              finalPaidAmount: amount,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  const handleUpdateScrapStatus = async (
    requestId: string,
    status: ScrapRequest['status']
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated && !isAuthorizedKabariPartner && status !== 'cancelled') {
      return { ok: false, error: 'You are not authorized to update this scrap pickup status.' };
    }
    if (!auth.currentUser) {
      return { ok: false, error: 'Authentication session required.' };
    }
    const updatedAt = new Date().toISOString();
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'scrapRequests', requestId), cleanForFirestore({ status, updatedAt }));
      batch.update(doc(db, 'publicScrapListings', requestId), cleanForFirestore({ status, updatedAt }));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update scrap pickup status.' };
    }

    setPublicScrapListings((prev) =>
      prev.map((l) => (l.id === requestId ? { ...l, status, updatedAt } : l))
    );
    setScrapRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status, updatedAt } : req))
    );
    return { ok: true };
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // BACKEND REQUIRED: Authoritative server-side catalog item-price lookup and atomic stock deduction require Cloud Functions.
  // On Spark (₹0), mixed-shop carts are split into separate per-shop Order docs committed atomically in a single writeBatch.
  const handlePlaceOrder = async (
    orderOrListOrAddress: Order | Order[] | string,
    paymentMethod?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const authUid = await resolveAuthUid();
    if (!authUid) {
      setCustomerAuthInitialStep('login');
      setIsCustomerAuthModalOpen(true);
      return { ok: false, error: 'Please sign in to place your order.' };
    }

    const evaluateEligibleRiders = (pickupLoc: string) => {
      if (deliveryPersons.length > 0) {
        return getEligibleDeliveryRidersForOrder({
          pickupLocality: pickupLoc,
          config: routingConfig,
          deliveryPersons,
          partnerAccounts: combinedPartnerAccounts,
          localities
        }).eligible;
      }
      return evaluatePublicRiderCardsForOrder({
        pickupLocality: pickupLoc,
        config: routingConfig,
        approvedRiders,
        partnerAccounts: combinedPartnerAccounts,
        localities
      }).eligible;
    };

    let candidateOrders: Order[] = [];
    if (typeof orderOrListOrAddress === 'string') {
      const deliveryAddress = orderOrListOrAddress;
      const method = paymentMethod || 'Cash on Delivery';
      if (cart.length === 0) {
        return { ok: false, error: 'Your cart is empty.' };
      }
      const plan = planSplitCartOrders({
        cart,
        shops,
        customerId: authUid,
        customerName: user.name || 'Customer',
        customerPhone: user.phone || '',
        deliveryAddress: deliveryAddress || user.address,
        deliveryLocality: currentLocation,
        paymentMethod: method,
        localities
      });
      if (plan.error || plan.orders.length === 0) {
        return { ok: false, error: plan.error || 'Unable to prepare checkout orders.' };
      }
      candidateOrders = plan.orders;
    } else {
      candidateOrders = Array.isArray(orderOrListOrAddress)
        ? orderOrListOrAddress
        : [orderOrListOrAddress];
      if (candidateOrders.length === 0) {
        return { ok: false, error: 'No valid orders to submit.' };
      }
    }

    const validatedOrders: Order[] = [];
    const alertsToCreate: RoutingAlert[] = [];
    const batch = writeBatch(db);

    for (const candidate of candidateOrders) {
      const itemShopCheck = validateOrderItemsMatchShop(candidate);
      if (!itemShopCheck.ok) {
        return { ok: false, error: itemShopCheck.error };
      }

      const matchedShop = candidate.shopId
        ? shops.find((s) => s.id === candidate.shopId)
        : undefined;
      if (!candidate.shopId || !matchedShop || matchedShop.status !== 'approved') {
        return {
          ok: false,
          error: 'One or more shops in your cart are currently suspended or unavailable for new orders.'
        };
      }

      const hasInvalidItem = candidate.items.some((item) => {
        if (!item.product.shopId) return true;
        const itemShop = shops.find((s) => s.id === item.product.shopId);
        return (
          !itemShop ||
          itemShop.status !== 'approved' ||
          (item.product.shopStatus && item.product.shopStatus !== 'approved')
        );
      });
      if (hasInvalidItem) {
        return {
          ok: false,
          error: 'One or more items in your cart belong to a suspended or unapproved shop.'
        };
      }

      const resolvedOwnerId = candidate.shopOwnerId || matchedShop.ownerId || '';
      const pickupLoc =
        candidate.pickupLocality ||
        candidate.shopLocality ||
        matchedShop.locality ||
        candidate.locality ||
        currentLocation;
      const pricing = computeShopOrderPricing(candidate.items);
      const eligibleRiders = evaluateEligibleRiders(pickupLoc);

      const finalOrder: Order = {
        ...candidate,
        ...(resolvedOwnerId ? { shopOwnerId: resolvedOwnerId } : {}),
        pickupLocality: pickupLoc,
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        discount: pricing.discount,
        total: pricing.total,
        routingStatus:
          eligibleRiders.length === 0
            ? 'unavailable_in_locality'
            : (candidate.routingStatus || 'pending_admin_routing'),
        riderName:
          eligibleRiders.length === 0
            ? 'No Local Rider Online — Admin Alerted'
            : (candidate.riderName || 'Pending Local Rider Assignment'),
        customerId: authUid
      };

      batch.set(doc(db, 'orders', finalOrder.id), cleanForFirestore(finalOrder));
      validatedOrders.push(finalOrder);

      if (eligibleRiders.length === 0) {
        const alert = buildUnavailableLocalityAlert({
          requestId: finalOrder.id,
          serviceCategory: 'shop_order',
          requestLocality: pickupLoc
        });
        alertsToCreate.push(alert);
        batch.set(doc(db, 'routingAlerts', alert.id), cleanForFirestore(alert));
      }
    }

    try {
      await batch.commit();
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Unable to submit order to Firestore. Please try again.'
      };
    }

    if (alertsToCreate.length > 0) {
      setRoutingAlerts((prev) => [...alertsToCreate, ...prev]);
    }
    const orderedIds = new Set(validatedOrders.map((o) => o.id));
    setCustomerOrders((prev) => [...validatedOrders, ...prev.filter((o) => !orderedIds.has(o.id))]);
    setOrders((prev) => [...validatedOrders, ...prev.filter((o) => !orderedIds.has(o.id))]);

    const orderedQtyByProductId = new Map<string, number>();
    validatedOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        orderedQtyByProductId.set(
          item.product.id,
          (orderedQtyByProductId.get(item.product.id) || 0) + item.quantity
        );
      });
    });

    setProducts((prev) =>
      prev.map((prod) => {
        const orderedQty = orderedQtyByProductId.get(prod.id);
        if (orderedQty && prod.stock !== undefined) {
          const newStock = Math.max(0, prod.stock - orderedQty);
          return {
            ...prod,
            stock: newStock,
            inStock: newStock > 0
          };
        }
        return prod;
      })
    );

    setCart([]);
    setIsCartOpen(false);
    setTrackedOrder(validatedOrders[0]);
    return { ok: true };
  };

  const handleUpdateOrderStatus = (
    orderId: string, 
    status: OrderStatus, 
    extraOrReason?: string | { rejectionReason?: string; riderId?: string; riderName?: string; riderPhone?: string }
  ) => {
    const isPartnerAuthorized =
      activePartnerAccount?.status === 'active' &&
      (activePartnerAccount.role === 'shopkeeper' || activePartnerAccount.role === 'delivery');
    if (!isAdminAuthenticated && !isPartnerAuthorized) {
      console.warn('Blocked order status mutation by inactive or suspended account.');
      return;
    }

    const reason = typeof extraOrReason === 'string' ? extraOrReason : extraOrReason?.rejectionReason;
    const riderId = typeof extraOrReason === 'object' ? extraOrReason.riderId : undefined;
    const riderName = typeof extraOrReason === 'object' ? extraOrReason.riderName : undefined;
    const riderPhone = typeof extraOrReason === 'object' ? extraOrReason.riderPhone : undefined;
    const updatedAt = new Date().toISOString();

    if (!isAdminAuthenticated && status === 'out_for_delivery' && !riderId) {
      console.warn('Shopkeeper dispatch requires selecting an approved fleet rider ID.');
      return;
    }
    if (riderId) {
      const riderEntity = deliveryPersons.find((p) => p.id === riderId);
      const riderCard = approvedRiders.find((r) => r.id === riderId);
      if ((riderEntity && riderEntity.status !== 'approved') || (!riderEntity && !riderCard)) {
        console.warn('Blocked dispatching order to suspended or unapproved rider.');
        return;
      }
    }

    const applyOrderPatch = (list: Order[]) =>
      list.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              ...(reason !== undefined ? { rejectionReason: reason } : {}),
              riderId: riderId || o.riderId,
              riderName: riderName || o.riderName,
              ...(isAdminAuthenticated && riderPhone ? { riderPhone } : {}),
              updatedAt
            }
          : o
      );

    setOrders(applyOrderPatch);
    setCustomerOrders(applyOrderPatch);
    setTrackedOrder((prev) => (prev && prev.id === orderId ? applyOrderPatch([prev])[0] : prev));
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'orders', orderId), {
        status,
        ...(reason !== undefined ? { rejectionReason: reason } : {}),
        ...(riderId !== undefined ? { riderId } : {}),
        ...(riderName !== undefined ? { riderName } : {}),
        ...(isAdminAuthenticated && riderPhone !== undefined ? { riderPhone } : {}),
        updatedAt
      }).catch((err) => console.warn(err));
    }
  };

  const handleCustomerCancelOrder = async (
    orderId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const authUid = firebaseUser?.uid || auth.currentUser?.uid || null;
    if (!authUid) {
      return { ok: false, error: 'Please sign in to cancel your order.' };
    }

    const target = customerOrders.find((o) => o.id === orderId && o.customerId === authUid);
    if (!target) {
      return { ok: false, error: 'Order not found for your signed-in account.' };
    }
    if (!isCustomerOrderCancellable(target.status)) {
      return {
        ok: false,
        error: getCustomerCancelBlockedReason(target.status)
      };
    }

    const updatedAt = new Date().toISOString();
    try {
      await safeUpdateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt
      });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'not-found') {
        // Order exists in memory only; proceed with local cancellation update
      } else if (code === 'permission-denied') {
        return {
          ok: false,
          error: 'Cancellation is not permitted once the order is out for delivery or finalized.'
        };
      } else {
        return {
          ok: false,
          error: err?.message || 'Unable to cancel order right now. Please try again.'
        };
      }
    }

    const applyCancel = (list: Order[]) =>
      list.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus, updatedAt } : o));

    setCustomerOrders(applyCancel);
    setOrders(applyCancel);
    setTrackedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: 'cancelled', updatedAt } : prev));
    return { ok: true };
  };

  const handleCustomerRequestReturn = async (
    orderId: string,
    payload: { reason: ReturnReason; description?: string; photoEvidenceUrl?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    const authUid = firebaseUser?.uid || auth.currentUser?.uid || null;
    if (!authUid) {
      return { ok: false, error: 'Please sign in to submit a return request.' };
    }

    if (
      payload.reason !== 'Damaged or defective items' &&
      payload.reason !== 'Wrong items delivered'
    ) {
      return {
        ok: false,
        error: 'Return requests are allowed only for damaged/defective items or wrong items delivered.'
      };
    }

    const target = customerOrders.find((o) => o.id === orderId && o.customerId === authUid);
    if (!target) {
      return { ok: false, error: 'Order not found for your signed-in account.' };
    }
    if (target.status !== 'delivered') {
      return { ok: false, error: 'Return requests can only be submitted for delivered orders.' };
    }

    const returnId = `ret-${orderId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const alreadyRequested =
      Boolean(target.returnRequest) ||
      complaints.some((c) => c.id === returnId || (c.orderId === orderId && c.type === 'return_request'));
    if (alreadyRequested) {
      return { ok: false, error: 'A return request has already been submitted for this order.' };
    }

    const now = new Date().toISOString();
    const trimmedDesc = (payload.description || '').trim();
    const returnReq: OrderReturnRequest = {
      id: returnId,
      orderId,
      customerId: authUid,
      customerName: target.customerName || user.name || 'Customer',
      customerPhone: target.customerPhone || user.phone || '',
      shopId: target.shopId,
      shopName: target.shopName,
      reason: payload.reason,
      ...(trimmedDesc ? { description: trimmedDesc.slice(0, 1000) } : {}),
      ...(payload.photoEvidenceUrl ? { photoEvidenceUrl: payload.photoEvidenceUrl } : {}),
      status: 'pending_review',
      requestedAt: now
    };

    const complaintDoc: Complaint = {
      id: returnId,
      userId: authUid,
      userName: returnReq.customerName,
      userPhone: returnReq.customerPhone,
      customerName: returnReq.customerName,
      customerPhone: returnReq.customerPhone,
      targetId: target.shopId || orderId,
      targetName: target.shopName || `Order #${orderId}`,
      type: 'return_request',
      subject: `Return Request #${orderId}: ${payload.reason}`.slice(0, 195),
      description: (trimmedDesc
        ? `[Return Request: ${payload.reason}] ${trimmedDesc}`
        : `[Return Request: ${payload.reason}] Customer requested manual review.`
      ).slice(0, 1950),
      status: 'open',
      createdAt: now,
      orderId,
      ...(target.shopId ? { shopId: target.shopId } : {}),
      ...(target.shopName ? { shopName: target.shopName } : {}),
      ...(target.shopOwnerId ? { shopOwnerId: target.shopOwnerId } : {}),
      returnReason: payload.reason,
      returnStatus: 'pending_review',
      ...(trimmedDesc ? { customerDescription: trimmedDesc.slice(0, 1000) } : {}),
      ...(payload.photoEvidenceUrl ? { photoEvidenceUrl: payload.photoEvidenceUrl } : {})
    };

    try {
      // Create-only (no merge) enforces one return request per order under firestore.rules
      await safeSetDoc(doc(db, 'complaints', returnId), complaintDoc);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        return {
          ok: false,
          error: 'A return request already exists for this order or permission was denied.'
        };
      }
      return {
        ok: false,
        error: err?.message || 'Could not submit return request. Please try again.'
      };
    }

    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'orders', orderId), {
        returnRequest: returnReq,
        updatedAt: now
      }).catch((err) => console.warn(err));
    }

    setComplaints((prev) => [complaintDoc, ...prev.filter((c) => c.id !== returnId)]);
    const attachReturn = (list: Order[]) =>
      list.map((o) => (o.id === orderId ? { ...o, returnRequest: returnReq } : o));
    setCustomerOrders(attachReturn);
    setOrders(attachReturn);
    setTrackedOrder((prev) => (prev && prev.id === orderId ? { ...prev, returnRequest: returnReq } : prev));
    return { ok: true };
  };

  const handleReviewReturnRequest = async (
    orderId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const returnId = `ret-${orderId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const existingOrder =
      orders.find((o) => o.id === orderId) || customerOrders.find((o) => o.id === orderId);
    const matchingComplaint = complaints.find(
      (c) => c.id === returnId || (c.orderId === orderId && c.type === 'return_request')
    );

    const existingReq: OrderReturnRequest | undefined =
      existingOrder?.returnRequest ||
      (matchingComplaint && matchingComplaint.returnReason
        ? {
            id: matchingComplaint.id,
            orderId,
            customerId: matchingComplaint.userId || existingOrder?.customerId || '',
            customerName: matchingComplaint.customerName || existingOrder?.customerName,
            customerPhone: matchingComplaint.customerPhone || existingOrder?.customerPhone,
            shopId: matchingComplaint.shopId || existingOrder?.shopId,
            shopName: matchingComplaint.shopName || existingOrder?.shopName,
            reason: matchingComplaint.returnReason,
            description: matchingComplaint.customerDescription,
            photoEvidenceUrl: matchingComplaint.photoEvidenceUrl,
            status: matchingComplaint.returnStatus || 'pending_review',
            requestedAt: matchingComplaint.createdAt
          }
        : undefined);

    if (!existingReq) {
      return { ok: false, error: 'Return request not found for this order.' };
    }
    if (existingReq.status !== 'pending_review') {
      return { ok: false, error: `Return request is already ${existingReq.status}.` };
    }

    const now = new Date().toISOString();
    const reviewer: 'admin' | 'shopkeeper' = isAdminAuthenticated ? 'admin' : 'shopkeeper';
    const reviewNotes =
      notes?.trim() ||
      (decision === 'approved'
        ? `Return approved by ${reviewer} for manual pickup & refund settlement.`
        : `Return declined by ${reviewer} after review.`);

    const updatedReturn: OrderReturnRequest = {
      ...existingReq,
      status: decision,
      reviewNotes,
      reviewedBy: reviewer,
      reviewedAt: now
    };

    try {
      await safeUpdateDoc(doc(db, 'orders', orderId), {
        returnRequest: updatedReturn,
        updatedAt: now
      });
    } catch (err: any) {
      if (err?.code === 'not-found') {
        // Order exists locally only
      } else if (err?.code === 'permission-denied') {
        return {
          ok: false,
          error:
            'Existing Firestore rules restrict non-admin writes on delivered orders. Super Admin can finalize this return request in the Admin Dashboard.'
        };
      } else {
        return { ok: false, error: err?.message || 'Unable to save return review decision.' };
      }
    }

    if (isAdminAuthenticated) {
      if (matchingComplaint) {
        safeUpdateDoc(doc(db, 'complaints', matchingComplaint.id), {
          status: 'resolved',
          returnStatus: decision,
          resolutionNotes: reviewNotes,
          reviewedBy: reviewer,
          reviewedAt: now
        }).catch((err) => console.warn(err));
      }
      logAdminAction(
        `Return ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        `Order #${orderId}: ${reviewNotes}`
      );
    }

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === returnId || (c.orderId === orderId && c.type === 'return_request')
          ? {
              ...c,
              status: 'resolved',
              returnStatus: decision,
              resolutionNotes: reviewNotes,
              reviewedBy: reviewer,
              reviewedAt: now
            }
          : c
      )
    );
    const applyReturnPatch = (list: Order[]) =>
      list.map((o) => (o.id === orderId ? { ...o, returnRequest: updatedReturn, updatedAt: now } : o));
    setOrders(applyReturnPatch);
    setCustomerOrders(applyReturnPatch);
    setTrackedOrder((prev) => (prev && prev.id === orderId ? { ...prev, returnRequest: updatedReturn, updatedAt: now } : prev));
    return { ok: true };
  };

  // --- SHOPKEEPER INVENTORY & UNIFIED ATOMIC LIFECYCLE HANDLERS ---
  const findPartnerAccountForEntity = (
    role: PartnerRoleType,
    entityId: string,
    ownerId?: string
  ): PartnerAccount | undefined =>
    adminPartnerAccounts.find(
      (a) =>
        a.role === role &&
        ((a.linkedEntityId && a.linkedEntityId === entityId) || (ownerId && a.uid === ownerId))
    );

  const syncShopProductsInChunks = async (
    shopId: string,
    nextShopStatus: ShopApprovalStatus,
    shopName: string | undefined,
    updatedAt: string
  ): Promise<ChunkedProductSyncResult> => {
    const prodSnap = await getDocs(query(collection(db, 'products'), where('shopId', '==', shopId)));
    if (prodSnap.empty) {
      return { totalProducts: 0, totalChunks: 0, completedChunks: 0 };
    }
    const docs = prodSnap.docs;
    const totalChunks = Math.ceil(docs.length / 200);
    let completedChunks = 0;
    for (let i = 0; i < docs.length; i += 200) {
      const chunkIndex = Math.floor(i / 200);
      const chunk = docs.slice(i, i + 200);
      try {
        const pBatch = writeBatch(db);
        chunk.forEach((d) => {
          const pData = {
            id: d.id,
            ...d.data(),
            ...(shopName ? { shopName } : {}),
            shopStatus: nextShopStatus,
            updatedAt
          } as Product;
          pBatch.update(
            d.ref,
            cleanForFirestore({
              ...(shopName ? { shopName } : {}),
              shopStatus: nextShopStatus,
              updatedAt
            })
          );
          pBatch.set(
            doc(db, 'publicProducts', d.id),
            cleanForFirestore(toPublicProductCard(pData)),
            { merge: true }
          );
        });
        await pBatch.commit();
        completedChunks += 1;
      } catch (chunkErr: any) {
        return {
          totalProducts: docs.length,
          totalChunks,
          completedChunks,
          failedChunkIndex: chunkIndex,
          error:
            chunkErr?.message ||
            `Product sync stopped at batch ${chunkIndex + 1} of ${totalChunks}.`
        };
      }
    }
    return { totalProducts: docs.length, totalChunks, completedChunks };
  };

  const applyLocalAccountPatch = (
    uid: string,
    patch: Partial<PartnerAccount>,
    clearSuspendedPreviousStatus: boolean
  ) => {
    setAdminPartnerAccounts((prev) =>
      prev.map((a) => {
        if (a.uid !== uid) return a;
        const merged = { ...a, ...patch };
        if (clearSuspendedPreviousStatus) {
          delete merged.suspendedEntityPreviousStatus;
        }
        return merged;
      })
    );
  };

  const handleUpdateShop = (updatedShop: Partial<Shop>) => {
    const uid = auth.currentUser?.uid;
    const canPartnerEdit =
      Boolean(uid) &&
      Boolean(shop.id) &&
      shop.ownerId === uid &&
      shop.status === 'approved' &&
      activePartnerAccount?.status === 'active' &&
      activePartnerAccount.role === 'shopkeeper' &&
      activePartnerAccount.linkedEntityId === shop.id;
    if (!isAdminAuthenticated && !canPartnerEdit) {
      console.warn('Blocked shop update by suspended or unauthorized account.');
      return;
    }
    setShop((prev) => {
      const safePatch = isAdminAuthenticated
        ? updatedShop
        : (() => {
            const { status: _s, isVerified: _v, ownerId: _o, ...rest } = updatedShop;
            return rest;
          })();
      const merged = { ...prev, ...safePatch };
      setShops((sList) => sList.map((s) => (s.id === merged.id ? merged : s)));
      return merged;
    });
  };

  const handleUpdateShopStatusUnified = async (
    shopId: string,
    status: ShopApprovalStatus
  ): Promise<{ ok: boolean; error?: string; warning?: string }> => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Only verified Super Admin can update shop status.' };
    }
    const updatedAt = new Date().toISOString();
    let targetShop = shops.find((s) => s.id === shopId);
    if (!targetShop) {
      try {
        const snap = await getDoc(doc(db, 'shops', shopId));
        if (snap.exists()) {
          targetShop = { id: snap.id, ...snap.data() } as Shop;
        }
      } catch {
        // ignore lookup error, validate below
      }
    }
    if (!targetShop) {
      return { ok: false, error: 'Shop record not found in Firestore.' };
    }

    const prevStatus = targetShop.status;
    const offlinePatch = status === 'suspended' || status === 'rejected' ? { isOpen: false } : {};
    const updatedShopObj: Shop = {
      ...targetShop,
      status,
      isVerified: status === 'approved',
      ...offlinePatch,
      updatedAt
    };

    const linkedAcc = findPartnerAccountForEntity('shopkeeper', shopId, targetShop.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: status,
          currentAccount: linkedAcc,
          previousEntityStatus: prevStatus,
          now: updatedAt
        })
      : null;

    const act = createAdminActivityRecord('Shop Status Changed', `Shop ${shopId} (${targetShop.name}) updated to ${status}`, updatedAt);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'shops', shopId), cleanForFirestore(updatedShopObj), { merge: true });
      batch.set(doc(db, 'publicShops', shopId), cleanForFirestore(toPublicShopCard(updatedShopObj)), { merge: true });
      if (linkedAcc && accPlan) {
        const accFirestorePatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: shopId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accFirestorePatch));
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to update shop status batch in Firestore.' };
    }

    setAdminActivities((prev) => [act, ...prev]);
    setShops((prev) => prev.map((s) => (s.id === shopId ? updatedShopObj : s)));
    if (shop.id === shopId) setShop(updatedShopObj);
    if (linkedAcc && accPlan) {
      applyLocalAccountPatch(
        linkedAcc.uid,
        {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: shopId } : {})
        },
        accPlan.clearSuspendedPreviousStatus
      );
    }

    const prodResult = await syncShopProductsInChunks(shopId, status, targetShop.name, updatedAt);
    setProducts((prev) =>
      prev.map((p) => (p.shopId === shopId ? { ...p, shopStatus: status, updatedAt } : p))
    );

    if (prodResult.error) {
      return {
        ok: true,
        warning: `Shop status updated to ${status}, but product card batch ${ (prodResult.failedChunkIndex || 0) + 1 }/${prodResult.totalChunks} failed (${prodResult.error}). Rules still block purchases from non-approved shops.`
      };
    }
    return { ok: true };
  };

  const handleAdminUpdateShop = async (
    shopId: string,
    updates: AdminShopUpdateInput
  ): Promise<{ ok: boolean; error?: string; warning?: string }> => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Only verified Super Admin can edit shop details.' };
    }
    const existing = shops.find((s) => s.id === shopId);
    if (!existing) {
      return { ok: false, error: 'Shop record not found.' };
    }
    const cleanName = updates.name.trim();
    const cleanCategory = updates.category.trim();
    const cleanAddress = updates.address.trim();
    const cleanLocality = updates.locality.trim();
    const cleanContact = normalizePhoneE164(updates.contactNumber) || updates.contactNumber.trim();
    if (!cleanName || !cleanCategory || !cleanAddress || !cleanLocality || !cleanContact) {
      return { ok: false, error: 'Shop name, category, address, primary locality, and contact number are required.' };
    }

    const normalizedAreas = Array.from(
      new Set(
        [cleanLocality, ...(updates.deliveryAreas || [])]
          .map((a) => a.trim())
          .filter(Boolean)
      )
    );
    const derivedShopType = updates.shopType || resolveShopTypeFromCategory(cleanCategory);
    const updatedAt = new Date().toISOString();

    const updatedShop: Shop = {
      ...existing,
      name: cleanName,
      category: cleanCategory,
      shopType: derivedShopType,
      address: cleanAddress,
      locality: cleanLocality,
      pincode:
        updates.pincode?.trim() ||
        localities.find((l) => l.name.toLowerCase() === cleanLocality.toLowerCase())?.pincode ||
        existing.pincode ||
        '735214',
      contactNumber: cleanContact,
      publishContact: Boolean(updates.publishContact),
      ...(updates.publishContact
        ? { publicContactNumber: normalizePhoneE164(updates.publicContactNumber || cleanContact) || updates.publicContactNumber || cleanContact }
        : { publicContactNumber: undefined }),
      ...(updates.businessHours?.trim() ? { businessHours: updates.businessHours.trim() } : {}),
      ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
      ...(updates.imageUrl?.trim() ? { imageUrl: updates.imageUrl.trim() } : {}),
      deliveryAreas: normalizedAreas,
      servedLocalities: normalizedAreas,
      deliveryCharge: Number(updates.deliveryCharge) >= 0 ? Number(updates.deliveryCharge) : existing.deliveryCharge,
      ...(updates.freeDeliveryAbove !== undefined ? { freeDeliveryAbove: Number(updates.freeDeliveryAbove) } : {}),
      deliveryRadiusKm: Number(updates.deliveryRadiusKm) > 0 ? Number(updates.deliveryRadiusKm) : existing.deliveryRadiusKm,
      isOpen: updates.status === 'suspended' || updates.status === 'rejected' ? false : updates.isOpen,
      status: updates.status,
      isVerified: updates.status === 'approved',
      updatedAt
    };

    const linkedAcc = findPartnerAccountForEntity('shopkeeper', shopId, existing.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: updates.status,
          currentAccount: linkedAcc,
          previousEntityStatus: existing.status,
          now: updatedAt
        })
      : null;

    let nextRouting = routingConfig;
    normalizedAreas.forEach((locName) => {
      nextRouting = syncPartnerIntoRoutingConfig(nextRouting, 'shop', shopId, locName);
    });

    const act = createAdminActivityRecord(
      'Shop Details Updated',
      `Updated shop "${cleanName}" [${updates.status}] areas: ${normalizedAreas.join(', ')}`,
      updatedAt
    );

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'shops', shopId), cleanForFirestore(updatedShop), { merge: true });
      batch.set(doc(db, 'publicShops', shopId), cleanForFirestore(toPublicShopCard(updatedShop)), { merge: true });
      if (linkedAcc && accPlan) {
        const accFirestorePatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: shopId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accFirestorePatch));
      }
      batch.set(doc(db, 'routingConfig', 'universal'), cleanForFirestore(nextRouting), { merge: true });
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();

      setAdminActivities((prev) => [act, ...prev]);
      setRoutingConfig(nextRouting);
      setShops((prev) => prev.map((s) => (s.id === shopId ? updatedShop : s)));
      if (shop.id === shopId) {
        setShop(updatedShop);
      }
      if (linkedAcc && accPlan) {
        applyLocalAccountPatch(
          linkedAcc.uid,
          {
            status: accPlan.status,
            updatedAt: accPlan.updatedAt,
            ...(accPlan.suspendedEntityPreviousStatus !== undefined
              ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
              : {}),
            ...(!linkedAcc.linkedEntityId ? { linkedEntityId: shopId } : {})
          },
          accPlan.clearSuspendedPreviousStatus
        );
      }

      const prodResult = await syncShopProductsInChunks(shopId, updates.status, cleanName, updatedAt);
      setProducts((prev) =>
        prev.map((p) =>
          p.shopId === shopId
            ? { ...p, shopName: cleanName, shopStatus: updates.status, updatedAt }
            : p
        )
      );

      if (prodResult.error) {
        return {
          ok: true,
          warning: `Shop saved, but product sync failed on chunk ${(prodResult.failedChunkIndex || 0) + 1}/${prodResult.totalChunks}: ${prodResult.error}`
        };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to save shop updates.' };
    }
  };

  const handleAdminChangeStatus = (newStatus: ShopApprovalStatus) => {
    if (!isAdminAuthenticated || !shop.id) {
      console.warn('Blocked unauthenticated admin shop status change.');
      return;
    }
    handleUpdateShopStatusUnified(shop.id, newStatus).catch((err) => console.warn(err));
  };

  const canModifyActiveShopProducts = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    return canShopkeeperMutateCatalog({
      isAdmin: isAdminAuthenticated,
      account: activePartnerAccount,
      shop
    });
  };

  const handleAddProduct = (newProd: Partial<Product>) => {
    if (!canModifyActiveShopProducts()) {
      console.warn('Blocked product add: suspended, unapproved, or missing linkedEntityId.');
      return;
    }
    const id = `prod-${Date.now()}`;
    const uid = auth.currentUser?.uid;
    const product: Product = {
      id,
      name: newProd.name || 'New Product',
      price: newProd.price || 0,
      unit: newProd.unit || '1 pc',
      image: newProd.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      category: newProd.category || 'Vegetables',
      rating: newProd.rating || 4.8,
      inStock: newProd.inStock !== false,
      stock: newProd.stock || 20,
      isAvailable: newProd.isAvailable !== false,
      isDeal: newProd.isDeal || false,
      badge: newProd.badge || '',
      description: newProd.description || '',
      localName: newProd.localName || '',
      shopId: shop.id,
      shopName: shop.name,
      shopStatus: shop.status,
      ownerId: uid || shop.ownerId,
      createdAt: new Date().toISOString()
    };
    setProducts((prev) => [product, ...prev]);
    const batch = writeBatch(db);
    batch.set(doc(db, 'products', id), cleanForFirestore(product));
    batch.set(doc(db, 'publicProducts', id), cleanForFirestore(toPublicProductCard(product)));
    batch.commit().catch((err) => console.warn(err));
  };

  const handleUpdateProduct = (id: string, updated: Partial<Product>) => {
    if (!canModifyActiveShopProducts()) {
      console.warn('Blocked product update: suspended, unapproved, or missing linkedEntityId.');
      return;
    }
    const updatedAt = new Date().toISOString();
    const { shopStatus: _ss, ownerId: _oi, shopId: _si, id: _id, ...safeUpdated } = updated;
    const clientPatch = isAdminAuthenticated ? updated : safeUpdated;
    const currentProd = products.find((p) => p.id === id);
    const mergedProd = currentProd ? { ...currentProd, ...clientPatch, updatedAt } : null;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...clientPatch, updatedAt } : p))
    );
    const batch = writeBatch(db);
    batch.update(doc(db, 'products', id), cleanForFirestore({ ...clientPatch, updatedAt }));
    if (mergedProd) {
      batch.set(doc(db, 'publicProducts', id), cleanForFirestore(toPublicProductCard(mergedProd)), { merge: true });
    }
    batch.commit().catch((err) => console.warn(err));
  };

  const handleDeleteProduct = (id: string) => {
    if (!canModifyActiveShopProducts()) {
      console.warn('Blocked product delete: suspended, unapproved, or missing linkedEntityId.');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const batch = writeBatch(db);
    batch.delete(doc(db, 'products', id));
    batch.delete(doc(db, 'publicProducts', id));
    batch.commit().catch((err) => console.warn(err));
  };

  const handleToggleProductAvailability = (id: string) => {
    if (!canModifyActiveShopProducts()) {
      console.warn('Blocked product availability toggle: suspended, unapproved, or missing linkedEntityId.');
      return;
    }
    const target = products.find((p) => p.id === id);
    const newAvail = target?.isAvailable === false ? true : false;
    const updatedAt = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isAvailable: newAvail, inStock: newAvail, updatedAt } : p
      )
    );
    const batch = writeBatch(db);
    batch.update(doc(db, 'products', id), {
      isAvailable: newAvail,
      inStock: newAvail,
      updatedAt
    });
    if (target) {
      batch.set(
        doc(db, 'publicProducts', id),
        cleanForFirestore(toPublicProductCard({ ...target, isAvailable: newAvail, inStock: newAvail, updatedAt })),
        { merge: true }
      );
    }
    batch.commit().catch((err) => console.warn(err));
  };

  // --- DRIVER & RIDE HANDLERS ---
  const canActiveDriverOperate = () =>
    isAdminAuthenticated ||
    (Boolean(auth.currentUser?.uid) &&
      Boolean(currentDriver.id) &&
      activePartnerAccount?.status === 'active' &&
      activePartnerAccount.role === 'driver' &&
      activePartnerAccount.linkedEntityId === currentDriver.id &&
      currentDriver.ownerId === auth.currentUser?.uid &&
      currentDriver.status === 'approved');

  const handleUpdateDriver = (updated: Partial<Driver>) => {
    if (!canActiveDriverOperate()) {
      console.warn('Blocked driver update for suspended or unapproved driver.');
      return;
    }
    setCurrentDriver((prev) => {
      const updatedAt = new Date().toISOString();
      const safePatch = isAdminAuthenticated
        ? updated
        : (() => {
            const { status: _s, approvalStatus: _a, ownerId: _o, ...rest } = updated;
            return rest;
          })();
      const next = { ...prev, ...safePatch, updatedAt };
      setDrivers((list) => list.map((d) => (d.id === next.id ? next : d)));
      if (next.status === 'approved') {
        const publicCard = toPublicDriverCard(next, isAdminAuthenticated ? undefined : 'active');
        setApprovedDrivers((prevCards) => mergeById(prevCards, [publicCard]));
      }
      if (auth.currentUser && next.id && (next.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
        safeUpdateDoc(doc(db, 'drivers', next.id), { ...safePatch, updatedAt }).catch((err) => console.warn(err));
        if (next.status === 'approved') {
          if (isAdminAuthenticated) {
            safeSetDoc(
              doc(db, 'publicDrivers', next.id),
              cleanForFirestore(toPublicDriverCard(next)),
              { merge: true }
            ).catch((err) => console.warn('publicDrivers admin sync:', err.message));
          } else {
            const { name, vehicleType, locality, currentLocation, servedLocalities, isOnline } = toPublicDriverCard(next, 'active');
            safeUpdateDoc(
              doc(db, 'publicDrivers', next.id),
              cleanForFirestore({ name, vehicleType, locality, currentLocation, servedLocalities, isOnline, updatedAt })
            ).catch((err) => console.warn('publicDrivers owner sync:', err.message));
          }
        }
      }
      return next;
    });
  };

  const handleUpdateDriverStatus = async (
    driverId: string,
    status: ShopApprovalStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated) return { ok: false, error: 'Only verified Super Admin can update driver status.' };
    const updatedAt = new Date().toISOString();
    const targetDriver = drivers.find((d) => d.id === driverId);
    const prevStatus = targetDriver?.status;
    const offlinePatch = status === 'suspended' || status === 'rejected' ? { isOnline: false } : {};
    const linkedAcc = findPartnerAccountForEntity('driver', driverId, targetDriver?.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: status,
          currentAccount: linkedAcc,
          previousEntityStatus: prevStatus,
          now: updatedAt
        })
      : null;
    const updatedDriverObj = targetDriver
      ? { ...targetDriver, status, approvalStatus: status, ...offlinePatch, updatedAt }
      : undefined;
    const publicCard = updatedDriverObj
      ? toPublicDriverCard(updatedDriverObj, accPlan?.status || linkedAcc?.status || 'active')
      : undefined;
    const act = createAdminActivityRecord('Driver Verification', `Updated driver ${driverId} status to ${status}`, updatedAt);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'drivers', driverId), cleanForFirestore({ status, approvalStatus: status, ...offlinePatch, updatedAt }));
      if (linkedAcc && accPlan) {
        const accPatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: driverId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accPatch));
      }
      if (publicCard) {
        batch.set(doc(db, 'publicDrivers', driverId), cleanForFirestore(publicCard), { merge: true });
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update driver status.' };
    }

    setAdminActivities((prev) => [act, ...prev]);
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status, approvalStatus: status, ...offlinePatch, updatedAt } : d))
    );
    if (currentDriver.id === driverId) {
      setCurrentDriver((prev) => ({ ...prev, status, approvalStatus: status, ...offlinePatch, updatedAt }));
    }
    if (publicCard) {
      setApprovedDrivers((prev) =>
        status === 'approved'
          ? mergeById(prev, [publicCard])
          : prev.filter((d) => d.id !== driverId)
      );
    }
    if (linkedAcc && accPlan) {
      applyLocalAccountPatch(
        linkedAcc.uid,
        {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: driverId } : {})
        },
        accPlan.clearSuspendedPreviousStatus
      );
    }
    return { ok: true };
  };

  // BACKEND REQUIRED: Atomic multi-driver claiming requires Cloud Functions; assigned driver post-confirmation updates persist to Firestore.
  const handleUpdateRideStatus = async (
    rideId: string,
    status: RideStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!canActiveDriverOperate()) {
      return { ok: false, error: 'Blocked ride status update by suspended or unapproved driver.' };
    }
    const target = rideBookings.find((r) => r.id === rideId);
    if (!isAdminAuthenticated && (!target?.driverId || target.driverId !== currentDriver.id)) {
      return {
        ok: false,
        error: 'Only the assigned driver or Super Admin can update this ride status.'
      };
    }
    const updatedAt = new Date().toISOString();
    if (auth.currentUser) {
      try {
        await safeUpdateDoc(doc(db, 'rideBookings', rideId), { status, updatedAt });
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to update ride status.' };
      }
    }
    setRideBookings((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, status, updatedAt } : r))
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Two drivers racing to accept the same ride must be arbitrated in a Cloud Function transaction.
  const handleAcceptRide = async (
    rideId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    vehicleNumber: string,
    agreedFare?: number
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!canActiveDriverOperate()) {
      return { ok: false, error: 'Driver account is suspended or unapproved.' };
    }
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Concurrent driver ride claiming requires a Cloud Function transaction (Spark plan cannot prevent multi-driver race conditions).'
      };
    }

    const existing = rideBookings.find((r) => r.id === rideId);
    if (!existing) return { ok: false, error: 'Ride booking not found.' };
    if (existing.status === 'CONFIRMED' || existing.status === 'accepted') {
      return { ok: false, error: 'Ride is already confirmed.' };
    }
    const updatedAt = new Date().toISOString();
    const finalFare = agreedFare !== undefined ? agreedFare : (existing.customerProposedFare || existing.estimatedFare);
    const acceptedOffer: FareOffer = {
      id: `offer-${Date.now()}-dacc`,
      offeredBy: 'driver',
      amount: finalFare,
      driverId,
      driverName,
      driverPhone,
      status: 'accepted',
      timestamp: updatedAt,
      roundNumber: (existing.currentRound || 1) + 1
    };
    const nextHistory = [...(existing.negotiationHistory || []), acceptedOffer];

    try {
      await safeUpdateDoc(
        doc(db, 'rideBookings', rideId),
        cleanForFirestore({
          status: 'CONFIRMED',
          driverId,
          driverName,
          driverPhone,
          vehicleNumber,
          agreedFare: finalFare,
          activeDriverOffers: [],
          negotiationHistory: nextHistory,
          updatedAt
        })
      );
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to confirm ride.' };
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === rideId
          ? {
              ...r,
              status: 'CONFIRMED',
              driverId,
              driverName,
              driverPhone,
              vehicleNumber,
              agreedFare: finalFare,
              activeDriverOffers: [],
              negotiationHistory: nextHistory,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Unassigned driver counter-offers across competing drivers require Cloud Functions.
  const handleDriverCounterOffer = async (
    rideId: string,
    driverObj: Driver,
    counterAmount: number,
    note?: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!canActiveDriverOperate()) {
      return { ok: false, error: 'Driver account is suspended or unapproved.' };
    }
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Driver counter-offer submission on unassigned ride requests requires Cloud Functions on Blaze plan.'
      };
    }

    const existing = rideBookings.find((r) => r.id === rideId);
    if (!existing) return { ok: false, error: 'Ride booking not found.' };
    if (existing.status === 'CONFIRMED' || existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      return { ok: false, error: 'Negotiation is closed for this ride.' };
    }
    const updatedAt = new Date().toISOString();
    const nextRound = (existing.currentRound || 1) + 1;
    const newOffer: FareOffer = {
      id: `offer-${Date.now()}-${driverObj.id}`,
      offeredBy: 'driver',
      amount: counterAmount,
      driverId: driverObj.id,
      driverName: driverObj.name,
      driverPhone: driverObj.phone,
      driverRating: driverObj.rating,
      driverVehicle: driverObj.vehicleType,
      driverPlate: driverObj.vehicleNumber,
      note,
      status: 'pending',
      timestamp: updatedAt,
      roundNumber: nextRound,
      expiresAt: new Date(Date.now() + 120000).toISOString()
    };
    const updatedHistory = [...(existing.negotiationHistory || []), newOffer];

    try {
      await safeUpdateDoc(
        doc(db, 'rideBookings', rideId),
        cleanForFirestore({
          status: 'COUNTER_OFFERED',
          activeDriverOffers: [newOffer],
          negotiationHistory: updatedHistory,
          currentRound: nextRound,
          updatedAt
        })
      );
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to send counter offer.' };
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === rideId
          ? {
              ...r,
              status: 'COUNTER_OFFERED',
              activeDriverOffers: [newOffer],
              negotiationHistory: updatedHistory,
              currentRound: nextRound,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Per-driver ride request dismissal requires Cloud Functions.
  const handleDriverRejectRide = async (
    rideId: string,
    driverId: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!canActiveDriverOperate()) {
      return { ok: false, error: 'Driver account is suspended or unapproved.' };
    }
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Updating shared ride request rejection lists requires Cloud Functions on Blaze plan.'
      };
    }

    const existing = rideBookings.find((r) => r.id === rideId);
    if (!existing) return { ok: false, error: 'Ride booking not found.' };
    const updatedAt = new Date().toISOString();
    const rejectedOffer: FareOffer = {
      id: `reject-${Date.now()}-${driverId}`,
      offeredBy: 'driver',
      amount: existing.customerProposedFare || existing.estimatedFare,
      driverId,
      status: 'rejected',
      timestamp: updatedAt,
      roundNumber: existing.currentRound || 1
    };
    const nextOffers = (existing.activeDriverOffers || []).filter((o) => o.driverId !== driverId);
    const nextHistory = [...(existing.negotiationHistory || []), rejectedOffer];

    try {
      await safeUpdateDoc(
        doc(db, 'rideBookings', rideId),
        cleanForFirestore({
          activeDriverOffers: nextOffers,
          negotiationHistory: nextHistory,
          updatedAt
        })
      );
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to dismiss ride request.' };
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === rideId
          ? {
              ...r,
              activeDriverOffers: nextOffers,
              negotiationHistory: nextHistory,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Settling negotiated fare + assigning driverId into CONFIRMED state must run via trusted backend.
  const handleCustomerAcceptRiderOffer = async (
    bookingId: string,
    offerId: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Accepting a driver counter-offer and locking driver assignment requires Cloud Functions on Blaze plan.'
      };
    }

    const existing = rideBookings.find((r) => r.id === bookingId);
    if (!existing) return { ok: false, error: 'Ride booking not found.' };
    const matchedOffer =
      (existing.activeDriverOffers || []).find((o) => o.id === offerId) ||
      (existing.negotiationHistory || []).find((o) => o.id === offerId);
    if (!matchedOffer) return { ok: false, error: 'Matched driver offer not found.' };

    const updatedAt = new Date().toISOString();
    const finalAgreedFare = matchedOffer.amount;
    const driverId = matchedOffer.driverId || '';
    const driverObj = drivers.find((d) => d.id === driverId);
    const acceptedRecord: FareOffer = {
      id: `offer-${Date.now()}-cacc`,
      offeredBy: 'customer',
      amount: finalAgreedFare,
      status: 'accepted',
      timestamp: updatedAt,
      roundNumber: (existing.currentRound || 1) + 1
    };
    const nextHistory = [
      ...(existing.negotiationHistory || []).map((h) => (h.id === offerId ? { ...h, status: 'accepted' as const } : h)),
      acceptedRecord
    ];
    const driverName = matchedOffer.driverName || driverObj?.name || 'Local Verified Partner';
    const driverPhone = matchedOffer.driverPhone || driverObj?.phone || '';
    const vehicleNumber = matchedOffer.driverPlate || driverObj?.vehicleNumber || '';
    const driverRating = matchedOffer.driverRating || driverObj?.rating || 4.9;

    try {
      await safeUpdateDoc(
        doc(db, 'rideBookings', bookingId),
        cleanForFirestore({
          status: 'CONFIRMED',
          agreedFare: finalAgreedFare,
          ...(driverId ? { driverId } : {}),
          driverName,
          ...(driverPhone ? { driverPhone } : {}),
          ...(vehicleNumber ? { vehicleNumber } : {}),
          driverRating,
          activeDriverOffers: [],
          negotiationHistory: nextHistory,
          updatedAt
        })
      );
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to confirm ride offer.' };
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === bookingId
          ? {
              ...r,
              status: 'CONFIRMED',
              agreedFare: finalAgreedFare,
              ...(driverId ? { driverId } : {}),
              driverName,
              ...(driverPhone ? { driverPhone } : {}),
              ...(vehicleNumber ? { vehicleNumber } : {}),
              driverRating,
              activeDriverOffers: [],
              negotiationHistory: nextHistory,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  const handleCustomerCounterBack = async (
    bookingId: string,
    newAmount: number
  ): Promise<{ ok: boolean; error?: string }> => {
    const updatedAt = new Date().toISOString();
    const current = rideBookings.find((r) => r.id === bookingId);
    if (!current) return { ok: false, error: 'Ride booking not found.' };
    if (['CONFIRMED', 'PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(current.status)) {
      return { ok: false, error: 'Negotiation is closed for this ride.' };
    }
    const nextRound = (current.currentRound || 1) + 1;
    const counterRecord: FareOffer = {
      id: `offer-${Date.now()}-cback`,
      offeredBy: 'customer',
      amount: newAmount,
      status: 'pending',
      timestamp: updatedAt,
      roundNumber: nextRound
    };
    const nextHistory = [...(current.negotiationHistory || []), counterRecord];

    if (auth.currentUser) {
      try {
        await safeUpdateDoc(doc(db, 'rideBookings', bookingId), {
          status: 'OFFER_SENT',
          customerProposedFare: newAmount,
          activeDriverOffers: [],
          negotiationHistory: nextHistory,
          currentRound: nextRound,
          updatedAt
        });
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to send fare offer.' };
      }
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === bookingId
          ? {
              ...r,
              customerProposedFare: newAmount,
              status: 'OFFER_SENT',
              activeDriverOffers: [],
              negotiationHistory: nextHistory,
              currentRound: nextRound,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Updating offer rejection state cleanly across drivers & customer requires Cloud Functions.
  const handleCustomerRejectRiderOffer = async (
    bookingId: string,
    offerId: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Rejecting individual driver counter-offers requires Cloud Functions on Blaze plan.'
      };
    }

    const existing = rideBookings.find((r) => r.id === bookingId);
    if (!existing) return { ok: false, error: 'Ride booking not found.' };
    const updatedAt = new Date().toISOString();
    const nextOffers = (existing.activeDriverOffers || []).filter((o) => o.id !== offerId);
    const nextHistory = (existing.negotiationHistory || []).map((h) =>
      h.id === offerId ? { ...h, status: 'rejected' as const } : h
    );
    try {
      await safeUpdateDoc(
        doc(db, 'rideBookings', bookingId),
        cleanForFirestore({
          status: 'REQUESTED',
          activeDriverOffers: nextOffers,
          negotiationHistory: nextHistory,
          updatedAt
        })
      );
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to reject driver offer.' };
    }

    setRideBookings((prev) =>
      prev.map((r) =>
        r.id === bookingId
          ? {
              ...r,
              status: 'REQUESTED',
              activeDriverOffers: nextOffers,
              negotiationHistory: nextHistory,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  const handleCustomerCancelRide = (bookingId: string) => {
    const updatedAt = new Date().toISOString();
    setRideBookings((prev) =>
      prev.map((r) => (r.id === bookingId ? { ...r, status: 'CANCELLED', updatedAt } : r))
    );
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'rideBookings', bookingId), { status: 'CANCELLED', updatedAt }).catch((err) =>
        console.warn('Firestore ride cancel notice:', err.message)
      );
    }
  };

  const handleCustomerBookRide = async (booking: RideBooking): Promise<{ ok: boolean; error?: string }> => {
    const authUid = await resolveAuthUid();
    if (!authUid) {
      return { ok: false, error: 'Please sign in to book a ride.' };
    }
    const pickupLoc = booking.pickupLocality || resolveAreaKey(booking.pickupLocation, localities);
    const dropLoc = booking.dropLocality || resolveAreaKey(booking.dropLocation, localities);
    const eligible =
      drivers.length > 0
        ? getEligiblePartnersForRequest({
            serviceCategory: 'ride',
            requestLocality: pickupLoc,
            requestedVehicleType: booking.vehicleType,
            config: routingConfig,
            drivers,
            partnerAccounts: combinedPartnerAccounts,
            localities
          }).eligible
        : evaluatePublicDriverCardsForRide({
            pickupLocality: pickupLoc,
            requestedVehicleType: booking.vehicleType,
            config: routingConfig,
            approvedDrivers,
            partnerAccounts: combinedPartnerAccounts,
            localities
          }).eligible;

    const enrichedBooking: RideBooking = {
      ...booking,
      pickupLocality: pickupLoc,
      dropLocality: dropLoc,
      routingStatus: eligible.length === 0 ? 'unavailable_in_locality' : 'pending_admin_routing',
      customerId: authUid
    };
    const alert = eligible.length === 0
      ? buildUnavailableLocalityAlert({
          requestId: enrichedBooking.id,
          serviceCategory: 'ride',
          requestLocality: pickupLoc,
          vehicleType: booking.vehicleType
        })
      : null;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'rideBookings', enrichedBooking.id), cleanForFirestore(enrichedBooking));
      if (alert) {
        batch.set(doc(db, 'routingAlerts', alert.id), cleanForFirestore(alert));
      }
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to submit ride request.' };
    }

    if (alert) {
      setRoutingAlerts((prev) => [alert, ...prev]);
    }
    setRideBookings((prev) => [enrichedBooking, ...prev]);
    return { ok: true };
  };

  // --- DELIVERY FLEET HANDLERS ---
  const canActiveRiderOperate = () =>
    isAdminAuthenticated ||
    (Boolean(auth.currentUser?.uid) &&
      Boolean(currentRider.id) &&
      activePartnerAccount?.status === 'active' &&
      activePartnerAccount.role === 'delivery' &&
      activePartnerAccount.linkedEntityId === currentRider.id &&
      currentRider.ownerId === auth.currentUser?.uid &&
      currentRider.status === 'approved');

  const handleUpdateRider = (updated: Partial<DeliveryPerson>) => {
    if (!canActiveRiderOperate()) {
      console.warn('Blocked rider update for suspended or unapproved rider.');
      return;
    }
    setCurrentRider((prev) => {
      const updatedAt = new Date().toISOString();
      const safePatch = isAdminAuthenticated
        ? updated
        : (() => {
            const { status: _s, ownerId: _o, ...rest } = updated;
            return rest;
          })();
      const next = { ...prev, ...safePatch, updatedAt };
      setDeliveryPersons((list) => list.map((p) => (p.id === next.id ? next : p)));
      if (next.status === 'approved') {
        const publicCard = toPublicRiderCard(next, isAdminAuthenticated ? undefined : 'active');
        setApprovedRiders((prevCards) => mergeById(prevCards, [publicCard]));
      }
      if (auth.currentUser && next.id && (next.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
        safeUpdateDoc(doc(db, 'deliveryPersons', next.id), { ...safePatch, updatedAt }).catch((err) =>
          console.warn(err)
        );
        if (next.status === 'approved') {
          if (isAdminAuthenticated) {
            safeSetDoc(
              doc(db, 'publicRiders', next.id),
              cleanForFirestore(toPublicRiderCard(next)),
              { merge: true }
            ).catch((err) => console.warn('publicRiders admin sync:', err.message));
          } else {
            const { name, locality, currentLocation, servedLocalities, isOnline } = toPublicRiderCard(next, 'active');
            safeUpdateDoc(
              doc(db, 'publicRiders', next.id),
              cleanForFirestore({ name, locality, currentLocation, servedLocalities, isOnline, updatedAt })
            ).catch((err) => console.warn('publicRiders owner sync:', err.message));
          }
        }
      }
      return next;
    });
  };

  const handleUpdateDeliveryPersonStatus = async (
    personId: string,
    status: ShopApprovalStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated) return { ok: false, error: 'Only verified Super Admin can update rider status.' };
    const updatedAt = new Date().toISOString();
    const targetRider = deliveryPersons.find((p) => p.id === personId);
    const prevStatus = targetRider?.status;
    const offlinePatch = status === 'suspended' || status === 'rejected' ? { isOnline: false } : {};
    const linkedAcc = findPartnerAccountForEntity('delivery', personId, targetRider?.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: status,
          currentAccount: linkedAcc,
          previousEntityStatus: prevStatus,
          now: updatedAt
        })
      : null;
    const updatedRiderObj = targetRider ? { ...targetRider, status, ...offlinePatch, updatedAt } : undefined;
    const publicCard = updatedRiderObj ? toPublicRiderCard(updatedRiderObj, accPlan?.status || linkedAcc?.status) : undefined;
    const act = createAdminActivityRecord('Delivery Rider Verification', `Updated fleet rider ${personId} status to ${status}`, updatedAt);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'deliveryPersons', personId), cleanForFirestore({ status, ...offlinePatch, updatedAt }));
      if (linkedAcc && accPlan) {
        const accPatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: personId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accPatch));
      }
      if (publicCard) {
        batch.set(doc(db, 'publicRiders', personId), cleanForFirestore(publicCard), { merge: true });
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update rider status.' };
    }

    setAdminActivities((prev) => [act, ...prev]);
    setDeliveryPersons((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, status, ...offlinePatch, updatedAt } : p))
    );
    if (currentRider.id === personId) {
      setCurrentRider((prev) => ({ ...prev, status, ...offlinePatch, updatedAt }));
    }
    if (publicCard) {
      setApprovedRiders((prev) =>
        status === 'approved'
          ? mergeById(prev, [publicCard])
          : prev.filter((r) => r.id !== personId)
      );
    }
    if (linkedAcc && accPlan) {
      applyLocalAccountPatch(
        linkedAcc.uid,
        {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: personId } : {})
        },
        accPlan.clearSuspendedPreviousStatus
      );
    }
    return { ok: true };
  };

  const handleUpdateDeliveryStatus = async (
    deliveryId: string,
    status: DeliveryStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!canActiveRiderOperate()) {
      return { ok: false, error: 'Blocked delivery update by suspended or unapproved rider.' };
    }
    const existingDelivery = deliveries.find((d) => d.id === deliveryId);
    if (!isAdminAuthenticated && (!existingDelivery?.assignedDeliveryPersonId || existingDelivery.assignedDeliveryPersonId !== currentRider.id)) {
      return { ok: false, error: 'Only the assigned rider or Super Admin can update this delivery status.' };
    }
    const updatedAt = new Date().toISOString();
    if (auth.currentUser) {
      try {
        await safeUpdateDoc(doc(db, 'deliveries', deliveryId), { status, updatedAt });
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to update delivery status.' };
      }
    }
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status, updatedAt } : d))
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Claiming an unassigned parcel delivery atomically across competing riders requires Cloud Functions.
  const handleAcceptDelivery = async (
    deliveryId: string,
    riderId: string,
    riderName: string,
    riderPhone: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!canActiveRiderOperate()) {
      return { ok: false, error: 'Delivery rider account is suspended or unapproved.' };
    }
    const existingDelivery = deliveries.find((d) => d.id === deliveryId);
    const isAlreadyAssignedToThisRider = existingDelivery?.assignedDeliveryPersonId === riderId;
    if (!isAdminAuthenticated && !isAlreadyAssignedToThisRider) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Claiming unassigned parcel deliveries requires Cloud Functions on Blaze plan. Admin must assign local riders on Spark plan.'
      };
    }

    const updatedAt = new Date().toISOString();
    if (auth.currentUser) {
      try {
        if (isAdminAuthenticated) {
          await safeUpdateDoc(doc(db, 'deliveries', deliveryId), {
            status: 'accepted',
            assignedDeliveryPersonId: riderId,
            assignedDeliveryPersonName: riderName,
            assignedDeliveryPersonPhone: riderPhone,
            updatedAt
          });
        } else {
          await safeUpdateDoc(doc(db, 'deliveries', deliveryId), {
            status: 'accepted',
            updatedAt
          });
        }
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to accept delivery task.' };
      }
    }

    const patch = {
      status: 'accepted' as DeliveryStatus,
      assignedDeliveryPersonId: riderId,
      assignedDeliveryPersonName: riderName,
      assignedDeliveryPersonPhone: riderPhone,
      updatedAt
    };
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...patch } : d))
    );
    return { ok: true };
  };

  const handleAssignDelivery = (
    deliveryId: string,
    personId: string,
    personName: string,
    personPhone: string
  ) => {
    if (!isAdminAuthenticated) return;
    const patch = {
      status: 'assigned' as DeliveryStatus,
      assignedDeliveryPersonId: personId,
      assignedDeliveryPersonName: personName,
      assignedDeliveryPersonPhone: personPhone,
      updatedAt: new Date().toISOString()
    };
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...patch } : d))
    );
    safeUpdateDoc(doc(db, 'deliveries', deliveryId), patch).catch((err) => console.warn(err));
    logAdminAction('Manual Delivery Dispatch', `Assigned delivery ${deliveryId} to ${personName}`);
  };

  const handleCustomerRequestDelivery = async (req: DeliveryRequest) => {
    const authUid = await resolveAuthUid();
    const pickupLoc = req.pickupLocality || resolveAreaKey(req.senderAddress, localities);
    const dropLoc = req.dropLocality || resolveAreaKey(req.receiverAddress, localities);
    const eligible =
      deliveryPersons.length > 0
        ? getEligiblePartnersForRequest({
            serviceCategory: 'delivery',
            requestLocality: pickupLoc,
            config: routingConfig,
            deliveryPersons,
            partnerAccounts: combinedPartnerAccounts,
            localities
          }).eligible
        : evaluatePublicRiderCardsForOrder({
            pickupLocality: pickupLoc,
            config: routingConfig,
            approvedRiders,
            partnerAccounts: combinedPartnerAccounts,
            localities
          }).eligible;
    const enriched: DeliveryRequest = {
      ...req,
      pickupLocality: pickupLoc,
      dropLocality: dropLoc,
      routingStatus: eligible.length === 0 ? 'unavailable_in_locality' : 'pending_admin_routing',
      customerId: authUid || req.customerId || ''
    };
    const alert = eligible.length === 0
      ? buildUnavailableLocalityAlert({
          requestId: enriched.id,
          serviceCategory: 'delivery',
          requestLocality: pickupLoc
        })
      : null;

    if (authUid) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'deliveries', enriched.id), cleanForFirestore(enriched));
      if (alert) {
        batch.set(doc(db, 'routingAlerts', alert.id), cleanForFirestore(alert));
      }
      await batch.commit().catch((err) => console.warn('Firestore delivery request error:', err));
    }
    if (alert) {
      setRoutingAlerts((prev) => [alert, ...prev]);
    }
    setDeliveries((prev) => [enriched, ...prev]);
  };

  // --- SERVICE PROVIDERS HANDLERS ---
  const canActiveProviderOperate = () =>
    isAdminAuthenticated ||
    (Boolean(auth.currentUser?.uid) &&
      Boolean(currentProvider.id) &&
      activePartnerAccount?.status === 'active' &&
      activePartnerAccount.role === 'service_provider' &&
      activePartnerAccount.linkedEntityId === currentProvider.id &&
      currentProvider.ownerId === auth.currentUser?.uid &&
      currentProvider.status === 'approved');

  const handleUpdateProvider = async (updated: Partial<ServiceProvider>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!canActiveProviderOperate()) {
      console.warn('Blocked unauthorized service provider profile modification.');
      return;
    }

    const prev = currentProvider;
    const safePatch = isAdminAuthenticated
      ? updated
      : (() => {
          const { status: _s, ownerId: _o, ...rest } = updated;
          return rest;
        })();
    const next = { ...prev, ...safePatch };
    setCurrentProvider(next);
    setServiceProviders((list) => list.map((p) => (p.id === next.id ? next : p)));
    if (next.id) {
      safeUpdateDoc(doc(db, 'serviceProviders', next.id), safePatch).catch((err) =>
        console.warn(err)
      );
    }
  };

  const handleUpdateServiceProviderStatus = async (
    providerId: string,
    status: ShopApprovalStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated) return { ok: false, error: 'Only verified Super Admin can update service provider status.' };
    const updatedAt = new Date().toISOString();
    const targetProvider = serviceProviders.find((p) => p.id === providerId);
    const prevStatus = targetProvider?.status;
    const offlinePatch = status === 'suspended' || status === 'rejected' ? { isAvailable: false } : {};
    const linkedAcc = findPartnerAccountForEntity('service_provider', providerId, targetProvider?.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: status,
          currentAccount: linkedAcc,
          previousEntityStatus: prevStatus,
          now: updatedAt
        })
      : null;
    const act = createAdminActivityRecord('Technician Verification', `Updated service provider ${providerId} status to ${status}`, updatedAt);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'serviceProviders', providerId), cleanForFirestore({ status, ...offlinePatch, updatedAt }));
      if (linkedAcc && accPlan) {
        const accPatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: providerId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accPatch));
      }
      if (targetProvider) {
        batch.set(
          doc(db, 'publicServiceProviders', providerId),
          cleanForFirestore(toPublicServiceProviderCard({ ...targetProvider, status, ...offlinePatch, updatedAt })),
          { merge: true }
        );
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update service provider status.' };
    }

    setAdminActivities((prev) => [act, ...prev]);
    setServiceProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status, ...offlinePatch, updatedAt } : p))
    );
    if (currentProvider.id === providerId) {
      setCurrentProvider((prev) => ({ ...prev, status, ...offlinePatch, updatedAt }));
    }
    if (linkedAcc && accPlan) {
      applyLocalAccountPatch(
        linkedAcc.uid,
        {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: providerId } : {})
        },
        accPlan.clearSuspendedPreviousStatus
      );
    }
    return { ok: true };
  };

  const handleUpdateServiceStatus = async (
    requestId: string,
    status: ServiceRequestStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!canActiveProviderOperate()) {
      return { ok: false, error: 'Blocked service request update by suspended or unapproved provider.' };
    }
    const existing = serviceRequests.find((r) => r.id === requestId);
    if (!isAdminAuthenticated && (!existing?.providerId || existing.providerId !== currentProvider.id)) {
      return { ok: false, error: 'Only the assigned technician or Super Admin can update this request.' };
    }
    const updatedAt = new Date().toISOString();
    if (auth.currentUser) {
      try {
        await safeUpdateDoc(doc(db, 'serviceRequests', requestId), { status, updatedAt });
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to update service status.' };
      }
    }
    setServiceRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, updatedAt } : r))
    );
    return { ok: true };
  };

  // BACKEND REQUIRED: Claiming unassigned service requests across competing providers requires Cloud Functions.
  const handleAcceptServiceRequest = async (
    requestId: string,
    providerId: string,
    providerName: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    if (!isAdminAuthenticated) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Claiming unassigned service requests across technicians requires Cloud Functions on Blaze plan.'
      };
    }
    const updatedAt = new Date().toISOString();
    const targetProvider = serviceProviders.find((p) => p.id === providerId);
    const providerOwnerId = targetProvider?.ownerId || '';
    try {
      await safeUpdateDoc(doc(db, 'serviceRequests', requestId), {
        status: 'accepted',
        providerId,
        ...(providerOwnerId ? { providerOwnerId } : {}),
        providerName,
        updatedAt
      });
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to assign service request.' };
    }

    setServiceRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'accepted',
              providerId,
              ...(providerOwnerId ? { providerOwnerId } : {}),
              providerName,
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  const handleCustomerRequestService = async (req: ServiceRequest) => {
    const authUid = await resolveAuthUid();
    const reqLoc = req.locality || resolveAreaKey(req.address, localities);
    const eligible = getEligiblePartnersForRequest({
      serviceCategory: 'service',
      requestLocality: reqLoc,
      requestedServiceCategory: req.category,
      config: routingConfig,
      serviceProviders,
      partnerAccounts: combinedPartnerAccounts,
      localities
    }).eligible;
    const enrichedReq: ServiceRequest = {
      ...req,
      locality: reqLoc,
      routingStatus: eligible.length === 0 ? 'unavailable_in_locality' : 'pending_admin_routing',
      customerId: authUid || req.customerId || ''
    };
    const alert = eligible.length === 0
      ? buildUnavailableLocalityAlert({
          requestId: enrichedReq.id,
          serviceCategory: 'service',
          requestLocality: reqLoc,
          serviceRequired: req.category
        })
      : null;

    if (authUid) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'serviceRequests', enrichedReq.id), cleanForFirestore(enrichedReq));
      if (alert) {
        batch.set(doc(db, 'routingAlerts', alert.id), cleanForFirestore(alert));
      }
      await batch.commit().catch((err) => console.warn('Firestore serviceRequest error:', err));
    }
    if (alert) {
      setRoutingAlerts((prev) => [alert, ...prev]);
    }
    setServiceRequests((prev) => [enrichedReq, ...prev]);
  };

  // --- EMPLOYER & JOBS HANDLERS ---
  const handlePostJob = async (
    job: Omit<JobListing, 'id' | 'applicantsCount' | 'status' | 'createdAt'>
  ) => {
    const canPost =
      isAdminAuthenticated ||
      (activePartnerAccount?.status === 'active' && activePartnerAccount.role === 'employer');
    if (!canPost) {
      console.warn('Blocked unauthorized job posting without Admin-issued employer role.');
      return;
    }
    const authUid = auth.currentUser?.uid;
    if (!authUid) return;
    const id = `job-${Date.now()}`;
    const newJob: JobListing = {
      ...job,
      id,
      employerId: authUid,
      applicantsCount: 0,
      status: 'pending',
      posted: 'Just Now',
      createdAt: new Date().toISOString()
    };
    setJobListings((prev) => [newJob, ...prev]);
    safeSetDoc(doc(db, 'jobs', id), newJob).catch((err) => console.warn(err));
  };

  const handleUpdateJobStatus = async (
    jobId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated) return { ok: false, error: 'Only verified Super Admin can update job status.' };
    const updatedAt = new Date().toISOString();
    const targetJob = jobListings.find((j) => j.id === jobId);
    const act = createAdminActivityRecord('Job Listing Review', `Marked job listing ${jobId} as ${status}`, updatedAt);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'jobs', jobId), { status });
      if (targetJob) {
        batch.set(
          doc(db, 'publicJobs', jobId),
          cleanForFirestore(toPublicJobCard({ ...targetJob, status, updatedAt })),
          { merge: true }
        );
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update job listing status.' };
    }
    setAdminActivities((prev) => [act, ...prev]);
    setJobListings((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
    return { ok: true };
  };

  const handleCustomerApplyJob = async (app: JobApplication) => {
    const authUid = await resolveAuthUid();
    const { employerId: _ignoredEmployerId, ...restApp } = app;
    const enrichedApp: JobApplication = {
      ...restApp,
      ...(app.employerId ? { employerId: app.employerId } : {}),
      applicantId: authUid || app.applicantId
    };
    setJobApplications((prev) => [enrichedApp, ...prev]);
    setJobListings((prev) =>
      prev.map((j) =>
        j.id === app.jobId
          ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 }
          : j
      )
    );
    if (authUid) {
      safeSetDoc(doc(db, 'jobApplications', enrichedApp.id), enrichedApp).catch((err) => console.warn(err));
    }
  };

  const handleUpdateJobApplicationStatus = (
    appId: string,
    status: 'pending' | 'shortlisted' | 'hired' | 'rejected'
  ) => {
    const canReview =
      isAdminAuthenticated ||
      (activePartnerAccount?.status === 'active' && activePartnerAccount.role === 'employer');
    if (!canReview) {
      console.warn('Blocked job application review by suspended or unauthorized employer.');
      return;
    }
    const updatedAt = new Date().toISOString();
    setJobApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status, updatedAt } : a))
    );
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'jobApplications', appId), { status, updatedAt }).catch((err) => console.warn(err));
    }
  };

  // --- ADMIN COMPLAINTS HANDLERS ---
  const handleResolveComplaint = (complaintId: string, notes: string) => {
    if (!isAdminAuthenticated) return;
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, status: 'resolved', resolutionNotes: notes }
          : c
      )
    );
    safeUpdateDoc(doc(db, 'complaints', complaintId), {
      status: 'resolved',
      resolutionNotes: notes
    }).catch((err) => console.warn(err));
    logAdminAction('Grievance Resolved', `Resolved complaint ${complaintId}: ${notes}`);
  };

  const handleCustomerFileComplaint = async (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => {
    const authUid = await resolveAuthUid();
    const newComp: Complaint = {
      ...complaintData,
      id: `comp-${Date.now()}`,
      userId: authUid || '',
      userName: user.name || 'Customer',
      userPhone: user.phone || '',
      status: 'open',
      createdAt: new Date().toISOString()
    };
    setComplaints((prev) => [newComp, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'complaints', newComp.id), newComp).catch((err) => console.warn(err));
    }
  };

  // --- DOCTOR & EMERGENCY HEALTHCARE HANDLERS ---
  const handleRequestDoctor = async (newReq: Omit<EmergencyDoctorRequest, 'id' | 'createdAt'>) => {
    const authUid = await resolveAuthUid();
    const req: EmergencyDoctorRequest = {
      ...newReq,
      id: `emg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      patientUserId: authUid || '',
      customerId: authUid || ''
    };
    setEmergencyDoctorRequests((prev) => [req, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'emergencyDoctorRequests', req.id), req).catch((err) => console.warn(err));
    }
  };

  const canActiveDoctorOperate = () =>
    isAdminAuthenticated ||
    (Boolean(auth.currentUser?.uid) &&
      Boolean(currentDoctor.id) &&
      activePartnerAccount?.status === 'active' &&
      activePartnerAccount.role === 'doctor' &&
      activePartnerAccount.linkedEntityId === currentDoctor.id &&
      currentDoctor.ownerId === auth.currentUser?.uid &&
      currentDoctor.status === 'approved');

  const handleUpdateDoctor = (updated: Doctor) => {
    if (!canActiveDoctorOperate()) {
      console.warn('Blocked doctor profile update for suspended or unapproved doctor.');
      return;
    }
    const safeUpdated = isAdminAuthenticated
      ? updated
      : (() => {
          const { status: _s, ownerId: _o, ...rest } = updated;
          return { ...currentDoctor, ...rest };
        })();
    setDoctors((prev) => prev.map((d) => (d.id === safeUpdated.id ? safeUpdated : d)));
    if (currentDoctor.id === safeUpdated.id) {
      setCurrentDoctor(safeUpdated);
    }
    if (auth.currentUser && safeUpdated.id && (updated.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
      const { status: _s, ownerId: _o, ...safeFields } = safeUpdated;
      safeUpdateDoc(doc(db, 'doctors', safeUpdated.id), isAdminAuthenticated ? safeUpdated : safeFields).catch((err) =>
        console.warn(err)
      );
    }
  };

  const handleUpdateDoctorStatus = async (
    doctorId: string,
    status: 'approved' | 'rejected' | 'suspended' | 'pending'
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isAdminAuthenticated) return { ok: false, error: 'Only verified Super Admin can update doctor status.' };
    const updatedAt = new Date().toISOString();
    const targetDoc = doctors.find((d) => d.id === doctorId);
    const prevStatus = targetDoc?.status;
    const offlinePatch = status === 'suspended' || status === 'rejected' ? { isOnline: false, isAvailable: false } : {};
    const linkedAcc = findPartnerAccountForEntity('doctor', doctorId, targetDoc?.ownerId);
    const accPlan = linkedAcc
      ? buildManualEntityStatusAccountPatch({
          entityStatus: status,
          currentAccount: linkedAcc,
          previousEntityStatus: prevStatus,
          now: updatedAt
        })
      : null;
    const act = createAdminActivityRecord('Doctor Verification', `Updated doctor ${doctorId} status to ${status}`, updatedAt);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'doctors', doctorId), cleanForFirestore({ status, ...offlinePatch, updatedAt }));
      if (linkedAcc && accPlan) {
        const accPatch: Record<string, unknown> = {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(accPlan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: doctorId } : {})
        };
        batch.update(doc(db, 'partnerAccounts', linkedAcc.uid), cleanForFirestore(accPatch));
      }
      if (targetDoc) {
        batch.set(
          doc(db, 'publicDoctors', doctorId),
          cleanForFirestore(toPublicDoctorCard({ ...targetDoc, status, ...offlinePatch, updatedAt })),
          { merge: true }
        );
      }
      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update doctor status.' };
    }

    setAdminActivities((prev) => [act, ...prev]);
    setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, status, ...offlinePatch, updatedAt } : d)));
    if (currentDoctor.id === doctorId) {
      setCurrentDoctor((prev) => ({ ...prev, status, ...offlinePatch, updatedAt }));
    }
    if (linkedAcc && accPlan) {
      applyLocalAccountPatch(
        linkedAcc.uid,
        {
          status: accPlan.status,
          updatedAt: accPlan.updatedAt,
          ...(accPlan.suspendedEntityPreviousStatus !== undefined
            ? { suspendedEntityPreviousStatus: accPlan.suspendedEntityPreviousStatus }
            : {}),
          ...(!linkedAcc.linkedEntityId ? { linkedEntityId: doctorId } : {})
        },
        accPlan.clearSuspendedPreviousStatus
      );
    }
    return { ok: true };
  };

  // BACKEND REQUIRED: Atomic claiming of unassigned emergency requests by competing doctors requires Cloud Functions.
  const handleUpdateEmergencyDoctorRequestStatus = async (
    requestId: string,
    status: EmergencyDoctorStatus,
    etaMinutes?: number,
    notes?: string
  ): Promise<{ ok: boolean; backendRequired?: boolean; error?: string }> => {
    const canAct = status === 'cancelled' || canActiveDoctorOperate();
    if (!canAct) {
      return {
        ok: false,
        error: 'Blocked emergency request status update for suspended or unapproved doctor.'
      };
    }

    const existingReq = emergencyDoctorRequests.find((r) => r.id === requestId);
    const isAssigned = Boolean(existingReq?.assignedDoctorId || existingReq?.doctorId);
    if (!isAdminAuthenticated && status !== 'cancelled' && !isAssigned) {
      return {
        ok: false,
        backendRequired: true,
        error: 'BACKEND REQUIRED: Claiming unassigned emergency doctor requests requires Cloud Functions on Blaze plan.'
      };
    }

    const updatedAt = new Date().toISOString();
    if (auth.currentUser) {
      try {
        await safeUpdateDoc(doc(db, 'emergencyDoctorRequests', requestId), {
          status,
          ...(etaMinutes !== undefined ? { etaMinutes, estimatedArrivalMinutes: etaMinutes } : {}),
          ...(notes !== undefined ? { doctorNotes: notes } : {}),
          updatedAt
        });
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Unable to update emergency request.' };
      }
    }

    setEmergencyDoctorRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              ...(etaMinutes !== undefined ? { etaMinutes, estimatedArrivalMinutes: etaMinutes } : {}),
              ...(notes !== undefined ? { doctorNotes: notes } : {}),
              updatedAt
            }
          : r
      )
    );
    return { ok: true };
  };

  const handleRegisterCustomer = async (newUser: UserProfile) => {
    const fbUser = auth.currentUser;
    const authUid = fbUser?.uid;
    if (!fbUser || !authUid) {
      throw new Error('Firebase authentication session is required to save customer profile.');
    }

    const {
      password: _pw,
      otp: _otp,
      role: _role,
      partnerRole: _prole,
      approved: _app,
      status: _st,
      isAdmin: _ia,
      admin: _adm,
      ...safeProfileFields
    } = newUser as UserProfile & Record<string, unknown>;

    const normalizedPhone = normalizePhoneE164(newUser.phone) || newUser.phone.trim();
    const flags = getAuthFlags(fbUser, normalizedPhone);
    const finalUser: UserProfile = {
      ...safeProfileFields,
      id: authUid,
      userId: authUid,
      phone: normalizedPhone,
      ...flags
    };

    await safeSetDoc(doc(db, 'customers', authUid), finalUser, { merge: true });

    setUser(finalUser);
    if (finalUser.location) setCurrentLocation(finalUser.location);
    if (finalUser.pincode) setCurrentPincode(finalUser.pincode);
  };

  // --- ADMIN-ONLY PARTNER ACCOUNT PROVISIONING & ACCESS CONTROL ---
  const handleCreatePartnerAccount = async (
    input: CreatePartnerAccountInput & { email?: string; createNewEntity?: boolean; linkedEntityId?: string }
  ): Promise<{
    ok: boolean;
    error?: string;
    account?: PartnerAccount;
    issuedEmail?: string;
    issuedPhone?: string;
    resetEmailSent?: boolean;
  }> => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Only the verified Super Admin can issue partner role accounts.' };
    }

    const cleanName = input.displayName.trim();
    const cleanEmail = (input.loginEmail || input.email || '').trim().toLowerCase();
    const cleanPhoneRaw = input.phone?.trim() || '';
    const normalizedPhone = cleanPhoneRaw ? normalizePhoneE164(cleanPhoneRaw) : '';
    const linkedId = (input.linkExistingEntityId || input.linkedEntityId || '').trim() || undefined;
    const creatingNew = !linkedId && input.createNewEntity !== false;

    if (!cleanName) {
      return { ok: false, error: 'Full name is required.' };
    }
    if (cleanPhoneRaw && !normalizedPhone) {
      return { ok: false, error: 'Please enter a valid 10-digit Indian mobile number or E.164 format.' };
    }
    if (!cleanEmail && !normalizedPhone) {
      return { ok: false, error: 'Provide an email address or a mobile number for partner login.' };
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (!input.password || input.password.length < 6) {
      return { ok: false, error: 'Initial password must be at least 6 characters.' };
    }

    const targetLocality = input.locality?.trim() || '';
    if (!targetLocality) {
      return { ok: false, error: 'Primary locality is required.' };
    }
    const targetPincode =
      input.pincode?.trim() ||
      localities.find((l) => l.name.toLowerCase() === targetLocality.toLowerCase())?.pincode ||
      '735214';

    // Strict per-role input validation before creating Firebase Auth account
    const shopContactNormalized = input.shopContactPhone?.trim()
      ? normalizePhoneE164(input.shopContactPhone.trim())
      : normalizedPhone;
    if (input.shopContactPhone?.trim() && !shopContactNormalized) {
      return { ok: false, error: 'Shop contact phone must be a valid 10-digit mobile number or E.164 format.' };
    }

    const deliveryAreasList = Array.from(
      new Set([targetLocality, ...(input.deliveryAreas || [])].map((s) => s.trim()).filter(Boolean))
    );
    const servedLocalitiesList = Array.from(
      new Set([targetLocality, ...(input.servedLocalities || [])].map((s) => s.trim()).filter(Boolean))
    );

    if (creatingNew && input.role === 'shopkeeper') {
      if (!input.shopName?.trim()) return { ok: false, error: 'Shop name is required for a new Shopkeeper account.' };
      if (!input.shopCategory?.trim()) return { ok: false, error: 'Shop category is required.' };
      if (!input.shopAddress?.trim()) return { ok: false, error: 'Full shop physical address is required.' };
      if (!shopContactNormalized) return { ok: false, error: 'A real mobile / shop contact number is required.' };
      if (deliveryAreasList.length === 0) return { ok: false, error: 'Select at least one approved service locality.' };
    }
    if (creatingNew && input.role === 'driver') {
      if (!normalizedPhone) return { ok: false, error: 'Driver mobile number is required.' };
      if (!input.vehicleType || !['toto', 'auto', 'taxi'].includes(input.vehicleType)) {
        return { ok: false, error: 'Vehicle type must be Toto, Auto, or Taxi.' };
      }
      if (!input.vehicleNumber?.trim()) return { ok: false, error: 'Vehicle registration number is required.' };
    }
    if (creatingNew && input.role === 'delivery') {
      if (!normalizedPhone) return { ok: false, error: 'Delivery rider mobile number is required.' };
    }
    if (creatingNew && input.role === 'doctor') {
      if (!normalizedPhone) return { ok: false, error: 'Doctor mobile number is required.' };
      if (!input.qualification?.trim()) return { ok: false, error: 'Medical qualification is required.' };
      if (!input.specialization?.trim()) return { ok: false, error: 'Doctor specialization is required.' };
      if (!input.medicalCouncilRegNo?.trim()) return { ok: false, error: 'Medical council registration number is required.' };
      if (!input.clinicAddress?.trim()) return { ok: false, error: 'Clinic address is required.' };
      if (input.consultationFee === undefined || Number.isNaN(Number(input.consultationFee)) || Number(input.consultationFee) < 0) {
        return { ok: false, error: 'Valid consultation fee is required.' };
      }
    }
    if (creatingNew && input.role === 'service_provider') {
      if (!normalizedPhone) return { ok: false, error: 'Technician mobile number is required.' };
      if (!input.serviceCategory?.trim()) return { ok: false, error: 'Service category is required.' };
      if (input.hourlyRate === undefined || Number.isNaN(Number(input.hourlyRate)) || Number(input.hourlyRate) < 0) {
        return { ok: false, error: 'Valid hourly rate is required.' };
      }
    }

    const loginEmail = cleanEmail || buildSyntheticPartnerEmail(normalizedPhone);
    const now = new Date().toISOString();

    if (normalizedPhone) {
      try {
        const phoneHash = await hashPhoneForLookup(normalizedPhone);
        const existingPhoneSnap = await getDoc(doc(db, 'phoneAuthLookup', phoneHash));
        if (existingPhoneSnap.exists()) {
          return {
            ok: false,
            error: 'This mobile number is already registered to another partner login account. Use a unique mobile number.'
          };
        }
      } catch (lookupErr: any) {
        return {
          ok: false,
          error: lookupErr?.message || 'Unable to verify mobile uniqueness right now.'
        };
      }
    }

    try {
      const provisioned = await provisionPartnerAuthWithFirestore(
        loginEmail,
        input.password,
        { sendResetEmail: Boolean(input.sendPasswordReset && cleanEmail) },
        async (createdAuth) => {
          const batch = writeBatch(db);
          let finalLinkedEntityId = linkedId;
          let routingLocalities = [targetLocality];

          let createdShop: Shop | null = null;
          let createdDriver: Driver | null = null;
          let createdRider: DeliveryPerson | null = null;
          let createdDoctor: Doctor | null = null;
          let createdSp: ServiceProvider | null = null;

          if (input.role === 'shopkeeper') {
            if (finalLinkedEntityId) {
              const existingShop = shops.find((s) => s.id === finalLinkedEntityId);
              if (!existingShop) throw new Error('Selected linked shop record was not found.');
              createdShop = { ...existingShop, ownerId: createdAuth.uid, ownerEmail: loginEmail, updatedAt: now };
              batch.set(doc(db, 'shops', existingShop.id), cleanForFirestore(createdShop), { merge: true });
              if (createdShop.status === 'approved') {
                batch.set(doc(db, 'publicShops', existingShop.id), cleanForFirestore(toPublicShopCard(createdShop)), { merge: true });
              }
              routingLocalities = createdShop.deliveryAreas?.length ? createdShop.deliveryAreas : [createdShop.locality];
            } else if (creatingNew) {
              const newShopId = `shop-${Date.now()}`;
              const shopCat = input.shopCategory!.trim();
              createdShop = {
                id: newShopId,
                ownerId: createdAuth.uid,
                ownerEmail: loginEmail,
                name: input.shopName!.trim(),
                address: input.shopAddress!.trim(),
                locality: targetLocality,
                pincode: targetPincode,
                contactNumber: shopContactNormalized,
                imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600',
                category: shopCat,
                shopType: resolveShopTypeFromCategory(shopCat),
                status: 'approved',
                isVerified: true,
                isOpen: true,
                deliveryAreas: deliveryAreasList,
                servedLocalities: deliveryAreasList,
                deliveryCharge: 20,
                deliveryRadiusKm: 8,
                rating: 4.8,
                totalOrders: 0,
                totalRevenue: 0,
                createdAt: now,
                updatedAt: now
              };
              batch.set(doc(db, 'shops', newShopId), cleanForFirestore(createdShop));
              batch.set(doc(db, 'publicShops', newShopId), cleanForFirestore(toPublicShopCard(createdShop)), { merge: true });
              finalLinkedEntityId = newShopId;
              routingLocalities = deliveryAreasList;
            }
          } else if (input.role === 'driver') {
            if (finalLinkedEntityId) {
              const existingDriver = drivers.find((d) => d.id === finalLinkedEntityId);
              if (!existingDriver) throw new Error('Selected linked driver record was not found.');
              createdDriver = { ...existingDriver, ownerId: createdAuth.uid, updatedAt: now };
              batch.set(doc(db, 'drivers', existingDriver.id), cleanForFirestore(createdDriver), { merge: true });
              if (createdDriver.status === 'approved') {
                batch.set(doc(db, 'publicDrivers', existingDriver.id), cleanForFirestore(toPublicDriverCard(createdDriver, 'active')), { merge: true });
              }
              routingLocalities = (
                createdDriver.servedLocalities?.length
                  ? createdDriver.servedLocalities
                  : [createdDriver.locality || targetLocality]
              ).filter((l): l is string => Boolean(l));
            } else if (creatingNew) {
              const newDriverId = `drv-${Date.now()}`;
              createdDriver = {
                id: newDriverId,
                ownerId: createdAuth.uid,
                name: cleanName,
                phone: normalizedPhone,
                email: loginEmail,
                vehicleType: input.vehicleType!,
                vehicleNumber: input.vehicleNumber!.trim().toUpperCase(),
                ...(input.licenseNumber?.trim() ? { licenseNumber: input.licenseNumber.trim().toUpperCase() } : {}),
                locality: targetLocality,
                currentLocation: targetLocality,
                servedLocalities: servedLocalitiesList,
                status: 'approved',
                approvalStatus: 'approved',
                isOnline: true,
                rating: 4.8,
                totalRides: 0,
                createdAt: now,
                updatedAt: now
              };
              batch.set(doc(db, 'drivers', newDriverId), cleanForFirestore(createdDriver));
              batch.set(doc(db, 'publicDrivers', newDriverId), cleanForFirestore(toPublicDriverCard(createdDriver, 'active')), { merge: true });
              finalLinkedEntityId = newDriverId;
              routingLocalities = servedLocalitiesList;
            }
          } else if (input.role === 'delivery') {
            if (finalLinkedEntityId) {
              const existingRider = deliveryPersons.find((p) => p.id === finalLinkedEntityId);
              if (!existingRider) throw new Error('Selected linked rider record was not found.');
              createdRider = { ...existingRider, ownerId: createdAuth.uid, updatedAt: now };
              batch.set(doc(db, 'deliveryPersons', existingRider.id), cleanForFirestore(createdRider), { merge: true });
              if (createdRider.status === 'approved') {
                batch.set(doc(db, 'publicRiders', existingRider.id), cleanForFirestore(toPublicRiderCard(createdRider, 'active')), { merge: true });
              }
              routingLocalities = createdRider.servedLocalities?.length ? createdRider.servedLocalities : [createdRider.locality];
            } else if (creatingNew) {
              const newRiderId = `del-${Date.now()}`;
              createdRider = {
                id: newRiderId,
                ownerId: createdAuth.uid,
                name: cleanName,
                phone: normalizedPhone,
                email: loginEmail,
                locality: targetLocality,
                currentLocation: targetLocality,
                servedLocalities: servedLocalitiesList,
                status: 'approved',
                isOnline: true,
                rating: 4.8,
                totalDelivered: 0,
                createdAt: now,
                updatedAt: now
              };
              batch.set(doc(db, 'deliveryPersons', newRiderId), cleanForFirestore(createdRider));
              batch.set(doc(db, 'publicRiders', newRiderId), cleanForFirestore(toPublicRiderCard(createdRider, 'active')), { merge: true });
              finalLinkedEntityId = newRiderId;
              routingLocalities = servedLocalitiesList;
            }
          } else if (input.role === 'doctor') {
            if (finalLinkedEntityId) {
              const existingDoc = doctors.find((d) => d.id === finalLinkedEntityId);
              if (!existingDoc) throw new Error('Selected linked doctor record was not found.');
              createdDoctor = { ...existingDoc, ownerId: createdAuth.uid, updatedAt: now };
              batch.set(doc(db, 'doctors', existingDoc.id), cleanForFirestore(createdDoctor), { merge: true });
              if (createdDoctor.status === 'approved') {
                batch.set(doc(db, 'publicDoctors', existingDoc.id), cleanForFirestore(toPublicDoctorCard(createdDoctor)), { merge: true });
              }
            } else if (creatingNew) {
              const newDocId = `doc-${Date.now()}`;
              createdDoctor = {
                id: newDocId,
                ownerId: createdAuth.uid,
                name: cleanName,
                phone: normalizedPhone,
                email: loginEmail,
                qualification: input.qualification!.trim(),
                specialization: input.specialization!,
                experienceYears: Number(input.experienceYears) > 0 ? Number(input.experienceYears) : 1,
                medicalCouncilRegNo: input.medicalCouncilRegNo!.trim().toUpperCase(),
                clinicAddress: input.clinicAddress!.trim(),
                localitiesServed: servedLocalitiesList,
                servedLocalities: servedLocalitiesList,
                consultationFee: Number(input.consultationFee),
                homeVisitFee: Number(input.homeVisitFee ?? Math.max(Number(input.consultationFee) + 200, 300)),
                availableSchedule: '9:00 AM - 8:00 PM',
                isOnline: true,
                isAvailable: true,
                status: 'approved',
                rating: 4.9,
                completedConsultations: 0,
                createdAt: now,
                updatedAt: now
              };
              batch.set(doc(db, 'doctors', newDocId), cleanForFirestore(createdDoctor));
              batch.set(doc(db, 'publicDoctors', newDocId), cleanForFirestore(toPublicDoctorCard(createdDoctor)), { merge: true });
              finalLinkedEntityId = newDocId;
            }
          } else if (input.role === 'service_provider') {
            if (finalLinkedEntityId) {
              const existingSp = serviceProviders.find((p) => p.id === finalLinkedEntityId);
              if (!existingSp) throw new Error('Selected linked service provider record was not found.');
              createdSp = { ...existingSp, ownerId: createdAuth.uid, updatedAt: now };
              batch.set(doc(db, 'serviceProviders', existingSp.id), cleanForFirestore(createdSp), { merge: true });
              if (createdSp.status === 'approved') {
                batch.set(doc(db, 'publicServiceProviders', existingSp.id), cleanForFirestore(toPublicServiceProviderCard(createdSp)), { merge: true });
              }
              routingLocalities = createdSp.servedLocalities?.length ? createdSp.servedLocalities : [createdSp.serviceArea];
            } else if (creatingNew) {
              const newSpId = `sp-${Date.now()}`;
              createdSp = {
                id: newSpId,
                ownerId: createdAuth.uid,
                name: cleanName,
                phone: normalizedPhone,
                category: input.serviceCategory!,
                serviceArea: targetLocality,
                currentLocation: targetLocality,
                servedLocalities: servedLocalitiesList,
                description: input.serviceDescription?.trim() || `${input.serviceCategory} specialist serving ${servedLocalitiesList.join(', ')}`,
                experienceYears: Number(input.experienceYears) > 0 ? Number(input.experienceYears) : 1,
                hourlyRate: Number(input.hourlyRate),
                status: 'approved',
                isAvailable: true,
                rating: 4.8,
                totalJobsCompleted: 0,
                createdAt: now,
                updatedAt: now
              };
              batch.set(doc(db, 'serviceProviders', newSpId), cleanForFirestore(createdSp));
              batch.set(doc(db, 'publicServiceProviders', newSpId), cleanForFirestore(toPublicServiceProviderCard(createdSp)), { merge: true });
              finalLinkedEntityId = newSpId;
              routingLocalities = servedLocalitiesList;
            }
          }

          let nextRouting: UniversalRoutingConfig | null = null;
          if (finalLinkedEntityId && (input.role === 'shopkeeper' || input.role === 'driver' || input.role === 'delivery' || input.role === 'service_provider')) {
            const mappedRole = input.role === 'shopkeeper' ? 'shop' : input.role;
            nextRouting = routingConfig;
            routingLocalities.forEach((locName) => {
              nextRouting = syncPartnerIntoRoutingConfig(nextRouting!, mappedRole, finalLinkedEntityId!, locName);
            });
            batch.set(doc(db, 'routingConfig', 'universal'), cleanForFirestore(nextRouting), { merge: true });
          }

          const account: PartnerAccount = {
            uid: createdAuth.uid,
            role: input.role,
            displayName: cleanName,
            loginEmail,
            ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            ...(finalLinkedEntityId ? { linkedEntityId: finalLinkedEntityId } : {}),
            status: 'active',
            assignedBy: firebaseUser?.email || ADMIN_EMAIL,
            createdAt: now,
            updatedAt: now
          };

          batch.set(doc(db, 'partnerAccounts', createdAuth.uid), cleanForFirestore(account));

          if (normalizedPhone) {
            const phoneHash = await hashPhoneForLookup(normalizedPhone);
            batch.set(doc(db, 'phoneAuthLookup', phoneHash), {
              loginEmail,
              updatedAt: now
            });
          }

          const act = createAdminActivityRecord(
            'Partner Role Account Created',
            `Issued ${input.role} credentials for "${cleanName}" (${cleanEmail || normalizedPhone}) [UID: ${createdAuth.uid}]`,
            now
          );
          batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));

          await batch.commit();

          return {
            account,
            act,
            nextRouting,
            createdShop,
            createdDriver,
            createdRider,
            createdDoctor,
            createdSp
          };
        }
      );

      const {
        account,
        act,
        nextRouting,
        createdShop,
        createdDriver,
        createdRider,
        createdDoctor,
        createdSp
      } = provisioned.result;

      if (createdShop) {
        setShops((prev) => mergeById(prev, [createdShop]));
      }
      if (createdDriver) {
        setDrivers((prev) => mergeById(prev, [createdDriver]));
        if (createdDriver.status === 'approved') {
          setApprovedDrivers((prev) => mergeById(prev, [toPublicDriverCard(createdDriver, 'active')]));
        }
      }
      if (createdRider) {
        setDeliveryPersons((prev) => mergeById(prev, [createdRider]));
        if (createdRider.status === 'approved') {
          setApprovedRiders((prev) => mergeById(prev, [toPublicRiderCard(createdRider, 'active')]));
        }
      }
      if (createdDoctor) {
        setDoctors((prev) => mergeById(prev, [createdDoctor]));
      }
      if (createdSp) {
        setServiceProviders((prev) => mergeById(prev, [createdSp]));
      }
      if (nextRouting) {
        setRoutingConfig(nextRouting);
      }

      setAdminPartnerAccounts((prev) => [account, ...prev.filter((a) => a.uid !== account.uid)]);
      setAdminActivities((prev) => [act, ...prev]);

      return {
        ok: true,
        account,
        issuedEmail: cleanEmail || undefined,
        issuedPhone: normalizedPhone || undefined,
        resetEmailSent: provisioned.resetEmailSent
      };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return {
          ok: false,
          error: 'This login email or mobile login already exists in Firebase Authentication. Use a unique email or mobile number.'
        };
      }
      if (code === 'auth/operation-not-allowed') {
        return {
          ok: false,
          error: 'Email/Password sign-in provider is disabled in Firebase Console. Enable it under Authentication → Sign-in method.'
        };
      }
      return {
        ok: false,
        error: err?.message || 'Unable to provision partner account.'
      };
    }
  };

  const handleTogglePartnerAccountStatus = async (
    uid: string,
    nextStatus: PartnerAccountStatus
  ): Promise<{ ok: boolean; error?: string; warning?: string }> => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Only the verified Super Admin can update partner account access.' };
    }
    const updatedAt = new Date().toISOString();

    try {
      let targetAccount = adminPartnerAccounts.find((a) => a.uid === uid);
      if (!targetAccount) {
        const snap = await getDoc(doc(db, 'partnerAccounts', uid));
        if (!snap.exists()) {
          return { ok: false, error: 'Partner account record not found.' };
        }
        targetAccount = { uid: snap.id, ...snap.data() } as PartnerAccount;
      }

      const entityCollectionByRole: Partial<Record<PartnerRoleType, string>> = {
        shopkeeper: 'shops',
        driver: 'drivers',
        delivery: 'deliveryPersons',
        doctor: 'doctors',
        service_provider: 'serviceProviders'
      };
      const entityCol = entityCollectionByRole[targetAccount.role];
      let resolvedEntityId = targetAccount.linkedEntityId;
      let missingEntityWarning: string | undefined;

      let matchedShop: Shop | undefined;
      let matchedDriver: Driver | undefined;
      let matchedRider: DeliveryPerson | undefined;
      let matchedDoctor: Doctor | undefined;
      let matchedProvider: ServiceProvider | undefined;

      if (entityCol) {
        if (resolvedEntityId) {
          const eSnap = await getDoc(doc(db, entityCol, resolvedEntityId));
          if (eSnap.exists()) {
            const entityData = { id: eSnap.id, ...eSnap.data() };
            if (targetAccount.role === 'shopkeeper') matchedShop = entityData as Shop;
            else if (targetAccount.role === 'driver') matchedDriver = entityData as Driver;
            else if (targetAccount.role === 'delivery') matchedRider = entityData as DeliveryPerson;
            else if (targetAccount.role === 'doctor') matchedDoctor = entityData as Doctor;
            else if (targetAccount.role === 'service_provider') matchedProvider = entityData as ServiceProvider;
          } else {
            missingEntityWarning = `Linked ${targetAccount.role} record (${resolvedEntityId}) was not found in Firestore; partner account status updated only.`;
          }
        } else {
          // Recover legacy unlinked entity by ownerId if available
          const recoveredSnap = await getDocs(query(collection(db, entityCol), where('ownerId', '==', uid)));
          if (!recoveredSnap.empty) {
            const firstDoc = recoveredSnap.docs[0];
            resolvedEntityId = firstDoc.id;
            const entityData = { id: firstDoc.id, ...firstDoc.data() };
            if (targetAccount.role === 'shopkeeper') matchedShop = entityData as Shop;
            else if (targetAccount.role === 'driver') matchedDriver = entityData as Driver;
            else if (targetAccount.role === 'delivery') matchedRider = entityData as DeliveryPerson;
            else if (targetAccount.role === 'doctor') matchedDoctor = entityData as Doctor;
            else if (targetAccount.role === 'service_provider') matchedProvider = entityData as ServiceProvider;
          } else {
            missingEntityWarning = `No linked ${targetAccount.role} business record found for this account; partner account status updated only.`;
          }
        }
      }

      const currentEntityStatus: ShopApprovalStatus | undefined =
        matchedShop?.status ||
        matchedDriver?.status ||
        matchedRider?.status ||
        matchedDoctor?.status ||
        matchedProvider?.status;

      const plan = buildAccountStatusSyncPlan({
        account: targetAccount,
        targetStatus: nextStatus,
        currentEntityStatus,
        now: updatedAt
      });

      const act = createAdminActivityRecord(
        `Partner Account ${nextStatus === 'active' ? 'Reactivated' : 'Suspended'}`,
        `Updated ${targetAccount.role} "${targetAccount.displayName}" (${uid}) -> account:${nextStatus}${plan.nextEntityStatus ? `, entity:${plan.nextEntityStatus}` : ''}`,
        updatedAt
      );

      const batch = writeBatch(db);
      const firestoreAccountPatch: Record<string, unknown> = {
        ...plan.accountPatch,
        ...(plan.clearSuspendedPreviousStatus ? { suspendedEntityPreviousStatus: deleteField() } : {}),
        ...(!targetAccount.linkedEntityId && resolvedEntityId ? { linkedEntityId: resolvedEntityId } : {})
      };
      batch.update(doc(db, 'partnerAccounts', uid), cleanForFirestore(firestoreAccountPatch));

      if (matchedShop && plan.nextEntityStatus) {
        const nextShopStatus = plan.nextEntityStatus;
        const shopUpdates = {
          status: nextShopStatus,
          isVerified: nextShopStatus === 'approved',
          ...(nextStatus === 'suspended' ? { isOpen: false } : {}),
          updatedAt
        };
        const updatedShop: Shop = { ...matchedShop, ...shopUpdates };
        batch.update(doc(db, 'shops', matchedShop.id), cleanForFirestore(shopUpdates));
        batch.set(doc(db, 'publicShops', matchedShop.id), cleanForFirestore(toPublicShopCard(updatedShop)), { merge: true });
      } else if (matchedDriver && plan.nextEntityStatus) {
        const nextDriverStatus = plan.nextEntityStatus;
        const driverUpdates = {
          status: nextDriverStatus,
          approvalStatus: nextDriverStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false } : {}),
          updatedAt
        };
        const updatedDriver: Driver = { ...matchedDriver, ...driverUpdates };
        batch.update(doc(db, 'drivers', matchedDriver.id), cleanForFirestore(driverUpdates));
        batch.set(
          doc(db, 'publicDrivers', matchedDriver.id),
          cleanForFirestore(toPublicDriverCard(updatedDriver, nextStatus)),
          { merge: true }
        );
      } else if (matchedRider && plan.nextEntityStatus) {
        const nextRiderStatus = plan.nextEntityStatus;
        const riderUpdates = {
          status: nextRiderStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false } : {}),
          updatedAt
        };
        const updatedRider: DeliveryPerson = { ...matchedRider, ...riderUpdates };
        batch.update(doc(db, 'deliveryPersons', matchedRider.id), cleanForFirestore(riderUpdates));
        batch.set(
          doc(db, 'publicRiders', matchedRider.id),
          cleanForFirestore(toPublicRiderCard(updatedRider, nextStatus)),
          { merge: true }
        );
      } else if (matchedDoctor && plan.nextEntityStatus) {
        const nextDocStatus = plan.nextEntityStatus;
        const docUpdates = {
          status: nextDocStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false, isAvailable: false } : {}),
          updatedAt
        };
        const updatedDoc: Doctor = { ...matchedDoctor, ...docUpdates };
        batch.update(doc(db, 'doctors', matchedDoctor.id), cleanForFirestore(docUpdates));
        batch.set(doc(db, 'publicDoctors', matchedDoctor.id), cleanForFirestore(toPublicDoctorCard(updatedDoc)), { merge: true });
      } else if (matchedProvider && plan.nextEntityStatus) {
        const nextSpStatus = plan.nextEntityStatus;
        const spUpdates = {
          status: nextSpStatus,
          ...(nextStatus === 'suspended' ? { isAvailable: false } : {}),
          updatedAt
        };
        const updatedSp: ServiceProvider = { ...matchedProvider, ...spUpdates };
        batch.update(doc(db, 'serviceProviders', matchedProvider.id), cleanForFirestore(spUpdates));
        batch.set(doc(db, 'publicServiceProviders', matchedProvider.id), cleanForFirestore(toPublicServiceProviderCard(updatedSp)), { merge: true });
      }

      batch.set(doc(db, 'adminActivity', act.id), cleanForFirestore(act));
      await batch.commit();
      setAdminActivities((prev) => [act, ...prev]);

      // Sync all products & publicProducts belonging to the shopkeeper's shop (explicit chunked non-atomic update)
      let prodSyncWarning: string | undefined;
      if (matchedShop && plan.nextEntityStatus) {
        const prodResult = await syncShopProductsInChunks(matchedShop.id, plan.nextEntityStatus, matchedShop.name, updatedAt);
        if (prodResult.error) {
          prodSyncWarning = `Account & shop updated to ${plan.nextEntityStatus}, but product batch ${(prodResult.failedChunkIndex || 0) + 1}/${prodResult.totalChunks} failed: ${prodResult.error}`;
        }
      }

      // Sync local React state consistently without deleting any historical orders/requests/jobs/applications
      applyLocalAccountPatch(
        uid,
        {
          ...plan.accountPatch,
          ...(!targetAccount.linkedEntityId && resolvedEntityId ? { linkedEntityId: resolvedEntityId } : {})
        },
        plan.clearSuspendedPreviousStatus
      );

      if (matchedShop && plan.nextEntityStatus) {
        const nextShopStatus = plan.nextEntityStatus;
        const updatedShop: Shop = {
          ...matchedShop,
          status: nextShopStatus,
          isVerified: nextShopStatus === 'approved',
          ...(nextStatus === 'suspended' ? { isOpen: false } : {}),
          updatedAt
        };
        setShops((prev) => prev.map((s) => (s.id === matchedShop.id ? updatedShop : s)));
        if (shop.id === matchedShop.id) setShop(updatedShop);
        setProducts((prev) =>
          prev.map((p) => (p.shopId === matchedShop.id ? { ...p, shopStatus: nextShopStatus, updatedAt } : p))
        );
      } else if (matchedDriver && plan.nextEntityStatus) {
        const nextDriverStatus = plan.nextEntityStatus;
        const updatedDriver: Driver = {
          ...matchedDriver,
          status: nextDriverStatus,
          approvalStatus: nextDriverStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false } : {}),
          updatedAt
        };
        setDrivers((prev) => prev.map((d) => (d.id === matchedDriver.id ? updatedDriver : d)));
        if (currentDriver.id === matchedDriver.id) setCurrentDriver(updatedDriver);
        const publicDriverCard = toPublicDriverCard(updatedDriver, nextStatus);
        setApprovedDrivers((prev) =>
          nextDriverStatus === 'approved' && nextStatus === 'active'
            ? mergeById(prev, [publicDriverCard])
            : prev.filter((d) => d.id !== matchedDriver.id)
        );
      } else if (matchedRider && plan.nextEntityStatus) {
        const nextRiderStatus = plan.nextEntityStatus;
        const updatedRider: DeliveryPerson = {
          ...matchedRider,
          status: nextRiderStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false } : {}),
          updatedAt
        };
        setDeliveryPersons((prev) => prev.map((p) => (p.id === matchedRider.id ? updatedRider : p)));
        if (currentRider.id === matchedRider.id) setCurrentRider(updatedRider);
        const publicCard = toPublicRiderCard(updatedRider, nextStatus);
        setApprovedRiders((prev) =>
          nextRiderStatus === 'approved' && nextStatus === 'active'
            ? mergeById(prev, [publicCard])
            : prev.filter((r) => r.id !== matchedRider.id)
        );
      } else if (matchedDoctor && plan.nextEntityStatus) {
        const nextDocStatus = plan.nextEntityStatus;
        const updatedDoc: Doctor = {
          ...matchedDoctor,
          status: nextDocStatus,
          ...(nextStatus === 'suspended' ? { isOnline: false, isAvailable: false } : {}),
          updatedAt
        };
        setDoctors((prev) => prev.map((d) => (d.id === matchedDoctor.id ? updatedDoc : d)));
        if (currentDoctor.id === matchedDoctor.id) setCurrentDoctor(updatedDoc);
      } else if (matchedProvider && plan.nextEntityStatus) {
        const nextSpStatus = plan.nextEntityStatus;
        const updatedSp: ServiceProvider = {
          ...matchedProvider,
          status: nextSpStatus,
          ...(nextStatus === 'suspended' ? { isAvailable: false } : {}),
          updatedAt
        };
        setServiceProviders((prev) => prev.map((p) => (p.id === matchedProvider.id ? updatedSp : p)));
        if (currentProvider.id === matchedProvider.id) setCurrentProvider(updatedSp);
      }

      return { ok: true, warning: prodSyncWarning || missingEntityWarning };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to update partner status.' };
    }
  };

  // --- UNIVERSAL LOCALITY ROUTING HANDLERS ---
  const handleUpdateRoutingConfig = (next: UniversalRoutingConfig) => {
    if (!isAdminAuthenticated) return;
    const stamped: UniversalRoutingConfig = {
      ...next,
      updatedBy: firebaseUser?.email || ADMIN_EMAIL,
      updatedAt: new Date().toISOString()
    };
    setRoutingConfig(stamped);
    persistRoutingConfigToFirestore(stamped);
    logAdminAction('Locality Routing Rules Updated', `Global cross-locality: ${next.globalCrossLocalityEnabled ? 'ENABLED' : 'LOCKED'}`);
  };

  const handleResolveRoutingAlert = (alertId: string) => {
    if (!isAdminAuthenticated) return;
    const now = new Date().toISOString();
    setRoutingAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved', resolvedAt: now } : a))
    );
    safeUpdateDoc(doc(db, 'routingAlerts', alertId), { status: 'resolved', resolvedAt: now }).catch((err) =>
      console.warn('Resolve alert Firestore sync:', err.message)
    );
    logAdminAction('Routing Alert Resolved', `Marked unavailable-locality alert ${alertId} as resolved.`);
  };

  const handleAssignPartnerWithRouting = (params: {
    serviceCategory: RoutingServiceCategory;
    requestId: string;
    partnerId: string;
    isReassignment?: boolean;
  }): { allowed: boolean; error?: string } => {
    if (!isAdminAuthenticated) {
      return { allowed: false, error: 'Only Super Admin can execute routing assignments.' };
    }
    const adminActor = firebaseUser?.email || ADMIN_EMAIL;
    const now = new Date().toISOString();

    if (params.serviceCategory === 'shop_order') {
      const order = orders.find((o) => o.id === params.requestId);
      if (!order) return { allowed: false, error: 'Order not found.' };
      const reqLocality =
        order.pickupLocality || order.shopLocality || order.locality || currentLocation;
      const evaluation = getEligibleDeliveryRidersForOrder({
        pickupLocality: reqLocality,
        config: routingConfig,
        deliveryPersons,
        partnerAccounts: combinedPartnerAccounts,
        localities
      });
      const selected = [...evaluation.eligible, ...evaluation.ineligible].find((r) => r.partnerId === params.partnerId);
      const rider = deliveryPersons.find((d) => d.id === params.partnerId);
      const validation = validateAndBuildAssignmentAudit({
        requestId: params.requestId,
        serviceCategory: params.serviceCategory,
        requestLocality: reqLocality,
        report: selected,
        partnerRole: 'delivery',
        assignedBy: adminActor,
        isReassignment: params.isReassignment
      });
      if (!validation.allowed || !rider) {
        return { allowed: false, error: validation.errorMessage || 'Selected rider is ineligible.' };
      }
      const nextHistory = [...(order.assignmentHistory || []), validation.auditEntry];
      const patchOrder = (list: Order[]) =>
        list.map((o) =>
          o.id === order.id
            ? {
                ...o,
                riderId: rider.id,
                riderName: rider.name,
                riderPhone: rider.phone,
                riderLocality: rider.currentLocation || rider.locality,
                routingStatus: 'assigned' as const,
                assignmentHistory: nextHistory,
                updatedAt: now
              }
            : o
        );
      setOrders(patchOrder);
      setCustomerOrders(patchOrder);
      setTrackedOrder((prev) => (prev && prev.id === order.id ? patchOrder([prev])[0] : prev));
      setRoutingAlerts((prev) =>
        prev.map((a) => (a.requestId === order.id ? { ...a, status: 'resolved', resolvedAt: now } : a))
      );
      routingAlerts
        .filter((a) => a.requestId === order.id && a.status === 'open')
        .forEach((a) => safeUpdateDoc(doc(db, 'routingAlerts', a.id), { status: 'resolved', resolvedAt: now }).catch(() => {}));
      safeUpdateDoc(doc(db, 'orders', order.id), {
        riderId: rider.id,
        riderName: rider.name,
        riderPhone: rider.phone,
        riderLocality: rider.currentLocation || rider.locality,
        routingStatus: 'assigned',
        assignmentHistory: nextHistory,
        updatedAt: now
      }).catch((err) => console.warn(err));
      logAdminAction('Locality Order Dispatch', `Assigned ${rider.name} (${rider.locality}) to #${order.id}`);
      return { allowed: true };
    }

    if (params.serviceCategory === 'delivery') {
      const req = deliveries.find((d) => d.id === params.requestId);
      if (!req) return { allowed: false, error: 'Delivery request not found.' };
      const reqLocality = req.pickupLocality || req.senderAddress;
      const evaluation = getEligiblePartnersForRequest({
        serviceCategory: 'delivery',
        requestLocality: reqLocality,
        config: routingConfig,
        deliveryPersons,
        partnerAccounts: combinedPartnerAccounts,
        localities
      });
      const selected = [...evaluation.eligible, ...evaluation.ineligible].find((r) => r.partnerId === params.partnerId);
      const rider = deliveryPersons.find((d) => d.id === params.partnerId);
      const validation = validateAndBuildAssignmentAudit({
        requestId: req.id,
        serviceCategory: 'delivery',
        requestLocality: reqLocality,
        report: selected,
        partnerRole: 'delivery',
        assignedBy: adminActor,
        isReassignment: params.isReassignment
      });
      if (!validation.allowed || !rider) {
        return { allowed: false, error: validation.errorMessage || 'Selected rider is ineligible.' };
      }
      const nextHistory = [...(req.assignmentHistory || []), validation.auditEntry];
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === req.id
            ? {
                ...d,
                status: 'assigned',
                assignedDeliveryPersonId: rider.id,
                assignedDeliveryPersonName: rider.name,
                assignedDeliveryPersonPhone: rider.phone,
                assignedDeliveryPersonLocality: rider.currentLocation || rider.locality,
                routingStatus: 'assigned',
                assignmentHistory: nextHistory,
                updatedAt: now
              }
            : d
        )
      );
      setRoutingAlerts((prev) =>
        prev.map((a) => (a.requestId === req.id ? { ...a, status: 'resolved', resolvedAt: now } : a))
      );
      routingAlerts
        .filter((a) => a.requestId === req.id && a.status === 'open')
        .forEach((a) => safeUpdateDoc(doc(db, 'routingAlerts', a.id), { status: 'resolved', resolvedAt: now }).catch(() => {}));
      safeUpdateDoc(doc(db, 'deliveries', req.id), {
        status: 'assigned',
        assignedDeliveryPersonId: rider.id,
        assignedDeliveryPersonName: rider.name,
        assignedDeliveryPersonPhone: rider.phone,
        assignedDeliveryPersonLocality: rider.currentLocation || rider.locality,
        routingStatus: 'assigned',
        assignmentHistory: nextHistory,
        updatedAt: now
      }).catch((err) => console.warn(err));
      logAdminAction('Locality Parcel Dispatch', `Assigned ${rider.name} to delivery ${req.id}`);
      return { allowed: true };
    }

    if (params.serviceCategory === 'ride') {
      const ride = rideBookings.find((r) => r.id === params.requestId);
      if (!ride) return { allowed: false, error: 'Ride booking not found.' };
      const reqLocality = ride.pickupLocality || ride.pickupLocation;
      const evaluation = getEligiblePartnersForRequest({
        serviceCategory: 'ride',
        requestLocality: reqLocality,
        requestedVehicleType: ride.vehicleType,
        config: routingConfig,
        drivers,
        partnerAccounts: combinedPartnerAccounts,
        localities
      });
      const selected = [...evaluation.eligible, ...evaluation.ineligible].find((r) => r.partnerId === params.partnerId);
      const driver = drivers.find((d) => d.id === params.partnerId);
      const validation = validateAndBuildAssignmentAudit({
        requestId: ride.id,
        serviceCategory: 'ride',
        requestLocality: reqLocality,
        report: selected,
        partnerRole: 'driver',
        assignedBy: adminActor,
        isReassignment: params.isReassignment
      });
      if (!validation.allowed || !driver) {
        return { allowed: false, error: validation.errorMessage || 'Selected driver is ineligible.' };
      }
      const nextHistory = [...(ride.assignmentHistory || []), validation.auditEntry];
      setRideBookings((prev) =>
        prev.map((r) =>
          r.id === ride.id
            ? {
                ...r,
                status: 'CONFIRMED',
                driverId: driver.id,
                driverName: driver.name,
                driverPhone: driver.phone,
                vehicleNumber: driver.vehicleNumber,
                driverLocality: driver.currentLocation || driver.locality,
                agreedFare: r.agreedFare || r.customerProposedFare || r.estimatedFare,
                routingStatus: 'assigned',
                assignmentHistory: nextHistory,
                updatedAt: now
              }
            : r
        )
      );
      setRoutingAlerts((prev) =>
        prev.map((a) => (a.requestId === ride.id ? { ...a, status: 'resolved', resolvedAt: now } : a))
      );
      routingAlerts
        .filter((a) => a.requestId === ride.id && a.status === 'open')
        .forEach((a) => safeUpdateDoc(doc(db, 'routingAlerts', a.id), { status: 'resolved', resolvedAt: now }).catch(() => {}));
      safeUpdateDoc(doc(db, 'rideBookings', ride.id), {
        status: 'CONFIRMED',
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleNumber: driver.vehicleNumber,
        driverLocality: driver.currentLocation || driver.locality,
        routingStatus: 'assigned',
        assignmentHistory: nextHistory,
        updatedAt: now
      }).catch((err) => console.warn(err));
      logAdminAction('Locality Ride Dispatch', `Assigned ${driver.name} (${driver.vehicleType}) to ride ${ride.id}`);
      return { allowed: true };
    }

    if (params.serviceCategory === 'service') {
      const req = serviceRequests.find((s) => s.id === params.requestId);
      if (!req) return { allowed: false, error: 'Service request not found.' };
      const reqLocality = req.locality || req.address;
      const evaluation = getEligiblePartnersForRequest({
        serviceCategory: 'service',
        requestLocality: reqLocality,
        requestedServiceCategory: req.category,
        config: routingConfig,
        serviceProviders,
        partnerAccounts: combinedPartnerAccounts,
        localities
      });
      const selected = [...evaluation.eligible, ...evaluation.ineligible].find((r) => r.partnerId === params.partnerId);
      const provider = serviceProviders.find((p) => p.id === params.partnerId);
      const validation = validateAndBuildAssignmentAudit({
        requestId: req.id,
        serviceCategory: 'service',
        requestLocality: reqLocality,
        report: selected,
        partnerRole: 'service_provider',
        assignedBy: adminActor,
        isReassignment: params.isReassignment
      });
      if (!validation.allowed || !provider) {
        return { allowed: false, error: validation.errorMessage || 'Selected service partner is ineligible.' };
      }
      const nextHistory = [...(req.assignmentHistory || []), validation.auditEntry];
      setServiceRequests((prev) =>
        prev.map((s) =>
          s.id === req.id
            ? {
                ...s,
                status: 'accepted',
                providerId: provider.id,
                ...(provider.ownerId ? { providerOwnerId: provider.ownerId } : {}),
                providerName: provider.name,
                providerLocality: provider.currentLocation || provider.serviceArea,
                routingStatus: 'assigned',
                assignmentHistory: nextHistory,
                updatedAt: now
              }
            : s
        )
      );
      setRoutingAlerts((prev) =>
        prev.map((a) => (a.requestId === req.id ? { ...a, status: 'resolved', resolvedAt: now } : a))
      );
      routingAlerts
        .filter((a) => a.requestId === req.id && a.status === 'open')
        .forEach((a) => safeUpdateDoc(doc(db, 'routingAlerts', a.id), { status: 'resolved', resolvedAt: now }).catch(() => {}));
      safeUpdateDoc(doc(db, 'serviceRequests', req.id), {
        status: 'accepted',
        providerId: provider.id,
        ...(provider.ownerId ? { providerOwnerId: provider.ownerId } : {}),
        providerName: provider.name,
        providerLocality: provider.currentLocation || provider.serviceArea,
        routingStatus: 'assigned',
        assignmentHistory: nextHistory,
        updatedAt: now
      }).catch((err) => console.warn(err));
      logAdminAction('Locality Service Dispatch', `Assigned ${provider.name} to service request ${req.id}`);
      return { allowed: true };
    }

    return { allowed: false, error: 'Unsupported service category.' };
  };

  // --- NAVIGATION HELPERS ---
  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab);
    setActiveServiceView(null);
  };

  const handleSelectService = (service: ServiceType) => {
    if (service === 'shopping') {
      setCurrentTab('categories');
      setActiveServiceView(null);
    } else if (service === 'emergency_doctor') {
      setIsEmergencyDoctorModalOpen(true);
    } else {
      setActiveServiceView(service);
    }
  };

  const activeCustomerUid = firebaseUser?.uid || null;

  const enrichOrderWithReturnComplaint = (order: Order): Order => {
    if (order.returnRequest) return order;
    const match = complaints.find(
      (c) => c.type === 'return_request' && c.orderId === order.id && c.returnReason
    );
    if (!match || !match.returnReason) return order;
    const derivedReturn: OrderReturnRequest = {
      id: match.id,
      orderId: order.id,
      customerId: match.userId || order.customerId || '',
      customerName: match.customerName || order.customerName,
      customerPhone: match.customerPhone || order.customerPhone,
      shopId: match.shopId || order.shopId,
      shopName: match.shopName || order.shopName,
      reason: match.returnReason,
      description: match.customerDescription,
      photoEvidenceUrl: match.photoEvidenceUrl,
      status: match.returnStatus || (match.status === 'resolved' ? 'approved' : 'pending_review'),
      reviewNotes: match.resolutionNotes,
      reviewedBy: match.reviewedBy,
      requestedAt: match.createdAt,
      reviewedAt: match.reviewedAt
    };
    return { ...order, returnRequest: derivedReturn };
  };

  const scopedCustomerOrders = activeCustomerUid
    ? customerOrders
        .filter((o) => o.customerId === activeCustomerUid)
        .map(enrichOrderWithReturnComplaint)
    : [];

  const enrichedPartnerOrders = orders.map(enrichOrderWithReturnComplaint);

  const activeTrackedOrder =
    trackedOrder && activeCustomerUid && trackedOrder.customerId === activeCustomerUid
      ? scopedCustomerOrders.find((o) => o.id === trackedOrder.id) || enrichOrderWithReturnComplaint(trackedOrder)
      : null;

  const handleOpenActiveTracker = () => {
    if (scopedCustomerOrders.length > 0) {
      setTrackedOrder(scopedCustomerOrders[0]);
    } else {
      setCurrentTab('orders');
    }
  };

  // Products visible to customer: strictly require approved shopStatus, existing approved parent shop, and non-suspended shopkeeper account
  const approvedProducts = products.filter((p) => {
    if (!p.shopId) return false;
    if (p.shopStatus && p.shopStatus !== 'approved') return false;
    const parentShop = shops.find((s) => s.id === p.shopId);
    if (!parentShop || parentShop.status !== 'approved') return false;
    if (combinedPartnerAccounts.length > 0) {
      const suspendedOwner = combinedPartnerAccounts.some(
        (a) =>
          a.role === 'shopkeeper' &&
          a.status === 'suspended' &&
          (a.linkedEntityId === p.shopId || (parentShop.ownerId && a.uid === parentShop.ownerId))
      );
      if (suspendedOwner) return false;
    }
    return p.isAvailable !== false && p.inStock !== false;
  });

  const filteredByLocality = filterProductsByLocality(approvedProducts, shops, currentLocation, true, localities);
  const visibleCustomerProducts = filteredByLocality.localProducts.length > 0
    ? [...filteredByLocality.localProducts, ...filteredByLocality.nearbyProducts]
    : approvedProducts;

  const activeOrdersCount = scopedCustomerOrders.filter(
    (o) => ['pending', 'placed', 'confirmed', 'preparing', 'ready_for_dispatch', 'packed', 'out_for_delivery'].includes(o.status)
  ).length;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ----------------------------------------------------
  // ROUTE 1: SUPER ADMIN DASHBOARD
  // ----------------------------------------------------
  if (portalMode === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-900/90 backdrop-blur-xs flex items-center justify-center p-4">
          <AdminAuthModal
            isOpen={true}
            onClose={() => {
              setAdminAuthError('');
              setIsAdminAuthModalOpen(false);
              setPortalMode('customer');
            }}
            onLoginSuccess={() => {
              setAdminAuthError('');
              setIsAdminAuthModalOpen(false);
              setPortalMode('admin');
            }}
            allowedEmail={ADMIN_EMAIL}
            externalError={adminAuthError}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-purple-200">
        <div className="w-full max-w-lg bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <AdminDashboard
            onSwitchPortal={() => {
              setIsPortalSwitcherOpen(true);
            }}
            onLogout={handleAdminLogout}
            shops={shops}
            onUpdateShopStatus={(shopId, status) => handleUpdateShopStatusUnified(shopId, status)}
            onAdminUpdateShop={handleAdminUpdateShop}
            orders={enrichedPartnerOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onReviewReturnRequest={handleReviewReturnRequest}
            products={products}
            drivers={drivers}
            onUpdateDriverStatus={handleUpdateDriverStatus}
            rideBookings={rideBookings}
            deliveryPersons={deliveryPersons}
            onUpdateDeliveryPersonStatus={handleUpdateDeliveryPersonStatus}
            deliveries={deliveries}
            onAssignDelivery={handleAssignDelivery}
            serviceProviders={serviceProviders}
            onUpdateServiceProviderStatus={handleUpdateServiceProviderStatus}
            jobListings={jobListings}
            onUpdateJobStatus={handleUpdateJobStatus}
            complaints={complaints}
            onResolveComplaint={handleResolveComplaint}
            adminActivities={adminActivities}
            scrapRequests={scrapRequests}
            onUpdateScrapStatus={handleUpdateScrapStatus}
            adminEmail={firebaseUser?.email || ''}
            localities={localities}
            onAddLocality={handleAddLocality}
            onUpdateLocality={handleUpdateLocality}
            onDeleteLocality={handleDeleteLocality}
            doctors={doctors}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            emergencyDoctorRequests={emergencyDoctorRequests}
            onUpdateEmergencyDoctorRequestStatus={handleUpdateEmergencyDoctorRequestStatus}
            customers={adminCustomers}
            partnerAccounts={combinedPartnerAccounts}
            onCreatePartnerAccount={handleCreatePartnerAccount}
            onTogglePartnerAccountStatus={handleTogglePartnerAccountStatus}
            routingConfig={routingConfig}
            routingAlerts={routingAlerts}
            onUpdateRoutingConfig={handleUpdateRoutingConfig}
            onAssignPartnerWithRouting={handleAssignPartnerWithRouting}
            onResolveRoutingAlert={handleResolveRoutingAlert}
            serviceRequests={serviceRequests}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={handleAdminLogout}
          />
        </div>
      </div>
    );
  }

  const renderPartnerGate = (requiredRole: PartnerRoleType): React.ReactNode | null => {
    if (isAdminAuthenticated) return null;

    if (!isPartnerAccountResolved) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-5 text-center space-y-2 max-w-xs w-full">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold">Verifying Authorized Role...</p>
            <p className="text-xs text-slate-400">Checking Firebase Authentication & Admin assignment</p>
          </div>
        </div>
      );
    }

    const isEntityRole =
      requiredRole === 'shopkeeper' ||
      requiredRole === 'driver' ||
      requiredRole === 'delivery' ||
      requiredRole === 'doctor' ||
      requiredRole === 'service_provider';

    const linkedEntity = (() => {
      if (!activePartnerAccount || activePartnerAccount.role !== requiredRole || !activePartnerAccount.linkedEntityId) {
        return undefined;
      }
      const eid = activePartnerAccount.linkedEntityId;
      if (requiredRole === 'shopkeeper') return shops.find((x) => x.id === eid) || (shop.id === eid ? shop : undefined);
      if (requiredRole === 'driver') return drivers.find((x) => x.id === eid) || (currentDriver.id === eid ? currentDriver : undefined);
      if (requiredRole === 'delivery') return deliveryPersons.find((x) => x.id === eid) || (currentRider.id === eid ? currentRider : undefined);
      if (requiredRole === 'doctor') return doctors.find((x) => x.id === eid) || (currentDoctor.id === eid ? currentDoctor : undefined);
      if (requiredRole === 'service_provider') return serviceProviders.find((x) => x.id === eid) || (currentProvider.id === eid ? currentProvider : undefined);
      return undefined;
    })();

    const isAccountSuspended = activePartnerAccount?.role === requiredRole && activePartnerAccount.status === 'suspended';
    const isLinkedEntitySuspendedOrRejected = Boolean(
      linkedEntity && (linkedEntity.status === 'suspended' || linkedEntity.status === 'rejected')
    );
    const isMissingLinkedEntity = Boolean(
      isEntityRole && activePartnerAccount?.role === requiredRole && (!activePartnerAccount.linkedEntityId || !linkedEntity)
    );
    const isLinkedEntityPending = Boolean(linkedEntity && linkedEntity.status === 'pending');

    const isAuthorizedForRole = Boolean(
      firebaseUser &&
      !firebaseUser.isAnonymous &&
      activePartnerAccount &&
      activePartnerAccount.status === 'active' &&
      activePartnerAccount.role === requiredRole &&
      (!isEntityRole || (Boolean(activePartnerAccount.linkedEntityId) && Boolean(linkedEntity) && linkedEntity!.status === 'approved'))
    );

    if (isAuthorizedForRole) return null;

    if (
      firebaseUser &&
      !firebaseUser.isAnonymous &&
      activePartnerAccount &&
      activePartnerAccount.role === requiredRole &&
      (isAccountSuspended || isLinkedEntitySuspendedOrRejected || isMissingLinkedEntity || isLinkedEntityPending)
    ) {
      const restrictionBadge = isLinkedEntityPending
        ? 'Pending Approval'
        : isMissingLinkedEntity
          ? 'Entity Link Required'
          : 'Account Suspended';
      const restrictionTitle = isLinkedEntityPending
        ? 'Business Profile Awaiting Verification'
        : isMissingLinkedEntity
          ? 'Linked Business Entity Not Found'
          : 'Access Restricted by Super Admin';
      const restrictionMessage = isLinkedEntityPending
        ? `Your ${requiredRole.replace('_', ' ')} partner account (${activePartnerAccount.displayName}) is waiting for Super Admin profile approval before dashboard operations are unlocked.`
        : isMissingLinkedEntity
          ? `Your ${requiredRole.replace('_', ' ')} partner account (${activePartnerAccount.displayName}) does not have an active linked business record. Please contact Super Admin.`
          : `Your ${requiredRole.replace('_', ' ')} partner account (${activePartnerAccount.displayName}) is currently suspended. Protected operations, listings, and new assignments are paused while historical records remain safely preserved.`;

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-2xl">
              !
            </div>
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                {restrictionBadge}
              </span>
              <h2 className="text-lg font-black text-slate-900">{restrictionTitle}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{restrictionMessage}</p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPortalMode('customer')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Return to Customer Marketplace
              </button>
              <button
                type="button"
                onClick={handlePartnerLogout}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900/95 backdrop-blur-xs flex items-center justify-center p-4">
        <PartnerAuthModal
          isOpen={true}
          expectedRole={requiredRole}
          onClose={() => setPortalMode('customer')}
          onLoginSuccess={handlePartnerLoginSuccess}
          onOpenAdminLogin={() => {
            setPortalMode('admin');
            setIsAdminAuthModalOpen(true);
          }}
        />
      </div>
    );
  };

  // ----------------------------------------------------
  // ROUTE 2: DRIVER PARTNER PORTAL (TAXI, AUTO, TOTO ONLY - NO BIKE TAXI)
  // ----------------------------------------------------
  if (portalMode === 'driver') {
    const blockedGate = renderPartnerGate('driver');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-emerald-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <DriverDashboard
            driver={currentDriver}
            rideBookings={rideBookings}
            routingConfig={routingConfig}
            partnerAccounts={combinedPartnerAccounts}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateDriver={handleUpdateDriver}
            onUpdateRideStatus={handleUpdateRideStatus}
            onAcceptRide={handleAcceptRide}
            onDriverCounterOffer={handleDriverCounterOffer}
            onDriverRejectRide={handleDriverRejectRide}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 3: DELIVERY FLEET PORTAL
  // ----------------------------------------------------
  if (portalMode === 'delivery') {
    const blockedGate = renderPartnerGate('delivery');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-sky-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <DeliveryDashboard
            rider={currentRider}
            deliveries={deliveries}
            assignedOrders={orders.filter((o) => o.riderId === currentRider.id)}
            routingConfig={routingConfig}
            partnerAccounts={combinedPartnerAccounts}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateRider={handleUpdateRider}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            onAcceptDelivery={handleAcceptDelivery}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 4: SERVICE PROVIDER PORTAL
  // ----------------------------------------------------
  if (portalMode === 'service_provider') {
    const blockedGate = renderPartnerGate('service_provider');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-amber-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ServiceProviderDashboard
            provider={currentProvider}
            isAdmin={isAdminAuthenticated}
            serviceRequests={serviceRequests}
            routingConfig={routingConfig}
            partnerAccounts={combinedPartnerAccounts}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateProvider={handleUpdateProvider}
            onUpdateServiceStatus={handleUpdateServiceStatus}
            onAcceptRequest={handleAcceptServiceRequest}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 5: EMPLOYER & JOBS PORTAL
  // ----------------------------------------------------
  if (portalMode === 'employer') {
    const blockedGate = renderPartnerGate('employer');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-purple-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <EmployerDashboard
            jobListings={jobListings}
            jobApplications={jobApplications}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onPostJob={handlePostJob}
            onUpdateApplicationStatus={handleUpdateJobApplicationStatus}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6: SHOPKEEPER MERCHANT DASHBOARD
  // ----------------------------------------------------
  if (portalMode === 'shopkeeper') {
    const blockedGate = renderPartnerGate('shopkeeper');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-emerald-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ShopkeeperDashboard
            shop={shop}
            isAdmin={isAdminAuthenticated}
            orders={enrichedPartnerOrders}
            products={products.filter((p) => !p.shopId || p.shopId === shop.id)}
            approvedRiders={approvedRiders}
            deliveryPersons={deliveryPersons}
            routingConfig={routingConfig}
            partnerAccounts={combinedPartnerAccounts}
            onSwitchToCustomer={() => handleSelectPortalMode('customer')}
            onUpdateShop={handleUpdateShop}
            onAdminChangeStatus={handleAdminChangeStatus}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onReviewReturnRequest={handleReviewReturnRequest}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleAvailability={handleToggleProductAvailability}
            localities={localities}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6.5: KABARI & SCRAP BUYER PORTAL
  // ----------------------------------------------------
  if (portalMode === 'kabari') {
    const blockedGate = renderPartnerGate('kabari');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-lime-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ScrapMarketplaceView
            onBackToHome={() => handleSelectPortalMode('customer')}
            user={user}
            currentLocality={currentLocation}
            scrapRequests={scrapRequests}
            publicScrapListings={publicScrapListings}
            isAdmin={isAdminAuthenticated}
            isAuthorizedBuyer={isAuthorizedKabariPartner}
            activeBuyerId={firebaseUser?.uid || ''}
            activeBuyerName={activePartnerAccount?.displayName || ''}
            onAddScrapRequest={handleAddScrapRequest}
            onSendOffer={handleSendScrapOffer}
            onAcceptOffer={handleAcceptScrapOffer}
            onUpdateScrapStatus={handleUpdateScrapStatus}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6.6: DOCTOR PARTNER PORTAL (MBBS & SPECIALISTS)
  // ----------------------------------------------------
  if (portalMode === 'doctor') {
    const blockedGate = renderPartnerGate('doctor');
    if (blockedGate) return blockedGate;

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-rose-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <DoctorDashboard
            doctor={currentDoctor}
            isAdmin={isAdminAuthenticated}
            onUpdateDoctor={handleUpdateDoctor}
            requests={emergencyDoctorRequests}
            onUpdateRequestStatus={handleUpdateEmergencyDoctorRequestStatus}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
            localities={localities}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={handleSelectPortalMode}
            userEmail={firebaseUser?.email || null}
            isAdmin={isAdminAuthenticated}
            partnerAccount={activePartnerAccount}
            onOpenPartnerLogin={() => {
              setIsPortalSwitcherOpen(false);
              setPartnerAuthExpectedRole(null);
              setIsPartnerAuthModalOpen(true);
            }}
            onLogout={isAdminAuthenticated ? handleAdminLogout : handlePartnerLogout}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 7: CUSTOMER PANEL (DEFAULT SUPER APP)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-emerald-200">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200/80">
        {isAdminAuthenticated && (
          <div className="bg-purple-950 text-white px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-purple-800">
            <span className="font-semibold text-purple-200 truncate">
              Admin Preview ({firebaseUser?.email})
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPortalMode('admin')}
                className="px-2 py-0.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
              >
                Return to Admin
              </button>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <Header
          currentLocation={currentLocation}
          currentPincode={currentPincode}
          language={language}
          onSelectLanguage={(lang) => {
            setLanguage(lang);
            try { localStorage.setItem('tb_language', lang); } catch (e) { console.warn(e); }
          }}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenMenu={() => setIsSideDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenPosterModal={() => setIsPosterModalOpen(true)}
          onOpenShopkeeper={() => handleSelectPortalMode('shopkeeper')}
          onOpenPortalSwitcher={() => setIsPortalSwitcherOpen(true)}
          onOpenUniversalQr={() => setIsUniversalQrOpen(true)}
          onOpenAuthModal={() => setIsCustomerAuthModalOpen(true)}
          cartCount={totalCartCount}
          notificationCount={notifications.filter((n) => !n.read).length}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim().length > 0 && currentTab !== 'categories') {
              setCurrentTab('categories');
              setActiveServiceView(null);
            }
          }}
          onSearchSubmit={() => {
            setCurrentTab('categories');
            setActiveServiceView(null);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {activeServiceView ? (
            /* Dedicated Service Screen */
            <>
              {activeServiceView === 'mobile' && (
                <MobileShopView
                  products={visibleCustomerProducts}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onBackToHome={() => setActiveServiceView(null)}
                  onOpenCart={() => setIsCartOpen(true)}
                  currentLocality={currentLocation}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}

              {activeServiceView === 'medical' && (
                <MedicalShopView
                  products={visibleCustomerProducts}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onBackToHome={() => setActiveServiceView(null)}
                  onOpenCart={() => setIsCartOpen(true)}
                  currentLocality={currentLocation}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}

              {activeServiceView === 'meat' && (
                <MeatShopView
                  products={visibleCustomerProducts}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onBackToHome={() => setActiveServiceView(null)}
                  onOpenCart={() => setIsCartOpen(true)}
                  currentLocality={currentLocation}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}

              {activeServiceView === 'scrap' && (
                <ScrapMarketplaceView
                  onBackToHome={() => setActiveServiceView(null)}
                  user={user}
                  currentLocality={currentLocation}
                  scrapRequests={scrapRequests}
                  publicScrapListings={publicScrapListings}
                  isAdmin={isAdminAuthenticated}
                  isAuthorizedBuyer={isAuthorizedKabariPartner}
                  activeBuyerId={firebaseUser?.uid || ''}
                  activeBuyerName={activePartnerAccount?.displayName || ''}
                  onAddScrapRequest={handleAddScrapRequest}
                  onSendOffer={handleSendScrapOffer}
                  onAcceptOffer={handleAcceptScrapOffer}
                  onUpdateScrapStatus={handleUpdateScrapStatus}
                />
              )}

              {(activeServiceView === 'toto' ||
                activeServiceView === 'auto' ||
                activeServiceView === 'taxi') && (
                <RideBookingView
                  initialVehicleType={activeServiceView}
                  currentLocation={currentLocation}
                  onBackToHome={() => setActiveServiceView(null)}
                  onBookRide={handleCustomerBookRide}
                  rideBookings={rideBookings}
                  onCustomerAcceptRiderOffer={handleCustomerAcceptRiderOffer}
                  onCustomerRejectOffer={handleCustomerRejectRiderOffer}
                  onCustomerCounterOffer={handleCustomerCounterBack}
                  onCancelRide={handleCustomerCancelRide}
                  customerId={firebaseUser?.uid || user.id}
                  customerName={user.name}
                  customerPhone={user.phone}
                  drivers={drivers}
                  approvedDrivers={approvedDrivers}
                  routingConfig={routingConfig}
                  partnerAccounts={combinedPartnerAccounts}
                  localities={localities}
                />
              )}

              {activeServiceView === 'delivery' && (
                <DeliveryView
                  currentLocation={currentLocation}
                  onBackToHome={() => setActiveServiceView(null)}
                  onRequestDelivery={handleCustomerRequestDelivery}
                  deliveryPersons={deliveryPersons}
                  routingConfig={routingConfig}
                  partnerAccounts={combinedPartnerAccounts}
                  localities={localities}
                />
              )}

              {activeServiceView === 'services' && (
                <ServicesView
                  currentLocation={currentLocation}
                  onBackToHome={() => setActiveServiceView(null)}
                  onRequestService={handleCustomerRequestService}
                  customerName={user.name}
                  customerPhone={user.phone}
                  serviceProviders={serviceProviders}
                  routingConfig={routingConfig}
                  partnerAccounts={combinedPartnerAccounts}
                  localities={localities}
                />
              )}

              {activeServiceView === 'jobs' && (
                <JobsView 
                  onBackToHome={() => setActiveServiceView(null)}
                  jobs={jobListings}
                  onApplyJob={handleCustomerApplyJob}
                />
              )}

              {activeServiceView === 'phones' && (
                <MobileShopView
                  products={visibleCustomerProducts}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onBackToHome={() => setActiveServiceView(null)}
                  onOpenCart={() => setIsCartOpen(true)}
                  currentLocality={currentLocation}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}
            </>
          ) : (
            /* Tab Screen */
            <>
              {currentTab === 'home' && (
                <HomeView
                  products={visibleCustomerProducts}
                  cart={cart}
                  currentLocation={currentLocation}
                  currentPincode={currentPincode}
                  language={language}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onSelectService={handleSelectService}
                  onTrackOrder={handleOpenActiveTracker}
                  onViewAllDeals={() => handleTabChange('categories')}
                  onOpenPosterModal={() => setIsPosterModalOpen(true)}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}

              {currentTab === 'categories' && (
                <CategoriesView
                  products={visibleCustomerProducts}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onBackToHome={() => handleTabChange('home')}
                  isCatalogLoading={isPublicCatalogLoading}
                />
              )}

              {currentTab === 'orders' && (
                <OrdersView
                  orders={scopedCustomerOrders}
                  currentCustomerUid={activeCustomerUid}
                  onBackToHome={() => handleTabChange('home')}
                  onTrackOrder={(order) => setTrackedOrder(order)}
                  onCancelOrder={handleCustomerCancelOrder}
                  onRequestReturn={handleCustomerRequestReturn}
                />
              )}

              {currentTab === 'account' && (
                <AccountView
                  user={user}
                  onUpdateUser={(updated) => {
                    const fbUser = auth.currentUser;
                    const authUid = fbUser?.uid;
                    const normalizedPhone = normalizePhoneE164(updated.phone) || updated.phone.trim();
                    const flags = getAuthFlags(fbUser, normalizedPhone);
                    const finalUpdated: UserProfile = {
                      ...updated,
                      phone: normalizedPhone,
                      ...(authUid ? { id: authUid, userId: authUid } : {}),
                      ...flags
                    };
                    setUser(finalUpdated);
                    setCurrentLocation(finalUpdated.location);
                    if (finalUpdated.pincode) setCurrentPincode(finalUpdated.pincode);
                    if (authUid) {
                      safeSetDoc(doc(db, 'customers', authUid), finalUpdated, { merge: true }).catch((err) => console.warn(err));
                    }
                  }}
                  onSelectLanguage={(lang) => {
                    setLanguage(lang as any);
                    try { localStorage.setItem('tb_language', lang); } catch (e) { console.warn(e); }
                  }}
                  localities={localities}
                  onOpenAuthModal={() => {
                    setCustomerAuthInitialStep('login');
                    setIsCustomerAuthModalOpen(true);
                  }}
                  onFileComplaint={handleCustomerFileComplaint}
                  complaints={complaints}
                  products={visibleCustomerProducts}
                  onAddToCart={handleAddToCart}
                  onNavigateTab={handleTabChange}
                  onTrackOrder={handleOpenActiveTracker}
                  onOpenCart={() => setIsCartOpen(true)}
                  onLogout={async () => {
                    clearCustomerScopedState();
                    await handleAuthSignOut();
                    setUser(createGuestUserProfile(currentLocation, currentPincode, user.language || 'en'));
                    setCustomerAuthInitialStep('login');
                    setIsCustomerAuthModalOpen(true);
                  }}
                />
              )}

              {currentTab === 'more' && (
                <MoreView
                  onSelectService={handleSelectService}
                  onOpenPosterModal={() => setIsPosterModalOpen(true)}
                  onOpenShopkeeper={() => handleSelectPortalMode('shopkeeper')}
                  onNavigateTab={handleTabChange}
                  onTrackOrder={handleOpenActiveTracker}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenPartnerPortal={() => setIsPortalSwitcherOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          activeOrdersCount={activeOrdersCount}
        />

        {/* Modals & Drawers */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onPlaceOrder={handlePlaceOrder}
          user={user}
          currentLocation={currentLocation}
          shops={shops}
          localities={localities}
        />

        <OrderTrackingModal
          isOpen={activeTrackedOrder !== null}
          onClose={() => setTrackedOrder(null)}
          order={activeTrackedOrder}
        />

        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          currentLocation={currentLocation}
          onSelectLocation={(loc, pin) => {
            setCurrentLocation(loc);
            if (pin) setCurrentPincode(pin);
            try {
              localStorage.setItem('tb_locality', loc);
              if (pin) localStorage.setItem('tb_pincode', pin);
            } catch (e) {
              console.warn(e);
            }
            setUser((prev) => ({ ...prev, location: loc, pincode: pin || prev.pincode }));
          }}
          localities={localities}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectDeal={() => handleTabChange('categories')}
          onSelectTrack={handleOpenActiveTracker}
        />

        <SideDrawer
          isOpen={isSideDrawerOpen}
          onClose={() => setIsSideDrawerOpen(false)}
          language={language}
          onSelectLanguage={(lang) => {
            setLanguage(lang);
            try { localStorage.setItem('tb_language', lang); } catch (e) { console.warn(e); }
          }}
          onSelectTab={handleTabChange}
          onSelectService={handleSelectService}
          onTrackOrder={handleOpenActiveTracker}
          onOpenPosterModal={() => setIsPosterModalOpen(true)}
          onOpenUniversalQr={() => {
            setIsSideDrawerOpen(false);
            setIsUniversalQrOpen(true);
          }}
          onOpenAuthModal={() => {
            setIsSideDrawerOpen(false);
            setCustomerAuthInitialStep('login');
            setIsCustomerAuthModalOpen(true);
          }}
          onOpenCart={() => {
            setIsSideDrawerOpen(false);
            setIsCartOpen(true);
          }}
          user={user}
          onLogout={async () => {
            setIsSideDrawerOpen(false);
            clearCustomerScopedState();
            await handleAuthSignOut();
            setUser(createGuestUserProfile(currentLocation, currentPincode, user.language || 'en'));
            setCustomerAuthInitialStep('login');
            setIsCustomerAuthModalOpen(true);
          }}
        />

        <PosterModal
          isOpen={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
        />

        <PortalSwitcherModal
          isOpen={isPortalSwitcherOpen}
          onClose={() => setIsPortalSwitcherOpen(false)}
          currentMode={portalMode}
          onSelectMode={handleSelectPortalMode}
          userEmail={firebaseUser?.email || null}
          isAdmin={isAdminAuthenticated}
          partnerAccount={activePartnerAccount}
          onOpenPartnerLogin={() => {
            setIsPortalSwitcherOpen(false);
            setPartnerAuthExpectedRole(null);
            setIsPartnerAuthModalOpen(true);
          }}
          onLogout={
            isAdminAuthenticated
              ? handleAdminLogout
              : activePartnerAccount
                ? handlePartnerLogout
                : undefined
          }
        />

        <UniversalQrModal
          isOpen={isUniversalQrOpen}
          onClose={() => setIsUniversalQrOpen(false)}
        />

        <EmergencyDoctorModal
          isOpen={isEmergencyDoctorModalOpen}
          onClose={() => setIsEmergencyDoctorModalOpen(false)}
          currentLocality={currentLocation}
          currentPincode={currentPincode}
          doctors={doctors}
          emergencyRequests={emergencyDoctorRequests}
          user={user}
          onRequestDoctor={handleRequestDoctor}
          localities={localities}
        />

        <CustomerAuthModal
          isOpen={isCustomerAuthModalOpen}
          onClose={() => {
            setCustomerAuthError('');
            setCustomerAuthInitialStep('login');
            setIsCustomerAuthModalOpen(false);
          }}
          currentUser={user}
          onLoginSuccess={(u) => {
            setUser(u);
            if (u.location) setCurrentLocation(u.location);
            if (u.pincode) setCurrentPincode(u.pincode);
            setCustomerAuthError('');
            setCustomerAuthInitialStep('login');
            setIsCustomerAuthModalOpen(false);
          }}
          onRegisterCustomer={handleRegisterCustomer}
          localities={localities}
          externalError={customerAuthError}
          onClearExternalError={() => setCustomerAuthError('')}
          initialStep={customerAuthInitialStep}
        />

        <PartnerAuthModal
          isOpen={isPartnerAuthModalOpen}
          expectedRole={partnerAuthExpectedRole}
          onClose={() => {
            setIsPartnerAuthModalOpen(false);
            setPartnerAuthExpectedRole(null);
          }}
          onLoginSuccess={handlePartnerLoginSuccess}
          onOpenAdminLogin={() => {
            setIsPartnerAuthModalOpen(false);
            setPartnerAuthExpectedRole(null);
            setPortalMode('admin');
            setIsAdminAuthModalOpen(true);
          }}
        />

        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onLoginSuccess={() => {
            setAdminAuthError('');
            setIsAdminAuthModalOpen(false);
            setPortalMode('admin');
          }}
          allowedEmail={ADMIN_EMAIL}
          externalError={adminAuthError}
        />

        {/* Real-time Global PWA Offline/Online Connectivity Banner */}
        <OfflineIndicator />
      </div>
    </div>
  );
}
