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
import { ShopkeeperAuthModal } from './components/shopkeeper/ShopkeeperAuthModal';
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
import { DoctorAuthModal } from './components/doctor/DoctorAuthModal';
import { CustomerAuthModal } from './components/customer/CustomerAuthModal';
import { DriverAuthModal } from './components/driver/DriverAuthModal';
import { AdminAuthModal } from './components/common/AdminAuthModal';

import { 
  ALL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_USER, 
  INITIAL_SHOP,
  INITIAL_SHOPS,
  INITIAL_DRIVERS,
  INITIAL_RIDE_BOOKINGS,
  INITIAL_DELIVERY_PERSONS,
  INITIAL_DELIVERY_REQUESTS,
  INITIAL_SERVICE_PROVIDERS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_JOB_LISTINGS,
  INITIAL_JOB_APPLICATIONS,
  INITIAL_COMPLAINTS,
  INITIAL_ADMIN_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SCRAP_REQUESTS,
  INITIAL_DOCTORS,
  INITIAL_EMERGENCY_REQUESTS
} from './data/mockData';
import { 
  SERVICE_LOCALITIES, 
  INITIAL_SERVICE_LOCALITIES, 
  rankShopsForCustomer, 
  filterProductsByLocality,
  getLocalityByName
} from './utils/hyperlocalRouting';

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
  LocalityInfo,
  AppNotification,
  Doctor,
  EmergencyDoctorRequest,
  EmergencyDoctorStatus,
  PublicShopCard,
  PublicProductCard,
  PublicDoctorCard,
  PublicServiceProviderCard,
  PublicJobCard,
  PublicRiderCard
} from './types';

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
  toPublicRiderCard
} from './utils/directorySanitizer';

