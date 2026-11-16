import React, { useState } from 'react';
import { 
  Wrench, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Power, 
  AlertCircle, 
  ArrowLeft,
  User,
  Star,
  Calendar,
  Briefcase,
  LogOut
} from 'lucide-react';
import {
  PartnerAccount,
  ServiceProvider,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceCategoryType,
  ShopApprovalStatus,
  UniversalRoutingConfig
} from '../../types';
import {
  evaluateServiceProviderEligibility,
  normalizeServiceCategory
} from '../../utils/hyperlocalRouting';

interface ServiceActionResult {
  ok: boolean;
  backendRequired?: boolean;
  error?: string;
}

interface ServiceProviderDashboardProps {
  provider: ServiceProvider;
  isAdmin?: boolean;
  serviceRequests: ServiceRequest[];
  routingConfig?: UniversalRoutingConfig;
  partnerAccounts?: PartnerAccount[];
  onSwitchPortal: () => void;
  onUpdateProvider: (updated: Partial<ServiceProvider>) => void;
  onUpdateServiceStatus: (requestId: string, status: ServiceRequestStatus) => Promise<ServiceActionResult | void> | void;
  onAcceptRequest: (requestId: string, providerId: string, providerName: string) => Promise<ServiceActionResult | void> | void;
  onLogout?: () => void;
}

