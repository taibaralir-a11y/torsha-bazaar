import React, { useState } from 'react';
import { X, Store, LogIn, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, ensureAuthSession } from '../../firebase';
import { Shop, ShopApprovalStatus, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';

interface ShopkeeperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (shopData: Partial<Shop>, userEmail: string) => void;
  existingShop: Shop;
  localities?: LocalityInfo[];
}

export const ShopkeeperAuthModal: React.FC<ShopkeeperAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  existingShop,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [shopName, setShopName] = useState('');
  const [locality, setLocality] = useState('Satali');
  const [contactNumber, setContactNumber] = useState('+91 94340 12890');
  const [category, setCategory] = useState('Grocery & Fresh Produce');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const email = res.user.email || 'shopkeeper@torshabazaar.in';
      const uid = res.user.uid;
      
      if (isRegisterMode) {
        onLoginSuccess({
          id: `shop-${Date.now()}`,
          ownerId: uid,
          name: shopName.trim() || 'My Torsa Shop',
          locality,
          contactNumber,
          category,
          status: 'pending', // New shops are pending until admin approval
          isVerified: false
        }, email);
      } else {
        // Do not overwrite existingShop.ownerId if it belongs to another owner/legacy ID
        onLoginSuccess({ ...existingShop }, email);
      }
      onClose();
    } catch (err: any) {
      console.warn('Firebase Google Auth popup notice:', err?.code || err?.message);
      const fbUser = await ensureAuthSession(true);
      const uid = fbUser?.uid;
      if (!uid) {
        alert('Authentication session required. Please try again.');
        return;
      }
      const fallbackEmail = fbUser?.email || 'merchant@torshabazaar.in';
      if (isRegisterMode) {
        onLoginSuccess({
          id: `shop-${Date.now()}`,
          ownerId: uid,
          name: shopName.trim() || 'My Torsa Shop',
          locality,
          contactNumber,
          category,
          status: 'pending',
          isVerified: false
        }, fallbackEmail);
      } else {
        onLoginSuccess({ ...existingShop }, fallbackEmail);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDemoLogin = async () => {
    setLoading(true);
    try {
      const fbUser = await ensureAuthSession(true);
      const uid = fbUser?.uid;
      if (!uid) {
        alert('Unable to establish Firebase Auth session.');
        return;
      }
      const merchantEmail = fbUser?.email || existingShop.ownerEmail || 'merchant@torshabazaar.in';
      if (isRegisterMode) {
        if (!shopName.trim()) {
          alert('Please enter your shop name');
          return;
        }
        onLoginSuccess({
          id: `shop-${Date.now()}`,
          ownerId: uid,
          name: shopName.trim(),
          locality,
          contactNumber,
          category,
          status: 'pending', // Enforces rule: newly registered shop starts as Pending
          isVerified: false
        }, merchantEmail);
      } else {
        // Preserve existingShop.ownerId intact; Firestore writes remain gated by ownerId == uid
        onLoginSuccess({ ...existingShop }, merchantEmail);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#0E7438]" />
            <h3 className="text-base font-bold text-gray-900">
              {isRegisterMode ? 'Register New Shop' : 'Shopkeeper Login'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900">
          <span className="font-bold block">Torsa Bazaar Merchant Portal</span>
          <span>Access your live orders, manage inventory, and view sales statistics.</span>
        </div>

        {isRegisterMode ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Shop / Business Name</label>
              <input
                type="text"
                placeholder="e.g. Kalchini Fresh Fruits"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Locality in Dooars</label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold text-gray-900"
              >
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name} ({loc.pincode}) - {loc.parentArea} Area
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
              />
            </div>

            <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg">
              * Note: New registrations start with <strong>Pending</strong> status and require marketplace approval before products become public.
            </p>

            <button
              onClick={handleDirectDemoLogin}
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-xs"
            >
              Submit & Open Shopkeeper Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Existing Shop Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                Registered Merchant
              </span>
              <h4 className="text-sm font-bold text-gray-900">{existingShop.name}</h4>
              <p className="text-xs text-gray-500">{existingShop.locality} • {existingShop.contactNumber}</p>
            </div>

            {/* Quick Login button */}
            <button
              onClick={handleDirectDemoLogin}
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-yellow-300" />
              <span>Login as {existingShop.name.split(' ')[0]} Shopkeeper</span>
            </button>

            {/* Google Sign-in */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Toggle between Login and Register Mode */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs font-semibold text-[#0E7438] hover:underline"
          >
            {isRegisterMode
              ? 'Already registered? Login to existing shop'
              : 'Register a new shop in Kalchini'}
          </button>
        </div>
      </div>
    </div>
  );
};
