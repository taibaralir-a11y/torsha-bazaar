import React, { useState } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Navigation, 
  DollarSign, 
  Calendar, 
  User, 
  Activity, 
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Eye,
  LogOut
} from 'lucide-react';
import { 
  Doctor, 
  EmergencyDoctorRequest, 
  EmergencyDoctorStatus, 
  LocalityInfo 
} from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface DoctorActionResult {
  ok: boolean;
  backendRequired?: boolean;
  error?: string;
}

interface DoctorDashboardProps {
  doctor: Doctor;
  isAdmin?: boolean;
  onUpdateDoctor: (updated: Doctor) => void;
  requests: EmergencyDoctorRequest[];
  onUpdateRequestStatus: (
    requestId: string,
    status: EmergencyDoctorStatus,
    etaMinutes?: number,
    notes?: string
  ) => Promise<DoctorActionResult | void> | void;
  onSwitchPortal: () => void;
  onLogout?: () => void;
  localities?: LocalityInfo[];
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  isAdmin = false,
  onUpdateDoctor,
  requests,
  onUpdateRequestStatus,
  onSwitchPortal,
  onLogout,
  localities = []
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'active_visits' | 'history' | 'profile'>('requests');
  const [etaInput, setEtaInput] = useState<{ [key: string]: string }>({});
  const [notesInput, setNotesInput] = useState<{ [key: string]: string }>({});
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isApproved = doctor.status === 'approved';
  const isPending = doctor.status === 'pending';

  const regNumber = doctor.councilRegistrationNumber || doctor.medicalCouncilRegNo || 'WBMC/PENDING';
  const servedLocs = doctor.servedLocalities || doctor.localitiesServed || [];
  const isDocAvailable = doctor.isAvailable !== undefined ? doctor.isAvailable : (doctor.isOnline ?? true);

  // Doctor's served localities for unassigned triage feed; active/history strictly restricted to this doctor
  const doctorRequests = requests.filter(r => {
    if (r.assignedDoctorId === doctor.id || r.doctorId === doctor.id) return true;
    if (r.assignedDoctorId && r.assignedDoctorId !== doctor.id) return false;
    if (servedLocs && servedLocs.length > 0) {
      return servedLocs.includes(r.locality);
    }
    return true;
  });

  const pendingRequests = doctorRequests.filter(
    r => (r.status === 'pending' || r.status === 'searching') && !r.assignedDoctorId
  );
  const activeVisits = doctorRequests.filter(
    r => (r.assignedDoctorId === doctor.id || r.doctorId === doctor.id) &&
         ['accepted', 'on_the_way', 'doctor_on_the_way'].includes(r.status)
  );
  const completedVisits = doctorRequests.filter(
    r => (r.assignedDoctorId === doctor.id || r.doctorId === doctor.id) &&
         ['completed', 'cancelled'].includes(r.status)
  );

