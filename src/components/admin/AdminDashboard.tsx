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
  HeartHandshake
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
  UserProfile
} from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface AdminDashboardProps {
  onSwitchPortal: () => void;
  shops: Shop[];
  onUpdateShopStatus: (shopId: string, status: ShopApprovalStatus) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  products: Product[];
  drivers: Driver[];
  onUpdateDriverStatus: (driverId: string, status: ShopApprovalStatus) => void;
  rideBookings: RideBooking[];
  deliveryPersons: DeliveryPerson[];
  onUpdateDeliveryPersonStatus: (personId: string, status: ShopApprovalStatus) => void;
  deliveries: DeliveryRequest[];
  onAssignDelivery: (deliveryId: string, personId: string, personName: string, personPhone: string) => void;
  serviceProviders: ServiceProvider[];
  onUpdateServiceProviderStatus: (providerId: string, status: ShopApprovalStatus) => void;
  jobListings: JobListing[];
  onUpdateJobStatus: (jobId: string, status: 'pending' | 'approved' | 'rejected') => void;
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
  onUpdateDoctorStatus?: (doctorId: string, status: 'approved' | 'rejected' | 'suspended' | 'pending') => void;
  emergencyDoctorRequests?: EmergencyDoctorRequest[];
  onUpdateEmergencyDoctorRequestStatus?: (requestId: string, status: EmergencyDoctorStatus) => void;
  customers?: UserProfile[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSwitchPortal,
  shops,
  onUpdateShopStatus,
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
  adminEmail = 'taibaralir@gmail.com',
  localities = INITIAL_SERVICE_LOCALITIES,
  onAddLocality,
  onUpdateLocality,
  onDeleteLocality,
  doctors = [],
  onUpdateDoctorStatus,
  emergencyDoctorRequests = [],
  onUpdateEmergencyDoctorRequestStatus,
  customers = []
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'shops' | 'orders' | 'doctors' | 'emergency_requests' | 'customers' | 'drivers' | 'deliveries' | 'services' | 'jobs' | 'scrap' | 'localities' | 'complaints' | 'activity'
  >('overview');

  const [searchTerm, setSearchTerm] = useState('');
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
  const pendingDeliveries = deliveries.filter((d) => d.status === 'pending_assignment');
  const pendingProviders = serviceProviders.filter((p) => p.status === 'pending');
  const pendingJobs = jobListings.filter((j) => j.status === 'pending');
  const openComplaints = complaints.filter((c) => c.status === 'open');
  const pendingScraps = scrapRequests.filter((s) => s.status === 'open' || s.status === 'offers_received');

  const pendingDoctors = doctors.filter((d) => d.status === 'pending');
  const activeEmergencyCalls = emergencyDoctorRequests.filter((r) => r.status === 'pending');

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
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
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
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
      label: 'Drivers', 
      icon: Car,
      badge: pendingDrivers.length > 0 ? pendingDrivers.length : undefined
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
              Authenticated: {adminEmail} • Central Dooars Control
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
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
                                onClick={() => onUpdateDoctorStatus(doc.id, 'approved')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                              >
                                Approve Doctor
                              </button>
                            )}
                            {doc.status === 'approved' && (
                              <button
                                onClick={() => onUpdateDoctorStatus(doc.id, 'suspended')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                Suspend Account
                              </button>
                            )}
                            {doc.status !== 'rejected' && (
                              <button
                                onClick={() => onUpdateDoctorStatus(doc.id, 'rejected')}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
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

            <div className="space-y-2">
              {customers.map((c, idx) => (
                <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <p className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{c.phone}</span>
                      <span>• {c.email}</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{c.location} (PIN {c.pincode}) — {c.address}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full uppercase">
                      Verified User
                    </span>
                    {c.gpsCoordinates && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                        GPS: {c.gpsCoordinates.lat}, {c.gpsCoordinates.lng}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOPS TAB */}
        {activeTab === 'shops' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Marketplace Shops ({shops.length})</h3>
            </div>

            <div className="space-y-3">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={shop.imageUrl}
                        alt={shop.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-600 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-white">{shop.name}</h4>
                        <p className="text-xs text-slate-400">{shop.locality} • {shop.contactNumber}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Owner: {shop.ownerEmail || shop.ownerId}</p>
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      shop.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : shop.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {shop.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-700 text-xs">
                    <button
                      onClick={() => onUpdateShopStatus(shop.id, 'approved')}
                      disabled={shop.status === 'approved'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                    >
                      Approve Shop
                    </button>
                    <button
                      onClick={() => onUpdateShopStatus(shop.id, 'pending')}
                      disabled={shop.status === 'pending'}
                      className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                    >
                      Set Pending
                    </button>
                    <button
                      onClick={() => onUpdateShopStatus(shop.id, 'rejected')}
                      disabled={shop.status === 'rejected'}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onUpdateShopStatus(shop.id, 'suspended')}
                      disabled={shop.status === 'suspended'}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl transition-colors"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">All Platform Orders ({orders.length})</h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-purple-300">#{order.id}</span>
                      <p className="text-xs text-white font-semibold mt-0.5">
                        {order.customerName} ({order.customerPhone})
                      </p>
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
                        <span>{i.quantity}x {i.product.name} ({i.product.unit})</span>
                        <span>₹{i.product.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

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

        {/* DRIVERS TAB (Taxi, Auto, Toto) */}
        {activeTab === 'drivers' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Registered Drivers ({drivers.length})</h3>
            <p className="text-xs text-slate-400">Taxi, Auto and Toto fleet in Kalchini & Dooars. (Bike taxi strictly excluded).</p>

            <div className="space-y-3">
              {drivers.map((drv) => (
                <div key={drv.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{drv.name}</span>
                        <span className="text-xs uppercase bg-sky-500/20 text-sky-300 px-2 py-0.2 rounded font-bold">
                          {drv.vehicleType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{drv.vehicleNumber} • {drv.phone}</p>
                      <p className="text-[11px] text-slate-400">{drv.locality} • {drv.totalRides} rides completed • ★ {drv.rating}</p>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      drv.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {drv.status}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-700 text-xs">
                    <button
                      onClick={() => onUpdateDriverStatus(drv.id, 'approved')}
                      disabled={drv.status === 'approved'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      Verify Driver
                    </button>
                    <button
                      onClick={() => onUpdateDriverStatus(drv.id, 'suspended')}
                      disabled={drv.status === 'suspended'}
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

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Local Parcel Requests ({deliveries.length})</h3>
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

                  {/* Manual Assignment */}
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
                      <option value="" disabled>Assign Rider</option>
                      {deliveryPersons.map((dp) => (
                        <option key={dp.id} value={dp.id}>{dp.name} ({dp.locality})</option>
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
                      onClick={() => onUpdateServiceProviderStatus(srv.id, 'approved')}
                      disabled={srv.status === 'approved'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      Approve Provider
                    </button>
                    <button
                      onClick={() => onUpdateServiceProviderStatus(srv.id, 'suspended')}
                      disabled={srv.status === 'suspended'}
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
                      onClick={() => onUpdateJobStatus(job.id, 'approved')}
                      disabled={job.status === 'approved'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-1 px-3 rounded-lg"
                    >
                      Approve Listing
                    </button>
                    <button
                      onClick={() => onUpdateJobStatus(job.id, 'rejected')}
                      disabled={job.status === 'rejected'}
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
            <h3 className="text-sm font-bold text-white">Support Grievances & Tickets ({complaints.length})</h3>
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-red-400">#{c.id}</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">{c.subject}</h4>
                      <p className="text-xs text-slate-300">{c.customerName} ({c.customerPhone})</p>
                      <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                    </div>

                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                      c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {c.resolutionNotes && (
                    <div className="bg-slate-900 p-2.5 rounded-xl text-xs text-emerald-400 border border-slate-700">
                      <strong>Resolution:</strong> {c.resolutionNotes}
                    </div>
                  )}

                  {c.status !== 'resolved' && (
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

        {/* LOGS TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Administrator Audit Trail</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700/60 p-2">
              {adminActivities.map((act) => (
                <div key={act.id} className="p-3 text-xs flex justify-between items-start">
                  <div>
                    <span className="font-bold text-purple-300 block">{act.action}</span>
                    <span className="text-slate-300 mt-0.5 block">{act.details}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">{act.adminEmail}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{act.timestamp.split('T')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
