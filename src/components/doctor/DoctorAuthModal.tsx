import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  Lock, 
  Phone, 
  Mail, 
  User, 
  FileText, 
  Award, 
  DollarSign, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Doctor, DoctorSpecialization, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { ensureAuthSession } from '../../firebase';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (doctor: Doctor) => void;
  onRegisterDoctor: (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => void;
  doctors: Doctor[];
  localities?: LocalityInfo[];
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterDoctor,
  doctors,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [councilRegNo, setCouncilRegNo] = useState('');
  const [qualification, setQualification] = useState('MBBS');
  const [specialization, setSpecialization] = useState<DoctorSpecialization>('General Physician');
  const [consultationFee, setConsultationFee] = useState(350);
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>(['Satali', 'Hasimara']);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
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

    const matched = doctors.find(
      d => (d.email.toLowerCase() === loginIdentifier.trim().toLowerCase() || d.phone === loginIdentifier.trim())
    );

    if (!matched) {
      if (loginIdentifier.trim().length > 3) {
        const newPendingDoctor: Doctor = {
          id: `doc_${Date.now()}`,
          ownerId: fbUser.uid,
          name: 'Dr. Partner (Pending)',
          phone: loginIdentifier.includes('@') ? '9832001122' : loginIdentifier,
          email: loginIdentifier.includes('@') ? loginIdentifier : 'doctor@torshabazaar.in',
          medicalCouncilRegNo: 'WBMC/PENDING',
          councilRegistrationNumber: 'WBMC/PENDING',
          qualification: 'MBBS, General Medicine',
          specialization: 'General Physician',
          consultationFee: 350,
          homeVisitFee: 450,
          isAvailable: true,
          isOnline: true,
          status: 'pending',
          servedLocalities: ['Satali', 'Hasimara', 'Malangi'],
          localitiesServed: ['Satali', 'Hasimara', 'Malangi'],
          parentArea: 'Satali / Hasimara',
          rating: 4.8,
          totalConsultations: 0,
          completedConsultations: 0,
          createdAt: new Date().toISOString()
        };
        setLoginPassword('');
        onLoginSuccess(newPendingDoctor);
        onClose();
        return;
      }
      setLoginError('Doctor account not found with this Phone or Email.');
      return;
    }

    setLoginPassword('');
    // Preserve existing/legacy ownerId untouched
    onLoginSuccess(matched);
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!councilRegNo.trim()) {
      setRegError('Medical Council Registration Number is mandatory for doctor verification.');
      return;
    }

    if (selectedLocalities.length === 0) {
      setRegError('Please select at least one locality you serve.');
      return;
    }

    const fbUser = await ensureAuthSession(true);
    if (!fbUser) {
      setRegError('Unable to establish Firebase Auth session. Please retry.');
      return;
    }

    const newDoctor: Omit<Doctor, 'id' | 'createdAt'> = {
      ownerId: fbUser.uid,
      name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
      phone,
      email,
      medicalCouncilRegNo: councilRegNo.trim().toUpperCase(),
      councilRegistrationNumber: councilRegNo.trim().toUpperCase(),
      qualification,
      specialization,
      consultationFee: Number(consultationFee) || 350,
      homeVisitFee: (Number(consultationFee) || 350) + 100,
      isAvailable: true,
      isOnline: true,
      status: 'pending', // Starts in pending until admin verification
      servedLocalities: selectedLocalities,
      localitiesServed: selectedLocalities,
      parentArea: 'Satali / Hasimara',
      rating: 5.0,
      totalConsultations: 0,
      completedConsultations: 0
    };

    setPassword('');
    onRegisterDoctor(newDoctor);
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
        <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Doctor Partner Portal</h2>
              <p className="text-xs text-rose-100">TORSHA BAZAAR Emergency & Healthcare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
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
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Doctor Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Doctor Registration
          </button>
          <button
            onClick={() => { setActiveTab('forgot'); setRegSuccess(false); setForgotSuccess(false); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'forgot'
                ? 'border-rose-600 text-rose-700 bg-white'
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
                  Registered Phone or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9832012345 or doctor@gmail.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Sign In as Doctor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Quick Test Credentials:</p>
                <p className="mt-0.5">Dr. Subir Roy (Satali): <code className="bg-white px-1 py-0.5 rounded border text-[11px]">9832011223</code></p>
                <p className="mt-0.5">Dr. Priya Chettri (Hasimara): <code className="bg-white px-1 py-0.5 rounded border text-[11px]">9832044556</code></p>
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
                  <h3 className="text-base font-bold text-slate-900">Doctor Registration Submitted!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your application with Medical Council Reg No <strong>{councilRegNo}</strong> has been registered. It is now awaiting admin verification by <strong>taibaralir@gmail.com</strong>.
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
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <span>
                      <strong>Verification Mandatory:</strong> Newly registered doctors start in <em>Pending</em> status until Medical Council registration credentials are authenticated by Super Admin.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Doctor Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Subir Roy"
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
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="doctor@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Medical Council Registration Number (WBMC / MCI) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WBMC/67890 or MCI/2018/1234"
                      value={councilRegNo}
                      onChange={(e) => setCouncilRegNo(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Qualifications *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MBBS, MD, DCH"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Specialization *
                      </label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value as DoctorSpecialization)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="General Physician">General Physician</option>
                        <option value="Emergency Medicine">Emergency Medicine</option>
                        <option value="Pediatrician">Pediatrician (Child)</option>
                        <option value="Gynecologist">Gynecologist</option>
                        <option value="Orthopedic">Orthopedic</option>
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="ENT Specialist">ENT Specialist</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="2000"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Served Localities in Dooars *
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
                              className="rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="truncate">{loc.name}</span>
                          </label>
                        );
                      })}
                    </div>
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
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Submit Doctor Registration
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
                  <h3 className="text-sm font-bold text-slate-900">Password Reset Instructions Sent</h3>
                  <p className="text-xs text-slate-600">
                    If an account is associated with <strong>{forgotEmail}</strong>, password reset link has been dispatched.
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
                    Enter your registered email address or phone number to recover your Doctor Partner account.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Email or Phone
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. doctor@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
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
