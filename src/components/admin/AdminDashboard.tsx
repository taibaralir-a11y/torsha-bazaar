import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Store, 
  ShoppingBag, 
  Car, 
  Truck, 
  Wrench, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  ArrowLeft, 
  Search, 
  Filter, 
  UserCheck, 
  Eye,
  Activity,
  FileText,
  Edit3,
  Plus,
  MapPin,
  Check,
  AlertCircle,
  Trash2,
  Globe,
  Sparkles,
  Navigation,
  Stethoscope,
  Phone,
  HeartHandshake,
  LogOut,
  RotateCcw,
  X,
  KeyRound,
  Copy,
  EyeOff,
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  Shop, 
  Order, 
  Product, 
  Driver, 
  RideBooking, 
  DeliveryPerson, 
  DeliveryRequest, 
  ServiceProvider, 
  ServiceRequest,
  JobListing, 
  Complaint, 
  AdminActivity,
  ShopApprovalStatus,
  OrderStatus,
  ScrapRequest,
  LocalityInfo,
  Doctor,
  EmergencyDoctorRequest,
  EmergencyDoctorStatus,
  UserProfile,
  PartnerAccount,
  PartnerAccountStatus,
  PartnerRoleType,
  UniversalRoutingConfig,
  RoutingAlert,
  RoutingServiceCategory,
  CreatePartnerAccountInput,
  AdminShopUpdateInput,
  VehicleType,
  DoctorSpecialization,
  ServiceCategoryType,
  ShopCategoryType,
  RideDispatchSummary,
  NotificationTokenRecord,
  RideNotificationLog
} from '../../types';
import { INITIAL_SERVICE_LOCALITIES, createDefaultRoutingConfig } from '../../utils/hyperlocalRouting';
import { resolveShopTypeFromCategory } from '../../utils/partnerLifecycle';
import { computeCartItemLineTotal } from '../../utils/checkoutOrder';
import { getActionableRidesForAdmin } from '../../utils/rideLifecycle';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { LocalityRoutingTab } from './LocalityRoutingTab';
import { AdminRidesMonitorTab } from './AdminRidesMonitorTab';

interface AdminDashboardProps {
  onSwitchPortal: () => void;
  shops: Shop[];
  onUpdateShopStatus: (shopId: string, status: ShopApprovalStatus) => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  onAdminUpdateShop?: (shopId: string, updates: AdminShopUpdateInput) => Promise<{ ok: boolean; error?: string; warning?: string }>;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  products: Product[];
  drivers: Driver[];
  onUpdateDriverStatus: (driverId: string, status: ShopApprovalStatus) => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  rideBookings: RideBooking[];
  deliveryPersons: DeliveryPerson[];
  onUpdateDeliveryPersonStatus: (personId: string, status: ShopApprovalStatus) => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  deliveries: DeliveryRequest[];
  onAssignDelivery: (deliveryId: string, personId: string, personName: string, personPhone: string) => void;
  serviceProviders: ServiceProvider[];
  onUpdateServiceProviderStatus: (providerId: string, status: ShopApprovalStatus) => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  jobListings: JobListing[];
  onUpdateJobStatus: (jobId: string, status: 'pending' | 'approved' | 'rejected') => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  complaints: Complaint[];
  onResolveComplaint: (complaintId: string, notes: string) => void;
  adminActivities: AdminActivity[];
  scrapRequests?: ScrapRequest[];
  onUpdateScrapStatus?: (requestId: string, status: ScrapRequest['status']) => void;
  adminEmail?: string;
  localities?: LocalityInfo[];
  onAddLocality?: (locality: LocalityInfo) => void;
  onUpdateLocality?: (localityId: string, updated: Partial<LocalityInfo>) => void;
  onDeleteLocality?: (localityId: string) => void;
  doctors?: Doctor[];
  onUpdateDoctorStatus?: (doctorId: string, status: 'approved' | 'rejected' | 'suspended' | 'pending') => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>;
  emergencyDoctorRequests?: EmergencyDoctorRequest[];
  onUpdateEmergencyDoctorRequestStatus?: (requestId: string, status: EmergencyDoctorStatus) => void;
  customers?: UserProfile[];
  onLogout?: () => void;
  onReviewReturnRequest?: (orderId: string, decision: 'approved' | 'rejected', notes?: string) => Promise<{ ok: boolean; error?: string }>;
  partnerAccounts?: PartnerAccount[];
  onCreatePartnerAccount?: (
    input: CreatePartnerAccountInput & { email?: string; createNewEntity?: boolean; linkedEntityId?: string }
  ) => Promise<{
    ok: boolean;
    error?: string;
    account?: PartnerAccount;
    issuedEmail?: string;
    issuedPhone?: string;
    resetEmailSent?: boolean;
  }>;
  onTogglePartnerAccountStatus?: (uid: string, nextStatus: PartnerAccountStatus) => Promise<{ ok: boolean; error?: string; warning?: string }>;
  routingConfig?: UniversalRoutingConfig;
  routingAlerts?: RoutingAlert[];
  onUpdateRoutingConfig?: (next: UniversalRoutingConfig) => void;
  onAssignPartnerWithRouting?: (params: {
    serviceCategory: RoutingServiceCategory;
    requestId: string;
    partnerId: string;
    isReassignment?: boolean;
  }) => { allowed: boolean; error?: string };
  onResolveRoutingAlert?: (alertId: string) => void;
  serviceRequests?: ServiceRequest[];
  rideDispatchSummaries?: RideDispatchSummary[];
  notificationTokens?: NotificationTokenRecord[];
  rideNotificationLogs?: RideNotificationLog[];
  focusedRideId?: string | null;
  onCancelRide?: (rideId: string) => Promise<{ ok: boolean; error?: string } | void> | void;
  onExpireRide?: (rideId: string) => Promise<{ ok: boolean; error?: string } | void> | void;
  alertAudioStatus?: {
    muted: boolean;
    snoozed: boolean;
    snoozeRemainingSec: number;
    activeCount: number;
    isRinging: boolean;
    unlocked: boolean;
  };
  onToggleAlertMute?: () => void;
  onSnoozeAlerts?: (durationMs?: number) => void;
  onUnlockAndTestAudio?: () => Promise<boolean> | void;
  onEnablePushNotifications?: () => Promise<void> | void;
  notificationPermission?: 'granted' | 'denied' | 'default' | 'unsupported';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSwitchPortal,
  shops,
  onUpdateShopStatus,
  onAdminUpdateShop,
  orders,
  onUpdateOrderStatus,
  products,
  drivers,
  onUpdateDriverStatus,
  rideBookings,
  deliveryPersons,
  onUpdateDeliveryPersonStatus,
  deliveries,
  onAssignDelivery,
  serviceProviders,
  onUpdateServiceProviderStatus,
  jobListings,
  onUpdateJobStatus,
  complaints,
  onResolveComplaint,
  adminActivities,
  scrapRequests = [],
  onUpdateScrapStatus,
  adminEmail = '',
  localities = INITIAL_SERVICE_LOCALITIES,
  onAddLocality,
  onUpdateLocality,
  onDeleteLocality,
  doctors = [],
  onUpdateDoctorStatus,
  emergencyDoctorRequests = [],
  onUpdateEmergencyDoctorRequestStatus,
  customers = [],
  onLogout,
  onReviewReturnRequest,
  partnerAccounts = [],
  onCreatePartnerAccount,
  onTogglePartnerAccountStatus,
  routingConfig,
  routingAlerts = [],
  onUpdateRoutingConfig,
  onAssignPartnerWithRouting,
  onResolveRoutingAlert,
  serviceRequests = [],
  rideDispatchSummaries = [],
  notificationTokens = [],
  rideNotificationLogs = [],
  focusedRideId,
  onCancelRide,
  onExpireRide,
  alertAudioStatus,
  onToggleAlertMute,
  onSnoozeAlerts,
  onUnlockAndTestAudio,
  onEnablePushNotifications,
  notificationPermission = 'default'
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rides' | 'routing' | 'role_accounts' | 'shops' | 'orders' | 'doctors' | 'emergency_requests' | 'customers' | 'drivers' | 'deliveries' | 'services' | 'jobs' | 'scrap' | 'localities' | 'complaints' | 'activity'
  >('overview');