export const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  provider,
  isAdmin = false,
  serviceRequests,
  routingConfig,
  partnerAccounts = [],
  onSwitchPortal,
  onUpdateProvider,
  onUpdateServiceStatus,
  onAcceptRequest,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'history' | 'profile'>('requests');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(provider.name);
  const [editPhone, setEditPhone] = useState(provider.phone);
  const [editCategory, setEditCategory] = useState<ServiceCategoryType>(provider.category);
  const [editServiceArea, setEditServiceArea] = useState(provider.serviceArea);
  const [editHourlyRate, setEditHourlyRate] = useState(provider.hourlyRate);
  const [editExperience, setEditExperience] = useState(provider.experienceYears);
  const [editDesc, setEditDesc] = useState(provider.description);
  const [actionNotice, setActionNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmCancelJobId, setConfirmCancelJobId] = useState<string | null>(null);

  // Incoming booking requests strictly filtered by Admin locality routing & service category
  const incomingRequests = serviceRequests.filter((r) => {
    if (r.status !== 'requested') return false;
    if (r.providerId && r.providerId !== provider.id) return false;
    if (r.providerId === provider.id) return true;
    const reqLoc = r.locality || r.address;
    if (routingConfig) {
      return evaluateServiceProviderEligibility(
        reqLoc,
        r.category,
        provider,
        routingConfig,
        partnerAccounts
      ).isEligible;
    }
    return (
      provider.status === 'approved' &&
      provider.isAvailable &&
      normalizeServiceCategory(r.category) === normalizeServiceCategory(provider.category)
    );
  });

  // Active accepted jobs
  const activeJobs = serviceRequests.filter(
    (r) => r.providerId === provider.id && (r.status === 'accepted' || r.status === 'in_progress')
  );

  // Completed jobs
  const completedJobs = serviceRequests.filter(
    (r) => r.providerId === provider.id && (r.status === 'completed' || r.status === 'cancelled')
  );

  const totalEarnings = completedJobs
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.finalFee || r.estimatedFee), 0);

  const isApproved = provider.status === 'approved';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProvider({
      name: editName,
      phone: editPhone,
      category: editCategory,
      serviceArea: editServiceArea,
      hourlyRate: Number(editHourlyRate),
      experienceYears: Number(editExperience),
      description: editDesc
    });
    setShowEditModal(false);
  };

  const categoriesList: ServiceCategoryType[] = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'Mechanic',
    'Painter',
    'AC Repair',
    'Mobile Repair',
    'Home Repair',
    'Other Services'
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Provider Header */}
      <div className="bg-amber-800 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchPortal}
              className="p-1.5 bg-amber-900/60 rounded-lg hover:bg-amber-900 transition-colors"
              title="Switch Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-wide">TORSA EXPERT</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-600 text-amber-100">
                  {provider.category}
                </span>
              </div>
              <p className="text-xs text-amber-200">Local Technician & Services Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Availability Toggle */}
            <button
              onClick={() => onUpdateProvider({ isAvailable: !provider.isAvailable })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                provider.isAvailable
                  ? 'bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-300'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {provider.isAvailable ? 'AVAILABLE' : 'BUSY'}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 bg-rose-700/80 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Badge Card */}
        <div className="bg-amber-900/70 backdrop-blur-xs rounded-xl p-3 flex items-center justify-between border border-amber-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center font-black text-white text-base border-2 border-amber-400">
              {provider.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{provider.name}</p>
              <p className="text-xs text-amber-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                {provider.serviceArea}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-300 font-bold text-xs justify-end">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>{provider.rating.toFixed(1)}</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                provider.status === 'approved'
                  ? 'bg-emerald-400 text-emerald-950 font-black'
                  : provider.status === 'pending'
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : 'bg-red-400 text-white font-black'
              }`}
            >
              {provider.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Warning if not approved */}
        {!isApproved && (
          <div className="mt-2 bg-amber-500/20 border border-amber-400/40 rounded-lg p-2 text-[11px] text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Profile status is <strong>{provider.status}</strong>. Admin review required before receiving booking requests.
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex justify-between">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Requests ({incomingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Active Jobs ({activeJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Earnings ({completedJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1">
        {actionNotice && (
          <div
            className={`rounded-2xl p-3 text-xs font-semibold flex items-start justify-between gap-2 border ${
              actionNotice.type === 'err'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
        {/* TAB 1: INCOMING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Customer Inquiries</h3>
              <span className="text-xs text-gray-500">Live Requests</span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Open Requests</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When local residents in Kalchini or Torsa book a {provider.category}, they will appear here.
                </p>
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {req.id}
                    </span>
                    <span className="text-base font-black text-amber-800">
                      ₹{req.estimatedFee} Est.
                    </span>
                  </div>

                  <div className="text-xs space-y-2">
                    <p className="font-bold text-gray-900">
                      Problem: <span className="font-normal text-gray-700">{req.issueDescription}</span>
                    </p>
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Preferred: <strong>{req.preferredDate} ({req.preferredTime})</strong>
                    </p>
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      Address: <strong>{req.address}</strong>
                    </p>
                    <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                      <span>Customer: <strong>{req.customerName}</strong></span>
                      <span className="font-mono">{req.customerPhone}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!isApproved || !provider.isAvailable || !isAdmin || isBusy}
                    onClick={async () => {
                      if (!isAdmin) return;
                      setActionNotice(null);
                      setIsBusy(true);
                      try {
                        const res = await onAcceptRequest(req.id, provider.id, provider.name);
                        if (res && res.ok === false) {
                          setActionNotice({
                            type: 'err',
                            text: res.error || 'Could not accept service request.'
                          });
                          return;
                        }
                        setActiveTab('active');
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isAdmin ? 'Accept Service Request' : 'Dispatcher Assignment Needed (BACKEND REQUIRED)'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE JOBS */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Active Service Jobs</h4>
                <p className="text-xs text-gray-500">
                  Accept a customer request from the Requests tab to start work.
                </p>
              </div>
            ) : (
              activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border-2 border-amber-500 p-5 shadow-lg space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Job In Progress
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900 bg-amber-50 px-2.5 py-1 rounded-lg">
                      ₹{job.estimatedFee} Base
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                    <p className="font-bold text-gray-900">{job.issueDescription}</p>
                    <p className="text-gray-600">Location: <strong>{job.address}</strong></p>
                    <p className="text-gray-600">Slot: <strong>{job.preferredDate} - {job.preferredTime}</strong></p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{job.customerName}</p>
                      <p className="text-gray-600 font-mono">{job.customerPhone}</p>
                    </div>
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setActionNotice(null);
                          setIsBusy(true);
                          try {
                            const res = await onUpdateServiceStatus(job.id, 'in_progress');
                            if (res && res.ok === false) setActionNotice({ type: 'err', text: res.error || 'Could not update status.' });
                          } finally {
                            setIsBusy(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                          job.status === 'in_progress'
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        At Customer Site
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setActionNotice(null);
                          setIsBusy(true);
                          try {
                            const res = await onUpdateServiceStatus(job.id, 'completed');
                            if (res && res.ok === false) setActionNotice({ type: 'err', text: res.error || 'Could not complete job.' });
                          } finally {
                            setIsBusy(false);
                          }
                        }}
                        className="p-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white border border-emerald-700 shadow-sm disabled:opacity-50"
                      >
                        ✓ Job Completed
                      </button>
                    </div>

                    {confirmCancelJobId === job.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs space-y-2">
                        <p className="font-bold text-red-900">Cancel this service job?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              setActionNotice(null);
                              setIsBusy(true);
                              try {
                                const res = await onUpdateServiceStatus(job.id, 'cancelled');
                                if (res && res.ok === false) {
                                  setActionNotice({ type: 'err', text: res.error || 'Could not cancel job.' });
                                  return;
                                }
                                setConfirmCancelJobId(null);
                              } finally {
                                setIsBusy(false);
                              }
                            }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg"
                          >
                            {isBusy ? 'Cancelling...' : 'Yes, Cancel Job'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmCancelJobId(null)}
                            className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg"
                          >
                            Keep Job
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelJobId(job.id)}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Job
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS & HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Work Pay</span>
                <p className="text-xl font-black text-amber-800 mt-1">₹{totalEarnings}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{completedJobs.filter((r) => r.status === 'completed').length} completed tasks</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Technician Rating</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-black text-gray-900">{provider.rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-amber-700 font-bold mt-0.5">Verified Professional</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-gray-800">Past Jobs</h4>
              {completedJobs.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No completed jobs yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {completedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{job.issueDescription}</p>
                        <p className="text-[10px] text-gray-500">{job.customerName} • {job.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-amber-800">₹{job.finalFee || job.estimatedFee}</span>
                        <span
                          className={`text-[9px] font-bold block uppercase ${
                            job.status === 'completed' ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-800">Technician Profile</h4>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-amber-700 hover:underline"
              >
                Edit Info
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-gray-100">
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-bold text-gray-900">{provider.name}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-mono font-bold text-gray-900">{provider.phone}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Trade Skill</span>
                <span className="font-bold text-amber-800">{provider.category}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Service Area</span>
                <span className="font-bold text-gray-900">{provider.serviceArea}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Inspection Fee</span>
                <span className="font-bold text-emerald-700">₹{provider.hourlyRate}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Experience</span>
                <span className="font-bold text-gray-900">{provider.experienceYears} Years</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">About Services:</span>
                <p className="text-gray-700 bg-slate-50 p-2 rounded-lg">{provider.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900">Update Expert Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Trade Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ServiceCategoryType)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Operating Areas</label>
                <input
                  type="text"
                  required
                  value={editServiceArea}
                  onChange={(e) => setEditServiceArea(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="e.g. Kalchini, Torsa, Hamiltonganj"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Inspection Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={editHourlyRate}
                    onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={editExperience}
                    onChange={(e) => setEditExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Specialties & Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-sm hover:bg-amber-700"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