  const totalEarnings = completedVisits
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.consultationFee || r.doctorFee || doctor.consultationFee || 350), 0);

  const toggleAvailability = () => {
    onUpdateDoctor({
      ...doctor,
      isAvailable: !isDocAvailable,
      isOnline: !isDocAvailable
    });
  };

  const runStatusUpdate = async (
    requestId: string,
    status: EmergencyDoctorStatus,
    eta?: number,
    notes?: string
  ) => {
    if (isBusy) return;
    setActionNotice(null);
    setIsBusy(true);
    try {
      const res = await onUpdateRequestStatus(requestId, status, eta, notes);
      if (res && res.ok === false) {
        setActionNotice({
          type: 'err',
          text: res.error || 'Could not update emergency consultation status.'
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleAccept = (req: EmergencyDoctorRequest) => {
    const eta = parseInt(etaInput[req.id] || '20', 10);
    runStatusUpdate(req.id, 'accepted', eta, 'Doctor confirmed consultation/home visit');
  };

  const handleStartJourney = (reqId: string) => {
    runStatusUpdate(reqId, 'doctor_on_the_way', undefined, 'Doctor is traveling to patient address');
  };

  const handleComplete = (reqId: string) => {
    const note = notesInput[reqId] || 'Consultation completed. Patient advised proper care.';
    runStatusUpdate(reqId, 'completed', undefined, note);
  };

  const handleDecline = (reqId: string) => {
    runStatusUpdate(reqId, 'cancelled', undefined, 'Doctor unavailable for this request');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {doctor.name}
                </h1>
                {isApproved ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified MBBS / Council
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Reg: <span className="font-mono font-medium">{regNumber}</span> · {doctor.qualification} · {doctor.specialization}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />
            {/* Online / Offline Toggle */}
            <button
              onClick={toggleAvailability}
              disabled={!isApproved}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                !isApproved 
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' 
                  : isDocAvailable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDocAvailable && isApproved ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="whitespace-nowrap">{isDocAvailable && isApproved ? 'Online & Available' : 'Offline'}</span>
            </button>

            <button
              onClick={onSwitchPortal}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Switch Portal
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Verification Notice Banner if Pending */}
      {isPending && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
              <span>
                <strong>Doctor Profile Under Verification:</strong> Medical Council Reg No <strong>{regNumber}</strong> is currently under review by Super Admin (taibaralir@gmail.com). You will receive emergency alerts once approved.
              </span>
            </div>
            <span className="hidden sm:inline font-mono font-bold text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
              Status: PENDING
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {actionNotice && (
          <div
            className={`rounded-xl p-3 text-xs font-semibold flex items-start justify-between gap-2 border ${
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
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>New Requests</span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {pendingRequests.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting acceptance</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active Visits</span>
              <Navigation className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeVisits.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">In progress / En route</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Completed Consults</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {completedVisits.filter(r => r.status === 'completed').length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Hasimara & Satali patients</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Earnings</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ₹{totalEarnings}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Direct patient collection</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Emergency Feed ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('active_visits')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'active_visits'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Consultations ({activeVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History & Records ({completedVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctor Profile & Fees
          </button>
        </div>

        {/* TAB 1: EMERGENCY REQUESTS FEED */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Incoming Emergency & Home Visit Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Showing calls matching your coverage area: {servedLocs.length > 0 ? servedLocs.join(', ') : 'All Dooars'}
                </p>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Filter:</span>
                {['all', 'critical', 'high', 'medium'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                      filterPriority === p
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No Pending Emergency Calls</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When patients in Hasimara, Satali, or nearby tea estates request a doctor home visit, the request appears here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests
                  .filter(r => filterPriority === 'all' || r.priority === filterPriority)
                  .map((req) => (
                    <div
                      key={req.id}
                      className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                        req.priority === 'critical'
                          ? 'border-rose-400 bg-rose-50/20'
                          : req.priority === 'high'
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              req.priority === 'critical'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : req.priority === 'high'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {req.priority} PRIORITY
                            </span>
                            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {req.requestType === 'home_visit' ? '🏠 Home Visit Required' : '📞 Phone Consultation'}
                            </span>
                            <span className="text-xs text-slate-500">
                              Requested {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Emergency Request #{req.id}</span>
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Patient Identity Masked
                            </span>
                          </h3>

                          {/* Locality & PIN only (exact address & phone protected until assignment) */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-semibold">{req.locality}</span>
                            <span>· PIN: {req.pincode}</span>
                            {req.crossLocalityApproved && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-medium">
                                Cross-Locality Approved
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <strong className="text-slate-800">Privacy-Protected Triage:</strong> Full patient name, phone, street address, and clinical symptoms unlock only after trusted dispatch assignment.
                          </p>
                        </div>

                        {/* Action buttons & ETA */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Consultation Fee</span>
                            <span className="text-lg font-bold font-mono text-emerald-700">
                              ₹{req.consultationFee || doctor.consultationFee || 350}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1">
                              <label className="text-[11px] text-slate-500">ETA (mins):</label>
                              <input
                                type="number"
                                min="5"
                                max="120"
                                value={etaInput[req.id] || '20'}
                                onChange={(e) => setEtaInput({ ...etaInput, [req.id]: e.target.value })}
                                className="w-14 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-medium"
                              />
                            </div>
                            <button
                              onClick={() => isAdmin && handleAccept(req)}
                              disabled={!isApproved || !isAdmin}
                              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
                            >
                              {isAdmin ? 'Accept Call' : 'Dispatch Needed (BACKEND REQUIRED)'}
                            </button>
                            <button
                              onClick={() => isAdmin && handleDecline(req.id)}
                              disabled={!isAdmin}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE VISITS */}
        {activeTab === 'active_visits' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Active Patient Visits & Ongoing Consultations
            </h2>

            {activeVisits.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Ongoing Consultations</h3>
                <p className="text-xs text-slate-500 mt-1">Accept an incoming request from the Emergency Feed to begin a visit.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVisits.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-emerald-300 p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'on_the_way' || req.status === 'doctor_on_the_way'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {req.status === 'on_the_way' || req.status === 'doctor_on_the_way' ? '🚗 DOCTOR EN ROUTE' : '✅ VISIT ACCEPTED'}
                          </span>
                          <span className="text-xs text-slate-500">
                            Estimated Arrival: <strong className="font-mono text-slate-800">{req.estimatedArrivalMinutes || 20} mins</strong>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">{req.patientName}</h3>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <a href={`tel:${req.patientPhone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                              {req.patientPhone}
                            </a>
                            <span className="text-slate-400">· (Direct Patient Line)</span>
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{req.patientAddress || req.address || 'Home Address'}, {req.locality} (PIN {req.pincode})</span>
                          </p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                          <p><strong className="text-slate-800">Symptoms:</strong> {req.symptoms}</p>
                          {(req.notes || req.doctorNotes) && (
                            <p className="text-slate-500 mt-1">
                              <strong className="text-slate-700">Notes:</strong> {req.notes || req.doctorNotes}
                            </p>
                          )}
                        </div>

                        {/* Consultation Note Input */}
                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Doctor Consultation Notes / Advice for Patient:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Paracetamol 650mg prescribed for fever. Advised hydration."
                            value={notesInput[req.id] || ''}
                            onChange={(e) => setNotesInput({ ...notesInput, [req.id]: e.target.value })}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-sm font-mono font-bold text-emerald-700">
                          Fee: ₹{req.consultationFee || doctor.consultationFee || 350}
                        </span>

                        {req.status === 'accepted' && (
                          <button
                            onClick={() => handleStartJourney(req.id)}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Mark "Doctor on the Way"
                          </button>
                        )}

                        <button
                          onClick={() => handleComplete(req.id)}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete Visit & Collect Fee
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Completed Visits & Records
            </h2>

            {completedVisits.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No Visit History</h3>
                <p className="text-xs text-slate-500 mt-1">Completed emergency consultations will be logged here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Locality</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedVisits.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{req.patientName}</td>
                        <td className="p-3 text-slate-600">{req.locality}</td>
                        <td className="p-3 text-slate-600 capitalize">{req.requestType.replace('_', ' ')}</td>
                        <td className="p-3 text-slate-500 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          ₹{req.consultationFee || doctor.consultationFee || 350}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            req.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCTOR PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 max-w-2xl">
            <h2 className="text-sm font-bold text-slate-900">
              Medical Credentials & Service Configuration
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Doctor Full Name</label>
                <input
                  type="text"
                  value={doctor.name}
                  onChange={(e) => onUpdateDoctor({ ...doctor, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Medical Council Reg No</label>
                  <input
                    type="text"
                    value={regNumber}
                    disabled
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Verified by Admin · Contact support to update</span>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Qualifications</label>
                  <input
                    type="text"
                    value={doctor.qualification}
                    onChange={(e) => onUpdateDoctor({ ...doctor, qualification: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Specialization</label>
                  <input
                    type="text"
                    value={doctor.specialization}
                    onChange={(e) => onUpdateDoctor({ ...doctor, specialization: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={doctor.consultationFee}
                    onChange={(e) => onUpdateDoctor({ ...doctor, consultationFee: parseInt(e.target.value || '0', 10) })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Served Dooars Localities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  {localities.map((loc) => {
                    const isChecked = servedLocs.includes(loc.name);
                    return (
                      <label key={loc.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updatedList = [...servedLocs];
                            if (e.target.checked) {
                              updatedList.push(loc.name);
                            } else {
                              updatedList = updatedList.filter((l: string) => l !== loc.name);
                            }
                            onUpdateDoctor({ 
                              ...doctor, 
                              servedLocalities: updatedList,
                              localitiesServed: updatedList
                            });
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="truncate">{loc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />{' '}
                  {profileSavedNotice || 'Changes synced to local & database'}
                </span>
                <button
                  type="button"
                  onClick={() => setProfileSavedNotice('Doctor profile settings saved successfully.')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