  // Role Account Provisioning State (ephemeral password never stored in Firestore)
  const [roleFormType, setRoleFormType] = useState<PartnerRoleType>('shopkeeper');
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormEmail, setRoleFormEmail] = useState('');
  const [roleFormPhone, setRoleFormPhone] = useState('');
  const [roleFormPassword, setRoleFormPassword] = useState('');
  const [showRolePassword, setShowRolePassword] = useState(false);
  const [roleFormSendReset, setRoleFormSendReset] = useState(false);
  const [roleFormLocality, setRoleFormLocality] = useState(localities[0]?.name || 'Satali');
  const [roleMultiLocalities, setRoleMultiLocalities] = useState<string[]>([localities[0]?.name || 'Satali']);
  const [roleLinkMode, setRoleLinkMode] = useState<'new' | 'existing' | 'none'>('new');
  const [roleLinkedEntityId, setRoleLinkedEntityId] = useState('');
  // Shopkeeper-specific real inputs
  const [roleShopName, setRoleShopName] = useState('');
  const [roleShopCategory, setRoleShopCategory] = useState('Grocery & Ration');
  const [roleShopAddress, setRoleShopAddress] = useState('');
  const [roleShopContactPhone, setRoleShopContactPhone] = useState('');
  // Driver-specific real inputs (Toto / Auto / Taxi strictly)
  const [roleVehicleType, setRoleVehicleType] = useState<VehicleType>('toto');
  const [roleVehicleNumber, setRoleVehicleNumber] = useState('');
  const [roleLicenseNumber, setRoleLicenseNumber] = useState('');
  // Doctor-specific real inputs
  const [roleQualification, setRoleQualification] = useState('');
  const [roleSpecialization, setRoleSpecialization] = useState<DoctorSpecialization>('General Physician');
  const [roleMedicalRegNo, setRoleMedicalRegNo] = useState('');
  const [roleClinicAddress, setRoleClinicAddress] = useState('');
  const [roleConsultationFee, setRoleConsultationFee] = useState('');
  const [roleHomeVisitFee, setRoleHomeVisitFee] = useState('');
  const [roleExperienceYears, setRoleExperienceYears] = useState('');
  // Service Provider-specific real inputs
  const [roleServiceCategory, setRoleServiceCategory] = useState<ServiceCategoryType>('Electrician');
  const [roleHourlyRate, setRoleHourlyRate] = useState('');
  const [roleServiceDescription, setRoleServiceDescription] = useState('');

  const [isCreatingRoleAccount, setIsCreatingRoleAccount] = useState(false);
  const [roleFormError, setRoleFormError] = useState('');
  const [roleActionNotice, setRoleActionNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [togglingRoleUid, setTogglingRoleUid] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [issuedSummary, setIssuedSummary] = useState<{
    role: PartnerRoleType;
    displayName: string;
    uid: string;
    loginEmail: string;
    phone?: string;
    password: string;
    linkedEntityId?: string;
    resetEmailSent?: boolean;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Fleet sub-tab (Drivers vs Delivery Fleet Riders)
  const [fleetSubTab, setFleetSubTab] = useState<'drivers' | 'delivery'>('drivers');

  // Shop Edit Modal state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [shopEditForm, setShopEditForm] = useState<{
    name: string;
    category: string;
    shopType: ShopCategoryType;
    address: string;
    locality: string;
    pincode: string;
    contactNumber: string;
    publishContact: boolean;
    publicContactNumber: string;
    businessHours: string;
    description: string;
    imageUrl: string;
    deliveryAreas: string[];
    deliveryCharge: string;
    freeDeliveryAbove: string;
    deliveryRadiusKm: string;
    isOpen: boolean;
    status: ShopApprovalStatus;
  } | null>(null);
  const [shopEditError, setShopEditError] = useState('');
  const [isSavingShopEdit, setIsSavingShopEdit] = useState(false);
  const [shopFeedback, setShopFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [adminActionNotice, setAdminActionNotice] = useState<{ type: 'ok' | 'err' | 'warn'; text: string } | null>(null);
  const [busyEntityActionKey, setBusyEntityActionKey] = useState<string | null>(null);

  const runEntityStatusAction = async (
    actionKey: string,
    successText: string,
    fn?: () => void | Promise<{ ok?: boolean; error?: string; warning?: string } | void>
  ) => {
    if (!fn || busyEntityActionKey) return;
    setAdminActionNotice(null);
    setBusyEntityActionKey(actionKey);
    try {
      const res = await fn();
      if (res && res.ok === false) {
        setAdminActionNotice({ type: 'err', text: res.error || 'Status update failed.' });
      } else if (res && res.warning) {
        setAdminActionNotice({ type: 'warn', text: res.warning });
      } else {
        setAdminActionNotice({ type: 'ok', text: successText });
      }
    } catch (err: any) {
      setAdminActionNotice({ type: 'err', text: err?.message || 'Unable to update status in Firestore.' });
    } finally {
      setBusyEntityActionKey(null);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'returns' | 'cancelled'>('all');
  const [returnReviewNotes, setReturnReviewNotes] = useState<Record<string, string>>({});
  const [reviewingReturnOrderId, setReviewingReturnOrderId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // LOCALITY MANAGEMENT STATES
  const [locSearch, setLocSearch] = useState('');
  const [locPinFilter, setLocPinFilter] = useState<'all' | '735214' | '735215' | '735217' | '735182'>('all');
  const [isAddLocalityModalOpen, setIsAddLocalityModalOpen] = useState(false);
  const [editingLocality, setEditingLocality] = useState<LocalityInfo | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPin, setFormPin] = useState('735214');
  const [formParent, setFormParent] = useState('Satali');
  const [formHub, setFormHub] = useState('');
  const [formLandmarks, setFormLandmarks] = useState('');
  const [formLat, setFormLat] = useState('26.7214');
  const [formLng, setFormLng] = useState('89.3982');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Counters
  const pendingShops = shops.filter((s) => s.status === 'pending');
  const pendingDrivers = drivers.filter((d) => d.status === 'pending');
  const pendingDeliveryRiders = deliveryPersons.filter((p) => p.status === 'pending');
  const pendingDeliveries = deliveries.filter((d) => d.status === 'pending_assignment');
  const pendingProviders = serviceProviders.filter((p) => p.status === 'pending');
  const pendingJobs = jobListings.filter((j) => j.status === 'pending');
  const openComplaints = complaints.filter((c) => c.status === 'open');
  const pendingScraps = scrapRequests.filter((s) => s.status === 'open' || s.status === 'offers_received');

  const pendingDoctors = doctors.filter((d) => d.status === 'pending');
  const openRoutingAlerts = routingAlerts.filter((a) => a.status === 'open');
  const pendingActionableRides = getActionableRidesForAdmin(rideBookings);
  const activeEmergencyCalls = emergencyDoctorRequests.filter((r) => r.status === 'pending');
  const pendingReturns = orders.filter((o) => o.returnRequest?.status === 'pending_review');

  React.useEffect(() => {
    if (focusedRideId) {
      setActiveTab('rides');
    }
  }, [focusedRideId]);

  const findLinkedAccountForEntity = (role: PartnerRoleType, entityId: string, ownerId?: string) =>
    partnerAccounts.find(
      (a) => a.role === role && (a.linkedEntityId === entityId || (ownerId && a.uid === ownerId))
    );

  const describeLinkedEntity = (acc: PartnerAccount): { label: string; status?: ShopApprovalStatus } | null => {
    if (acc.role === 'shopkeeper') {
      const s = shops.find((x) => x.id === acc.linkedEntityId || x.ownerId === acc.uid);
      return s ? { label: `${s.name} (${s.locality})`, status: s.status } : null;
    }
    if (acc.role === 'driver') {
      const d = drivers.find((x) => x.id === acc.linkedEntityId || x.ownerId === acc.uid);
      return d ? { label: `${d.name} (${d.vehicleType.toUpperCase()} • ${d.locality})`, status: d.status } : null;
    }
    if (acc.role === 'delivery') {
      const p = deliveryPersons.find((x) => x.id === acc.linkedEntityId || x.ownerId === acc.uid);
      return p ? { label: `${p.name} (${p.locality})`, status: p.status } : null;
    }
    if (acc.role === 'doctor') {
      const doc = doctors.find((x) => x.id === acc.linkedEntityId || x.ownerId === acc.uid);
      return doc ? { label: `${doc.name} (${doc.specialization})`, status: doc.status } : null;
    }
    if (acc.role === 'service_provider') {
      const sp = serviceProviders.find((x) => x.id === acc.linkedEntityId || x.ownerId === acc.uid);
      return sp ? { label: `${sp.name} (${sp.category} • ${sp.serviceArea})`, status: sp.status } : null;
    }
    return null;
  };

  const resolvedRoutingConfig = routingConfig || createDefaultRoutingConfig({
    shops,
    deliveryPersons,
    drivers,
    serviceProviders
  });

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const handleAdminReturnDecision = async (orderId: string, decision: 'approved' | 'rejected') => {
    if (!onReviewReturnRequest || reviewingReturnOrderId === orderId) return;
    setReviewingReturnOrderId(orderId);
    try {
      await onReviewReturnRequest(orderId, decision, returnReviewNotes[orderId]);
    } finally {
      setReviewingReturnOrderId(null);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    {
      id: 'rides' as const,
      label: 'Rides & Alerts',
      icon: BellRing,
      badge: pendingActionableRides.length > 0 ? pendingActionableRides.length : undefined
    },
    {
      id: 'routing' as const,
      label: 'Locality Routing',
      icon: Navigation,
      badge: openRoutingAlerts.length > 0 ? openRoutingAlerts.length : undefined
    },
    {
      id: 'role_accounts' as const,
      label: 'Role Accounts',
      icon: KeyRound,
      badge: partnerAccounts.length > 0 ? partnerAccounts.length : undefined
    },
    { 
      id: 'doctors' as const, 
      label: 'Doctors', 
      icon: Stethoscope,
      badge: pendingDoctors.length > 0 ? pendingDoctors.length : undefined
    },
    { 
      id: 'emergency_requests' as const, 
      label: 'Emergency Calls', 
      icon: AlertTriangle,
      badge: activeEmergencyCalls.length > 0 ? activeEmergencyCalls.length : undefined
    },
    { 
      id: 'shops' as const, 
      label: 'Shops', 
      icon: Store,
      badge: pendingShops.length > 0 ? pendingShops.length : undefined
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingReturns.length > 0 ? pendingReturns.length : undefined
    },
    { id: 'customers' as const, label: 'Customers', icon: Users },
    { 
      id: 'scrap' as const, 
      label: 'Scrap Bids', 
      icon: Truck,
      badge: pendingScraps.length > 0 ? pendingScraps.length : undefined
    },
    { id: 'localities' as const, label: 'PIN Hubs', icon: MapPin },
    { 
      id: 'drivers' as const, 
      label: 'Fleet & Drivers', 
      icon: Car,
      badge: pendingDrivers.length + pendingDeliveryRiders.length > 0 ? pendingDrivers.length + pendingDeliveryRiders.length : undefined
    },
    { 
      id: 'deliveries' as const, 
      label: 'Deliveries', 
      icon: Truck,
      badge: pendingDeliveries.length > 0 ? pendingDeliveries.length : undefined
    },
    { 
      id: 'services' as const, 
      label: 'Services', 
      icon: Wrench,
      badge: pendingProviders.length > 0 ? pendingProviders.length : undefined
    },
    { 
      id: 'jobs' as const, 
      label: 'Jobs', 
      icon: Briefcase,
      badge: pendingJobs.length > 0 ? pendingJobs.length : undefined
    },
    { 
      id: 'complaints' as const, 
      label: 'Tickets', 
      icon: AlertTriangle,
      badge: openComplaints.length > 0 ? openComplaints.length : undefined
    },
    { id: 'activity' as const, label: 'Logs', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base font-heading tracking-wide text-white">
                TORSA BAZAAR ADMIN
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.2 rounded-full uppercase">
                Root Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Authenticated: {adminEmail || 'Not Signed In'} • Central Dooars Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" className="bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/40" />
          <button
            onClick={onSwitchPortal}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Switch Portal</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out of Admin"
              className="flex items-center gap-1 text-xs font-bold text-rose-200 hover:text-white bg-rose-950/80 hover:bg-rose-900 px-2.5 py-1.5 rounded-xl border border-rose-800/80 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs navigation strip */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-amber-400 text-black' : 'bg-red-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent Admin Pending Ride Alert Bar */}
      {(pendingActionableRides.length > 0 || alertAudioStatus?.snoozed || alertAudioStatus?.muted) && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <BellRing
              className={`w-4 h-4 shrink-0 ${
                alertAudioStatus?.isRinging ? 'text-amber-300 animate-bounce' : 'text-amber-400'
              }`}
            />
            <span className="font-bold">
              {pendingActionableRides.length > 0
                ? `${pendingActionableRides.length} Pending Ride Request(s) awaiting confirmation`
                : alertAudioStatus?.muted
                ? 'Admin Ride Alerts Muted'
                : `Admin Alerts Snoozed (${alertAudioStatus?.snoozeRemainingSec || 0}s)`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleAlertMute && (
              <button
                type="button"
                onClick={onToggleAlertMute}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-200 font-bold border border-amber-600/40 flex items-center gap-1"
              >
                {alertAudioStatus?.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{alertAudioStatus?.muted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}
            {onSnoozeAlerts && (
              <button
                type="button"
                onClick={() => onSnoozeAlerts(alertAudioStatus?.snoozed ? 0 : 5 * 60 * 1000)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1"
              >
                {alertAudioStatus?.snoozed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>{alertAudioStatus?.snoozed ? 'Resume' : 'Snooze 5m'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('rides')}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              View Rides
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
        {adminActionNotice && (
          <div
            className={`rounded-2xl p-3 text-xs font-semibold flex items-start justify-between gap-2 border ${
              adminActionNotice.type === 'err'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                : adminActionNotice.type === 'warn'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{adminActionNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminActionNotice(null)}
              className="font-bold opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Platform GMV</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  ₹{totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{orders.length} total orders</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Merchant Shops</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {shops.length}
                </span>
                <span className="text-[10px] text-amber-300 mt-0.5 block">
                  {pendingShops.length} pending review
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Drivers (Taxi/Auto/Toto)</span>
                <span className="text-xl font-black text-sky-400 mt-1 block">
                  {drivers.length}
                </span>
                <span className="text-[10px] text-sky-300 mt-0.5 block">
                  {drivers.filter((d) => d.isOnline).length} currently online
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Deliveries & Parcels</span>
                <span className="text-xl font-black text-orange-400 mt-1 block">
                  {deliveries.length}
                </span>
                <span className="text-[10px] text-orange-300 mt-0.5 block">
                  {pendingDeliveries.length} unassigned
                </span>
              </div>
            </div>

            {/* Open Routing Alerts Callout */}
            {openRoutingAlerts.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-200">
                      {openRoutingAlerts.length} Locality Routing Alert{openRoutingAlerts.length > 1 ? 's' : ''} Need Admin Action
                    </p>
                    <p className="text-[11px] text-rose-300 mt-0.5">
                      No approved local partner or rider was online in the requested locality. Review & route safely.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('routing')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl shrink-0"
                >
                  Open Routing
                </button>
              </div>
            )}

            {/* Quick Approval Action Callouts */}
            {(pendingShops.length > 0 || pendingDrivers.length > 0 || pendingProviders.length > 0 || pendingJobs.length > 0) && (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pending Marketplace Approvals</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {pendingShops.length > 0 && (
                    <button
                      onClick={() => setActiveTab('shops')}
                      className="bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 p-2.5 rounded-xl text-left border border-amber-700/50"
                    >
                      <span className="font-bold block">{pendingShops.length} Shops</span>
                      <span className="text-[10px] text-amber-300">Click to approve</span>
                    </button>
                  )}
                  {pendingDrivers.length > 0 && (
                    <button
                      onClick={() => setActiveTab('drivers')}
                      className="bg-sky-900/60 hover:bg-sky-800/80 text-sky-200 p-2.5 rounded-xl text-left border border-sky-700/50"
                    >
                      <span className="font-bold block">{pendingDrivers.length} Drivers</span>
                      <span className="text-[10px] text-sky-300">Click to verify</span>
                    </button>
                  )}
                  {pendingProviders.length > 0 && (
                    <button
                      onClick={() => setActiveTab('services')}
                      className="bg-teal-900/60 hover:bg-teal-800/80 text-teal-200 p-2.5 rounded-xl text-left border border-teal-700/50"
                    >
                      <span className="font-bold block">{pendingProviders.length} Technicians</span>
                      <span className="text-[10px] text-teal-300">Click to verify</span>
                    </button>
                  )}
                  {pendingJobs.length > 0 && (
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-2.5 rounded-xl text-left border border-stone-600/50"
                    >
                      <span className="font-bold block">{pendingJobs.length} Job Listings</span>
                      <span className="text-[10px] text-stone-300">Review vacancies</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent Live Orders Overview */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Recent Customer Orders</span>
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-purple-400 hover:underline font-semibold"
                >
                  View All ({orders.length}) →
                </button>
              </div>

              <div className="divide-y divide-slate-700/60">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">#{order.id}</span>
                        <span className="text-slate-400">• {order.customerName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{order.deliveryAddress}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-200 block">₹{order.total}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                        order.status === 'delivered' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RIDES & SMART ALERTS MONITOR TAB */}
        {activeTab === 'rides' && (
          <AdminRidesMonitorTab
            rideBookings={rideBookings}
            rideDispatchSummaries={rideDispatchSummaries}
            drivers={drivers}
            routingConfig={resolvedRoutingConfig}
            partnerAccounts={partnerAccounts}
            localities={localities}
            notificationTokens={notificationTokens}
            rideNotificationLogs={rideNotificationLogs}
            focusedRideId={focusedRideId}
            alertAudioStatus={alertAudioStatus}
            notificationPermission={notificationPermission}
            onToggleAlertMute={onToggleAlertMute}
            onSnoozeAlerts={onSnoozeAlerts}
            onUnlockAndTestAudio={onUnlockAndTestAudio}
            onEnablePushNotifications={onEnablePushNotifications}
            onAssignPartnerWithRouting={onAssignPartnerWithRouting}
            onCancelRide={onCancelRide}
            onExpireRide={onExpireRide}
          />
        )}

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-400" />
                  <span>Doctor Verification & Medical Council Registry ({doctors.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Verify MBBS credentials, Council Registration Numbers, and allocate Dooars coverage zones.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-xl">
                {pendingDoctors.length} Pending Approval
              </span>
            </div>

            {doctors.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-xs text-slate-400">
                No doctor registrations logged.
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`bg-slate-800 border rounded-2xl p-4 transition-all ${
                      doc.status === 'pending'
                        ? 'border-amber-500/60 bg-amber-950/20'
                        : doc.status === 'approved'
                          ? 'border-slate-700'
                          : 'border-rose-900 bg-rose-950/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            doc.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : doc.status === 'pending'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {doc.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Reg: <strong className="text-white font-mono">{doc.councilRegistrationNumber || doc.medicalCouncilRegNo || 'N/A'}</strong>
                          </span>
                          <span className="text-xs text-slate-400">
                            · {doc.qualification}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white">{doc.name}</h4>
                          <p className="text-xs text-slate-300">
                            Specialization: <strong className="text-purple-300">{doc.specialization}</strong> · Fee: <strong className="text-emerald-400 font-mono">₹{doc.consultationFee}</strong>
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <span>Phone: <strong className="text-slate-200">{doc.phone}</strong></span>
                            <span>• Email: <strong className="text-slate-200">{doc.email}</strong></span>
                          </p>
                        </div>

                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500 block mb-0.5 font-medium">Covered Dooars Localities:</span>
                          <div className="flex flex-wrap gap-1">
                            {(doc.servedLocalities || doc.localitiesServed || []).map((loc: string) => (
                              <span key={loc} className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                                {loc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        {onUpdateDoctorStatus && (
                          <>
                            {doc.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={busyEntityActionKey === `doc-${doc.id}`}
                                onClick={() =>
                                  runEntityStatusAction(
                                    `doc-${doc.id}`,
                                    `Doctor "${doc.name}" approved and synced.`,
                                    () => onUpdateDoctorStatus(doc.id, 'approved')
                                  )
                                }
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                              >
                                {busyEntityActionKey === `doc-${doc.id}` ? 'Saving...' : 'Approve Doctor'}
                              </button>
                            )}
                            {doc.status === 'approved' && (
                              <button
                                type="button"
                                disabled={busyEntityActionKey === `doc-${doc.id}`}
                                onClick={() =>
                                  runEntityStatusAction(
                                    `doc-${doc.id}`,
                                    `Doctor "${doc.name}" suspended and public listing hidden.`,
                                    () => onUpdateDoctorStatus(doc.id, 'suspended')
                                  )
                                }
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                {busyEntityActionKey === `doc-${doc.id}` ? 'Saving...' : 'Suspend Account'}
                              </button>
                            )}
                            {doc.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={busyEntityActionKey === `doc-${doc.id}`}
                                onClick={() =>
                                  runEntityStatusAction(
                                    `doc-${doc.id}`,
                                    `Doctor "${doc.name}" rejected.`,
                                    () => onUpdateDoctorStatus(doc.id, 'rejected')
                                  )
                                }
                                className="px-3 py-1.5 bg-slate-700 hover:bg-rose-600 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                              >
                                Reject / Revoke
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMERGENCY REQUESTS TAB */}
        {activeTab === 'emergency_requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>24x7 Emergency Doctor & Home Visit Dispatch ({emergencyDoctorRequests.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time monitor for doctor consultations across Satali, Hasimara, and Dooars tea estates.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-xl">
                {activeEmergencyCalls.length} Urgent Unfulfilled
              </span>
            </div>

            {emergencyDoctorRequests.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-xs text-slate-400">
                No emergency doctor requests currently logged.
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyDoctorRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-slate-800 border rounded-2xl p-4 space-y-2.5 ${
                      req.priority === 'critical'
                        ? 'border-rose-500 bg-rose-950/20'
                        : req.priority === 'high'
                          ? 'border-amber-500 bg-amber-950/20'
                          : 'border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            req.priority === 'critical'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500 text-slate-950 font-bold'
                          }`}>
                            {req.priority} PRIORITY
                          </span>
                          <span className="text-xs font-mono text-slate-400">#{req.id}</span>
                          <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded">
                            {req.requestType === 'home_visit' ? '🏠 Home Visit' : '📞 Phone Consultation'}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{req.patientName}</span>
                          <span className="text-xs font-normal text-slate-400">(Age: {req.patientAge || 'Adult'})</span>
                        </h4>

                        <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <a href={`tel:${req.patientPhone}`} className="text-emerald-400 font-mono font-bold hover:underline">
                            {req.patientPhone}
                          </a>
                          <span>• Locality: <strong className="text-white">{req.locality}</strong> (PIN {req.pincode})</span>
                        </p>

                        <p className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-xl mt-1.5 border border-slate-700">
                          <strong className="text-slate-100">Reported Symptoms:</strong> {req.symptoms}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                          req.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : req.status === 'accepted' || req.status === 'on_the_way'
                              ? 'bg-sky-950 text-sky-400'
                              : 'bg-amber-950 text-amber-400'
                        }`}>
                          {req.status}
                        </span>

                        {onUpdateEmergencyDoctorRequestStatus && req.status !== 'completed' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => onUpdateEmergencyDoctorRequestStatus(req.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                            >
                              Mark Done
                            </button>
                            <button
                              onClick={() => onUpdateEmergencyDoctorRequestStatus(req.id, 'cancelled')}
                              className="px-2 py-1 bg-slate-700 hover:bg-rose-700 text-slate-300 hover:text-white rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Registered Customers ({customers.length})</span>
            </h3>

            {customers.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                No registered customer records synced from Firestore yet.
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((c, idx) => {
                  const badge = c.isPhoneVerified
                    ? { label: 'Phone Verified', cls: 'bg-emerald-950 text-emerald-300 border-emerald-800' }
                    : c.isVerified
                      ? { label: 'Email Verified', cls: 'bg-purple-950 text-purple-300 border-purple-800' }
                      : c.authMethod === 'anonymous' || !c.isSessionAuthenticated
                        ? { label: 'Guest Session', cls: 'bg-slate-900 text-slate-300 border-slate-700' }
                        : { label: 'Unverified', cls: 'bg-amber-950 text-amber-300 border-amber-800' };

                  return (
                    <div key={c.id || c.userId || idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{c.name || 'Unnamed Customer'}</h4>
                        <p className="text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{c.phone || 'No phone'}</span>
                          <span>• {c.email || 'No email'}</span>
                        </p>
                        <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>
                            {c.location || 'Satali'}
                            {c.pincode ? ` (PIN ${c.pincode})` : ''}
                            {c.address ? ` — ${c.address}` : ''}
                          </span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {c.gpsCoordinates && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-1">
                            GPS: {c.gpsCoordinates.lat}, {c.gpsCoordinates.lng}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* UNIVERSAL LOCALITY ROUTING TAB */}
        {activeTab === 'routing' && (
          <LocalityRoutingTab
            routingConfig={resolvedRoutingConfig}
            routingAlerts={routingAlerts}
            localities={localities}
            shops={shops}
            deliveryPersons={deliveryPersons}
            drivers={drivers}
            serviceProviders={serviceProviders}
            partnerAccounts={partnerAccounts}
            orders={orders}
            deliveryRequests={deliveries}
            rideBookings={rideBookings}
            serviceRequests={serviceRequests}
            onUpdateRoutingConfig={(next) => onUpdateRoutingConfig?.(next)}
            onAssignPartner={(params) =>
              onAssignPartnerWithRouting
                ? onAssignPartnerWithRouting(params)
                : { allowed: false, error: 'Routing assignment handler not configured.' }
            }
            onResolveAlert={(alertId) => onResolveRoutingAlert?.(alertId)}
          />
        )}

        {/* SHOPS TAB */}
        {activeTab === 'shops' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">Marketplace Shops ({shops.length})</h3>
                <p className="text-[11px] text-slate-400">
                  Manage shop details, permitted categories, approved service areas, and account suspension sync.
                </p>
              </div>
            </div>

            {shopFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
                  shopFeedback.type === 'ok'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                }`}
              >
                <span>{shopFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setShopFeedback(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              {shops.map((shop) => {
                const linkedAcc = findLinkedAccountForEntity('shopkeeper', shop.id, shop.ownerId);
                const areas = shop.deliveryAreas?.length ? shop.deliveryAreas : [shop.locality];
                return (
                  <div
                    key={shop.id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <img
                          src={shop.imageUrl}
                          alt={shop.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-600 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white">{shop.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {shop.category || shop.shopType}
                            </span>
                            {!shop.isOpen && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                Closed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">
                            {shop.locality} ({shop.pincode}) • {shop.contactNumber}
                          </p>
                          <p className="text-[11px] text-slate-400">{shop.address}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Owner: {shop.ownerEmail || shop.ownerId}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            shop.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : shop.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {shop.status}
                        </span>
                        {linkedAcc && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              linkedAcc.status === 'active'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            Auth: {linkedAcc.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Approved Service Localities */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-semibold">Service Areas:</span>
                      {areas.map((area) => (
                        <span
                          key={area}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-emerald-300 font-semibold"
                        >
                          {area}
                        </span>
                      ))}
                      <span className="text-slate-400 ml-auto font-mono">
                        Fee: ₹{shop.deliveryCharge} • {shop.deliveryRadiusKm}km
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700 text-xs">
                      {onAdminUpdateShop && (
                        <button
                          type="button"
                          onClick={() => {
                            setShopEditError('');
                            setEditingShop(shop);
                            setShopEditForm({
                              name: shop.name,
                              category: shop.category || 'Grocery & Ration',
                              shopType: shop.shopType || resolveShopTypeFromCategory(shop.category || ''),
                              address: shop.address || '',
                              locality: shop.locality || localities[0]?.name || 'Satali',
                              pincode: shop.pincode || '735214',
                              contactNumber: shop.contactNumber || '',
                              publishContact: Boolean(shop.publishContact),
                              publicContactNumber: shop.publicContactNumber || '',
                              businessHours: shop.businessHours || '',
                              description: shop.description || '',
                              imageUrl: shop.imageUrl || '',
                              deliveryAreas: areas.length > 0 ? areas : [shop.locality],
                              deliveryCharge: String(shop.deliveryCharge ?? 20),
                              freeDeliveryAbove: shop.freeDeliveryAbove !== undefined ? String(shop.freeDeliveryAbove) : '',
                              deliveryRadiusKm: String(shop.deliveryRadiusKm ?? 8),
                              isOpen: Boolean(shop.isOpen),
                              status: shop.status
                            });
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details & Areas</span>
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const res = await onUpdateShopStatus(shop.id, 'approved');
                          if (res && res.ok === false) {
                            setShopFeedback({ type: 'err', text: res.error || 'Could not approve shop.' });
                          } else if (res && res.warning) {
                            setShopFeedback({ type: 'err', text: res.warning });
                          } else {
                            setShopFeedback({ type: 'ok', text: `Shop "${shop.name}" updated to approved.` });
                          }
                        }}
                        disabled={shop.status === 'approved'}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                      >
                        Approve Shop
                      </button>
                      <button
                        onClick={async () => {
                          const res = await onUpdateShopStatus(shop.id, 'pending');
                          if (res && res.ok === false) {
                            setShopFeedback({ type: 'err', text: res.error || 'Could not update shop.' });
                          } else if (res && res.warning) {
                            setShopFeedback({ type: 'err', text: res.warning });
                          } else {
                            setShopFeedback({ type: 'ok', text: `Shop "${shop.name}" set to pending.` });
                          }
                        }}
                        disabled={shop.status === 'pending'}
                        className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                      >
                        Set Pending
                      </button>
                      <button
                        onClick={async () => {
                          const res = await onUpdateShopStatus(shop.id, 'rejected');
                          if (res && res.ok === false) {
                            setShopFeedback({ type: 'err', text: res.error || 'Could not reject shop.' });
                          } else if (res && res.warning) {
                            setShopFeedback({ type: 'err', text: res.warning });
                          } else {
                            setShopFeedback({ type: 'ok', text: `Shop "${shop.name}" rejected and hidden.` });
                          }
                        }}
                        disabled={shop.status === 'rejected'}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={async () => {
                          const res = await onUpdateShopStatus(shop.id, 'suspended');
                          if (res && res.ok === false) {
                            setShopFeedback({ type: 'err', text: res.error || 'Could not suspend shop.' });
                          } else if (res && res.warning) {
                            setShopFeedback({ type: 'err', text: res.warning });
                          } else {
                            setShopFeedback({ type: 'ok', text: `Shop "${shop.name}" suspended safely.` });
                          }
                        }}
                        disabled={shop.status === 'suspended'}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit Shop Details & Areas Modal */}
            {editingShop && shopEditForm && onAdminUpdateShop && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-purple-400" />
                        <span>Edit Shop & Service Areas</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {editingShop.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShop(null);
                        setShopEditForm(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setShopEditError('');
                      setIsSavingShopEdit(true);
                      try {
                        const res = await onAdminUpdateShop(editingShop.id, {
                          name: shopEditForm.name,
                          category: shopEditForm.category,
                          shopType: resolveShopTypeFromCategory(shopEditForm.category),
                          address: shopEditForm.address,
                          locality: shopEditForm.locality,
                          pincode: shopEditForm.pincode,
                          contactNumber: shopEditForm.contactNumber,
                          publishContact: shopEditForm.publishContact,
                          publicContactNumber: shopEditForm.publishContact ? shopEditForm.publicContactNumber : undefined,
                          businessHours: shopEditForm.businessHours,
                          description: shopEditForm.description,
                          imageUrl: shopEditForm.imageUrl,
                          deliveryAreas: shopEditForm.deliveryAreas,
                          deliveryCharge: Number(shopEditForm.deliveryCharge || 0),
                          freeDeliveryAbove: shopEditForm.freeDeliveryAbove
                            ? Number(shopEditForm.freeDeliveryAbove)
                            : undefined,
                          deliveryRadiusKm: Number(shopEditForm.deliveryRadiusKm || 8),
                          isOpen: shopEditForm.isOpen,
                          status: shopEditForm.status
                        });
                        if (!res.ok) {
                          setShopEditError(res.error || 'Could not update shop.');
                          return;
                        }
                        setShopFeedback({
                          type: 'ok',
                          text: `Updated "${shopEditForm.name}" details, areas, and status (${shopEditForm.status}).`
                        });
                        setEditingShop(null);
                        setShopEditForm(null);
                      } finally {
                        setIsSavingShopEdit(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Shop Name</label>
                        <input
                          type="text"
                          required
                          value={shopEditForm.name}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, name: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Permitted Shop Category</label>
                        <select
                          value={shopEditForm.category}
                          onChange={(e) =>
                            setShopEditForm({
                              ...shopEditForm,
                              category: e.target.value,
                              shopType: resolveShopTypeFromCategory(e.target.value)
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          <option value="Grocery & Ration">Grocery & Ration</option>
                          <option value="Medical & Pharmacy">Medical & Pharmacy</option>
                          <option value="Meat, Chicken & Fish">Meat, Chicken & Fish</option>
                          <option value="New Mobile & Accessories">New Mobile & Accessories</option>
                          <option value="General & Household">General & Household</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Physical Address</label>
                      <input
                        type="text"
                        required
                        value={shopEditForm.address}
                        onChange={(e) => setShopEditForm({ ...shopEditForm, address: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Primary Locality</label>
                        <select
                          value={shopEditForm.locality}
                          onChange={(e) => {
                            const locName = e.target.value;
                            const found = localities.find((l) => l.name === locName);
                            const nextAreas = Array.from(new Set([locName, ...shopEditForm.deliveryAreas]));
                            setShopEditForm({
                              ...shopEditForm,
                              locality: locName,
                              pincode: found?.pincode || shopEditForm.pincode,
                              deliveryAreas: nextAreas
                            });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        >
                          {localities.map((loc) => (
                            <option key={loc.id} value={loc.name}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">PIN Code</label>
                        <input
                          type="text"
                          required
                          value={shopEditForm.pincode}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, pincode: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Contact Mobile</label>
                        <input
                          type="tel"
                          required
                          value={shopEditForm.contactNumber}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, contactNumber: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>

                    {/* Multi-select Approved Service Localities */}
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2">
                      <label className="text-slate-200 font-bold block">
                        Approved Service Localities ({shopEditForm.deliveryAreas.length} selected)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {localities.map((loc) => {
                          const checked = shopEditForm.deliveryAreas.includes(loc.name);
                          return (
                            <label
                              key={loc.id}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer text-[11px] ${
                                checked
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold'
                                  : 'bg-slate-900 border-slate-700 text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? Array.from(new Set([...shopEditForm.deliveryAreas, loc.name]))
                                    : shopEditForm.deliveryAreas.filter((a) => a !== loc.name);
                                  setShopEditForm({
                                    ...shopEditForm,
                                    deliveryAreas: next.length > 0 ? next : [shopEditForm.locality]
                                  });
                                }}
                              />
                              <span className="truncate">{loc.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Delivery Fee (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={shopEditForm.deliveryCharge}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, deliveryCharge: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Free Above (₹)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Optional"
                          value={shopEditForm.freeDeliveryAbove}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, freeDeliveryAbove: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Radius (km)</label>
                        <input
                          type="number"
                          min={1}
                          value={shopEditForm.deliveryRadiusKm}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, deliveryRadiusKm: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Business Hours</label>
                        <input
                          type="text"
                          placeholder="e.g. 7:00 AM - 9:30 PM"
                          value={shopEditForm.businessHours}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, businessHours: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Approval / Suspension Status</label>
                        <select
                          value={shopEditForm.status}
                          onChange={(e) =>
                            setShopEditForm({ ...shopEditForm, status: e.target.value as ShopApprovalStatus })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-semibold"
                        >
                          <option value="approved">Approved (Active)</option>
                          <option value="pending">Pending Review</option>
                          <option value="suspended">Suspended (Blocked)</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-2.5">
                      <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopEditForm.isOpen}
                          onChange={(e) => setShopEditForm({ ...shopEditForm, isOpen: e.target.checked })}
                        />
                        <span>Shop Currently Open</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopEditForm.publishContact}
                          onChange={(e) =>
                            setShopEditForm({
                              ...shopEditForm,
                              publishContact: e.target.checked,
                              publicContactNumber:
                                shopEditForm.publicContactNumber || shopEditForm.contactNumber
                            })
                          }
                        />
                        <span>Show Public Contact Number</span>
                      </label>
                    </div>

                    {shopEditForm.publishContact && (
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Public Display Contact Number</label>
                        <input
                          type="tel"
                          value={shopEditForm.publicContactNumber}
                          onChange={(e) =>
                            setShopEditForm({ ...shopEditForm, publicContactNumber: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={shopEditForm.description}
                        onChange={(e) => setShopEditForm({ ...shopEditForm, description: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>

                    {shopEditError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200">
                        {shopEditError}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShop(null);
                          setShopEditForm(null);
                        }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingShopEdit}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl"
                      >
                        {isSavingShopEdit ? 'Saving Changes...' : 'Save & Sync Shop'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">All Platform Orders ({orders.length})</h3>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${orders.length})` },
                  { id: 'active', label: `Active (${orders.filter((o) => !['delivered', 'cancelled', 'rejected'].includes(o.status)).length})` },
                  { id: 'delivered', label: `Delivered (${orders.filter((o) => o.status === 'delivered').length})` },
                  { id: 'returns', label: `Returns (${orders.filter((o) => Boolean(o.returnRequest)).length})` },
                  { id: 'cancelled', label: `Cancelled (${orders.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                      orderFilter === f.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {orders
                .filter((order) => {
                  if (orderFilter === 'active') return !['delivered', 'cancelled', 'rejected'].includes(order.status);
                  if (orderFilter === 'delivered') return order.status === 'delivered';
                  if (orderFilter === 'returns') return Boolean(order.returnRequest);
                  if (orderFilter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
                  return true;
                })
                .map((order) => (
                <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-purple-300">#{order.id}</span>
                        {order.locality && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {order.locality}
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                            Cancelled by Customer
                          </span>
                        )}
                        {order.returnRequest && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            order.returnRequest.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : order.returnRequest.status === 'rejected'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            Return: {order.returnRequest.status === 'pending_review' ? 'Pending Review' : order.returnRequest.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white font-semibold mt-0.5">
                        {order.customerName} ({order.customerPhone})
                      </p>
                      {order.shopName && (
                        <p className="text-[11px] text-emerald-300 font-medium">
                          Shop: {order.shopName}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">{order.deliveryAddress}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-white block">₹{order.total}</span>
                      <span className="text-[11px] text-slate-400 block">{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="text-xs bg-slate-900/70 p-2.5 rounded-xl space-y-1">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>
                          {i.quantity}x {i.product.name} ({i.selectedWeightGrams ? `${i.selectedWeightGrams}g` : i.product.unit})
                        </span>
                        <span>₹{computeCartItemLineTotal(i)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Return Request Review Block */}
                  {order.returnRequest && (
                    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return Request #{order.returnRequest.id}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase text-amber-200">
                          {order.returnRequest.status === 'pending_review' ? 'Pending Manual Review' : order.returnRequest.status}
                        </span>
                      </div>
                      <p className="text-slate-200">
                        <strong>Reason:</strong> {order.returnRequest.reason}
                      </p>
                      {order.returnRequest.description && (
                        <p className="text-slate-300">
                          <strong>Customer Details:</strong> {order.returnRequest.description}
                        </p>
                      )}
                      {order.returnRequest.photoEvidenceUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(order.returnRequest?.photoEvidenceUrl || null)}
                          className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-[11px] text-emerald-300 hover:bg-slate-800"
                        >
                          <img
                            src={order.returnRequest.photoEvidenceUrl}
                            alt="Return photo evidence"
                            className="w-10 h-10 rounded-md object-cover border border-slate-700"
                          />
                          <span>Inspect Photo Evidence</span>
                        </button>
                      )}
                      {order.returnRequest.reviewNotes && (
                        <p className="text-[11px] bg-slate-900 p-2 rounded-lg text-emerald-300 border border-slate-700">
                          <strong>Review Note ({order.returnRequest.reviewedBy || 'admin'}):</strong> {order.returnRequest.reviewNotes}
                        </p>
                      )}

                      {onReviewReturnRequest && order.returnRequest.status === 'pending_review' && (
                        <div className="pt-2 border-t border-amber-500/20 space-y-2">
                          <input
                            type="text"
                            placeholder="Optional review / refund note..."
                            value={returnReviewNotes[order.id] || ''}
                            onChange={(e) =>
                              setReturnReviewNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={reviewingReturnOrderId === order.id}
                              onClick={() => handleAdminReturnDecision(order.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-xs"
                            >
                              {reviewingReturnOrderId === order.id ? 'Saving...' : 'Approve Return'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingReturnOrderId === order.id}
                              onClick={() => handleAdminReturnDecision(order.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-xs"
                            >
                              Reject Return
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Status Override */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
                    <span className="text-slate-400">Current Status: <strong className="text-white uppercase">{order.status}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                        className="bg-slate-900 text-slate-200 border border-slate-600 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLEET & DRIVERS TAB (Ride Drivers + Delivery Fleet Riders) */}
        {activeTab === 'drivers' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Transport Drivers & Delivery Fleet ({drivers.length + deliveryPersons.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Manage Toto, Auto, Taxi ride drivers (bike taxi excluded) and Delivery Fleet riders.
                </p>
              </div>
              <div className="flex gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setFleetSubTab('drivers')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    fleetSubTab === 'drivers' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Ride Drivers ({drivers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFleetSubTab('delivery')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    fleetSubTab === 'delivery' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Delivery Riders ({deliveryPersons.length})
                </button>
              </div>
            </div>

            {fleetSubTab === 'drivers' ? (
              <div className="space-y-3">
                {drivers.map((drv) => {
                  const linkedAcc = findLinkedAccountForEntity('driver', drv.id, drv.ownerId);
                  return (
                    <div key={drv.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{drv.name}</span>
                            <span className="text-xs uppercase bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                              {drv.vehicleType}
                            </span>
                            {drv.isOnline && drv.status === 'approved' && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">
                            {drv.vehicleNumber} • {drv.phone}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Base: {drv.locality}
                            {drv.servedLocalities?.length ? ` • Serves: ${drv.servedLocalities.join(', ')}` : ''} •{' '}
                            {drv.totalRides} rides • ★ {drv.rating}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              drv.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : drv.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {drv.status}
                          </span>
                          {linkedAcc && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                linkedAcc.status === 'active'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Auth: {linkedAcc.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            runEntityStatusAction(
                              `drv-${drv.id}`,
                              `Driver "${drv.name}" approved and synced.`,
                              () => onUpdateDriverStatus(drv.id, 'approved')
                            )
                          }
                          disabled={drv.status === 'approved' || busyEntityActionKey === `drv-${drv.id}`}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                        >
                          {busyEntityActionKey === `drv-${drv.id}` ? 'Saving...' : 'Approve Driver'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runEntityStatusAction(
                              `drv-${drv.id}`,
                              `Driver "${drv.name}" set to pending.`,
                              () => onUpdateDriverStatus(drv.id, 'pending')
                            )
                          }
                          disabled={drv.status === 'pending' || busyEntityActionKey === `drv-${drv.id}`}
                          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                        >
                          Set Pending
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runEntityStatusAction(
                              `drv-${drv.id}`,
                              `Driver "${drv.name}" suspended and hidden from public ride dispatch.`,
                              () => onUpdateDriverStatus(drv.id, 'suspended')
                            )
                          }
                          disabled={drv.status === 'suspended' || busyEntityActionKey === `drv-${drv.id}`}
                          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runEntityStatusAction(
                              `drv-${drv.id}`,
                              `Driver "${drv.name}" rejected.`,
                              () => onUpdateDriverStatus(drv.id, 'rejected')
                            )
                          }
                          disabled={drv.status === 'rejected' || busyEntityActionKey === `drv-${drv.id}`}
                          className="bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryPersons.length === 0 ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No delivery fleet riders registered yet. Provision riders from the Role Accounts tab.
                  </div>
                ) : (
                  deliveryPersons.map((rider) => {
                    const linkedAcc = findLinkedAccountForEntity('delivery', rider.id, rider.ownerId);
                    return (
                      <div key={rider.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">{rider.name}</span>
                              {rider.isOnline && rider.status === 'approved' && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                  Online
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 font-mono mt-0.5">{rider.phone}</p>
                            <p className="text-[11px] text-slate-400">
                              Base: {rider.locality}
                              {rider.servedLocalities?.length ? ` • Serves: ${rider.servedLocalities.join(', ')}` : ''} •{' '}
                              {rider.totalDelivered} deliveries • ★ {rider.rating}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                rider.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : rider.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {rider.status}
                            </span>
                            {linkedAcc && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  linkedAcc.status === 'active'
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                Auth: {linkedAcc.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              runEntityStatusAction(
                                `del-${rider.id}`,
                                `Delivery rider "${rider.name}" approved.`,
                                () => onUpdateDeliveryPersonStatus(rider.id, 'approved')
                              )
                            }
                            disabled={rider.status === 'approved' || busyEntityActionKey === `del-${rider.id}`}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                          >
                            {busyEntityActionKey === `del-${rider.id}` ? 'Saving...' : 'Approve Rider'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              runEntityStatusAction(
                                `del-${rider.id}`,
                                `Delivery rider "${rider.name}" set to pending.`,
                                () => onUpdateDeliveryPersonStatus(rider.id, 'pending')
                              )
                            }
                            disabled={rider.status === 'pending' || busyEntityActionKey === `del-${rider.id}`}
                            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                          >
                            Set Pending
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              runEntityStatusAction(
                                `del-${rider.id}`,
                                `Delivery rider "${rider.name}" suspended.`,
                                () => onUpdateDeliveryPersonStatus(rider.id, 'suspended')
                              )
                            }
                            disabled={rider.status === 'suspended' || busyEntityActionKey === `del-${rider.id}`}
                            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              runEntityStatusAction(
                                `del-${rider.id}`,
                                `Delivery rider "${rider.name}" rejected.`,
                                () => onUpdateDeliveryPersonStatus(rider.id, 'rejected')
                              )
                            }
                            disabled={rider.status === 'rejected' || busyEntityActionKey === `del-${rider.id}`}
                            className="bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Local Parcel Requests ({deliveries.length})</h3>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('drivers');
                  setFleetSubTab('delivery');
                }}
                className="text-xs font-bold text-purple-300 hover:text-purple-200 underline"
              >
                Manage Fleet Riders ({deliveryPersons.filter((d) => d.status === 'approved').length}/{deliveryPersons.length} approved)
              </button>
            </div>
            <div className="space-y-3">
              {deliveries.map((del) => (
                <div key={del.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-orange-400">#{del.id}</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{del.parcelDescription} ({del.weightCategory})</h4>
                      <p className="text-[11px] text-slate-300">From: {del.senderName} ({del.senderAddress})</p>
                      <p className="text-[11px] text-slate-300">To: {del.receiverName} ({del.receiverAddress})</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-white">₹{del.estimatedPrice}</span>
                      <span className="text-[10px] uppercase font-bold block text-orange-300">{del.status}</span>
                    </div>
                  </div>

                  {/* Manual Assignment (strictly eligible approved active delivery riders) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
                    <span className="text-slate-400">
                      Rider: {del.assignedDeliveryPersonName || 'Not Assigned'}
                    </span>
                    <select
                      onChange={(e) => {
                        const targetRider = deliveryPersons.find((p) => p.id === e.target.value);
                        if (targetRider) {
                          onAssignDelivery(del.id, targetRider.id, targetRider.name, targetRider.phone);
                        }
                      }}
                      className="bg-slate-900 text-slate-200 border border-slate-600 rounded-lg px-2 py-1 text-xs"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign Approved Rider</option>
                      {deliveryPersons
                        .filter((dp) => dp.status === 'approved')
                        .map((dp) => (
                          <option key={dp.id} value={dp.id}>
                            {dp.name} ({dp.locality}{dp.isOnline ? ' • Online' : ' • Offline'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Local Service Providers ({serviceProviders.length})</h3>
            <div className="space-y-3">
              {serviceProviders.map((srv) => (
                <div key={srv.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{srv.name}</span>
                        <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.2 rounded font-bold">
                          {srv.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{srv.serviceArea} • {srv.phone}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{srv.description}</p>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      srv.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {srv.status}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        runEntityStatusAction(
                          `srv-${srv.id}`,
                          `Service provider "${srv.name}" approved.`,
                          () => onUpdateServiceProviderStatus(srv.id, 'approved')
                        )
                      }
                      disabled={srv.status === 'approved' || busyEntityActionKey === `srv-${srv.id}`}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      {busyEntityActionKey === `srv-${srv.id}` ? 'Saving...' : 'Approve Provider'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runEntityStatusAction(
                          `srv-${srv.id}`,
                          `Service provider "${srv.name}" suspended.`,
                          () => onUpdateServiceProviderStatus(srv.id, 'suspended')
                        )
                      }
                      disabled={srv.status === 'suspended' || busyEntityActionKey === `srv-${srv.id}`}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Local Job Listings ({jobListings.length})</h3>
            <div className="space-y-3">
              {jobListings.map((job) => (
                <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-700 text-stone-200 px-2 py-0.2 rounded inline-block mb-1">
                        {job.category}
                      </span>
                      <h4 className="font-bold text-sm text-white">{job.title}</h4>
                      <p className="text-xs text-slate-300">{job.employerName} • {job.location} • {job.salary}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{job.description}</p>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      job.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        runEntityStatusAction(
                          `job-${job.id}`,
                          `Job "${job.title}" approved.`,
                          () => onUpdateJobStatus(job.id, 'approved')
                        )
                      }
                      disabled={job.status === 'approved' || busyEntityActionKey === `job-${job.id}`}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      {busyEntityActionKey === `job-${job.id}` ? 'Saving...' : 'Approve Listing'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runEntityStatusAction(
                          `job-${job.id}`,
                          `Job "${job.title}" rejected.`,
                          () => onUpdateJobStatus(job.id, 'rejected')
                        )
                      }
                      disabled={job.status === 'rejected' || busyEntityActionKey === `job-${job.id}`}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Support Grievances, Return Requests & Tickets ({complaints.length})</h3>
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-red-400">#{c.id}</span>
                        {c.type === 'return_request' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Return Request
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-0.5">{c.subject}</h4>
                      <p className="text-xs text-slate-300">{c.customerName} ({c.customerPhone})</p>
                      {c.shopName && <p className="text-[11px] text-emerald-300">Shop: {c.shopName}</p>}
                      <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {c.type === 'return_request' && c.returnStatus ? c.returnStatus.replace('_', ' ') : c.status}
                    </span>
                  </div>

                  {c.photoEvidenceUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(c.photoEvidenceUrl || null)}
                      className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-[11px] text-emerald-300"
                    >
                      <img
                        src={c.photoEvidenceUrl}
                        alt="Return evidence"
                        className="w-10 h-10 rounded-md object-cover border border-slate-700"
                      />
                      <span>Inspect Photo Evidence</span>
                    </button>
                  )}

                  {c.resolutionNotes && (
                    <div className="bg-slate-900 p-2.5 rounded-xl text-xs text-emerald-400 border border-slate-700">
                      <strong>Resolution:</strong> {c.resolutionNotes}
                    </div>
                  )}

                  {c.status !== 'resolved' && c.type === 'return_request' && c.orderId && onReviewReturnRequest ? (
                    <div className="pt-2 border-t border-slate-700 space-y-2">
                      <input
                        type="text"
                        placeholder="Return review notes..."
                        value={returnReviewNotes[c.orderId] || ''}
                        onChange={(e) =>
                          setReturnReviewNotes((prev) => ({
                            ...prev,
                            [c.orderId as string]: e.target.value
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-xs rounded-xl p-2 text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={reviewingReturnOrderId === c.orderId}
                          onClick={() => handleAdminReturnDecision(c.orderId as string, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-3 rounded-xl"
                        >
                          Approve Return
                        </button>
                        <button
                          type="button"
                          disabled={reviewingReturnOrderId === c.orderId}
                          onClick={() => handleAdminReturnDecision(c.orderId as string, 'rejected')}
                          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-3 rounded-xl"
                        >
                          Reject Return
                        </button>
                      </div>
                    </div>
                  ) : c.status !== 'resolved' && (
                    <div className="pt-2 border-t border-slate-700 space-y-2">
                      <input
                        type="text"
                        placeholder="Resolution notes..."
                        value={selectedComplaintId === c.id ? resolutionNote : ''}
                        onChange={(e) => {
                          setSelectedComplaintId(c.id);
                          setResolutionNote(e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-xs rounded-xl p-2 text-white"
                      />
                      <button
                        onClick={() => {
                          onResolveComplaint(c.id, resolutionNote || 'Resolved by Administrator');
                          setResolutionNote('');
                          setSelectedComplaintId(null);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCRAP REQUESTS & KABARI BIDS TAB */}
        {activeTab === 'scrap' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Scrap Selling Requests & Bids</h3>
                <p className="text-[11px] text-slate-400">Dooars Kabari marketplace pickups & buyer offers</p>
              </div>
              <span className="text-xs bg-lime-900/60 text-lime-300 border border-lime-700/60 px-2 py-0.5 rounded-full font-bold">
                {scrapRequests.length} Total Requests
              </span>
            </div>

            <div className="space-y-2.5">
              {scrapRequests.map((req) => (
                <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">{req.category}</span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                          ~{req.estimatedWeight}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{req.description}</p>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                      {req.status}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="text-slate-300">
                      <strong>Customer:</strong> {req.customerName} ({req.customerPhone})
                    </div>
                    <div className="text-slate-400">
                      <strong>Address:</strong> {req.pickupAddress}, {req.locality} - {req.pincode}
                    </div>
                    <div className="text-slate-400">
                      <strong>Buyer Bids:</strong> {req.offers?.length || 0} quotes received
                    </div>
                  </div>

                  {onUpdateScrapStatus && req.status !== 'completed' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onUpdateScrapStatus(req.id, 'picked_up')}
                        className="bg-lime-600 hover:bg-lime-500 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs"
                      >
                        Dispatch / Mark Picked Up
                      </button>
                      <button
                        onClick={() => onUpdateScrapStatus(req.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs"
                      >
                        Confirm Complete & Paid
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOCALITIES & PIN CODES HUB TAB - INTERACTIVE MANAGEMENT CONSOLE */}
        {activeTab === 'localities' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Dooars Hyperlocal Localities & Verified PIN Hubs</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Centrally managed in Firestore • Multi-locality support for PIN 735214 & 735215
                </p>
              </div>

              <button
                onClick={() => {
                  setDuplicateError(null);
                  setFormName('');
                  setFormPin('735214');
                  setFormParent('Satali');
                  setFormHub('Satali Service Sector');
                  setFormLandmarks('');
                  setFormLat('26.7214');
                  setFormLng('89.3982');
                  setIsAddLocalityModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Locality</span>
              </button>
            </div>

            {/* Quick PIN Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">PIN 735214 (Satali Hub)</span>
                <span className="text-lg font-black text-emerald-400">
                  {localities.filter((l) => l.pincode === '735214').length} Localities
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">PIN 735215 (Hasimara Hub)</span>
                <span className="text-lg font-black text-blue-400">
                  {localities.filter((l) => l.pincode === '735215').length} Localities
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">PIN 735217 (Kalchini)</span>
                <span className="text-lg font-black text-purple-400">
                  {localities.filter((l) => l.pincode === '735217').length} Localities
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">PIN 735182 (Jaigaon)</span>
                <span className="text-lg font-black text-amber-400">
                  {localities.filter((l) => l.pincode === '735182').length} Localities
                </span>
              </div>
            </div>

            {/* Search and PIN Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search locality name, parent area, landmark..."
                  value={locSearch}
                  onChange={(e) => setLocSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto text-[11px]">
                {(['all', '735214', '735215', '735217', '735182'] as const).map((pin) => (
                  <button
                    key={pin}
                    onClick={() => setLocPinFilter(pin)}
                    className={`px-3 py-2 rounded-xl font-bold border transition-colors shrink-0 ${
                      locPinFilter === pin
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {pin === 'all' ? 'All PINs' : `PIN ${pin}`}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Locality Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localities
                .filter((loc) => {
                  if (locPinFilter !== 'all' && loc.pincode !== locPinFilter) return false;
                  if (locSearch.trim()) {
                    const q = locSearch.toLowerCase().trim();
                    return (
                      loc.name.toLowerCase().includes(q) ||
                      loc.pincode.includes(q) ||
                      loc.parentArea?.toLowerCase().includes(q) ||
                      loc.hubName?.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((loc) => (
                  <div key={loc.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5 relative group hover:border-slate-600 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">{loc.name}</span>
                          <span className="text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-lg">
                            PIN: {loc.pincode}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                            {loc.parentArea} Zone
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{loc.hubName}</p>
                      </div>

                      <button
                        onClick={() => {
                          setDuplicateError(null);
                          setEditingLocality(loc);
                          setFormName(loc.name);
                          setFormPin(loc.pincode);
                          setFormParent(loc.parentArea || 'Satali');
                          setFormHub(loc.hubName);
                          setFormLandmarks(loc.popularLandmarks ? loc.popularLandmarks.join(', ') : '');
                          setFormLat(loc.coordinates?.lat?.toString() || '26.7214');
                          setFormLng(loc.coordinates?.lng?.toString() || '89.3982');
                        }}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Edit Locality"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {loc.popularLandmarks && loc.popularLandmarks.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {loc.popularLandmarks.map((lm, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {lm}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="font-mono">
                        GPS: {loc.coordinates?.lat}, {loc.coordinates?.lng}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold">
                        {loc.isVerifiedPin !== false ? 'Verified PIN Assigned' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Add Locality Modal */}
            {isAddLocalityModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Add New Hyperlocal Locality</span>
                    </h4>
                    <button
                      onClick={() => setIsAddLocalityModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {duplicateError && (
                    <div className="p-3 bg-red-900/40 border border-red-500 rounded-xl text-xs text-red-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{duplicateError}</span>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const cleanName = formName.trim();
                      if (!cleanName) return;

                      // Duplicate check (case-insensitive)
                      const isDup = localities.some(
                        (l) => l.name.toLowerCase() === cleanName.toLowerCase()
                      );
                      if (isDup) {
                        setDuplicateError(`A locality named "${cleanName}" already exists. Duplicate records are strictly prohibited.`);
                        return;
                      }

                      const newLoc: LocalityInfo = {
                        id: `loc-${cleanName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                        name: cleanName,
                        pincode: formPin,
                        parentArea: formParent,
                        hubName: formHub.trim() || `${cleanName} Service Sector`,
                        coordinates: {
                          lat: parseFloat(formLat) || 26.7214,
                          lng: parseFloat(formLng) || 89.3982
                        },
                        popularLandmarks: formLandmarks
                          ? formLandmarks.split(',').map((s) => s.trim()).filter(Boolean)
                          : [cleanName],
                        isVerifiedPin: true,
                        active: true,
                        createdAt: new Date().toISOString()
                      };

                      if (onAddLocality) {
                        onAddLocality(newLoc);
                      }
                      setIsAddLocalityModalOpen(false);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Locality Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Subhashini, Gurudwara, Satali Mandal Para"
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          setDuplicateError(null);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">PIN Code (Admin Verified)</label>
                        <select
                          value={formPin}
                          onChange={(e) => setFormPin(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                        >
                          <option value="735214">735214 (Satali Hub)</option>
                          <option value="735215">735215 (Hasimara Hub)</option>
                          <option value="735217">735217 (Kalchini Hub)</option>
                          <option value="735182">735182 (Jaigaon Hub)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Parent Service Area</label>
                        <select
                          value={formParent}
                          onChange={(e) => setFormParent(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                        >
                          <option value="Satali">Satali</option>
                          <option value="Hasimara">Hasimara</option>
                          <option value="Kalchini">Kalchini</option>
                          <option value="Jaigaon">Jaigaon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Hub Name / Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Subhashini Tea Estate & Garden Hospital"
                        value={formHub}
                        onChange={(e) => setFormHub(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Popular Landmarks (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Factory Gate, Staff Quarters, Hospital More"
                        value={formLandmarks}
                        onChange={(e) => setFormLandmarks(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Latitude</label>
                        <input
                          type="text"
                          value={formLat}
                          onChange={(e) => setFormLat(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Longitude</label>
                        <input
                          type="text"
                          value={formLng}
                          onChange={(e) => setFormLng(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddLocalityModalOpen(false)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm"
                      >
                        Save Locality
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Locality Modal */}
            {editingLocality && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>Edit Locality: {editingLocality.name}</span>
                    </h4>
                    <button
                      onClick={() => setEditingLocality(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {duplicateError && (
                    <div className="p-3 bg-red-900/40 border border-red-500 rounded-xl text-xs text-red-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{duplicateError}</span>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const cleanName = formName.trim();
                      if (!cleanName) return;

                      // Duplicate check
                      const isDup = localities.some(
                        (l) => l.name.toLowerCase() === cleanName.toLowerCase() && l.id !== editingLocality.id
                      );
                      if (isDup) {
                        setDuplicateError(`Another locality named "${cleanName}" already exists. Duplicate records are prohibited.`);
                        return;
                      }

                      if (onUpdateLocality) {
                        onUpdateLocality(editingLocality.id, {
                          name: cleanName,
                          pincode: formPin,
                          parentArea: formParent,
                          hubName: formHub.trim() || editingLocality.hubName,
                          popularLandmarks: formLandmarks
                            ? formLandmarks.split(',').map((s) => s.trim()).filter(Boolean)
                            : editingLocality.popularLandmarks,
                          coordinates: {
                            lat: parseFloat(formLat) || editingLocality.coordinates?.lat || 26.7214,
                            lng: parseFloat(formLng) || editingLocality.coordinates?.lng || 89.3982
                          },
                          updatedAt: new Date().toISOString()
                        });
                      }
                      setEditingLocality(null);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Locality Name</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          setDuplicateError(null);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Verified PIN Code</label>
                        <select
                          value={formPin}
                          onChange={(e) => setFormPin(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                        >
                          <option value="735214">735214 (Satali)</option>
                          <option value="735215">735215 (Hasimara)</option>
                          <option value="735217">735217 (Kalchini)</option>
                          <option value="735182">735182 (Jaigaon)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Parent Service Area</label>
                        <select
                          value={formParent}
                          onChange={(e) => setFormParent(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                        >
                          <option value="Satali">Satali</option>
                          <option value="Hasimara">Hasimara</option>
                          <option value="Kalchini">Kalchini</option>
                          <option value="Jaigaon">Jaigaon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Hub Description</label>
                      <input
                        type="text"
                        value={formHub}
                        onChange={(e) => setFormHub(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Landmarks (comma separated)</label>
                      <input
                        type="text"
                        value={formLandmarks}
                        onChange={(e) => setFormLandmarks(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Latitude</label>
                        <input
                          type="text"
                          value={formLat}
                          onChange={(e) => setFormLat(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Longitude</label>
                        <input
                          type="text"
                          value={formLng}
                          onChange={(e) => setFormLng(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingLocality(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm"
                      >
                        Update Locality
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROLE ACCOUNTS PROVISIONING TAB */}
        {activeTab === 'role_accounts' && (
          <div className="space-y-4">
            <div className="bg-purple-950/50 border border-purple-700/50 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-bold text-white">Admin-Only Partner Role Accounts</h3>
              </div>
              <p className="text-xs text-slate-300">
                Provision verified Firebase Auth accounts for Shopkeepers, Riders (Toto/Auto/Taxi Drivers & Delivery Fleet), Doctors, and Business Partners. Public self-registration is disabled for all partner roles.
              </p>
            </div>

            {issuedSummary && (
              <div className="bg-emerald-950/70 border border-emerald-500/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Partner Credentials Issued ({issuedSummary.role.replace('_', ' ').toUpperCase()})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIssuedSummary(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-amber-200">
                  Share these login details securely with <strong>{issuedSummary.displayName}</strong>. Passwords are only held in Firebase Authentication and never written to Firestore.
                  {issuedSummary.resetEmailSent && ' A Firebase password-reset setup email was also dispatched.'}
                </p>
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 font-mono text-[11px] space-y-1 text-slate-200">
                  <div><strong>UID:</strong> {issuedSummary.uid}</div>
                  <div><strong>Login Email:</strong> {issuedSummary.loginEmail}</div>
                  {issuedSummary.phone && <div><strong>Login Mobile:</strong> {issuedSummary.phone}</div>}
                  <div><strong>Initial Password:</strong> {issuedSummary.password}</div>
                  {issuedSummary.linkedEntityId && <div><strong>Linked Record:</strong> {issuedSummary.linkedEntityId}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = [
                      `Torsa Bazaar Partner Login (${issuedSummary.role})`,
                      `Name: ${issuedSummary.displayName}`,
                      `Login Email: ${issuedSummary.loginEmail}`,
                      issuedSummary.phone ? `Login Mobile: ${issuedSummary.phone}` : null,
                      `Initial Password: ${issuedSummary.password}`
                    ]
                      .filter(Boolean)
                      .join('\n');
                    navigator.clipboard?.writeText(text).then(() => {
                      setCopiedCreds(true);
                      setTimeout(() => setCopiedCreds(false), 2000);
                    }).catch(() => {});
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCreds ? 'Copied Credentials!' : 'Copy Issued Credentials'}</span>
                </button>
              </div>
            )}

            {/* Create Partner Account Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onCreatePartnerAccount) return;
                setRoleFormError('');
                if (!roleFormName.trim()) {
                  setRoleFormError('Partner full name is required.');
                  return;
                }
                if (!roleFormEmail.trim() && !roleFormPhone.trim()) {
                  setRoleFormError('Provide an email address, a mobile number, or both.');
                  return;
                }
                if (roleFormPassword.length < 6) {
                  setRoleFormError('Initial password must be at least 6 characters.');
                  return;
                }
                if (roleLinkMode === 'existing' && !roleLinkedEntityId) {
                  setRoleFormError('Select an existing record to link, or switch to Create New Profile.');
                  return;
                }

                const matchedLoc = localities.find(
                  (l) => l.name.toLowerCase() === roleFormLocality.toLowerCase()
                );
                const selectedMulti = Array.from(new Set([roleFormLocality, ...roleMultiLocalities])).filter(Boolean);

                setIsCreatingRoleAccount(true);
                try {
                  const res = await onCreatePartnerAccount({
                    role: roleFormType,
                    displayName: roleFormName.trim(),
                    loginEmail: roleFormEmail.trim().toLowerCase(),
                    email: roleFormEmail.trim() || undefined,
                    phone: roleFormPhone.trim() || undefined,
                    password: roleFormPassword,
                    sendPasswordReset: Boolean(roleFormSendReset && roleFormEmail.trim()),
                    locality: roleFormLocality,
                    pincode: matchedLoc?.pincode,
                    linkExistingEntityId: roleLinkMode === 'existing' ? roleLinkedEntityId : undefined,
                    linkedEntityId: roleLinkMode === 'existing' ? roleLinkedEntityId : undefined,
                    createNewEntity: roleLinkMode === 'new',
                    // Shopkeeper fields (real admin inputs only)
                    ...(roleFormType === 'shopkeeper' && roleLinkMode === 'new'
                      ? {
                          shopName: roleShopName.trim(),
                          shopCategory: roleShopCategory,
                          shopAddress: roleShopAddress.trim(),
                          shopContactPhone: roleShopContactPhone.trim() || roleFormPhone.trim(),
                          deliveryAreas: selectedMulti
                        }
                      : {}),
                    // Driver fields (Toto / Auto / Taxi strictly)
                    ...(roleFormType === 'driver' && roleLinkMode === 'new'
                      ? {
                          vehicleType: roleVehicleType,
                          vehicleNumber: roleVehicleNumber.trim(),
                          licenseNumber: roleLicenseNumber.trim() || undefined,
                          servedLocalities: selectedMulti
                        }
                      : {}),
                    // Delivery rider fields
                    ...(roleFormType === 'delivery' && roleLinkMode === 'new'
                      ? {
                          servedLocalities: selectedMulti
                        }
                      : {}),
                    // Doctor fields
                    ...(roleFormType === 'doctor' && roleLinkMode === 'new'
                      ? {
                          qualification: roleQualification.trim(),
                          specialization: roleSpecialization,
                          medicalCouncilRegNo: roleMedicalRegNo.trim(),
                          clinicAddress: roleClinicAddress.trim(),
                          consultationFee: roleConsultationFee !== '' ? Number(roleConsultationFee) : undefined,
                          homeVisitFee: roleHomeVisitFee !== '' ? Number(roleHomeVisitFee) : undefined,
                          experienceYears: roleExperienceYears !== '' ? Number(roleExperienceYears) : undefined,
                          servedLocalities: selectedMulti
                        }
                      : {}),
                    // Service Provider fields
                    ...(roleFormType === 'service_provider' && roleLinkMode === 'new'
                      ? {
                          serviceCategory: roleServiceCategory,
                          hourlyRate: roleHourlyRate !== '' ? Number(roleHourlyRate) : undefined,
                          serviceDescription: roleServiceDescription.trim() || undefined,
                          servedLocalities: selectedMulti
                        }
                      : {})
                  });
                  if (!res.ok || !res.account) {
                    setRoleFormError(res.error || 'Could not create partner Firebase Auth account.');
                    return;
                  }
                  setIssuedSummary({
                    role: res.account.role,
                    displayName: res.account.displayName,
                    uid: res.account.uid,
                    loginEmail: res.issuedEmail || res.account.loginEmail,
                    phone: res.issuedPhone || res.account.phone,
                    password: roleFormPassword,
                    linkedEntityId: res.account.linkedEntityId,
                    resetEmailSent: res.resetEmailSent
                  });
                  setRoleFormName('');
                  setRoleFormEmail('');
                  setRoleFormPhone('');
                  setRoleFormPassword('');
                  setRoleFormSendReset(false);
                  setRoleLinkedEntityId('');
                  setRoleShopName('');
                  setRoleShopAddress('');
                  setRoleShopContactPhone('');
                  setRoleVehicleNumber('');
                  setRoleLicenseNumber('');
                  setRoleQualification('');
                  setRoleMedicalRegNo('');
                  setRoleClinicAddress('');
                  setRoleConsultationFee('');
                  setRoleHomeVisitFee('');
                  setRoleExperienceYears('');
                  setRoleHourlyRate('');
                  setRoleServiceDescription('');
                } finally {
                  setIsCreatingRoleAccount(false);
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 text-xs"
            >
              <h4 className="font-bold text-white text-sm">Issue New Role Account</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Assigned Role</label>
                  <select
                    value={roleFormType}
                    onChange={(e) => {
                      const nextRole = e.target.value as PartnerRoleType;
                      setRoleFormType(nextRole);
                      setRoleLinkedEntityId('');
                      setRoleFormError('');
                      if (nextRole === 'employer' || nextRole === 'kabari') {
                        setRoleLinkMode('none');
                      } else if (roleLinkMode === 'none') {
                        setRoleLinkMode('new');
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                  >
                    <option value="shopkeeper">Shopkeeper (Merchant Store)</option>
                    <option value="driver">Rider — Ride Driver (Toto / Auto / Taxi)</option>
                    <option value="delivery">Rider — Delivery Fleet Courier</option>
                    <option value="doctor">Doctor Partner</option>
                    <option value="service_provider">Business Partner — Home Services</option>
                    <option value="employer">Business Partner — Employer / Recruiter</option>
                    <option value="kabari">Business Partner — Kabari Scrap Buyer</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Partner Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subhash Roy"
                    value={roleFormName}
                    onChange={(e) => setRoleFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Verified Email <span className="text-slate-400 font-normal">(or set mobile below)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="partner@domain.com"
                    value={roleFormEmail}
                    onChange={(e) => setRoleFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Mobile Number <span className="text-slate-400 font-normal">(required for Rider/Driver/Doctor)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile e.g. 9832012345"
                    value={roleFormPhone}
                    onChange={(e) => setRoleFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Initial Password (min 6 chars)</label>
                  <div className="relative">
                    <input
                      type={showRolePassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Set initial login password"
                      value={roleFormPassword}
                      onChange={(e) => setRoleFormPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 pr-9 text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRolePassword((v) => !v)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      aria-label={showRolePassword ? 'Hide password' : 'Show password'}
                    >
                      {showRolePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Primary Locality</label>
                  <select
                    value={roleFormLocality}
                    onChange={(e) => {
                      const loc = e.target.value;
                      setRoleFormLocality(loc);
                      setRoleMultiLocalities((prev) => Array.from(new Set([loc, ...prev])));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                  >
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.pincode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {roleFormEmail.trim() && (
                <label className="flex items-center gap-2 text-slate-200 bg-slate-900/60 border border-slate-700 rounded-xl p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleFormSendReset}
                    onChange={(e) => setRoleFormSendReset(e.target.checked)}
                  />
                  <span>Also send Firebase password-reset setup email so the partner sets their own secret password</span>
                </label>
              )}

              {(roleFormType === 'shopkeeper' ||
                roleFormType === 'driver' ||
                roleFormType === 'delivery' ||
                roleFormType === 'doctor' ||
                roleFormType === 'service_provider') && (
                <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-slate-300 font-bold block">Profile Record Binding</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleLinkMode('new');
                          setRoleLinkedEntityId('');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold ${
                          roleLinkMode === 'new' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Create New Approved Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleLinkMode('existing')}
                        className={`px-3 py-1.5 rounded-lg font-bold ${
                          roleLinkMode === 'existing' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Link Existing Record (Preserve Data)
                      </button>
                    </div>
                  </div>

                  {roleLinkMode === 'existing' && (
                    <select
                      value={roleLinkedEntityId}
                      onChange={(e) => setRoleLinkedEntityId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    >
                      <option value="">-- Select existing record to bind --</option>
                      {roleFormType === 'shopkeeper' &&
                        shops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.locality}) [{s.id}]
                          </option>
                        ))}
                      {roleFormType === 'driver' &&
                        drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} • {d.vehicleType} • {d.vehicleNumber} [{d.id}]
                          </option>
                        ))}
                      {roleFormType === 'delivery' &&
                        deliveryPersons.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.locality}) [{p.id}]
                          </option>
                        ))}
                      {roleFormType === 'doctor' &&
                        doctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} ({doc.specialization}) [{doc.id}]
                          </option>
                        ))}
                      {roleFormType === 'service_provider' &&
                        serviceProviders.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} ({sp.category} • {sp.serviceArea}) [{sp.id}]
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Real per-role fields for new profiles */}
                  {roleLinkMode === 'new' && roleFormType === 'shopkeeper' && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Shop Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dooars Fresh Grocery"
                            value={roleShopName}
                            onChange={(e) => setRoleShopName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Shop Category</label>
                          <select
                            value={roleShopCategory}
                            onChange={(e) => setRoleShopCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          >
                            <option value="Grocery & Ration">Grocery & Ration</option>
                            <option value="Medical & Pharmacy">Medical & Pharmacy</option>
                            <option value="Meat, Chicken & Fish">Meat, Chicken & Fish</option>
                            <option value="New Mobile & Accessories">New Mobile & Accessories</option>
                            <option value="General & Household">General & Household</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Full Physical Shop Address</label>
                          <input
                            type="text"
                            required
                            placeholder="Building, Market Road, Landmark"
                            value={roleShopAddress}
                            onChange={(e) => setRoleShopAddress(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">
                            Shop Contact Phone <span className="text-slate-500 font-normal">(uses login mobile if blank)</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="10-digit store phone"
                            value={roleShopContactPhone}
                            onChange={(e) => setRoleShopContactPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {roleLinkMode === 'new' && roleFormType === 'driver' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Vehicle Type</label>
                        <select
                          value={roleVehicleType}
                          onChange={(e) => setRoleVehicleType(e.target.value as VehicleType)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-semibold"
                        >
                          <option value="toto">Toto (E-Rickshaw)</option>
                          <option value="auto">Auto Rickshaw</option>
                          <option value="taxi">Taxi / Cab</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Vehicle Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. WB-70-T-4421"
                          value={roleVehicleNumber}
                          onChange={(e) => setRoleVehicleNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">License No (optional)</label>
                        <input
                          type="text"
                          placeholder="DL Number"
                          value={roleLicenseNumber}
                          onChange={(e) => setRoleLicenseNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {roleLinkMode === 'new' && roleFormType === 'doctor' && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Qualification</label>
                          <input
                            type="text"
                            required
                            placeholder="MBBS / MD / BAMS"
                            value={roleQualification}
                            onChange={(e) => setRoleQualification(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Specialization</label>
                          <select
                            value={roleSpecialization}
                            onChange={(e) => setRoleSpecialization(e.target.value as DoctorSpecialization)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          >
                            <option value="General Physician">General Physician</option>
                            <option value="Pediatrician (Child Specialist)">Pediatrician</option>
                            <option value="Emergency Medicine">Emergency Medicine</option>
                            <option value="Gynecologist">Gynecologist</option>
                            <option value="Orthopedic">Orthopedic</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Ayurveda & General">Ayurveda & General</option>
                            <option value="Homeopathy">Homeopathy</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Medical Reg. No</label>
                          <input
                            type="text"
                            required
                            placeholder="WBMC Reg No"
                            value={roleMedicalRegNo}
                            onChange={(e) => setRoleMedicalRegNo(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white uppercase"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-slate-300 font-bold block mb-1">Clinic Address</label>
                          <input
                            type="text"
                            required
                            placeholder="Chamber / Clinic Address"
                            value={roleClinicAddress}
                            onChange={(e) => setRoleClinicAddress(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Consult Fee (₹)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            placeholder="300"
                            value={roleConsultationFee}
                            onChange={(e) => setRoleConsultationFee(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Home Visit Fee (₹)</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Optional"
                            value={roleHomeVisitFee}
                            onChange={(e) => setRoleHomeVisitFee(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 5"
                          value={roleExperienceYears}
                          onChange={(e) => setRoleExperienceYears(e.target.value)}
                          className="w-full sm:w-40 bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {roleLinkMode === 'new' && roleFormType === 'service_provider' && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Service Category</label>
                          <select
                            value={roleServiceCategory}
                            onChange={(e) => setRoleServiceCategory(e.target.value as ServiceCategoryType)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          >
                            <option value="Electrician">Electrician</option>
                            <option value="Plumber">Plumber</option>
                            <option value="Carpenter">Carpenter</option>
                            <option value="Mechanic">Mechanic</option>
                            <option value="Painter">Painter</option>
                            <option value="AC Repair">AC Repair</option>
                            <option value="Computer Repair">Computer Repair</option>
                            <option value="Home Cleaning">Home Cleaning</option>
                            <option value="Mobile Repair">Mobile Repair</option>
                            <option value="Home Repair">Home Repair</option>
                            <option value="Other Services">Other Services</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Starting / Hourly Rate (₹)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            placeholder="e.g. 250"
                            value={roleHourlyRate}
                            onChange={(e) => setRoleHourlyRate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Service Description</label>
                        <input
                          type="text"
                          placeholder="Expertise and covered repairs"
                          value={roleServiceDescription}
                          onChange={(e) => setRoleServiceDescription(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Approved Service Localities Multi-Select */}
                  {roleLinkMode === 'new' && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <label className="text-slate-300 font-bold block">
                        Approved Service Localities ({Array.from(new Set([roleFormLocality, ...roleMultiLocalities])).length} selected)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {localities.map((loc) => {
                          const isPrimary = loc.name === roleFormLocality;
                          const checked = isPrimary || roleMultiLocalities.includes(loc.name);
                          return (
                            <label
                              key={loc.id}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] cursor-pointer ${
                                checked
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold'
                                  : 'bg-slate-950 border-slate-700 text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isPrimary}
                                onChange={(e) => {
                                  setRoleMultiLocalities((prev) =>
                                    e.target.checked
                                      ? Array.from(new Set([...prev, loc.name]))
                                      : prev.filter((x) => x !== loc.name)
                                  );
                                }}
                              />
                              <span className="truncate">{loc.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                Contact numbers and emails are stored as entered; Firebase Authentication never auto-verifies unverified contacts.
              </p>

              {roleFormError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{roleFormError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingRoleAccount}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                {isCreatingRoleAccount ? 'Creating Firebase Auth Account...' : 'Create Firebase Auth Role Account'}
              </button>
            </form>

            {roleActionNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
                  roleActionNotice.type === 'ok'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                }`}
              >
                <span>{roleActionNotice.text}</span>
                <button
                  type="button"
                  onClick={() => setRoleActionNotice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Assigned Role Accounts Directory */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-white">
                  Provisioned Role Accounts ({partnerAccounts.length})
                </h4>
                <input
                  type="text"
                  placeholder="Search name, role, email..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 w-44"
                />
              </div>

              {partnerAccounts.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                  No Admin-issued partner accounts provisioned in Firestore yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {partnerAccounts
                    .filter((acc) => {
                      if (!roleSearch.trim()) return true;
                      const q = roleSearch.toLowerCase().trim();
                      return (
                        acc.displayName.toLowerCase().includes(q) ||
                        acc.role.toLowerCase().includes(q) ||
                        acc.loginEmail.toLowerCase().includes(q) ||
                        (acc.phone || '').toLowerCase().includes(q)
                      );
                    })
                    .map((acc) => {
                      const linkedInfo = describeLinkedEntity(acc);
                      return (
                        <div key={acc.uid} className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-white">{acc.displayName}</span>
                                <span className="text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                  {acc.role.replace('_', ' ')}
                                </span>
                                {linkedInfo?.status && (
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      linkedInfo.status === 'approved'
                                        ? 'bg-sky-500/20 text-sky-300'
                                        : linkedInfo.status === 'pending'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                  >
                                    Entity: {linkedInfo.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-300 font-mono mt-0.5">{acc.loginEmail}</p>
                              {acc.phone && <p className="text-slate-400 font-mono">Mobile: {acc.phone}</p>}
                              {linkedInfo && (
                                <p className="text-[11px] text-emerald-300 mt-0.5">
                                  Profile: {linkedInfo.label}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                UID: {acc.uid} {acc.linkedEntityId ? `• Record: ${acc.linkedEntityId}` : ''}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                                acc.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {acc.status}
                            </span>
                          </div>

                          {onTogglePartnerAccountStatus && (
                            <div className="pt-2 border-t border-slate-700 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400">
                                Issued by {acc.assignedBy}
                                {acc.status === 'suspended' && acc.suspendedEntityPreviousStatus
                                  ? ` • Prior status: ${acc.suspendedEntityPreviousStatus}`
                                  : ''}
                              </span>
                              <button
                                type="button"
                                disabled={togglingRoleUid === acc.uid}
                                onClick={async () => {
                                  const nextStatus: PartnerAccountStatus =
                                    acc.status === 'active' ? 'suspended' : 'active';
                                  setTogglingRoleUid(acc.uid);
                                  setRoleActionNotice(null);
                                  try {
                                    const res = await onTogglePartnerAccountStatus(acc.uid, nextStatus);
                                    if (!res.ok) {
                                      setRoleActionNotice({
                                        type: 'err',
                                        text: res.error || 'Unable to update partner account status.'
                                      });
                                    } else if (res.warning) {
                                      setRoleActionNotice({
                                        type: 'err',
                                        text: res.warning
                                      });
                                    } else {
                                      setRoleActionNotice({
                                        type: 'ok',
                                        text:
                                          nextStatus === 'suspended'
                                            ? `Suspended "${acc.displayName}" (${acc.role}) across account & linked entity/public records. Historical data preserved.`
                                            : `Reactivated "${acc.displayName}" (${acc.role}). Prior entity approval state restored safely.`
                                      });
                                    }
                                  } finally {
                                    setTogglingRoleUid(null);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-white disabled:opacity-50 ${
                                  acc.status === 'active'
                                    ? 'bg-rose-600 hover:bg-rose-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                              >
                                {togglingRoleUid === acc.uid
                                  ? 'Syncing...'
                                  : acc.status === 'active'
                                  ? 'Suspend Account & Entity'
                                  : 'Reactivate Account & Entity'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Administrator Audit Trail ({adminActivities.length})</h3>
            {adminActivities.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                No administrator audit entries recorded yet.
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700/60 p-2">
                {adminActivities.map((act) => (
                  <div key={act.id} className="p-3 text-xs flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-purple-300 block">{act.action}</span>
                      <span className="text-slate-300 mt-0.5 block">{act.details}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">{act.adminEmail}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {(act.timestamp || '').split('T')[0] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 bg-black/70 text-white rounded-full p-1.5"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhotoUrl} alt="Return evidence" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
