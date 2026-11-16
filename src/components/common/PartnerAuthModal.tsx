import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  resolvePartnerLoginEmail
} from '../../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { PartnerAccount, PartnerRoleType } from '../../types';

export const PARTNER_ROLE_LABELS: Record<PartnerRoleType, string> = {
  shopkeeper: 'Shopkeeper Merchant',
  driver: 'Ride Driver (Taxi / Auto / Toto)',
  delivery: 'Delivery Fleet Rider',
  doctor: 'Doctor Partner',
  service_provider: 'Service Provider (Business Partner)',
  employer: 'Employer / Recruiter (Business Partner)',
  kabari: 'Kabari / Scrap Buyer (Business Partner)'
};

interface PartnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedRole?: PartnerRoleType | null;
  onLoginSuccess: (account: PartnerAccount) => void;
  onOpenAdminLogin?: () => void;
}

export const PartnerAuthModal: React.FC<PartnerAuthModalProps> = ({
  isOpen,
  onClose,
  expectedRole = null,
  onLoginSuccess,
  onOpenAdminLogin
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const roleTitle = expectedRole ? PARTNER_ROLE_LABELS[expectedRole] : 'Authorized Partner';

  const getFriendlyAuthError = (err: any): string => {
    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid partner email/mobile or password. Please check your Admin-issued credentials.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error while verifying credentials. Please check your internet connection.';
    }
    return err?.message || 'Unable to authenticate partner credentials.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!identifier.trim()) {
      setError('Enter your Admin-issued email address or 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      const loginEmail = await resolvePartnerLoginEmail(identifier);
      const cred = await signInWithEmailAndPassword(auth, loginEmail, password);
      const snap = await getDoc(doc(db, 'partnerAccounts', cred.user.uid));
      const account: PartnerAccount | null = snap.exists()
        ? ({ uid: snap.id, ...snap.data() } as PartnerAccount)
        : null;

      if (!account) {
        await signOut(auth).catch(() => {});
        setError(
          'Access denied: No partner role is assigned to this account. Only Super Admin can issue partner credentials.'
        );
        return;
      }

      if (account.status !== 'active') {
        await signOut(auth).catch(() => {});
        setError('Access suspended: Your partner account has been suspended by Super Admin.');
        return;
      }

      if (expectedRole && account.role !== expectedRole) {
        await signOut(auth).catch(() => {});
        setError(
          `Role mismatch: These credentials are assigned to "${PARTNER_ROLE_LABELS[account.role]}", not "${PARTNER_ROLE_LABELS[expectedRole]}".`
        );
        return;
      }

      setPassword('');
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.endsWith('@login.torshabazaar.in')) {
      setError(
        'Password reset emails can only be sent to a real Admin-issued email address. For mobile-only credentials, contact Super Admin.'
      );
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setInfoMsg(`If an active account exists for ${trimmed}, a Firebase password reset link has been sent.`);
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {roleTitle} Sign In
              </h2>
              <p className="text-[11px] text-emerald-200 truncate">
                Admin-Issued Credentials Required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* No Self-Registration Policy Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Restricted Portal:</strong> Public self-registration is disabled for Shopkeeper, Rider, Driver, Doctor, and Business Partner roles. Sign in only with credentials issued by the Super Admin.
            </span>
          </div>

          {!isResetMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admin-Issued Email or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="partner@domain.com or 10-digit mobile"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter issued password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying Role Credentials...' : 'Sign In to Assigned Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setInfoMsg('');
                    setIsResetMode(true);
                  }}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
                {onOpenAdminLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminLogin();
                    }}
                    className="text-slate-500 hover:text-purple-700 font-semibold"
                  >
                    Super Admin Login
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admin-Issued Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered partner email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {infoMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                    setInfoMsg('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#0E7438] hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