import { 
  db, 
  auth, 
  handleFirestoreError, 
  safeSetDoc, 
  safeUpdateDoc,
  ensureAuthSession, 
  handleAuthSignOut, 
  getCurrentAuthUid 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, deleteDoc, collection, onSnapshot, query, where, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { normalizePhoneE164, phonesMatchNormalized } from './utils/phone';

export default function App() {
  // Portal Mode: customer, shopkeeper, admin, driver, delivery, service_provider, employer
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    try {
      const saved = localStorage.getItem('tb_portal_mode');
      return (saved as PortalMode) || 'customer';
    } catch {
      return 'customer';
    }
  });

  // Navigation State
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [activeServiceView, setActiveServiceView] = useState<ServiceType | null>(null);

  // Shopkeeper & Shops State
  const [shop, setShop] = useState<Shop>(() => {
    try {
      const saved = localStorage.getItem('tb_shop');
      return saved ? JSON.parse(saved) : INITIAL_SHOP;
    } catch {
      return INITIAL_SHOP;
    }
  });

  const [shops, setShops] = useState<Shop[]>(() => {
    try {
      const saved = localStorage.getItem('tb_shops');
      if (saved) return JSON.parse(saved);
      return INITIAL_SHOPS;
    } catch {
      return INITIAL_SHOPS;
    }
  });

  // Products State with Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tb_products');
      if (saved) return JSON.parse(saved);
      return ALL_PRODUCTS.map((p) => ({
        ...p,
        shopId: p.shopId || INITIAL_SHOP.id,
        shopStatus: 'approved',
        ownerId: p.ownerId || INITIAL_SHOP.ownerId,
        stock: p.stock !== undefined ? p.stock : 45,
        isAvailable: true
      }));
    } catch {
      return ALL_PRODUCTS.map((p) => ({
        ...p,
        shopId: p.shopId || INITIAL_SHOP.id,
        shopStatus: 'approved',
        ownerId: p.ownerId || INITIAL_SHOP.ownerId,
        stock: p.stock !== undefined ? p.stock : 45,
        isAvailable: true
      }));
    }
  });

  // Customer Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('tb_cart');
      return saved ? JSON.parse(saved) : [{ product: ALL_PRODUCTS[0], quantity: 1 }];
    } catch {
      return [{ product: ALL_PRODUCTS[0], quantity: 1 }];
    }
  });

  // Orders State (Shared across Customer, Shopkeeper, Admin, Delivery)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('tb_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // DRIVERS STATE (Taxi, Auto, Toto ONLY - No bike taxi)
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem('tb_drivers');
      return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
    } catch {
      return INITIAL_DRIVERS;
    }
  });

  // Active driver for Driver Dashboard simulation
  const [currentDriver, setCurrentDriver] = useState<Driver>(() => drivers[0] || INITIAL_DRIVERS[0]);

  // RIDE BOOKINGS STATE
  const [rideBookings, setRideBookings] = useState<RideBooking[]>(() => {
    try {
      const saved = localStorage.getItem('tb_ride_bookings');
      return saved ? JSON.parse(saved) : INITIAL_RIDE_BOOKINGS;
    } catch {
      return INITIAL_RIDE_BOOKINGS;
    }
  });

  // DELIVERY FLEET STATE
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(() => {
    try {
      const saved = localStorage.getItem('tb_delivery_persons');
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_PERSONS;
    } catch {
      return INITIAL_DELIVERY_PERSONS;
    }
  });

  // Active rider for Delivery Dashboard
  const [currentRider, setCurrentRider] = useState<DeliveryPerson>(() => deliveryPersons[0] || INITIAL_DELIVERY_PERSONS[0]);

  // Approved non-PII fleet rider cards (for Shopkeeper order dispatch selection)
  const [approvedRiders, setApprovedRiders] = useState<PublicRiderCard[]>(() =>
    INITIAL_DELIVERY_PERSONS.filter((r) => r.status === 'approved').map(toPublicRiderCard)
  );
  const [approvedPublicShopIds, setApprovedPublicShopIds] = useState<string[]>(() =>
    INITIAL_SHOPS.filter((s) => s.status === 'approved').map((s) => s.id)
  );
  const [isPublicCatalogLoading, setIsPublicCatalogLoading] = useState<boolean>(true);
  const syncedRemoteShopIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteProductIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteDoctorIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteProviderIdsRef = useRef<Set<string>>(new Set());
  const syncedRemoteJobIdsRef = useRef<Set<string>>(new Set());

  // PARCEL DELIVERIES
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>(() => {
    try {
      const saved = localStorage.getItem('tb_deliveries');
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_REQUESTS;
    } catch {
      return INITIAL_DELIVERY_REQUESTS;
    }
  });

  // SERVICE PROVIDERS
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>(() => {
    try {
      const saved = localStorage.getItem('tb_service_providers');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_PROVIDERS;
    } catch {
      return INITIAL_SERVICE_PROVIDERS;
    }
  });

  const [currentProvider, setCurrentProvider] = useState<ServiceProvider>(() => serviceProviders[0] || INITIAL_SERVICE_PROVIDERS[0]);

  // SERVICE REQUESTS
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    try {
      const saved = localStorage.getItem('tb_service_requests');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_REQUESTS;
    } catch {
      return INITIAL_SERVICE_REQUESTS;
    }
  });

  // JOB LISTINGS & APPLICATIONS
  const [jobListings, setJobListings] = useState<JobListing[]>(() => {
    try {
      const saved = localStorage.getItem('tb_job_listings');
      return saved ? JSON.parse(saved) : INITIAL_JOB_LISTINGS;
    } catch {
      return INITIAL_JOB_LISTINGS;
    }
  });

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    try {
      const saved = localStorage.getItem('tb_job_applications');
      return saved ? JSON.parse(saved) : INITIAL_JOB_APPLICATIONS;
    } catch {
      return INITIAL_JOB_APPLICATIONS;
    }
  });

  // COMPLAINTS & GRIEVANCES
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem('tb_complaints');
      return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
    } catch {
      return INITIAL_COMPLAINTS;
    }
  });

  // ADMIN AUDIT LOGS
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>(() => {
    try {
      const saved = localStorage.getItem('tb_admin_activities');
      return saved ? JSON.parse(saved) : INITIAL_ADMIN_ACTIVITIES;
    } catch {
      return INITIAL_ADMIN_ACTIVITIES;
    }
  });

  // APP NOTIFICATIONS
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('tb_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Customer User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('tb_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

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
  const [localities, setLocalities] = useState<LocalityInfo[]>(() => {
    try {
      const saved = localStorage.getItem('tb_localities');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_LOCALITIES;
    } catch {
      return INITIAL_SERVICE_LOCALITIES;
    }
  });

  // Scrap Marketplace Requests
  const [scrapRequests, setScrapRequests] = useState<ScrapRequest[]>(() => {
    try {
      const saved = localStorage.getItem('tb_scrap_requests');
      return saved ? JSON.parse(saved) : INITIAL_SCRAP_REQUESTS;
    } catch {
      return INITIAL_SCRAP_REQUESTS;
    }
  });

  // DOCTORS STATE
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('tb_doctors');
      return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  });

  const [currentDoctor, setCurrentDoctor] = useState<Doctor>(() => doctors[0] || INITIAL_DOCTORS[0]);

  // EMERGENCY DOCTOR REQUESTS
  const [emergencyDoctorRequests, setEmergencyDoctorRequests] = useState<EmergencyDoctorRequest[]>(() => {
    try {
      const saved = localStorage.getItem('tb_emergency_requests');
      return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_REQUESTS;
    } catch {
      return INITIAL_EMERGENCY_REQUESTS;
    }
  });

  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isShopAuthModalOpen, setIsShopAuthModalOpen] = useState(false);
  const [isPortalSwitcherOpen, setIsPortalSwitcherOpen] = useState(false);
  const [isUniversalQrOpen, setIsUniversalQrOpen] = useState(false);
  const [isEmergencyDoctorModalOpen, setIsEmergencyDoctorModalOpen] = useState(false);
  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false);
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [isDriverAuthModalOpen, setIsDriverAuthModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const ADMIN_EMAIL = 'taibaralir@gmail.com';
  const isAdminAuthenticated = Boolean(
    firebaseUser &&
    firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    firebaseUser.emailVerified === true
  );
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist portalMode
  useEffect(() => {
    try {
      localStorage.setItem('tb_portal_mode', portalMode);
    } catch (e) {
      console.warn(e);
    }
  }, [portalMode]);

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
    const authMethod: UserProfile['authMethod'] = hasExactPhoneMatch
      ? 'phone'
      : fbUser.email
        ? (fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email')
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

  // Synchronize Firebase Auth session across app reloads (Spark ₹0 plan)
  // Never assume authentication solely from tb_user in localStorage.
  // Never mark Firebase Anonymous Auth as phone-verified or account-verified.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let remoteProfile: Partial<UserProfile> = {};
        try {
          const snap = await getDoc(doc(db, 'customers', fbUser.uid));
          if (snap.exists()) {
            remoteProfile = snap.data() as Partial<UserProfile>;
          }
        } catch (err) {
          console.warn('Customer profile fetch notice:', (err as Error)?.message);
        }
        setUser((prev) => {
          const rawPhone = remoteProfile.phone || prev.phone;
          const effectivePhone = normalizePhoneE164(rawPhone) || rawPhone;
          const flags = getAuthFlags(fbUser, effectivePhone);
          const updated: UserProfile = {
            ...prev,
            ...remoteProfile,
            phone: effectivePhone,
            id: fbUser.uid,
            userId: fbUser.uid,
            ...flags
          };
          try { localStorage.setItem('tb_user', JSON.stringify(updated)); } catch (e) { console.warn(e); }
          return updated;
        });
      } else {
        const flags = getAuthFlags(null);
        setUser((prev) => ({
          ...prev,
          ...flags
        }));
      }
    });

    ensureAuthSession(false).then((currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist Shop to LocalStorage & sync to Firestore only when authenticated as owner or admin
  useEffect(() => {
    try {
      localStorage.setItem('tb_shop', JSON.stringify(shop));
    } catch (e) {
      console.warn(e);
    }
    if (
      firebaseUser &&
      portalMode === 'shopkeeper' &&
      (shop.ownerId === firebaseUser.uid || isAdminAuthenticated)
    ) {
      const payload = {
        ...shop,
        updatedAt: new Date().toISOString()
      };
      if (isAdminAuthenticated || shop.status === 'pending') {
        safeSetDoc(doc(db, 'shops', shop.id), payload, { merge: true }).catch((err) =>
          console.warn('Firestore shop sync info:', err.message)
        );
      } else {
        // Approved non-admin shop owners may only update non-privileged fields
        const { status: _s, isVerified: _v, ownerId: _o, ...safeShopFields } = payload;
        safeUpdateDoc(doc(db, 'shops', shop.id), safeShopFields).catch((err) =>
          console.warn('Firestore shop update info:', err.message)
        );
      }
    }
  }, [shop, firebaseUser, portalMode, isAdminAuthenticated]);

  // Persist Shops List
  useEffect(() => {
    try {
      localStorage.setItem('tb_shops', JSON.stringify(shops));
    } catch (e) {
      console.warn(e);
    }
  }, [shops]);

  // Persist Products
  useEffect(() => {
    try {
      localStorage.setItem('tb_products', JSON.stringify(products));
    } catch (e) {
      console.warn(e);
    }
  }, [products]);

  // Persist Cart
  useEffect(() => {
    try {
      localStorage.setItem('tb_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  // Persist Orders
  useEffect(() => {
    try {
      localStorage.setItem('tb_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn(e);
    }
  }, [orders]);

  // Persist Drivers
  useEffect(() => {
    try {
      localStorage.setItem('tb_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.warn(e);
    }
  }, [drivers]);

  // Persist Ride Bookings
  useEffect(() => {
    try {
      localStorage.setItem('tb_ride_bookings', JSON.stringify(rideBookings));
    } catch (e) {
      console.warn(e);
    }
  }, [rideBookings]);

  // Persist Deliveries & Delivery Persons
  useEffect(() => {
    try {
      localStorage.setItem('tb_deliveries', JSON.stringify(deliveries));
      localStorage.setItem('tb_delivery_persons', JSON.stringify(deliveryPersons));
    } catch (e) {
      console.warn(e);
    }
  }, [deliveries, deliveryPersons]);

  // Persist Services
  useEffect(() => {
    try {
      localStorage.setItem('tb_service_providers', JSON.stringify(serviceProviders));
      localStorage.setItem('tb_service_requests', JSON.stringify(serviceRequests));
    } catch (e) {
      console.warn(e);
    }
  }, [serviceProviders, serviceRequests]);

  // Persist Jobs
  useEffect(() => {
    try {
      localStorage.setItem('tb_job_listings', JSON.stringify(jobListings));
      localStorage.setItem('tb_job_applications', JSON.stringify(jobApplications));
    } catch (e) {
      console.warn(e);
    }
  }, [jobListings, jobApplications]);

  // Persist User
  useEffect(() => {
    try {
      localStorage.setItem('tb_user', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  }, [user]);

  // Persist Doctors
  useEffect(() => {
    try {
      localStorage.setItem('tb_doctors', JSON.stringify(doctors));
    } catch (e) {
      console.warn(e);
    }
  }, [doctors]);

  // Persist Emergency Doctor Requests
  useEffect(() => {
    try {
      localStorage.setItem('tb_emergency_requests', JSON.stringify(emergencyDoctorRequests));
    } catch (e) {
      console.warn(e);
    }
  }, [emergencyDoctorRequests]);

  // Helper to record admin activities (synced to Firestore only when verified Super Admin)
  const logAdminAction = (action: string, details: string) => {
    const act: AdminActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminEmail: firebaseUser?.email || 'taibaralir@gmail.com',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setAdminActivities((prev) => [act, ...prev]);
    if (isAdminAuthenticated) {
      safeSetDoc(doc(db, 'adminActivity', act.id), act).catch((err) =>
        console.warn('Firestore adminActivity sync:', err.message)
      );
    }
  };

  // Persist localities
  useEffect(() => {
    try {
      localStorage.setItem('tb_localities', JSON.stringify(localities));
    } catch (e) {
      console.warn(e);
    }
  }, [localities]);

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
        const hadRemoteShops = syncedRemoteShopIdsRef.current.size > 0;
        if (!snapshot.empty || hadRemoteShops) {
          const nextRemoteShopIds = new Set(remoteShops.map((s) => s.id));
          const removedShopIds = new Set(
            Array.from(syncedRemoteShopIdsRef.current).filter((id) => !nextRemoteShopIds.has(id))
          );
          setShops((prev) => mergeWithRemoteEviction(prev, remoteShops, syncedRemoteShopIdsRef));
          setApprovedPublicShopIds(remoteShops.map((s) => s.id));
          if (removedShopIds.size > 0) {
            setProducts((prev) => prev.filter((p) => !p.shopId || !removedShopIds.has(p.shopId)));
          }
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
        if (!snapshot.empty || syncedRemoteDoctorIdsRef.current.size > 0) {
          setDoctors((prev) => mergeWithRemoteEviction(prev, remoteDoctors, syncedRemoteDoctorIdsRef));
        }
      },
      (err) => console.warn('Firestore publicDoctors listener:', err.message)
    );

    const unsubPublicProviders = onSnapshot(
      query(collection(db, 'publicServiceProviders'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteProviders = snapshot.docs.map((d) =>
          fromPublicServiceProviderCard({ id: d.id, ...d.data() } as PublicServiceProviderCard)
        );
        if (!snapshot.empty || syncedRemoteProviderIdsRef.current.size > 0) {
          setServiceProviders((prev) =>
            mergeWithRemoteEviction(prev, remoteProviders, syncedRemoteProviderIdsRef)
          );
        }
      },
      (err) => console.warn('Firestore publicServiceProviders listener:', err.message)
    );

    const unsubPublicJobs = onSnapshot(
      query(collection(db, 'publicJobs'), where('status', '==', 'approved')),
      (snapshot) => {
        const remoteJobs = snapshot.docs.map((d) =>
          fromPublicJobCard({ id: d.id, ...d.data() } as PublicJobCard)
        );
        if (!snapshot.empty || syncedRemoteJobIdsRef.current.size > 0) {
          setJobListings((prev) => mergeWithRemoteEviction(prev, remoteJobs, syncedRemoteJobIdsRef));
        }
      },
      (err) => console.warn('Firestore publicJobs listener:', err.message)
    );

    return () => {
      unsubPublicShops();
      unsubPublicDoctors();
      unsubPublicProviders();
      unsubPublicJobs();
    };
  }, []);

  // Chunked publicProducts listener (<= 10 approved shopIds per query so isShopApproved() rule stays under Firestore's 10-get limit)
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
    for (let i = 0; i < uniqueShopIds.length; i += 10) {
      const chunk = uniqueShopIds.slice(i, i + 10);
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

  // Authenticated user-scoped listeners (strictly filtered by request.auth.uid to satisfy firestore.rules)
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) return;

    const unsubs: (() => void)[] = [
      onSnapshot(
        query(collection(db, 'publicRiders'), where('status', '==', 'approved')),
        (snap) => {
          if (!snap.empty) {
            const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicRiderCard));
            setApprovedRiders(cards);
          }
        },
        (err) => console.warn('Firestore publicRiders listener:', err.message)
      )
    ];

    if (isAdminAuthenticated) {
      unsubs.push(
        onSnapshot(collection(db, 'orders'), (snap) => {
          if (!snap.empty) {
            setOrders((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
          }
        }, (err) => console.warn('Admin orders listener:', err.message)),
        onSnapshot(collection(db, 'complaints'), (snap) => {
          if (!snap.empty) {
            setComplaints((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint))));
          }
        }, (err) => console.warn('Admin complaints listener:', err.message)),
        onSnapshot(collection(db, 'emergencyDoctorRequests'), (snap) => {
          if (!snap.empty) {
            setEmergencyDoctorRequests((prev) =>
              mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyDoctorRequest)))
            );
          }
        }, (err) => console.warn('Admin emergency requests listener:', err.message)),
        onSnapshot(collection(db, 'shops'), (snap) => {
          if (!snap.empty) {
            setShops((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop))));
          }
        }, (err) => console.warn('Admin shops listener:', err.message)),
        onSnapshot(collection(db, 'products'), (snap) => {
          if (!snap.empty) {
            setProducts((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))));
          }
        }, (err) => console.warn('Admin products listener:', err.message)),
        onSnapshot(collection(db, 'drivers'), (snap) => {
          if (!snap.empty) {
            setDrivers((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver))));
          }
        }, (err) => console.warn('Admin drivers listener:', err.message)),
        onSnapshot(collection(db, 'deliveryPersons'), (snap) => {
          if (!snap.empty) {
            setDeliveryPersons((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPerson))));
          }
        }, (err) => console.warn('Admin deliveryPersons listener:', err.message)),
        onSnapshot(collection(db, 'doctors'), (snap) => {
          if (!snap.empty) {
            setDoctors((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor))));
          }
        }, (err) => console.warn('Admin doctors listener:', err.message)),
        onSnapshot(collection(db, 'serviceProviders'), (snap) => {
          if (!snap.empty) {
            setServiceProviders((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceProvider))));
          }
        }, (err) => console.warn('Admin serviceProviders listener:', err.message)),
        onSnapshot(collection(db, 'serviceRequests'), (snap) => {
          if (!snap.empty) {
            setServiceRequests((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))));
          }
        }, (err) => console.warn('Admin serviceRequests listener:', err.message)),
        onSnapshot(collection(db, 'jobs'), (snap) => {
          if (!snap.empty) {
            setJobListings((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing))));
          }
        }, (err) => console.warn('Admin jobs listener:', err.message)),
        onSnapshot(collection(db, 'jobApplications'), (snap) => {
          if (!snap.empty) {
            setJobApplications((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication))));
          }
        }, (err) => console.warn('Admin jobApplications listener:', err.message)),
        onSnapshot(collection(db, 'scrapRequests'), (snap) => {
          if (!snap.empty) {
            setScrapRequests((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScrapRequest))));
          }
        }, (err) => console.warn('Admin scrapRequests listener:', err.message)),
        onSnapshot(collection(db, 'rideBookings'), (snap) => {
          if (!snap.empty) {
            setRideBookings((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as RideBooking))));
          }
        }, (err) => console.warn('Admin rideBookings listener:', err.message)),
        onSnapshot(collection(db, 'deliveries'), (snap) => {
          if (!snap.empty) {
            setDeliveries((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest))));
          }
        }, (err) => console.warn('Admin deliveries listener:', err.message))
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'orders'), where('customerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setOrders((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
            }
          },
          (err) => console.warn('Customer orders listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'complaints'), where('userId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setComplaints((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint))));
            }
          },
          (err) => console.warn('Customer complaints listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'emergencyDoctorRequests'), where('patientUserId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setEmergencyDoctorRequests((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmergencyDoctorRequest)))
              );
            }
          },
          (err) => console.warn('Customer emergency requests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'rideBookings'), where('customerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setRideBookings((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as RideBooking)))
              );
            }
          },
          (err) => console.warn('Customer rides listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'deliveries'), where('customerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setDeliveries((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest)))
              );
            }
          },
          (err) => console.warn('Customer deliveries listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'scrapRequests'), where('customerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setScrapRequests((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScrapRequest)))
              );
            }
          },
          (err) => console.warn('Customer scrap listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'serviceRequests'), where('customerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setServiceRequests((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest)))
              );
            }
          },
          (err) => console.warn('Customer serviceRequests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'serviceRequests'), where('providerOwnerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setServiceRequests((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest)))
              );
            }
          },
          (err) => console.warn('Provider serviceRequests listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'jobs'), where('employerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setJobListings((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing)))
              );
            }
          },
          (err) => console.warn('Employer jobs listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'jobApplications'), where('applicantId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setJobApplications((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication)))
              );
            }
          },
          (err) => console.warn('Applicant jobApplications listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'shops'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
              setShops((prev) => mergeById(prev, owned));
              setShop(owned[0]);
            }
          },
          (err) => console.warn('Owner shops listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'products'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              setProducts((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))));
            }
          },
          (err) => console.warn('Owner products listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'doctors'), where('ownerId', '==', uid)),
          (snap) => {
            if (!snap.empty) {
              const owned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor));
              setDoctors((prev) => mergeById(prev, owned));
              setCurrentDoctor(owned[0]);
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
              setCurrentDriver(owned[0]);
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
              setCurrentRider(owned[0]);
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
              setCurrentProvider(owned[0]);
            }
          },
          (err) => console.warn('Owner serviceProviders listener:', err.message)
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser?.uid, isAdminAuthenticated]);

  // Scoped shopkeeper orders, approved rider orders/deliveries, & employer jobApplications listeners
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid || isAdminAuthenticated) return;

    const unsubs: (() => void)[] = [];
    if (shop.ownerId === uid && shop.status === 'approved') {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'orders'), where('shopId', '==', shop.id)),
          (snap) => {
            if (!snap.empty) {
              setOrders((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
            }
          },
          (err) => console.warn('Shopkeeper orders listener:', err.message)
        )
      );
    }

    const ownedApprovedRiderIds = deliveryPersons
      .filter((p) => p.ownerId === uid && p.status === 'approved')
      .map((p) => p.id);
    for (let i = 0; i < ownedApprovedRiderIds.length; i += 10) {
      const riderChunk = ownedApprovedRiderIds.slice(i, i + 10);
      unsubs.push(
        onSnapshot(
          query(collection(db, 'deliveries'), where('assignedDeliveryPersonId', 'in', riderChunk)),
          (snap) => {
            if (!snap.empty) {
              setDeliveries((prev) =>
                mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRequest)))
              );
            }
          },
          (err) => console.warn('Rider deliveries listener:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'orders'), where('riderId', 'in', riderChunk)),
          (snap) => {
            if (!snap.empty) {
              setOrders((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
            }
          },
          (err) => console.warn('Rider assigned orders listener:', err.message)
        )
      );
    }

    const ownedJobIds = jobListings.filter((j) => j.employerId === uid).map((j) => j.id);
    for (let i = 0; i < ownedJobIds.length; i += 10) {
      const chunk = ownedJobIds.slice(i, i + 10);
      unsubs.push(
        onSnapshot(
          query(collection(db, 'jobApplications'), where('jobId', 'in', chunk)),
          (snap) => {
            if (!snap.empty) {
              setJobApplications((prev) => mergeById(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication))));
            }
          },
          (err) => console.warn('Employer jobApplications listener:', err.message)
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser?.uid, isAdminAuthenticated, shop.id, shop.ownerId, shop.status, deliveryPersons, jobListings]);

  // --- LOCALITY HANDLERS ---
  const handleAddLocality = (newLoc: LocalityInfo) => {
    setLocalities((prev) => {
      if (prev.some((l) => l.name.toLowerCase() === newLoc.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newLoc];
    });
    if (isAdminAuthenticated) {
      safeSetDoc(doc(db, 'localities', newLoc.id), newLoc, { merge: true }).catch((err) => console.warn(err));
    }
    logAdminAction('Locality Added', `Added ${newLoc.name} (PIN: ${newLoc.pincode}) under ${newLoc.parentArea}`);
  };

  const handleUpdateLocality = (localityId: string, updated: Partial<LocalityInfo>) => {
    setLocalities((prev) =>
      prev.map((l) => (l.id === localityId ? { ...l, ...updated, updatedAt: new Date().toISOString() } : l))
    );
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'localities', localityId), {
        ...updated,
        updatedAt: new Date().toISOString()
      }).catch((err) => console.warn(err));
    }
    logAdminAction('Locality Updated', `Updated locality ${localityId}`);
  };

  const handleDeleteLocality = (localityId: string) => {
    setLocalities((prev) => prev.filter((l) => l.id !== localityId));
    if (isAdminAuthenticated) {
      deleteDoc(doc(db, 'localities', localityId)).catch((err) => console.warn(err));
    }
    logAdminAction('Locality Deleted', `Deleted locality ${localityId}`);
  };

  // --- CART & ORDER HANDLERS ---
  const handleAddToCart = (product: Product, prescriptionUrl?: string, selectedWeightGrams?: number) => {
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
  const handleAddScrapRequest = async (req: ScrapRequest) => {
    const authUid = await resolveAuthUid();
    const enrichedReq: ScrapRequest = {
      ...req,
      customerId: authUid || req.customerId || ''
    };
    setScrapRequests((prev) => {
      const updated = [enrichedReq, ...prev];
      try {
        localStorage.setItem('tb_scrap_requests', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    if (authUid) {
      safeSetDoc(doc(db, 'scrapRequests', enrichedReq.id), enrichedReq).catch((err) => console.warn(err));
    }
  };

  // BACKEND REQUIRED: Cross-account buyer quotes & offer acceptance require Cloud Functions.
  const handleSendScrapOffer = (offer: ScrapOffer) => {
    if (!isAdminAuthenticated) {
      console.warn('Scrap offer submission requires BACKEND REQUIRED (Cloud Functions).');
      return;
    }
    const targetId = offer.requestId || offer.scrapRequestId;
    setScrapRequests((prev) => {
      const updated = prev.map((req) => {
        if (req.id === targetId) {
          const currentOffers = req.offers || [];
          return {
            ...req,
            offers: [...currentOffers, offer],
            status: 'offers_received' as const
          };
        }
        return req;
      });
      try {
        localStorage.setItem('tb_scrap_requests', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // BACKEND REQUIRED: Offer acceptance & buyer assignment require Cloud Functions.
  const handleAcceptScrapOffer = (
    requestId: string,
    offerId: string,
    buyerName: string,
    buyerPhone: string,
    amount: number
  ) => {
    if (!isAdminAuthenticated) {
      console.warn('Scrap offer acceptance requires BACKEND REQUIRED (Cloud Functions).');
      return;
    }
    setScrapRequests((prev) => {
      const updated = prev.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'accepted' as const,
            acceptedOfferId: offerId,
            assignedBuyerName: buyerName,
            assignedBuyerPhone: buyerPhone,
            finalAgreedAmount: amount
          };
        }
        return req;
      });
      try {
        localStorage.setItem('tb_scrap_requests', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleUpdateScrapStatus = (requestId: string, status: ScrapRequest['status']) => {
    const updatedAt = new Date().toISOString();
    setScrapRequests((prev) => {
      const updated = prev.map((req) => (req.id === requestId ? { ...req, status, updatedAt } : req));
      try {
        localStorage.setItem('tb_scrap_requests', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'scrapRequests', requestId), { status, updatedAt }).catch((err) => console.warn(err));
    }
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
  // On Spark (₹0), client submits order math matching (subtotal + deliveryFee - discount == total); Firestore rules verify approved shopId.
  const handlePlaceOrder = async (orderOrAddress: Order | string, paymentMethod?: string) => {
    const authUid = await resolveAuthUid();

    if (typeof orderOrAddress === 'object') {
      const matchedShop = shops.find((s) => s.id === orderOrAddress.shopId);
      const resolvedOwnerId = orderOrAddress.shopOwnerId || matchedShop?.ownerId || '';
      const newOrder: Order = {
        ...orderOrAddress,
        ...(resolvedOwnerId ? { shopOwnerId: resolvedOwnerId } : {}),
        customerId: authUid || orderOrAddress.customerId || ''
      };
      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      setTrackedOrder(newOrder);
      if (authUid) {
        safeSetDoc(doc(db, 'orders', newOrder.id), newOrder).catch((err) => console.warn(err));
      }
      return;
    }

    const deliveryAddress = orderOrAddress;
    const method = paymentMethod || 'Cash on Delivery';
    if (cart.length === 0) return;

    // Group items by shop for real multi-shop architecture
    const itemsByShop: Record<string, CartItem[]> = {};
    cart.forEach((item) => {
      const itemShopId = item.product.shopId || shop.id;
      if (!itemsByShop[itemShopId]) itemsByShop[itemShopId] = [];
      itemsByShop[itemShopId].push(item);
    });

    const newOrdersList: Order[] = Object.entries(itemsByShop).map(([orderShopId, shopItems]) => {
      const matchedShop = shops.find((s) => s.id === orderShopId) || shop;
      const subtotal = shopItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const deliveryFee = subtotal >= 500 ? 0 : 25;
      const discount = subtotal > 1000 ? 50 : 0;
      const total = Math.max(0, subtotal + deliveryFee - discount);
      const orderId = `TB-${Math.floor(1000 + Math.random() * 9000)}`;
      const resolvedOwnerId = matchedShop.ownerId || '';

      const newOrder: Order = {
        id: orderId,
        shopId: orderShopId,
        ...(resolvedOwnerId ? { shopOwnerId: resolvedOwnerId } : {}),
        shopName: matchedShop.name,
        customerId: authUid || '',
        customerName: user.name || 'Customer',
        customerPhone: user.phone || '',
        items: shopItems,
        subtotal,
        deliveryFee,
        discount,
        total,
        status: 'pending',
        date: 'Just Now',
        deliveryAddress: deliveryAddress || user.address,
        locality: currentLocation,
        estimatedDelivery: '30-45 mins',
        paymentMethod: method,
        riderName: 'Assigned on Dispatch',
        createdAt: new Date().toISOString()
      };

      if (authUid) {
        safeSetDoc(doc(db, 'orders', orderId), newOrder).catch((err) => {
          console.warn('Firestore order sync warning:', err.message);
        });
      }

      return newOrder;
    });

    setOrders((prev) => [...newOrdersList, ...prev]);

    // Update product stock counts locally (authoritative server decrement requires BACKEND REQUIRED)
    setProducts((prev) =>
      prev.map((prod) => {
        const orderedItem = cart.find((c) => c.product.id === prod.id);
        if (orderedItem && prod.stock !== undefined) {
          const newStock = Math.max(0, prod.stock - orderedItem.quantity);
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

    const firstOrder = newOrdersList[0];
    setTrackedOrder(firstOrder);
  };

  const handleUpdateOrderStatus = (
    orderId: string, 
    status: OrderStatus, 
    extraOrReason?: string | { rejectionReason?: string; riderId?: string; riderName?: string; riderPhone?: string }
  ) => {
    const reason = typeof extraOrReason === 'string' ? extraOrReason : extraOrReason?.rejectionReason;
    const riderId = typeof extraOrReason === 'object' ? extraOrReason.riderId : undefined;
    const riderName = typeof extraOrReason === 'object' ? extraOrReason.riderName : undefined;
    const riderPhone = typeof extraOrReason === 'object' ? extraOrReason.riderPhone : undefined;
    const updatedAt = new Date().toISOString();

    if (!isAdminAuthenticated && status === 'out_for_delivery' && !riderId) {
      console.warn('Shopkeeper dispatch requires selecting an approved fleet rider ID.');
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
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
      )
    );
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

  // --- SHOPKEEPER INVENTORY HANDLERS ---
  const handleUpdateShop = (updatedShop: Partial<Shop>) => {
    setShop((prev) => {
      const merged = { ...prev, ...updatedShop };
      setShops((sList) => sList.map((s) => (s.id === merged.id ? merged : s)));
      return merged;
    });
  };

  const syncShopApprovalToPublicAndProducts = async (shopId: string, newStatus: ShopApprovalStatus, targetShop?: Shop) => {
    if (!isAdminAuthenticated) return;
    const updatedAt = new Date().toISOString();
    try {
      const shopObj = targetShop || shops.find((s) => s.id === shopId);
      if (shopObj) {
        const publicCard = toPublicShopCard({
          ...shopObj,
          status: newStatus,
          isVerified: newStatus === 'approved',
          updatedAt
        });
        await safeSetDoc(doc(db, 'publicShops', shopId), publicCard, { merge: true });
      }
      const snap = await getDocs(query(collection(db, 'products'), where('shopId', '==', shopId)));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          const prodData = { id: d.id, ...d.data(), shopStatus: newStatus, updatedAt } as Product;
          batch.update(d.ref, { shopStatus: newStatus, updatedAt });
          batch.set(doc(db, 'publicProducts', d.id), toPublicProductCard(prodData), { merge: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Admin shop/product approval sync notice:', (err as Error)?.message);
    }
  };

  const handleAdminChangeStatus = (newStatus: ShopApprovalStatus) => {
    if (!isAdminAuthenticated) {
      console.warn('Blocked unauthenticated admin shop status change.');
      return;
    }
    const updatedAt = new Date().toISOString();
    handleUpdateShop({ status: newStatus, isVerified: newStatus === 'approved', updatedAt });
    setProducts((prev) =>
      prev.map((p) => (p.shopId === shop.id ? { ...p, shopStatus: newStatus, updatedAt } : p))
    );
    safeUpdateDoc(doc(db, 'shops', shop.id), {
      status: newStatus,
      isVerified: newStatus === 'approved',
      updatedAt
    }).catch((err) => console.warn(err));
    syncShopApprovalToPublicAndProducts(shop.id, newStatus, shop);
    logAdminAction('Shop Status Changed', `Updated shop "${shop.name}" status to ${newStatus}`);
  };

  const canModifyActiveShopProducts = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    return isAdminAuthenticated || (shop.ownerId === uid && shop.status === 'approved');
  };

  const handleAddProduct = (newProd: Partial<Product>) => {
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
    if (canModifyActiveShopProducts()) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'products', id), product);
      batch.set(doc(db, 'publicProducts', id), toPublicProductCard(product));
      batch.commit().catch((err) => console.warn(err));
    }
  };

  const handleUpdateProduct = (id: string, updated: Partial<Product>) => {
    const updatedAt = new Date().toISOString();
    const { shopStatus: _ss, ownerId: _oi, shopId: _si, id: _id, ...safeUpdated } = updated;
    const clientPatch = isAdminAuthenticated ? updated : safeUpdated;
    const currentProd = products.find((p) => p.id === id);
    const mergedProd = currentProd ? { ...currentProd, ...clientPatch, updatedAt } : null;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...clientPatch, updatedAt } : p))
    );
    if (canModifyActiveShopProducts()) {
      const batch = writeBatch(db);
      batch.update(doc(db, 'products', id), { ...clientPatch, updatedAt });
      if (mergedProd) {
        batch.set(doc(db, 'publicProducts', id), toPublicProductCard(mergedProd), { merge: true });
      }
      batch.commit().catch((err) => console.warn(err));
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (canModifyActiveShopProducts()) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'products', id));
      batch.delete(doc(db, 'publicProducts', id));
      batch.commit().catch((err) => console.warn(err));
    }
  };

  const handleToggleProductAvailability = (id: string) => {
    const target = products.find((p) => p.id === id);
    const newAvail = target?.isAvailable === false ? true : false;
    const updatedAt = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isAvailable: newAvail, inStock: newAvail, updatedAt } : p
      )
    );
    if (canModifyActiveShopProducts()) {
      const batch = writeBatch(db);
      batch.update(doc(db, 'products', id), {
        isAvailable: newAvail,
        inStock: newAvail,
        updatedAt
      });
      if (target) {
        batch.set(
          doc(db, 'publicProducts', id),
          toPublicProductCard({ ...target, isAvailable: newAvail, inStock: newAvail, updatedAt }),
          { merge: true }
        );
      }
      batch.commit().catch((err) => console.warn(err));
    }
  };

  // --- DRIVER & RIDE HANDLERS ---
  const handleUpdateDriver = (updated: Partial<Driver>) => {
    setCurrentDriver((prev) => {
      const next = { ...prev, ...updated };
      setDrivers((list) => list.map((d) => (d.id === next.id ? next : d)));
      if (auth.currentUser && (next.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
        const { status: _s, approvalStatus: _a, ownerId: _o, ...safeFields } = updated;
        const fieldsToWrite = isAdminAuthenticated ? updated : safeFields;
        safeUpdateDoc(doc(db, 'drivers', next.id), fieldsToWrite).catch((err) => console.warn(err));
      }
      return next;
    });
  };

  const handleUpdateDriverStatus = (driverId: string, status: ShopApprovalStatus) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status, approvalStatus: status } : d))
    );
    if (currentDriver.id === driverId) {
      setCurrentDriver((prev) => ({ ...prev, status, approvalStatus: status }));
    }
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'drivers', driverId), { status, approvalStatus: status }).catch((err) =>
        console.warn(err)
      );
    }
    logAdminAction('Driver Verification', `Updated driver ${driverId} status to ${status}`);
  };

  // BACKEND REQUIRED: Atomic multi-driver claiming & post-confirmation transitions require Cloud Functions.
  const handleUpdateRideStatus = (rideId: string, status: RideStatus) => {
    const updatedAt = new Date().toISOString();
    setRideBookings((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, status, updatedAt } : r))
    );
    const target = rideBookings.find((r) => r.id === rideId);
    if (auth.currentUser && (isAdminAuthenticated || target?.driverId)) {
      safeUpdateDoc(doc(db, 'rideBookings', rideId), { status, updatedAt }).catch((err) =>
        console.warn('Firestore ride status update notice:', err.message)
      );
    }
  };

  // BACKEND REQUIRED: Two drivers racing to accept the same ride must be arbitrated in a Cloud Function transaction.
  const handleAcceptRide = (
    rideId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    vehicleNumber: string,
    agreedFare?: number
  ) => {
    setRideBookings((prev) =>
      prev.map((r) => {
        if (r.id !== rideId) return r;
        if (r.status === 'CONFIRMED' || r.status === 'accepted') {
          return r;
        }
        const finalFare = agreedFare !== undefined ? agreedFare : (r.customerProposedFare || r.estimatedFare);
        const acceptedOffer: FareOffer = {
          id: `offer-${Date.now()}-dacc`,
          offeredBy: 'driver',
          amount: finalFare,
          driverId,
          driverName,
          driverPhone,
          status: 'accepted',
          timestamp: new Date().toISOString(),
          roundNumber: (r.currentRound || 1) + 1
        };

        return {
          ...r,
          status: 'CONFIRMED',
          driverId,
          driverName,
          driverPhone,
          vehicleNumber,
          agreedFare: finalFare,
          activeDriverOffers: [],
          negotiationHistory: [...(r.negotiationHistory || []), acceptedOffer],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const handleDriverCounterOffer = (
    rideId: string,
    driverObj: Driver,
    counterAmount: number,
    note?: string
  ) => {
    setRideBookings((prev) =>
      prev.map((r) => {
        if (r.id !== rideId) return r;
        if (r.status === 'CONFIRMED' || r.status === 'COMPLETED' || r.status === 'CANCELLED') {
          return r;
        }
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
          timestamp: new Date().toISOString(),
          roundNumber: (r.currentRound || 1) + 1,
          expiresAt: new Date(Date.now() + 120000).toISOString()
        };

        const updatedHistory = [...(r.negotiationHistory || []), newOffer];
        return {
          ...r,
          status: 'COUNTER_OFFERED',
          activeDriverOffers: [newOffer],
          negotiationHistory: updatedHistory,
          currentRound: (r.currentRound || 1) + 1,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const handleDriverRejectRide = (rideId: string, driverId: string) => {
    setRideBookings((prev) =>
      prev.map((r) => {
        if (r.id !== rideId) return r;
        const rejectedOffer: FareOffer = {
          id: `reject-${Date.now()}-${driverId}`,
          offeredBy: 'driver',
          amount: r.customerProposedFare || r.estimatedFare,
          driverId,
          status: 'rejected',
          timestamp: new Date().toISOString(),
          roundNumber: r.currentRound || 1
        };
        return {
          ...r,
          activeDriverOffers: (r.activeDriverOffers || []).filter((o) => o.driverId !== driverId),
          negotiationHistory: [...(r.negotiationHistory || []), rejectedOffer],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  // BACKEND REQUIRED: Settling negotiated fare + assigning driverId into CONFIRMED state must run via trusted backend.
  const handleCustomerAcceptRiderOffer = (bookingId: string, offerId: string) => {
    setRideBookings((prev) =>
      prev.map((r) => {
        if (r.id !== bookingId) return r;
        const matchedOffer = (r.activeDriverOffers || []).find((o) => o.id === offerId) ||
                             (r.negotiationHistory || []).find((o) => o.id === offerId);
        if (!matchedOffer) return r;

        const finalAgreedFare = matchedOffer.amount;
        const driverId = matchedOffer.driverId || 'drv-ramesh-1';
        const driverObj = drivers.find((d) => d.id === driverId);

        const acceptedRecord: FareOffer = {
          id: `offer-${Date.now()}-cacc`,
          offeredBy: 'customer',
          amount: finalAgreedFare,
          status: 'accepted',
          timestamp: new Date().toISOString(),
          roundNumber: (r.currentRound || 1) + 1
        };

        return {
          ...r,
          status: 'CONFIRMED',
          agreedFare: finalAgreedFare,
          driverId,
          driverName: matchedOffer.driverName || driverObj?.name || 'Local Verified Partner',
          driverPhone: matchedOffer.driverPhone || driverObj?.phone || '+91 98324 55198',
          vehicleNumber: matchedOffer.driverPlate || driverObj?.vehicleNumber || 'WB-72-E-1049',
          driverRating: matchedOffer.driverRating || driverObj?.rating || 4.9,
          activeDriverOffers: [],
          negotiationHistory: [
            ...(r.negotiationHistory || []).map((h) => (h.id === offerId ? { ...h, status: 'accepted' as const } : h)),
            acceptedRecord
          ],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const handleCustomerCounterBack = (bookingId: string, newAmount: number) => {
    const updatedAt = new Date().toISOString();
    const current = rideBookings.find((r) => r.id === bookingId);
    const nextRound = (current?.currentRound || 1) + 1;
    const counterRecord: FareOffer = {
      id: `offer-${Date.now()}-cback`,
      offeredBy: 'customer',
      amount: newAmount,
      status: 'pending',
      timestamp: updatedAt,
      roundNumber: nextRound
    };
    const nextHistory = [...(current?.negotiationHistory || []), counterRecord];
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
    if (auth.currentUser && current && !['CONFIRMED', 'PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(current.status)) {
      safeUpdateDoc(doc(db, 'rideBookings', bookingId), {
        status: 'OFFER_SENT',
        customerProposedFare: newAmount,
        activeDriverOffers: [],
        negotiationHistory: nextHistory,
        currentRound: nextRound,
        updatedAt
      }).catch((err) => console.warn('Firestore ride counter update notice:', err.message));
    }
  };

  const handleCustomerRejectRiderOffer = (bookingId: string, offerId: string) => {
    setRideBookings((prev) =>
      prev.map((r) => {
        if (r.id !== bookingId) return r;
        return {
          ...r,
          status: 'REQUESTED',
          activeDriverOffers: (r.activeDriverOffers || []).filter((o) => o.id !== offerId),
          negotiationHistory: (r.negotiationHistory || []).map((h) =>
            h.id === offerId ? { ...h, status: 'rejected' as const } : h
          ),
          updatedAt: new Date().toISOString()
        };
      })
    );
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

  const handleCustomerBookRide = async (booking: RideBooking) => {
    const authUid = await resolveAuthUid();
    const enrichedBooking: RideBooking = {
      ...booking,
      customerId: authUid || booking.customerId || ''
    };
    setRideBookings((prev) => [enrichedBooking, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'rideBookings', enrichedBooking.id), enrichedBooking).catch((err) => console.warn(err));
    }
  };

  // --- DELIVERY FLEET HANDLERS ---
  const handleUpdateRider = (updated: Partial<DeliveryPerson>) => {
    setCurrentRider((prev) => {
      const next = { ...prev, ...updated };
      setDeliveryPersons((list) => list.map((p) => (p.id === next.id ? next : p)));
      if (auth.currentUser && (next.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
        const { status: _s, ownerId: _o, ...safeFields } = updated;
        safeUpdateDoc(doc(db, 'deliveryPersons', next.id), isAdminAuthenticated ? updated : safeFields).catch((err) =>
          console.warn(err)
        );
      }
      return next;
    });
  };

  const handleUpdateDeliveryPersonStatus = (personId: string, status: ShopApprovalStatus) => {
    const updatedAt = new Date().toISOString();
    setDeliveryPersons((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, status } : p))
    );
    if (currentRider.id === personId) {
      setCurrentRider((prev) => ({ ...prev, status }));
    }
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'deliveryPersons', personId), { status }).catch((err) => console.warn(err));
      const targetRider = deliveryPersons.find((p) => p.id === personId);
      if (targetRider) {
        const publicCard = toPublicRiderCard({ ...targetRider, status, updatedAt });
        safeSetDoc(doc(db, 'publicRiders', personId), publicCard, { merge: true }).catch((err) =>
          console.warn('Public rider sync notice:', err.message)
        );
        setApprovedRiders((prev) =>
          status === 'approved'
            ? mergeById(prev, [publicCard])
            : prev.filter((r) => r.id !== personId)
        );
      }
    }
    logAdminAction('Delivery Rider Verification', `Updated fleet rider ${personId} status to ${status}`);
  };

  const handleUpdateDeliveryStatus = (deliveryId: string, status: DeliveryStatus) => {
    const updatedAt = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status, updatedAt } : d))
    );
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'deliveries', deliveryId), { status, updatedAt }).catch((err) => console.warn(err));
    }
  };

  // BACKEND REQUIRED: Claiming an unassigned parcel delivery atomically across competing riders requires Cloud Functions.
  const handleAcceptDelivery = (
    deliveryId: string,
    riderId: string,
    riderName: string,
    riderPhone: string
  ) => {
    const patch = {
      status: 'accepted' as DeliveryStatus,
      assignedDeliveryPersonId: riderId,
      assignedDeliveryPersonName: riderName,
      assignedDeliveryPersonPhone: riderPhone,
      updatedAt: new Date().toISOString()
    };
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...patch } : d))
    );
    const existingDelivery = deliveries.find((d) => d.id === deliveryId);
    if (isAdminAuthenticated || (auth.currentUser && existingDelivery?.assignedDeliveryPersonId)) {
      safeUpdateDoc(doc(db, 'deliveries', deliveryId), { status: 'accepted', updatedAt: patch.updatedAt }).catch((err) =>
        console.warn('Firestore delivery accept notice:', err.message)
      );
    }
  };

  const handleAssignDelivery = (
    deliveryId: string,
    personId: string,
    personName: string,
    personPhone: string
  ) => {
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
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'deliveries', deliveryId), patch).catch((err) => console.warn(err));
    }
    logAdminAction('Manual Delivery Dispatch', `Assigned delivery ${deliveryId} to ${personName}`);
  };

  const handleCustomerRequestDelivery = async (req: DeliveryRequest) => {
    const authUid = await resolveAuthUid();
    const enriched: DeliveryRequest = {
      ...req,
      customerId: authUid || req.customerId || ''
    };
    setDeliveries((prev) => [enriched, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'deliveries', enriched.id), enriched).catch((err) => console.warn(err));
    }
  };

  // --- SERVICE PROVIDERS HANDLERS ---
  const handleUpdateProvider = async (updated: Partial<ServiceProvider>) => {
    const uid = await resolveAuthUid();
    const isProfileSave = Boolean(updated.name || updated.phone || updated.serviceArea || updated.category);
    const prev = currentProvider;

    // Single-UID partner onboarding: if saving profile details and current record isn't owned by this UID yet,
    // create a pending /serviceProviders/{id} record owned by the caller's Firebase Auth UID.
    if (uid && !isAdminAuthenticated && prev.ownerId !== uid && isProfileSave) {
      const newId = `sp-${Date.now()}`;
      const newProvider: ServiceProvider = {
        ...prev,
        ...updated,
        id: newId,
        ownerId: uid,
        status: 'pending'
      };
      setCurrentProvider(newProvider);
      setServiceProviders((list) => [newProvider, ...list.filter((p) => p.id !== newId)]);
      safeSetDoc(doc(db, 'serviceProviders', newId), newProvider).catch((err) => console.warn(err));
      return;
    }

    const next = { ...prev, ...updated };
    setCurrentProvider(next);
    setServiceProviders((list) => list.map((p) => (p.id === next.id ? next : p)));
    if (uid && (next.ownerId === uid || isAdminAuthenticated)) {
      const { status: _s, ownerId: _o, ...safeFields } = updated;
      safeUpdateDoc(doc(db, 'serviceProviders', next.id), isAdminAuthenticated ? updated : safeFields).catch((err) =>
        console.warn(err)
      );
    }
  };

  const handleUpdateServiceProviderStatus = (providerId: string, status: ShopApprovalStatus) => {
    const updatedAt = new Date().toISOString();
    setServiceProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status, updatedAt } : p))
    );
    if (currentProvider.id === providerId) {
      setCurrentProvider((prev) => ({ ...prev, status, updatedAt }));
    }
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'serviceProviders', providerId), { status, updatedAt }).catch((err) => console.warn(err));
      const targetProvider = serviceProviders.find((p) => p.id === providerId);
      if (targetProvider) {
        safeSetDoc(
          doc(db, 'publicServiceProviders', providerId),
          toPublicServiceProviderCard({ ...targetProvider, status, updatedAt }),
          { merge: true }
        ).catch((err) => console.warn('Public provider sync notice:', err.message));
      }
    }
    logAdminAction('Technician Verification', `Updated service provider ${providerId} status to ${status}`);
  };

  const handleUpdateServiceStatus = (requestId: string, status: ServiceRequestStatus) => {
    const updatedAt = new Date().toISOString();
    setServiceRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, updatedAt } : r))
    );
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'serviceRequests', requestId), { status, updatedAt }).catch((err) => console.warn(err));
    }
  };

  // BACKEND REQUIRED: Claiming unassigned service requests across competing providers requires Cloud Functions.
  const handleAcceptServiceRequest = (
    requestId: string,
    providerId: string,
    providerName: string
  ) => {
    if (!isAdminAuthenticated) {
      console.warn('Service request dispatch requires BACKEND REQUIRED (Cloud Functions).');
      return;
    }
    const updatedAt = new Date().toISOString();
    const targetProvider = serviceProviders.find((p) => p.id === providerId);
    const providerOwnerId = targetProvider?.ownerId || '';
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
    if (auth.currentUser) {
      safeUpdateDoc(doc(db, 'serviceRequests', requestId), {
        status: 'accepted',
        providerId,
        ...(providerOwnerId ? { providerOwnerId } : {}),
        providerName,
        updatedAt
      }).catch((err) => console.warn(err));
    }
  };

  const handleCustomerRequestService = async (req: ServiceRequest) => {
    const authUid = await resolveAuthUid();
    const enrichedReq: ServiceRequest = {
      ...req,
      customerId: authUid || req.customerId || ''
    };
    setServiceRequests((prev) => [enrichedReq, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'serviceRequests', enrichedReq.id), enrichedReq).catch((err) => console.warn(err));
    }
  };

  // --- EMPLOYER & JOBS HANDLERS ---
  const handlePostJob = async (
    job: Omit<JobListing, 'id' | 'applicantsCount' | 'status' | 'createdAt'>
  ) => {
    const authUid = await resolveAuthUid();
    const id = `job-${Date.now()}`;
    const newJob: JobListing = {
      ...job,
      id,
      employerId: authUid || job.employerId,
      applicantsCount: 0,
      status: 'pending',
      posted: 'Just Now',
      createdAt: new Date().toISOString()
    };
    setJobListings((prev) => [newJob, ...prev]);
    if (authUid) {
      safeSetDoc(doc(db, 'jobs', id), newJob).catch((err) => console.warn(err));
    }
  };

  const handleUpdateJobStatus = (jobId: string, status: 'pending' | 'approved' | 'rejected') => {
    const updatedAt = new Date().toISOString();
    setJobListings((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'jobs', jobId), { status }).catch((err) => console.warn(err));
      const targetJob = jobListings.find((j) => j.id === jobId);
      if (targetJob) {
        safeSetDoc(
          doc(db, 'publicJobs', jobId),
          toPublicJobCard({ ...targetJob, status, updatedAt }),
          { merge: true }
        ).catch((err) => console.warn('Public job sync notice:', err.message));
      }
    }
    logAdminAction('Job Listing Review', `Marked job listing ${jobId} as ${status}`);
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
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, status: 'resolved', resolutionNotes: notes }
          : c
      )
    );
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'complaints', complaintId), {
        status: 'resolved',
        resolutionNotes: notes
      }).catch((err) => console.warn(err));
    }
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

  const handleUpdateDoctor = (updated: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (currentDoctor.id === updated.id) {
      setCurrentDoctor(updated);
    }
    if (auth.currentUser && (updated.ownerId === auth.currentUser.uid || isAdminAuthenticated)) {
      const { status: _s, ownerId: _o, ...safeFields } = updated;
      safeUpdateDoc(doc(db, 'doctors', updated.id), isAdminAuthenticated ? updated : safeFields).catch((err) =>
        console.warn(err)
      );
    }
  };

  const handleUpdateDoctorStatus = (doctorId: string, status: 'approved' | 'rejected' | 'suspended' | 'pending') => {
    const updatedAt = new Date().toISOString();
    setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, status, updatedAt } : d)));
    if (currentDoctor.id === doctorId) {
      setCurrentDoctor((prev) => ({ ...prev, status, updatedAt }));
    }
    if (isAdminAuthenticated) {
      safeUpdateDoc(doc(db, 'doctors', doctorId), { status, updatedAt }).catch((err) => console.warn(err));
      const targetDoc = doctors.find((d) => d.id === doctorId);
      if (targetDoc) {
        safeSetDoc(
          doc(db, 'publicDoctors', doctorId),
          toPublicDoctorCard({ ...targetDoc, status, updatedAt }),
          { merge: true }
        ).catch((err) => console.warn('Public doctor sync notice:', err.message));
      }
    }
    logAdminAction('Doctor Verification', `Updated doctor ${doctorId} status to ${status}`);
  };

  // BACKEND REQUIRED: Atomic claiming of unassigned emergency requests by competing doctors requires Cloud Functions.
  const handleUpdateEmergencyDoctorRequestStatus = (
    requestId: string,
    status: EmergencyDoctorStatus,
    etaMinutes?: number,
    notes?: string
  ) => {
    const updatedAt = new Date().toISOString();
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
    const existingReq = emergencyDoctorRequests.find((r) => r.id === requestId);
    const canClientWrite =
      isAdminAuthenticated ||
      status === 'cancelled' ||
      Boolean(existingReq?.assignedDoctorId || existingReq?.doctorId);
    if (auth.currentUser && canClientWrite) {
      safeUpdateDoc(doc(db, 'emergencyDoctorRequests', requestId), {
        status,
        ...(etaMinutes !== undefined ? { etaMinutes, estimatedArrivalMinutes: etaMinutes } : {}),
        ...(notes !== undefined ? { doctorNotes: notes } : {}),
        updatedAt
      }).catch((err) => console.warn(err));
    }
  };

  const handleRegisterDoctor = async (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => {
    const authUid = await resolveAuthUid();
    const newDoc: Doctor = {
      ...doctorData,
      id: `doc-${Date.now()}`,
      ownerId: authUid || doctorData.ownerId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setDoctors((prev) => [newDoc, ...prev]);
    setCurrentDoctor(newDoc);
    if (authUid) {
      safeSetDoc(doc(db, 'doctors', newDoc.id), newDoc).catch((err) => console.warn(err));
    }
  };

  const handleRegisterCustomer = async (newUser: UserProfile) => {
    const authUid = await resolveAuthUid();
    const normalizedPhone = normalizePhoneE164(newUser.phone) || newUser.phone.trim();
    const flags = getAuthFlags(auth.currentUser, normalizedPhone);
    const finalUser: UserProfile = {
      ...newUser,
      phone: normalizedPhone,
      ...(authUid ? { id: authUid, userId: authUid } : {}),
      ...flags
    };
    setUser(finalUser);
    if (finalUser.location) setCurrentLocation(finalUser.location);
    if (finalUser.pincode) setCurrentPincode(finalUser.pincode);
    try {
      localStorage.setItem('tb_user', JSON.stringify(finalUser));
    } catch (e) {
      console.warn(e);
    }
    if (authUid) {
      safeSetDoc(doc(db, 'customers', authUid), finalUser, { merge: true }).catch((err) => console.warn(err));
    }
  };

  const handleRegisterDriver = async (driverData: Omit<Driver, 'id'>) => {
    const authUid = await resolveAuthUid();
    const newDriver: Driver = {
      ...driverData,
      id: `drv-${Date.now()}`,
      ownerId: authUid || driverData.ownerId,
      status: 'pending',
      approvalStatus: 'pending'
    };
    setDrivers((prev) => [newDriver, ...prev]);
    setCurrentDriver(newDriver);
    if (authUid) {
      safeSetDoc(doc(db, 'drivers', newDriver.id), newDriver).catch((err) => console.warn(err));
    }
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

  const handleOpenActiveTracker = () => {
    if (orders.length > 0) {
      setTrackedOrder(orders[0]);
    } else {
      setCurrentTab('orders');
    }
  };

  // Approval status of active merchant shop
  const isShopApproved = shop.status === 'approved';

  // Products visible to customer: enforce approved shopStatus and prioritize customer locality
  const approvedProducts = products.filter((p) => {
    if (p.shopStatus && p.shopStatus !== 'approved') return false;
    if (p.shopId === shop.id && !isShopApproved) return false;
    const parentShop = shops.find((s) => s.id === p.shopId);
    if (parentShop && parentShop.status !== 'approved') return false;
    return p.isAvailable !== false && p.inStock !== false;
  });

  const filteredByLocality = filterProductsByLocality(approvedProducts, shops, currentLocation, true, localities);
  const visibleCustomerProducts = filteredByLocality.localProducts.length > 0
    ? [...filteredByLocality.localProducts, ...filteredByLocality.nearbyProducts]
    : approvedProducts;

  const activeOrdersCount = orders.filter(
    (o) => ['pending', 'confirmed', 'preparing', 'ready_for_dispatch', 'packed', 'out_for_delivery'].includes(o.status)
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
            onClose={() => setPortalMode('customer')}
            onLoginSuccess={() => {
              // Verified directly by Firebase onAuthStateChanged
            }}
            allowedEmail={ADMIN_EMAIL}
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
            shops={shops}
            onUpdateShopStatus={(shopId, status) => {
              const updatedAt = new Date().toISOString();
              const targetShop = shops.find((s) => s.id === shopId);
              setShops((prev) => prev.map((s) => (s.id === shopId ? { ...s, status, isVerified: status === 'approved', updatedAt } : s)));
              setProducts((prev) => prev.map((p) => (p.shopId === shopId ? { ...p, shopStatus: status, updatedAt } : p)));
              if (shop.id === shopId) setShop((prev) => ({ ...prev, status, isVerified: status === 'approved', updatedAt }));
              if (isAdminAuthenticated) {
                safeUpdateDoc(doc(db, 'shops', shopId), {
                  status,
                  isVerified: status === 'approved',
                  updatedAt
                }).catch((err) => console.warn(err));
                syncShopApprovalToPublicAndProducts(shopId, status, targetShop);
              }
              logAdminAction('Shop Status Changed', `Shop ${shopId} updated to ${status}`);
            }}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
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
            adminEmail="taibaralir@gmail.com"
            localities={localities}
            onAddLocality={handleAddLocality}
            onUpdateLocality={handleUpdateLocality}
            onDeleteLocality={handleDeleteLocality}
            doctors={doctors}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            emergencyDoctorRequests={emergencyDoctorRequests}
            onUpdateEmergencyDoctorRequestStatus={handleUpdateEmergencyDoctorRequestStatus}
            customers={[user]}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 2: DRIVER PARTNER PORTAL (TAXI, AUTO, TOTO ONLY - NO BIKE TAXI)
  // ----------------------------------------------------
  if (portalMode === 'driver') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-emerald-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <DriverDashboard
            driver={currentDriver}
            rideBookings={rideBookings}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateDriver={handleUpdateDriver}
            onUpdateRideStatus={handleUpdateRideStatus}
            onAcceptRide={handleAcceptRide}
            onDriverCounterOffer={handleDriverCounterOffer}
            onDriverRejectRide={handleDriverRejectRide}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 3: DELIVERY FLEET PORTAL
  // ----------------------------------------------------
  if (portalMode === 'delivery') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-sky-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <DeliveryDashboard
            rider={currentRider}
            deliveries={deliveries}
            assignedOrders={orders.filter((o) => o.riderId === currentRider.id)}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateRider={handleUpdateRider}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            onAcceptDelivery={handleAcceptDelivery}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 4: SERVICE PROVIDER PORTAL
  // ----------------------------------------------------
  if (portalMode === 'service_provider') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-amber-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ServiceProviderDashboard
            provider={currentProvider}
            isAdmin={isAdminAuthenticated}
            serviceRequests={serviceRequests}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onUpdateProvider={handleUpdateProvider}
            onUpdateServiceStatus={handleUpdateServiceStatus}
            onAcceptRequest={handleAcceptServiceRequest}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 5: EMPLOYER & JOBS PORTAL
  // ----------------------------------------------------
  if (portalMode === 'employer') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-purple-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <EmployerDashboard
            jobListings={jobListings}
            jobApplications={jobApplications}
            onSwitchPortal={() => setIsPortalSwitcherOpen(true)}
            onPostJob={handlePostJob}
            onUpdateApplicationStatus={handleUpdateJobApplicationStatus}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6: SHOPKEEPER MERCHANT DASHBOARD
  // ----------------------------------------------------
  if (portalMode === 'shopkeeper') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-emerald-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ShopkeeperDashboard
            shop={shop}
            isAdmin={isAdminAuthenticated}
            orders={orders}
            products={products.filter((p) => !p.shopId || p.shopId === shop.id)}
            approvedRiders={approvedRiders}
            onSwitchToCustomer={() => setPortalMode('customer')}
            onUpdateShop={handleUpdateShop}
            onAdminChangeStatus={handleAdminChangeStatus}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleAvailability={handleToggleProductAvailability}
            localities={localities}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6.5: KABARI & SCRAP BUYER PORTAL
  // ----------------------------------------------------
  if (portalMode === 'kabari') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-lime-200">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
          <ScrapMarketplaceView
            onBackToHome={() => setPortalMode('customer')}
            user={user}
            currentLocality={currentLocation}
            scrapRequests={scrapRequests}
            isAdmin={isAdminAuthenticated}
            onAddScrapRequest={handleAddScrapRequest}
            onSendOffer={handleSendScrapOffer}
            onAcceptOffer={handleAcceptScrapOffer}
            onUpdateScrapStatus={handleUpdateScrapStatus}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTE 6.6: DOCTOR PARTNER PORTAL (MBBS & SPECIALISTS)
  // ----------------------------------------------------
  if (portalMode === 'doctor') {
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
            onLogout={() => {
              setPortalMode('customer');
            }}
            localities={localities}
          />

          <DoctorAuthModal
            isOpen={isDoctorAuthModalOpen}
            onClose={() => setIsDoctorAuthModalOpen(false)}
            doctors={doctors}
            onLoginSuccess={(doc) => {
              setCurrentDoctor(doc);
              setIsDoctorAuthModalOpen(false);
            }}
            onRegisterDoctor={handleRegisterDoctor}
            localities={localities}
          />

          <PortalSwitcherModal
            isOpen={isPortalSwitcherOpen}
            onClose={() => setIsPortalSwitcherOpen(false)}
            currentMode={portalMode}
            onSelectMode={(mode) => setPortalMode(mode)}
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
          onOpenShopkeeper={() => setPortalMode('shopkeeper')}
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
                  isAdmin={isAdminAuthenticated}
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
                />
              )}

              {activeServiceView === 'delivery' && (
                <DeliveryView
                  currentLocation={currentLocation}
                  onBackToHome={() => setActiveServiceView(null)}
                  onRequestDelivery={handleCustomerRequestDelivery}
                />
              )}

              {activeServiceView === 'services' && (
                <ServicesView
                  currentLocation={currentLocation}
                  onBackToHome={() => setActiveServiceView(null)}
                  onRequestService={handleCustomerRequestService}
                  customerName={user.name}
                  customerPhone={user.phone}
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
                  orders={orders}
                  onBackToHome={() => handleTabChange('home')}
                  onTrackOrder={(order) => setTrackedOrder(order)}
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
                  onOpenAuthModal={() => setIsCustomerAuthModalOpen(true)}
                  onFileComplaint={handleCustomerFileComplaint}
                  complaints={complaints}
                  products={visibleCustomerProducts}
                  onAddToCart={handleAddToCart}
                  onNavigateTab={handleTabChange}
                  onTrackOrder={handleOpenActiveTracker}
                  onOpenCart={() => setIsCartOpen(true)}
                  onLogout={async () => {
                    await handleAuthSignOut();
                    try { localStorage.removeItem('tb_user'); } catch (e) { console.warn(e); }
                    setUser(INITIAL_USER);
                    setIsCustomerAuthModalOpen(true);
                  }}
                />
              )}

              {currentTab === 'more' && (
                <MoreView
                  onSelectService={handleSelectService}
                  onOpenPosterModal={() => setIsPosterModalOpen(true)}
                  onOpenShopkeeper={() => setPortalMode('shopkeeper')}
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
          isOpen={trackedOrder !== null}
          onClose={() => setTrackedOrder(null)}
          order={trackedOrder}
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
            setIsCustomerAuthModalOpen(true);
          }}
          onOpenCart={() => {
            setIsSideDrawerOpen(false);
            setIsCartOpen(true);
          }}
          user={user}
          onLogout={async () => {
            setIsSideDrawerOpen(false);
            await handleAuthSignOut();
            try { localStorage.removeItem('tb_user'); } catch (e) { console.warn(e); }
            setUser(INITIAL_USER);
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
          onSelectMode={(mode) => setPortalMode(mode)}
        />

        <UniversalQrModal
          isOpen={isUniversalQrOpen}
          onClose={() => setIsUniversalQrOpen(false)}
        />

        <ShopkeeperAuthModal
          isOpen={isShopAuthModalOpen}
          onClose={() => setIsShopAuthModalOpen(false)}
          existingShop={shop}
          localities={localities}
          onLoginSuccess={(shopData, email) => {
            const nextShop: Shop = {
              ...shop,
              ...shopData,
              ownerEmail: email
            };
            setShop(nextShop);
            setShops((prev) =>
              prev.some((s) => s.id === nextShop.id)
                ? prev.map((s) => (s.id === nextShop.id ? nextShop : s))
                : [nextShop, ...prev]
            );
            if (auth.currentUser && nextShop.ownerId === auth.currentUser.uid && nextShop.status === 'pending') {
              safeSetDoc(doc(db, 'shops', nextShop.id), {
                ...nextShop,
                createdAt: nextShop.createdAt || new Date().toISOString()
              }).catch((err) => console.warn(err));
            }
            setPortalMode('shopkeeper');
          }}
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
          onClose={() => setIsCustomerAuthModalOpen(false)}
          currentUser={user}
          onLoginSuccess={(u) => {
            setUser(u);
            if (u.location) setCurrentLocation(u.location);
            if (u.pincode) setCurrentPincode(u.pincode);
            setIsCustomerAuthModalOpen(false);
          }}
          onRegisterCustomer={handleRegisterCustomer}
          localities={localities}
        />

        <DriverAuthModal
          isOpen={isDriverAuthModalOpen}
          onClose={() => setIsDriverAuthModalOpen(false)}
          drivers={drivers}
          onLoginSuccess={(d) => {
            setCurrentDriver(d);
            setIsDriverAuthModalOpen(false);
            setPortalMode('driver');
          }}
          onRegisterDriver={handleRegisterDriver}
          localities={localities}
        />

        <DoctorAuthModal
          isOpen={isDoctorAuthModalOpen}
          onClose={() => setIsDoctorAuthModalOpen(false)}
          doctors={doctors}
          onLoginSuccess={(doc) => {
            setCurrentDoctor(doc);
            setIsDoctorAuthModalOpen(false);
            setPortalMode('doctor');
          }}
          onRegisterDoctor={handleRegisterDoctor}
          localities={localities}
        />

        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onLoginSuccess={() => {
            setIsAdminAuthModalOpen(false);
            setPortalMode('admin');
          }}
        />

        {/* Real-time Global PWA Offline/Online Connectivity Banner */}
        <OfflineIndicator />
      </div>
    </div>
  );
}
