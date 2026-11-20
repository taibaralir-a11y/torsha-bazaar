import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  PhoneCall, 
  Stethoscope, 
  Home, 
  Clock, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Activity, 
  ChevronRight, 
  HeartHandshake,
  User,
  AlertCircle
} from 'lucide-react';
import { 
  Doctor, 
  EmergencyDoctorRequest, 
  EmergencyDoctorPriority, 
  EmergencyDoctorRequestType, 
  NearbyHospital,
  LocalityInfo,
  UserProfile 
} from '../../types';
import { NEARBY_HOSPITALS } from '../../data/mockData';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';

interface EmergencyDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  currentPincode: string;
  doctors: Doctor[];
  emergencyRequests: EmergencyDoctorRequest[];
  user: UserProfile;
  onRequestDoctor: (newRequest: Omit<EmergencyDoctorRequest, 'id' | 'createdAt'>) => Promise<{ ok: boolean; error?: string } | void> | void;
  localities?: LocalityInfo[];
}

export const EmergencyDoctorModal: React.FC<EmergencyDoctorModalProps> = ({
  isOpen,
  onClose,
  currentLocality,
  currentPincode,
  doctors,
  emergencyRequests,
  user,
  onRequestDoctor,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'hospitals' | 'my_requests'>('request');

  // Strict patient privacy: only show emergency requests belonging to the authenticated user UID
  const myEmergencyRequests = emergencyRequests.filter(
    (req) =>
      Boolean(user?.id) &&
      (user?.isSessionAuthenticated !== false) &&
      (req.patientUserId === user.id || req.customerId === user.id)
  );

  // Form states
  const [patientName, setPatientName] = useState(user.name || '');
  const [patientPhone, setPatientPhone] = useState(user.phone || '');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [symptoms, setSymptoms] = useState('');
  const [locality, setLocality] = useState(currentLocality || 'Satali');
  const [pincode, setPincode] = useState(currentPincode || '735214');
  const [address, setAddress] = useState(user.address || '');
  const [priority, setPriority] = useState<EmergencyDoctorPriority>('urgent');
  const [requestType, setRequestType] = useState<EmergencyDoctorRequestType>('home_visit');
  const [detectedGps, setDetectedGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [crossLocalityApproved, setCrossLocalityApproved] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Find approved doctors serving patient's exact locality
  const localDoctors = doctors.filter(
    (d) => d.status === 'approved' && (d.localitiesServed || d.servedLocalities || []).includes(locality) && (d.isOnline ?? d.isAvailable ?? true)
  );

  // Other available doctors across Dooars
  const otherDoctors = doctors.filter(
    (d) => d.status === 'approved' && !(d.localitiesServed || d.servedLocalities || []).includes(locality) && (d.isOnline ?? d.isAvailable ?? true)
  );

  const handleGpsDetect = () => {
    setFormError('');
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectedGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDetectingGps(false);
      },
      () => {
        setIsDetectingGps(false);
        // Fallback Dooars coordinates
        setDetectedGps({ lat: 26.7214, lng: 89.3982 });
      },
      { timeout: 7000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');
    if (!patientName.trim() || !patientPhone.trim() || !symptoms.trim() || !address.trim()) {
      setFormError('Please fill in all mandatory patient and address details.');
      return;
    }

    if (localDoctors.length === 0 && otherDoctors.length > 0 && !crossLocalityApproved) {
      setFormError(`No doctors are currently based inside ${locality}. Please check the approval box to request doctors from neighboring Dooars areas.`);
      return;
    }

    const payload: Omit<EmergencyDoctorRequest, 'id' | 'createdAt'> = {
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientAge: Number(patientAge) || 30,
      symptoms: symptoms.trim(),
      locality,
      pincode,
      address: address.trim(),
      gpsCoordinates: detectedGps || undefined,
      priority,
      requestType,
      status: 'searching',
      patientUserId: user?.id,
      customerId: user?.id
    };

    setIsSubmitting(true);
    try {
      const res = await onRequestDoctor(payload);
      if (res && res.ok === false) {
        setFormError(res.error || 'Could not submit emergency doctor request.');
        return;
      }
      setActiveTab('my_requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-red-100 animate-in zoom-in-95 duration-200">
        
        {/* Top Header with Emergency 112 Action */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-4 shrink-0 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-red-600/70">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Stethoscope className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide flex items-center gap-1.5">
                  <span>EMERGENCY DOCTOR</span>
                  <span className="text-[10px] bg-yellow-400 text-black font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                    24x7
                  </span>
                </h3>
                <p className="text-[11px] text-red-100 font-medium leading-none mt-0.5">
                  Home Visit & Urgent Consultation • Dooars
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Life-Saving Disclaimer Banner */}
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/70 border border-red-400/40 text-[11px] text-rose-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white leading-tight">
                CRITICAL WARNING: Not an Ambulance or 112 Dispatch Replacement
              </p>
              <p className="text-[10px] text-rose-200 mt-0.5 leading-snug">
                For accidents, chest pain, stroke, or severe bleeding, call <strong>112</strong> immediately. Never delay hospital admission while awaiting a home visit.
              </p>
            </div>
          </div>

          {/* 112 Direct Quick-Call Button */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <a
              href="tel:112"
              className="flex-1 py-2 px-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-950 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4 text-black animate-pulse" />
              <span>Call 112 Emergency Police & Ambulance</span>
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 mt-3 bg-red-900/60 p-1 rounded-xl text-xs font-bold text-center">
            <button
              onClick={() => setActiveTab('request')}
              className={`py-1.5 rounded-lg transition ${
                activeTab === 'request' ? 'bg-white text-red-800 shadow-sm' : 'text-red-100 hover:text-white'
              }`}
            >
              Request Doctor
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`py-1.5 rounded-lg transition ${
                activeTab === 'hospitals' ? 'bg-white text-red-800 shadow-sm' : 'text-red-100 hover:text-white'
              }`}
            >
              Nearby Hospitals
            </button>
            <button
              onClick={() => setActiveTab('my_requests')}
              className={`py-1.5 rounded-lg transition relative ${
                activeTab === 'my_requests' ? 'bg-white text-red-800 shadow-sm' : 'text-red-100 hover:text-white'
              }`}
            >
              My Requests
              {myEmergencyRequests.length > 0 && (
                <span className="ml-1 bg-yellow-400 text-black text-[10px] px-1.5 py-0.2 rounded-full">
                  {myEmergencyRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Request Emergency Doctor / Home Visit Form */}
        {activeTab === 'request' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-gray-800">
            {/* Request Type Selector */}
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">Visit / Consultation Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType('home_visit')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    requestType === 'home_visit'
                      ? 'border-red-600 bg-red-50 text-red-900 font-bold ring-2 ring-red-400'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <Home className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold leading-tight">Doctor Home Visit</span>
                    <span className="text-[10px] text-gray-500">Doctor arrives at doorstep</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('phone_consultation')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    requestType === 'phone_consultation'
                      ? 'border-red-600 bg-red-50 text-red-900 font-bold ring-2 ring-red-400'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <PhoneCall className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold leading-tight">Phone / Audio Consult</span>
                    <span className="text-[10px] text-gray-500">Urgent tele-guidance</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-gray-700">Triage Priority:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                    priority === 'urgent'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Urgent (Immediate)
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                    priority === 'normal'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Normal (Routine)
                </button>
              </div>
            </div>

            {/* Patient Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-gray-600 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Roy"
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">Contact Mobile Number *</label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 94340 XXXXX"
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {/* Age & Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-gray-600 block mb-1">Patient Age (Years) *</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">Exact Dooars Locality *</label>
                <select
                  value={locality}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setLocality(sel);
                    const matched = localities.find((l) => l.name === sel);
                    if (matched) setPincode(matched.pincode);
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {localities.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} — PIN {loc.pincode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address & GPS Detection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-600">Full Home Address / Landmark *</label>
                <button
                  type="button"
                  onClick={handleGpsDetect}
                  disabled={isDetectingGps}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isDetectingGps ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
                </button>
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="House No, Landmark, Near Temple/School, Satali Road..."
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              {detectedGps && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  GPS Attached: {detectedGps.lat.toFixed(4)}, {detectedGps.lng.toFixed(4)}
                </span>
              )}
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="font-semibold text-gray-600 block mb-1">
                Symptoms & Chief Complaints * (No Automated Diagnosis)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                placeholder="e.g. High fever (103°F), difficulty breathing, persistent vomiting for 6 hours..."
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Hyperlocal Doctor Availability Status */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-700" />
                  <span>Locality-First Matching in {locality}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {localDoctors.length} Verified Online
                </span>
              </div>

              {localDoctors.length > 0 ? (
                <p className="text-[11px] text-amber-800">
                  Doctors based in {locality} will receive your urgent request immediately.
                </p>
              ) : (
                <div className="space-y-2 mt-1">
                  <p className="text-[11px] text-red-800 font-semibold">
                    ⚠️ No doctor is currently stationed inside {locality}. {otherDoctors.length} doctors are available in neighboring Dooars hubs.
                  </p>
                  <label className="flex items-start gap-2 text-[11px] font-bold text-gray-800 cursor-pointer bg-white p-2 rounded-xl border border-amber-300">
                    <input
                      type="checkbox"
                      checked={crossLocalityApproved}
                      onChange={(e) => setCrossLocalityApproved(e.target.checked)}
                      className="mt-0.5 rounded text-red-600"
                    />
                    <span>
                      I approve dispatching a verified doctor from neighboring Hasimara/Kalchini (requires customer consent).
                    </span>
                  </label>
                </div>
              )}
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-60 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-700/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Request...' : 'Submit Urgent Doctor Request'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Nearby Hospitals Directory */}
        {activeTab === 'hospitals' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
              <strong className="block">Dooars Emergency Hospital Directory:</strong>
              Direct telephone contact lines for government primary health centres and trauma facilities.
            </div>

            {NEARBY_HOSPITALS.map((hosp) => (
              <div
                key={hosp.id}
                className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-2 hover:border-blue-400 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{hosp.name}</h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                    {hosp.type}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                  <span className="text-gray-600 font-medium">Distance: <strong>{hosp.distance}</strong></span>
                  <a
                    href={`tel:${hosp.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs"
                  >
                    <PhoneCall className="w-3 h-3 text-yellow-300" />
                    <span>Call {hosp.phone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: My Emergency Requests Status Tracker */}
        {activeTab === 'my_requests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {myEmergencyRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <Stethoscope className="w-10 h-10 mx-auto text-gray-300" />
                <p className="font-bold text-gray-600">No Emergency Doctor Requests</p>
                <p className="text-[11px]">Any urgent doctor visit or phone consult requests will appear here.</p>
              </div>
            ) : (
              myEmergencyRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block font-mono">
                        {req.id} • {new Date(req.createdAt).toLocaleTimeString()}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-0.5">{req.patientName} (Age: {req.patientAge})</h4>
                    </div>
                    <div>
                      {req.status === 'searching' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                          Searching Doctor...
                        </span>
                      )}
                      {req.status === 'accepted' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Doctor Accepted
                        </span>
                      )}
                      {req.status === 'doctor_on_the_way' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-600 animate-bounce" />
                          On The Way (~{req.estimatedArrivalMinutes || 15}m)
                        </span>
                      )}
                      {req.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[10px]">
                          Completed
                        </span>
                      )}
                      {req.status === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-gray-600 text-[11px]">
                    <p><strong>Symptoms:</strong> {req.symptoms}</p>
                    <p><strong>Address:</strong> {req.address}, {req.locality} ({req.pincode})</p>
                    <p><strong>Type:</strong> {req.requestType === 'home_visit' ? 'Doctor Home Visit' : 'Phone Consultation'}</p>
                  </div>

                  {req.assignedDoctorName && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs">{req.assignedDoctorName}</p>
                        <p className="text-[10px] text-emerald-800">{req.assignedDoctorQualification || 'Verified Medical Officer'}</p>
                      </div>
                      {req.assignedDoctorPhone && (
                        <a
                          href={`tel:${req.assignedDoctorPhone}`}
                          className="flex items-center gap-1 bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs"
                        >
                          <PhoneCall className="w-3 h-3 text-yellow-300" />
                          <span>Call Doctor</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
