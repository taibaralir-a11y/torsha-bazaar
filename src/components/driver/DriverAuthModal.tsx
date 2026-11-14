import React, { useState } from 'react';
import { 
  X, 
  Car, 
  Phone, 
  Mail, 
  Lock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Driver, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { ensureAuthSession } from '../../firebase';

interface DriverAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  onLoginSuccess: (driver: Driver) => void;
  onRegisterDriver: (driverData: Omit<Driver, 'id'>) => void;
  localities?: LocalityInfo[];
}

export const DriverAuthModal: React.FC<DriverAuthModalProps> = ({
  isOpen,
  onClose,
  drivers,
  onLoginSuccess,
  onRegisterDriver,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<'toto' | 'auto' | 'taxi'>('toto');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>(['Satali', 'Hasimara']);
  const [password, setPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const fbUser = await ensureAuthSession(true);
    if (!fbUser) {
      setLoginError('Unable to establish Firebase Auth session. Please retry.');
      return;
    }

    const matched = drivers.find(d => d.phone === loginPhone.trim());
    if (matched) {
      setLoginPassword('');
      // Preserve existing/legacy ownerId untouched so rules are not spoofed client-side
      onLoginSuccess(matched);
      onClose();
      return;
    }

    if (loginPhone.trim().length >= 8) {
      // Create new pending partner profile owned by caller's Firebase UID
      const newPendingDriver: Driver = {
        id: `drv_${Date.now()}`,
        ownerId: fbUser.uid,
        name: 'Rider Partner',
        phone: loginPhone.trim(),
        vehicleType: 'toto',
        vehicleNumber: 'WB-74-T-1234',
        rating: 4.9,
        totalRides: 0,
        isOnline: true,
        status: 'pending',
        approvalStatus: 'pending',
        currentLocation: 'Satali',
        servedLocalities: ['Satali', 'Hasimara']
      };
      setLoginPassword('');
      onLoginSuccess(newPendingDriver);
      onClose();
      return;
    }

    setLoginError('Driver account not found. Please register first.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!name.trim() || !phone.trim() || !vehicleNumber.trim()) {
      setRegError('Name, Phone, and Vehicle Number are required.');
      return;
    }

    const fbUser = await ensureAuthSession(true);
    if (!fbUser) {
      setRegError('Unable to establish Firebase Auth session. Please retry.');
      return;
    }

    const newDriver: Omit<Driver, 'id'> = {
      ownerId: fbUser.uid,
      name: name.trim(),
      phone: phone.trim(),
      vehicleType,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      licenseNumber: licenseNumber.trim().toUpperCase() || 'WB-DL-PENDING',
      rating: 5.0,
      totalRides: 0,
      isOnline: true,
      status: 'pending',
      approvalStatus: 'pending', // Pending Admin approval
      currentLocation: selectedLocalities[0] || 'Satali',
      servedLocalities: selectedLocalities
    };

    setPassword('');
    onRegisterDriver(newDriver);
    setRegSuccess(true);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Driver Partner Portal</h2>
              <p className="text-xs text-sky-100">Toto, Auto & Taxi Fleet (Zero Bike Taxis)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('login'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Rider Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Driver Registration
          </button>
          <button
            onClick={() => { setActiveTab('forgot'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'forgot'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Forgot Password
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Registered Driver Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9832011222"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Driver PIN / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter PIN or password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Driver Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Quick Test Drivers:</p>
                <p className="mt-0.5">Biplab Das (Toto - Satali): <code className="bg-white px-1 py-0.5 rounded border text-[11px]">9832098765</code></p>
                <p className="mt-0.5">Manoj Roy (Auto - Hasimara): <code className="bg-white px-1 py-0.5 rounded border text-[11px]">9832087654</code></p>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <div>
              {regSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Driver Registration Submitted!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your application for <strong>{vehicleType.toUpperCase()} ({vehicleNumber})</strong> is submitted. Super Admin <strong>taibaralir@gmail.com</strong> will verify your documents shortly.
                  </p>
                  <button
                    onClick={() => { setActiveTab('login'); setRegSuccess(false); }}
                    className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Proceed to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-[11px] text-sky-900 flex items-start gap-2">
                    <Zap className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                    <span>
                      <strong>Allowed Vehicles:</strong> Toto (E-Rickshaw), Auto-Rickshaw, and 4-Wheeler Taxis only. Two-wheeler bike taxis are strictly prohibited for public safety.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Driver Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subhash Barman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9832011222"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['toto', 'auto', 'taxi'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVehicleType(type)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          vehicleType === type
                            ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Car className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs uppercase block">{type}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Vehicle Plate Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="WB-74-T-1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Driving License Number
                      </label>
                      <input
                        type="text"
                        placeholder="WB74201900123"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Localities You Serve in Dooars *
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto text-xs">
                      {localities.map((loc) => {
                        const checked = selectedLocalities.includes(loc.name);
                        return (
                          <label key={loc.id} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLocalities([...selectedLocalities, loc.name]);
                                } else {
                                  setSelectedLocalities(selectedLocalities.filter(l => l !== loc.name));
                                }
                              }}
                              className="rounded text-sky-600 focus:ring-sky-500"
                            />
                            <span className="truncate">{loc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Create Password / PIN *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 digits"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {regError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Submit Driver Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Driver PIN Reset Requested</h3>
                  <p className="text-xs text-slate-600">
                    A temporary PIN has been dispatched to <strong>{forgotPhone}</strong> via SMS / WhatsApp.
                  </p>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="mt-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Enter your registered driver phone number to reset your access PIN.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Driver Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9832011222"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl"
                  >
                    Request PIN Reset
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
