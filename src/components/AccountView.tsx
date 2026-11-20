import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Shield, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  Compass, 
  Heart, 
  AlertTriangle, 
  ShoppingBag, 
  Clock, 
  Send,
  LogIn,
  LogOut,
  Plus,
  Package,
  Truck,
  HelpCircle,
  Info,
  ShieldCheck,
  FileText,
  Tag
} from 'lucide-react';
import { UserProfile, LanguageCode, LocalityInfo, Complaint, Product, AppTab } from '../types';
import { INITIAL_SERVICE_LOCALITIES } from '../utils/hyperlocalRouting';
import { CustomerPolicyModal, CustomerPolicyType } from './common/CustomerPolicyModal';

interface AccountViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onSelectLanguage: (lang: string) => void;
  localities?: LocalityInfo[];
  onOpenAuthModal?: () => void;
  onFileComplaint?: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => Promise<{ ok: boolean; error?: string } | void> | void;
  complaints?: Complaint[];
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  onNavigateTab?: (tab: AppTab) => void;
  onTrackOrder?: () => void;
  onOpenCart?: () => void;
  onLogout?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  onUpdateUser,
  onSelectLanguage,
  localities = INITIAL_SERVICE_LOCALITIES,
  onOpenAuthModal,
  onFileComplaint,
  complaints = [],
  products = [],
  onAddToCart,
  onNavigateTab,
  onTrackOrder,
  onOpenCart,
  onLogout
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'addresses' | 'wishlist' | 'support' | 'legal'>('profile');
  const [activePolicy, setActivePolicy] = useState<CustomerPolicyType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [stateName, setStateName] = useState(user.state || 'West Bengal');
  const [district, setDistrict] = useState(user.district || 'Alipurduar');
  const [block, setBlock] = useState(user.block || 'Kalchini');
  const [selectedLocality, setSelectedLocality] = useState(user.location || 'Satali');
  const [pincode, setPincode] = useState(user.pincode || '735214');
  const [address, setAddress] = useState(user.address);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Bengali' | LanguageCode>(user.language);

  const emergencyNameInitial = typeof user.emergencyContact === 'object' && user.emergencyContact !== null
    ? user.emergencyContact.name
    : (typeof user.emergencyContact === 'string' ? user.emergencyContact.split('(')[0]?.trim() : '');
  const emergencyPhoneInitial = typeof user.emergencyContact === 'object' && user.emergencyContact !== null
    ? user.emergencyContact.phone
    : (typeof user.emergencyContact === 'string' ? (user.emergencyContact.match(/\((.*?)\)/)?.[1] || user.emergencyContact) : '');

  const [emergencyContactName, setEmergencyContactName] = useState(emergencyNameInitial || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(emergencyPhoneInitial || '');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [gpsError, setGpsError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setStateName(user.state || 'West Bengal');
      setDistrict(user.district || 'Alipurduar');
      setBlock(user.block || 'Kalchini');
      setSelectedLocality(user.location || 'Satali');
      setPincode(user.pincode || '735214');
      setAddress(user.address || '');
      setLanguage(user.language || 'en');
    }
  }, [
    isEditing,
    user.id,
    user.name,
    user.phone,
    user.email,
    user.state,
    user.district,
    user.block,
    user.location,
    user.pincode,
    user.address,
    user.language
  ]);

  // Complaint form state
  const [complaintType, setComplaintType] = useState<'order' | 'rider' | 'shop' | 'service'>('shop');
  const [complaintTargetName, setComplaintTargetName] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name,
      phone,
      email,
      state: stateName,
      district,
      block,
      location: selectedLocality,
      pincode,
      address,
      language,
      emergencyContact: emergencyContactPhone ? {
        name: emergencyContactName || 'Family Contact',
        phone: emergencyContactPhone
      } : undefined
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDetectGps = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this device.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6))
        };
        onUpdateUser({
          ...user,
          gpsCoordinates: coords
        });
        setGpsDetecting(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
      () => {
        setGpsDetecting(false);
        setGpsError('Could not retrieve GPS coordinates. Location remains set to ' + selectedLocality);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDescription.trim() || !onFileComplaint || isSubmittingComplaint) return;
    setComplaintError('');
    setIsSubmittingComplaint(true);
    try {
      const res = await onFileComplaint({
        type: complaintType,
        targetId: 'target_' + Date.now(),
        targetName: complaintTargetName.trim() || 'General Local Issue',
        customerName: user.name,
        customerPhone: user.phone,
        userName: user.name,
        userPhone: user.phone,
        subject: `${complaintType.toUpperCase()}: ${complaintTargetName.trim() || 'Issue'}`,
        description: complaintDescription.trim()
      });
      if (res && res.ok === false) {
        setComplaintError(res.error || 'Could not submit complaint.');
        return;
      }
      setComplaintDescription('');
      setComplaintTargetName('');
      setComplaintSuccess(true);
      setTimeout(() => setComplaintSuccess(false), 5000);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const userComplaints = complaints.filter(
    c => Boolean(user.id) && c.userId === user.id
  );

  const wishlistProducts = products.filter(p => user.wishlist?.includes(p.id));

  return (
    <div className="pb-24">
      {/* Customer Profile Header */}
      <div className="bg-[#0E7438] text-white p-5 pt-8 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center text-xl font-bold shadow-xs">
              {user.name.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full uppercase">
                  {user.location || 'Satali'}
                </span>
              </h2>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Phone className="w-3 h-3 text-yellow-300" />
                <span>{user.phone || 'No phone saved'}</span>
                {user.isPhoneVerified ? (
                  <span className="text-[9px] font-bold bg-emerald-950/70 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full">
                    OTP Verified
                  </span>
                ) : user.authMethod === 'google' ? (
                  <span className="text-[9px] font-bold bg-emerald-950/70 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full">
                    Google Verified
                  </span>
                ) : user.authMethod === 'email' ? (
                  <span className="text-[9px] font-bold bg-emerald-950/70 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full">
                    {user.isVerified ? 'Email Verified' : 'Email Signed In'}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-emerald-200 flex items-center gap-1 mt-0.5 truncate max-w-[220px]">
                <MapPin className="w-3 h-3 text-yellow-300 shrink-0" />
                <span className="truncate">{user.location} (PIN: {user.pincode})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all"
                title="Customer Login / Register"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30 transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* GPS Coordinates Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-100 truncate">
            <Compass className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span className="truncate">
              GPS: {user.gpsCoordinates ? `${user.gpsCoordinates.lat}, ${user.gpsCoordinates.lng}` : 'Using postal hub centroid'}
            </span>
          </div>
          <button
            onClick={handleDetectGps}
            disabled={gpsDetecting}
            className="text-[11px] font-bold bg-emerald-800 text-yellow-300 px-2.5 py-1 rounded-lg border border-emerald-700 hover:bg-emerald-700 whitespace-nowrap active:scale-95 transition-all"
          >
            {gpsDetecting ? 'Detecting...' : user.gpsCoordinates ? 'Re-sync GPS' : 'Auto-Detect GPS'}
          </button>
        </div>
      </div>

      {/* Customer Quick Action Cards */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl p-2.5 shadow-md border border-gray-100 grid grid-cols-4 gap-1.5 text-center">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('orders') : null}
            className="p-2 rounded-xl hover:bg-gray-50 flex flex-col items-center transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">My Orders</span>
          </button>

          <button
            onClick={onTrackOrder}
            className="p-2 rounded-xl hover:bg-gray-50 flex flex-col items-center transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-1">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Tracking</span>
          </button>

          <button
            onClick={() => setActiveSubTab('wishlist')}
            className="p-2 rounded-xl hover:bg-gray-50 flex flex-col items-center transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-1">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Wishlist</span>
          </button>

          <button
            onClick={onOpenCart}
            className="p-2 rounded-xl hover:bg-gray-50 flex flex-col items-center transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">My Cart</span>
          </button>
        </div>
      </div>

      {/* Customer Section Tabs */}
      <div className="px-4 pt-3 flex items-center gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'profile'
              ? 'border-[#0E7438] text-[#0E7438]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSubTab('addresses')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'addresses'
              ? 'border-[#0E7438] text-[#0E7438]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Saved Address
        </button>
        <button
          onClick={() => setActiveSubTab('wishlist')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'wishlist'
              ? 'border-[#0E7438] text-[#0E7438]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Wishlist ({user.wishlist?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('support')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
            activeSubTab === 'support'
              ? 'border-[#0E7438] text-[#0E7438]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help & Grievances ({userComplaints.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('legal')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'legal'
              ? 'border-[#0E7438] text-[#0E7438]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          About & Policies
        </button>
      </div>

      <div className="p-4 space-y-4">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Customer profile updated successfully!</span>
          </div>
        )}
        {gpsError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* TAB 1: PROFILE */}
        {activeSubTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Personal Details
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-[#0E7438] hover:underline"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Emergency Contact Person</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Emergency Phone"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Full Name</span>
                    <span className="font-bold text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Phone Number</span>
                    <span className="font-medium text-gray-900">{user.phone}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Email Address</span>
                    <span className="font-medium text-gray-900">{user.email || 'Not provided'}</span>
                  </div>
                  {user.emergencyContact && (
                    <div className="flex items-center justify-between py-1 text-rose-800">
                      <span className="text-gray-400">Emergency Contact</span>
                      <span className="font-bold">
                        {typeof user.emergencyContact === 'object' ? user.emergencyContact.name : user.emergencyContact} 
                        {typeof user.emergencyContact === 'object' && user.emergencyContact.phone ? ` (${user.emergencyContact.phone})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Settings Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preferred Language / ভাষা</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['English', 'Hindi', 'Bengali'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      onUpdateUser({ ...user, language: lang });
                      if (onSelectLanguage) {
                        const code = lang === 'English' ? 'en' : lang === 'Hindi' ? 'hi' : 'bn';
                        onSelectLanguage(code);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      language === lang
                        ? 'bg-emerald-50 border-[#0E7438] text-[#0E7438] shadow-xs font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeSubTab === 'addresses' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivery Address & Hyperlocal Hub</span>
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-[#0E7438] hover:underline"
                >
                  {isEditing ? 'Cancel' : 'Change Address'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">State</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">Block</label>
                      <input
                        type="text"
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">Locality Hub</label>
                      <select
                        value={selectedLocality}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          setSelectedLocality(chosen);
                          const found = localities.find(l => l.name.toLowerCase() === chosen.toLowerCase());
                          if (found) setPincode(found.pincode);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                      >
                        {localities.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} (PIN: {loc.pincode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Detailed Street Address / Landmark</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                      placeholder="House No., Street Name, Near Temple or Tea Garden line..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
                  >
                    Save Address
                  </button>
                </form>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold">Selected Delivery Locality</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {user.location || 'Satali'} (PIN: {user.pincode || '735214'})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] py-1 border-b border-gray-50">
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">State</span>
                      <span className="font-medium text-gray-800">{user.state || 'West Bengal'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">District</span>
                      <span className="font-medium text-gray-800">{user.district || 'Alipurduar'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Block</span>
                      <span className="font-medium text-gray-800">{user.block || 'Kalchini'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Detailed Street Address</span>
                    <span className="font-medium text-gray-800">{user.address}</span>
                  </div>
                </div>
              )}
            </div>

            {/* GPS Precision Card */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Precise GPS Coordinates</span>
                </span>
                <p className="text-[11px] text-emerald-800">
                  {user.gpsCoordinates ? `${user.gpsCoordinates.lat}, ${user.gpsCoordinates.lng}` : 'Auto-detect coordinates for exact doorstep delivery'}
                </p>
              </div>
              <button
                onClick={handleDetectGps}
                disabled={gpsDetecting}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                {gpsDetecting ? 'Detecting...' : 'Sync GPS'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: WISHLIST */}
        {activeSubTab === 'wishlist' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Saved Products & Deals ({wishlistProducts.length})
            </h3>

            {wishlistProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
                <Heart className="w-8 h-8 text-rose-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">Your Wishlist is Empty</h4>
                <p className="text-xs text-gray-500">
                  Tap the heart icon on any product or deal to save items for future orders.
                </p>
                <button
                  onClick={() => onNavigateTab ? onNavigateTab('categories') : null}
                  className="mt-2 px-4 py-2 bg-[#0E7438] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Browse Deals Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wishlistProducts.map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{p.name}</h4>
                      <p className="text-[11px] font-mono font-bold text-emerald-700">₹{p.price}</p>
                      <span className="text-[10px] text-gray-400 capitalize">{p.category}</span>
                    </div>
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(p)}
                        className="p-2 bg-[#0E7438] text-white rounded-xl hover:bg-emerald-800 transition-colors shrink-0 shadow-xs"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HELP & GRIEVANCES */}
        {activeSubTab === 'support' && (
          <div className="space-y-4">
            {/* Quick Helpline */}
            <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-purple-950">24x7 Customer Helpline</h4>
                <p className="text-xs font-mono font-bold text-purple-800 mt-0.5">+91 94340 12891</p>
                <span className="text-[10px] text-purple-700">Daily support 7:00 AM – 10:00 PM</span>
              </div>
              <a
                href="tel:+919434012891"
                className="px-3 py-1.5 bg-purple-700 text-white font-bold text-xs rounded-xl hover:bg-purple-800 shadow-xs"
              >
                Call Now
              </a>
            </div>

            {/* File Grievance Form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>File a Grievance or Report Issue</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Directly reviewed by Super Admin. We investigate shop overcharging, driver refusals, and delayed deliveries.
              </p>

              {complaintSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Complaint registered! Admin will review within 24 hours.</span>
                </div>
              )}

              {complaintError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{complaintError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitComplaint} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Issue Category</label>
                    <select
                      value={complaintType}
                      onChange={(e) => setComplaintType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                    >
                      <option value="shop">Shopkeeper / Store</option>
                      <option value="rider">Rider / Driver (Toto/Auto)</option>
                      <option value="order">Order / Delivery Delay</option>
                      <option value="service">Technician / Home Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Entity / Shop Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Satali Kirana Store"
                      value={complaintTargetName}
                      onChange={(e) => setComplaintTargetName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Complaint Details *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the issue clearly (order number, price discrepancy, behavior)..."
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingComplaint}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingComplaint ? 'Submitting...' : 'Submit Complaint to Admin'}</span>
                </button>
              </form>
            </div>

            {/* My Complaints History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                My Filed Complaints ({userComplaints.length})
              </h4>

              {userComplaints.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-xs text-gray-500">
                  No complaints filed. Everything is running smoothly.
                </div>
              ) : (
                <div className="space-y-2">
                  {userComplaints.map((c) => (
                    <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 capitalize">
                          {c.type === 'return_request' ? 'Return Request' : c.type || 'Issue'}: {c.targetName || c.subject || 'Complaint'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.type === 'return_request' && c.returnStatus ? c.returnStatus.replace('_', ' ') : c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">{c.description}</p>
                      {c.resolutionNotes && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          <strong>Admin Resolution:</strong> {c.resolutionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ABOUT & POLICIES */}
        {activeSubTab === 'legal' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-1">
            <button
              onClick={() => setActivePolicy('about')}
              className="w-full flex items-center justify-between p-3 hover:bg-emerald-50/70 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">About Torsa Bazaar</span>
                  <span className="text-[10px] text-gray-500">Local Dooars Hyperlocal Mission</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setActivePolicy('privacy')}
              className="w-full flex items-center justify-between p-3 hover:bg-blue-50/70 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Privacy Policy</span>
                  <span className="text-[10px] text-gray-500">100% Data Protection Guarantee</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setActivePolicy('terms')}
              className="w-full flex items-center justify-between p-3 hover:bg-amber-50/70 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Terms & Conditions</span>
                  <span className="text-[10px] text-gray-500">Customer Agreement & Fair Pricing</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Customer Policy Modal */}
      {activePolicy && (
        <CustomerPolicyModal
          isOpen={activePolicy !== null}
          onClose={() => setActivePolicy(null)}
          type={activePolicy}
        />
      )}
    </div>
  );
};
