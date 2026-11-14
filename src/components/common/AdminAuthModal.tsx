import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../../firebase';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
  allowedEmail?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  allowedEmail = 'taibaralir@gmail.com'
}) => {
  const [email, setEmail] = useState(allowedEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [isSigningInWithEmail, setIsSigningInWithEmail] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAdminLogin = async () => {
    setError('');
    setIsSigningInWithGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: allowedEmail });
      const res = await signInWithPopup(auth, provider);
      const userEmail = res.user.email?.toLowerCase();
      if (userEmail === allowedEmail.toLowerCase() && res.user.emailVerified) {
        onLoginSuccess(allowedEmail);
        onClose();
      } else {
        await signOut(auth).catch(() => {});
        setError(`Access denied. Account ${res.user.email || 'unknown'} is not verified as the authorized Super Admin (${allowedEmail}).`);
      }
    } catch (err: any) {
      console.warn('Google auth notice:', err);
      setError(err?.message?.includes('popup-closed') 
        ? 'Sign-in window closed. Please complete Google Sign-In as the authorized admin.' 
        : `Google Auth verification failed: ${err?.message || 'Unauthorized'}`);
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.trim().toLowerCase() !== allowedEmail.toLowerCase()) {
      setError(`Access denied. Super Admin access is strictly restricted to ${allowedEmail}. Public admin registration is disabled.`);
      return;
    }

    if (!password.trim()) {
      setError('Please enter your Firebase Admin password.');
      return;
    }

    setIsSigningInWithEmail(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authedEmail = cred.user.email?.toLowerCase();
      if (authedEmail !== allowedEmail.toLowerCase() || !cred.user.emailVerified) {
        await signOut(auth).catch(() => {});
        setError(`Access denied. Email verification is required for Super Admin (${allowedEmail}).`);
        return;
      }
      setPassword('');
      onLoginSuccess(allowedEmail);
      onClose();
    } catch (err: any) {
      console.warn('Firebase Admin Auth failed:', err?.code || err?.message);
      setError('Invalid admin credentials or Email/Password sign-in not enabled. Please use "Sign in with Google" above.');
    } finally {
      setIsSigningInWithEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Super Admin Verification</h2>
              <p className="text-xs text-purple-200">TORSHA BAZAAR Master Control Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-xs text-purple-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-purple-700 mt-0.5" />
            <span>
              <strong>Cryptographic Auth:</strong> Sign in with verified Firebase Authentication as <code>{allowedEmail}</code>. Public registration is disabled.
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isSigningInWithGoogle}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isSigningInWithGoogle ? 'Verifying with Google...' : 'Sign in with Google (Firebase Token)'}</span>
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="text-[10px] uppercase font-bold text-slate-400">or Firebase email auth</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Authorized Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Firebase Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Enter Firebase password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSigningInWithEmail}
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>{isSigningInWithEmail ? 'Authenticating...' : 'Unlock Admin Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
