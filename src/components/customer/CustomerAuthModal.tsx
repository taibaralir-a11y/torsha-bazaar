import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { ensureAuthSession } from '../../firebase';
import { normalizePhoneE164, phonesMatchNormalized } from '../../utils/phone';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterCustomer: (newUser: UserProfile) => void;
  localities?: LocalityInfo[];
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onRegisterCustomer,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Register
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateName, setStateName] = useState('West Bengal');
  const [district, setDistrict] = useState('Alipurduar');
  const [block, setBlock] = useState('Kalchini');
  const [selectedLocality, setSelectedLocality] = useState('Satali');
  const [pincode, setPincode] = useState('735214');
  const [address, setAddress] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLocalityChange = (locName: string) => {
    setSelectedLocality(locName);
    const found = localities.find(l => l.name.toLowerCase() === locName.toLowerCase());
    if (found) {
      setPincode(found.pincode);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6))
        });
        setGpsDetecting(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsDetecting(false);
        alert('Could not retrieve GPS coordinates. You can still proceed with manual locality selection.');
      },
      { timeout: 8000 }
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginPhone.trim().length < 4) {
      setLoginError('Please enter a valid Phone number or Email.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const fbUser = await ensureAuthSession(true);
      if (!fbUser) {
        setLoginError('Unable to start Firebase Auth session. Please retry.');
        return;
      }
      const rawInput = loginPhone.trim();
      const normalizedTargetPhone = !rawInput.includes('@')
        ? (normalizePhoneE164(rawInput) || rawInput)
        : (normalizePhoneE164(currentUser.phone) || currentUser.phone);
      const hasExactPhoneMatch = phonesMatchNormalized(fbUser.phoneNumber, normalizedTargetPhone);
      const isPhoneVerified = hasExactPhoneMatch;
      const isVerified = Boolean(isPhoneVerified || fbUser.emailVerified);
      const authMethod: UserProfile['authMethod'] = hasExactPhoneMatch
        ? 'phone'
        : fbUser.email
          ? (fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email')
          : (fbUser.isAnonymous ? 'anonymous' : 'none');

      const matchedUser: UserProfile = {
        ...currentUser,
        id: fbUser.uid,
        userId: fbUser.uid,
        phone: normalizedTargetPhone,
        email: rawInput.includes('@') ? rawInput : currentUser.email,
        name: currentUser.name || 'Customer',
        isSessionAuthenticated: true,
        isPhoneVerified,
        isVerified,
        authMethod
      };

      setLoginPassword('');
      onLoginSuccess(matchedUser);
      onClose();
    } catch (err: any) {
      setLoginError(err?.message || 'Unable to establish authenticated session.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!name.trim() || !phone.trim()) {
      setRegError('Name and Phone number are required.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const fbUser = await ensureAuthSession(true);
      if (!fbUser) {
        setRegError('Unable to establish Firebase Auth session. Please retry.');
        return;
      }
      const normalizedPhone = normalizePhoneE164(phone) || phone.trim();
      const emailDigits = normalizedPhone.replace(/[^\d]/g, '') || phone.trim().replace(/\s+/g, '');
      const hasExactPhoneMatch = phonesMatchNormalized(fbUser.phoneNumber, normalizedPhone);
      const isPhoneVerified = hasExactPhoneMatch;
      const isVerified = Boolean(isPhoneVerified || fbUser.emailVerified);
      const authMethod: UserProfile['authMethod'] = hasExactPhoneMatch
        ? 'phone'
        : fbUser.email
          ? (fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email')
          : (fbUser.isAnonymous ? 'anonymous' : 'none');

      const newUser: UserProfile = {
        id: fbUser.uid,
        userId: fbUser.uid,
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim() || `${emailDigits}@torshabazaar.in`,
        location: selectedLocality,
        pincode: pincode.trim(),
        address: address.trim() || `${selectedLocality}, ${block}, ${district}`,
        state: stateName,
        district,
        block,
        ...(gpsCoords ? { gpsCoordinates: gpsCoords } : {}),
        language: 'English',
        isSessionAuthenticated: true,
        isPhoneVerified,
        isVerified,
        authMethod
      };

      setPassword('');
      onRegisterCustomer(newUser);
      setRegSuccess(true);
    } catch (err: any) {
      setRegError(err?.message || 'Unable to complete registration.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="bg-[#0E7438] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Customer Account</h2>
              <p className="text-xs text-emerald-100">TORSHA BAZAAR Hyperlocal Dooars</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
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
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Customer Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            New Registration
          </button>
          <button
            onClick={() => { setActiveTab('forgot'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'forgot'
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
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
                  Registered Mobile Number or Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9832012345"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>Session Notice:</strong> Customer sign-in establishes a Firebase Anonymous session bound to your device UID. Your phone number is stored for delivery contact only and is not OTP-verified on the Spark client plan.
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>{isAuthenticating ? 'Connecting Firebase Session...' : 'Sign In & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-semibold text-[#0E7438] hover:underline"
                >
                  Don't have an account? Register with your locality
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <div>
              {regSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0E7438] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Profile Saved!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Welcome to TORSHA BAZAAR, <strong>{name}</strong>! Your Firebase session profile is saved for <strong>{selectedLocality} (PIN {pincode})</strong> (Guest/Anonymous Auth — phone not OTP-verified).
                  </p>
                  <button
                    onClick={() => { setRegSuccess(false); onClose(); }}
                    className="mt-2 px-4 py-2 bg-[#0E7438] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Barman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="9832012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="user@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Block</label>
                      <input
                        type="text"
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Exact Locality *
                      </label>
                      <select
                        value={selectedLocality}
                        onChange={(e) => handleLocalityChange(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        {localities.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} ({loc.pincode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Street / Landmark Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Satali High School, House #14"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Optional GPS Coordinates */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-emerald-700" />
                        Optional GPS Coordinates
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {gpsCoords 
                          ? `Lat: ${gpsCoords.lat}, Lng: ${gpsCoords.lng}` 
                          : 'Provides accurate kilometer distance to local shops'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={gpsDetecting}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                    >
                      {gpsDetecting ? 'Detecting...' : gpsCoords ? 'Re-detect' : 'Auto Detect'}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Create Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
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
                      className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Complete Customer Registration
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
                  <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Guest Session Recovery Info</h3>
                  <p className="text-xs text-slate-600">
                    Anonymous guest sessions are bound to this browser session and do not use SMS OTP or email password reset. Please sign in or register a fresh profile for <strong>{forgotIdentifier}</strong>.
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
                    Enter your registered phone number or email address to recover your customer account.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Phone Number or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9832012345"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0E7438] hover:bg-[#0c6330] text-white font-semibold text-xs rounded-xl"
                  >
                    Send Recovery Code
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
