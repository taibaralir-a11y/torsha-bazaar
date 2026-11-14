import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Compass,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { auth, db } from '../../firebase';
import { normalizePhoneE164, phonesMatchNormalized } from '../../utils/phone';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterCustomer: (newUser: UserProfile) => Promise<void> | void;
  localities?: LocalityInfo[];
  externalError?: string;
  onClearExternalError?: () => void;
  initialStep?: 'login' | 'register' | 'forgot' | 'complete_profile';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatFirebaseAuthError(err: any, fallback: string): string {
  const code: string = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This customer account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please use Customer Login (Email & Password or Google) instead.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Please sign in with your original method.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose at least 6 characters.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return `This sign-in provider is currently disabled in Firebase Console (${code}). Enable it under Firebase Authentication → Sign-in method or continue with Google.`;
    case 'auth/billing-not-enabled':
      return 'Live SMS OTP requires upgrading this Firebase project to the Blaze plan. For Spark testing, configure a Firebase Test Phone Number in Console or sign in with Google / Email.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid 10-digit Indian mobile number or E.164 number (e.g. +919832012345).';
    case 'auth/missing-phone-number':
      return 'Please enter your mobile number.';
    case 'auth/invalid-verification-code':
      return 'Incorrect 6-digit OTP code. Please verify and try again.';
    case 'auth/code-expired':
      return 'This OTP code has expired. Please request a new OTP.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA check failed. Please retry sending the OTP.';
    case 'auth/too-many-requests':
      return 'Too many verification attempts. Please wait a few minutes before retrying.';
    case 'auth/quota-exceeded':
      return 'Firebase SMS quota exceeded for this project. Please try again later or sign in with Google / Email.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Browser blocked the Google sign-in popup. Please allow popups and retry.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase Authentication. Please check your connection and retry.';
    default:
      return `${err?.message || fallback}${code ? ` (${code})` : ''}`;
  }
}

function buildAuthFlagsFromFirebaseUser(fbUser: FirebaseUser, phone: string) {
  const normalizedPhone = normalizePhoneE164(phone) || phone.trim();
  const hasExactPhoneMatch = phonesMatchNormalized(fbUser.phoneNumber, normalizedPhone);
  const isPhoneVerified = hasExactPhoneMatch;
  const isVerified = Boolean(isPhoneVerified || fbUser.emailVerified);
  const isGoogle = fbUser.providerData?.some((p) => p.providerId === 'google.com');
  const authMethod: UserProfile['authMethod'] = hasExactPhoneMatch
    ? 'phone'
    : fbUser.email
      ? (isGoogle ? 'google' : 'email')
      : (fbUser.isAnonymous ? 'anonymous' : 'none');

  return {
    isSessionAuthenticated: true,
    isPhoneVerified,
    isVerified,
    authMethod
  };
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onRegisterCustomer,
  localities = INITIAL_SERVICE_LOCALITIES,
  externalError = '',
  onClearExternalError,
  initialStep = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(
    initialStep === 'complete_profile' ? 'register' : initialStep
  );
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');

  // Login (Email & Password)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Phone OTP shared state
  const [otpPhoneInput, setOtpPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState('');

  // Shared Error & Loading States
  const [loginError, setLoginError] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile completion mode (after Google/Email first-time login or Phone OTP verification)
  const [pendingProfileAuthMode, setPendingProfileAuthMode] = useState<'phone' | 'google' | 'email' | null>(null);

  // Profile / Registration fields
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

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const clearRecaptcha = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // ignore cleanup failures
    }
    recaptchaVerifierRef.current = null;
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = '';
    }
  };

  // Sync external redirect errors or complete_profile prompt on open
  useEffect(() => {
    if (!isOpen) {
      clearRecaptcha();
      confirmationResultRef.current = null;
      return;
    }

    if (externalError) {
      setLoginError(externalError);
      setRegError(externalError);
    }

    if (initialStep === 'complete_profile' && auth.currentUser) {
      const fbUser = auth.currentUser;
      setActiveTab('register');
      setPendingProfileAuthMode(
        fbUser.providerData?.some((p) => p.providerId === 'google.com')
          ? 'google'
          : fbUser.phoneNumber
            ? 'phone'
            : 'email'
      );
      setName(fbUser.displayName || '');
      setEmail(fbUser.email || '');
      if (fbUser.phoneNumber) {
        setVerifiedPhoneE164(fbUser.phoneNumber);
        setPhone(fbUser.phoneNumber);
      }
    } else if (initialStep !== 'complete_profile') {
      setActiveTab(initialStep);
    }
  }, [isOpen, externalError, initialStep]);

  // Resend OTP 60s countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  if (!isOpen) return null;

  const isTopLevelWindow = (() => {
    try {
      return window.self === window.top;
    } catch {
      return false;
    }
  })();

  const clearErrors = () => {
    setLoginError('');
    setRegError('');
    setForgotError('');
    onClearExternalError?.();
  };

  const handleLocalityChange = (locName: string) => {
    setSelectedLocality(locName);
    const found = localities.find((l) => l.name.toLowerCase() === locName.toLowerCase());
    if (found) {
      setPincode(found.pincode);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setRegError('Geolocation is not supported by your browser.');
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
        setRegError('Could not retrieve GPS coordinates. You can proceed with manual locality selection.');
      },
      { timeout: 8000 }
    );
  };

  const loadExistingCustomerDoc = async (uid: string): Promise<Partial<UserProfile> | null> => {
    try {
      const snap = await getDoc(doc(db, 'customers', uid));
      return snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
    } catch (err) {
      console.warn('Customer profile lookup notice:', (err as Error)?.message);
      return null;
    }
  };

  const finalizeAuthenticatedLogin = (fbUser: FirebaseUser, remoteDoc: Partial<UserProfile>) => {
    const effectivePhone = normalizePhoneE164(remoteDoc.phone || fbUser.phoneNumber || '') || remoteDoc.phone || fbUser.phoneNumber || '';
    const flags = buildAuthFlagsFromFirebaseUser(fbUser, effectivePhone);
    const mergedUser: UserProfile = {
      ...currentUser,
      ...remoteDoc,
      id: fbUser.uid,
      userId: fbUser.uid,
      name: remoteDoc.name || fbUser.displayName || 'Customer',
      phone: effectivePhone,
      email: remoteDoc.email || fbUser.email || '',
      location: remoteDoc.location || currentUser.location || 'Satali',
      pincode: remoteDoc.pincode || currentUser.pincode || '735214',
      address: remoteDoc.address || '',
      language: remoteDoc.language || currentUser.language || 'en',
      ...flags
    };
    try {
      sessionStorage.removeItem('tb_explicit_logout');
    } catch {
      // ignore
    }
    onLoginSuccess(mergedUser);
    onClose();
  };

  const enterProfileCompletionForUser = (
    fbUser: FirebaseUser,
    mode: 'phone' | 'google' | 'email',
    remoteDoc: Partial<UserProfile> | null
  ) => {
    setPendingProfileAuthMode(mode);
    setActiveTab('register');
    setRegSuccess(false);
    setName(remoteDoc?.name || fbUser.displayName || '');
    setEmail(remoteDoc?.email || fbUser.email || '');
    const existingPhone = remoteDoc?.phone || fbUser.phoneNumber || '';
    const normalized = normalizePhoneE164(existingPhone) || existingPhone;
    setPhone(normalized);
    if (fbUser.phoneNumber) {
      setVerifiedPhoneE164(normalizePhoneE164(fbUser.phoneNumber) || fbUser.phoneNumber);
    }
    if (remoteDoc?.location) setSelectedLocality(remoteDoc.location);
    if (remoteDoc?.pincode) setPincode(remoteDoc.pincode);
    if (remoteDoc?.address) setAddress(remoteDoc.address);
    if (remoteDoc?.state) setStateName(remoteDoc.state);
    if (remoteDoc?.district) setDistrict(remoteDoc.district);
    if (remoteDoc?.block) setBlock(remoteDoc.block);
  };

  // =========================================================
  // 1. GOOGLE SIGN-IN / REGISTRATION
  // =========================================================
  const handleGoogleSignIn = async () => {
    clearErrors();
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const res = await signInWithPopup(auth, provider);
      try {
        sessionStorage.removeItem('tb_explicit_logout');
      } catch {
        // ignore
      }
      const existingDoc = await loadExistingCustomerDoc(res.user.uid);
      if (existingDoc && existingDoc.name && existingDoc.phone) {
        finalizeAuthenticatedLogin(res.user, existingDoc);
      } else {
        enterProfileCompletionForUser(res.user, 'google', existingDoc);
      }
    } catch (err: any) {
      const code = err?.code || '';
      const shouldTryRedirect =
        isTopLevelWindow &&
        (code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/web-storage-unsupported');

      if (shouldTryRedirect) {
        try {
          sessionStorage.removeItem('tb_explicit_logout');
          sessionStorage.setItem('tb_customer_google_pending', 'true');
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          const msg = formatFirebaseAuthError(redirectErr, 'Google redirect sign-in failed.');
          setLoginError(msg);
          setRegError(msg);
          setIsGoogleLoading(false);
          return;
        }
      }

      const msg =
        !isTopLevelWindow && (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment')
          ? 'Sign-in popup was blocked inside this embedded frame. Please allow popups or open TORSHA BAZAAR in a standalone browser tab.'
          : formatFirebaseAuthError(err, 'Unable to sign in with Google.');
      setLoginError(msg);
      setRegError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // =========================================================
  // 2. PHONE OTP SEND & VERIFY (LOGIN & REGISTRATION)
  // =========================================================
  const handleSendOtp = async (targetContext: 'login' | 'register') => {
    clearErrors();
    const normalized = normalizePhoneE164(otpPhoneInput);
    if (!normalized || !/^\+[1-9]\d{7,14}$/.test(normalized)) {
      const msg = 'Enter a valid 10-digit Indian mobile number (e.g. 9832012345) or E.164 number (+919832012345).';
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
      return;
    }

    if (!recaptchaContainerRef.current) {
      const msg = 'reCAPTCHA container not ready. Please close and reopen the sign-in dialog.';
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
      return;
    }

    setIsSendingOtp(true);
    try {
      clearRecaptcha();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          clearRecaptcha();
        }
      });
      recaptchaVerifierRef.current = verifier;

      const confirmationResult = await signInWithPhoneNumber(auth, normalized, verifier);
      confirmationResultRef.current = confirmationResult;
      setOtpSentTo(normalized);
      setOtpCode('');
      setResendCooldown(60);
    } catch (err: any) {
      clearRecaptcha();
      const msg = formatFirebaseAuthError(err, 'Unable to send OTP via Firebase Phone Auth.');
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (targetContext: 'login' | 'register') => {
    clearErrors();
    if (!confirmationResultRef.current) {
      const msg = 'Please request a verification OTP first.';
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
      return;
    }
    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      const msg = 'Please enter the 6-digit numeric OTP.';
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const cred = await confirmationResultRef.current.confirm(cleanOtp);
      setOtpCode('');
      confirmationResultRef.current = null;
      clearRecaptcha();
      try {
        sessionStorage.removeItem('tb_explicit_logout');
      } catch {
        // ignore
      }

      const verifiedPhone = normalizePhoneE164(cred.user.phoneNumber || otpSentTo) || cred.user.phoneNumber || otpSentTo;
      setVerifiedPhoneE164(verifiedPhone);
      setPhone(verifiedPhone);

      const existingDoc = await loadExistingCustomerDoc(cred.user.uid);
      if (targetContext === 'login' && existingDoc && existingDoc.name && existingDoc.phone) {
        finalizeAuthenticatedLogin(cred.user, existingDoc);
        return;
      }

      enterProfileCompletionForUser(cred.user, 'phone', existingDoc);
    } catch (err: any) {
      const msg = formatFirebaseAuthError(err, 'Failed to verify OTP code.');
      targetContext === 'login' ? setLoginError(msg) : setRegError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // =========================================================
  // 3. EMAIL & PASSWORD LOGIN
  // =========================================================
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const cleanEmail = loginEmail.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);
      setLoginPassword('');
      try {
        sessionStorage.removeItem('tb_explicit_logout');
      } catch {
        // ignore
      }
      const existingDoc = await loadExistingCustomerDoc(cred.user.uid);
      if (existingDoc && existingDoc.name && existingDoc.phone) {
        finalizeAuthenticatedLogin(cred.user, existingDoc);
      } else {
        enterProfileCompletionForUser(cred.user, 'email', existingDoc);
      }
    } catch (err: any) {
      setLoginError(formatFirebaseAuthError(err, 'Unable to sign in with email and password.'));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // =========================================================
  // 4. EMAIL & PASSWORD REGISTRATION
  // =========================================================
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const normalizedPhone = normalizePhoneE164(phone);

    if (!cleanName || cleanName.length < 2) {
      setRegError('Full Name is required (at least 2 characters).');
      return;
    }
    if (!normalizedPhone || !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setRegError('Please enter a valid 10-digit Indian mobile number or E.164 phone number.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      setPassword('');
      try {
        sessionStorage.removeItem('tb_explicit_logout');
      } catch {
        // ignore
      }

      await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
      await sendEmailVerification(cred.user).catch(() => {});

      const existingDoc = await loadExistingCustomerDoc(cred.user.uid);
      const flags = buildAuthFlagsFromFirebaseUser(cred.user, normalizedPhone);

      const newUser: UserProfile = {
        ...(existingDoc || {}),
        id: cred.user.uid,
        userId: cred.user.uid,
        name: cleanName,
        phone: normalizedPhone,
        email: cred.user.email || cleanEmail,
        location: selectedLocality,
        pincode: pincode.trim() || '735214',
        address: address.trim() || `${selectedLocality}, ${block}, ${district}`,
        state: stateName.trim() || 'West Bengal',
        district: district.trim() || 'Alipurduar',
        block: block.trim() || 'Kalchini',
        ...(gpsCoords ? { gpsCoordinates: gpsCoords } : {}),
        language: existingDoc?.language || 'English',
        ...flags
      };

      await onRegisterCustomer(newUser);
      setRegSuccessMessage(
        `Your Email account is created for ${selectedLocality} (PIN ${newUser.pincode}). A verification email has been sent to ${newUser.email}.`
      );
      setRegSuccess(true);
    } catch (err: any) {
      setRegError(formatFirebaseAuthError(err, 'Unable to create customer account.'));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // =========================================================
  // 5. SAVE PROFILE AFTER OTP / GOOGLE / EMAIL AUTH
  // =========================================================
  const handleSaveCompletedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const fbUser = auth.currentUser;
    if (!fbUser) {
      setRegError('Authentication session expired. Please sign in again.');
      setPendingProfileAuthMode(null);
      return;
    }

    const cleanName = name.trim();
    const effectiveRawPhone = pendingProfileAuthMode === 'phone' && verifiedPhoneE164 ? verifiedPhoneE164 : phone;
    const normalizedPhone = normalizePhoneE164(effectiveRawPhone);

    if (!cleanName || cleanName.length < 2) {
      setRegError('Full Name is required.');
      return;
    }
    if (!normalizedPhone || !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setRegError('Please enter a valid 10-digit Indian mobile number or E.164 phone number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (!fbUser.displayName && cleanName) {
        await updateProfile(fbUser, { displayName: cleanName }).catch(() => {});
      }

      const existingDoc = await loadExistingCustomerDoc(fbUser.uid);
      const flags = buildAuthFlagsFromFirebaseUser(fbUser, normalizedPhone);

      const profileToSave: UserProfile = {
        ...(existingDoc || {}),
        id: fbUser.uid,
        userId: fbUser.uid,
        name: cleanName,
        phone: normalizedPhone,
        email: email.trim() || fbUser.email || existingDoc?.email || '',
        location: selectedLocality,
        pincode: pincode.trim() || '735214',
        address: address.trim() || existingDoc?.address || `${selectedLocality}, ${block}, ${district}`,
        state: stateName.trim() || 'West Bengal',
        district: district.trim() || 'Alipurduar',
        block: block.trim() || 'Kalchini',
        ...(gpsCoords ? { gpsCoordinates: gpsCoords } : {}),
        language: existingDoc?.language || 'English',
        ...flags
      };

      await onRegisterCustomer(profileToSave);
      setPendingProfileAuthMode(null);
      setRegSuccessMessage(
        flags.isPhoneVerified
          ? `Your Mobile OTP verified profile is saved for ${selectedLocality} (PIN ${profileToSave.pincode}).`
          : `Your verified account profile is saved for ${selectedLocality} (PIN ${profileToSave.pincode}).`
      );
      setRegSuccess(true);
    } catch (err: any) {
      setRegError(formatFirebaseAuthError(err, 'Unable to save customer profile to Firestore.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =========================================================
  // 6. FORGOT PASSWORD (REAL FIREBASE EMAIL RESET)
  // =========================================================
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const cleanEmail = forgotEmail.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setForgotError('Please enter the registered email address associated with your Email & Password account.');
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(formatFirebaseAuthError(err, 'Unable to send password reset email.'));
    } finally {
      setIsSendingReset(false);
    }
  };

  const resetOtpFlow = () => {
    setOtpSentTo('');
    setOtpCode('');
    setResendCooldown(0);
    confirmationResultRef.current = null;
    clearRecaptcha();
    clearErrors();
  };

  const isBusy = isSendingOtp || isVerifyingOtp || isEmailSubmitting || isGoogleLoading || isSavingProfile || isSendingReset;

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
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setPendingProfileAuthMode(null);
              setRegSuccess(false);
              setForgotSuccess(false);
              resetOtpFlow();
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setPendingProfileAuthMode(null);
              setRegSuccess(false);
              setForgotSuccess(false);
              resetOtpFlow();
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot');
              setPendingProfileAuthMode(null);
              setRegSuccess(false);
              setForgotSuccess(false);
              clearErrors();
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'forgot'
                ? 'border-[#0E7438] text-[#0E7438] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Forgot Password
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
          {/* Persistent invisible reCAPTCHA container for Firebase Phone Auth */}
          <div ref={recaptchaContainerRef} id="customer-recaptcha-container" />

          {/* ===================================================== */}
          {/* TAB 1: CUSTOMER LOGIN                                 */}
          {/* ===================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Option 3: Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-[10px] uppercase font-bold text-slate-400">or sign in with</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Method Toggle: Mobile OTP vs Email & Password */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('phone'); resetOtpFlow(); }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    loginMethod === 'phone' ? 'bg-white text-[#0E7438] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('email'); clearErrors(); }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    loginMethod === 'email' ? 'bg-white text-[#0E7438] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
              </div>

              {/* Option 1: Mobile Number + Firebase Phone OTP */}
              {loginMethod === 'phone' && (
                <div className="space-y-3">
                  {!otpSentTo ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            placeholder="10-digit mobile (e.g. 9832012345)"
                            value={otpPhoneInput}
                            onChange={(e) => setOtpPhoneInput(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                        <strong>Phone OTP Note:</strong> Live SMS delivery requires Firebase Phone Auth & Blaze plan (10 free SMS/day on Blaze). For Spark testing, configure Firebase Test Phone Numbers in Console.
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendOtp('login')}
                        disabled={isBusy}
                        className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{isSendingOtp ? 'Sending OTP...' : 'Send Firebase OTP'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                        <span>OTP sent to <strong>{otpSentTo}</strong></span>
                        <button
                          type="button"
                          onClick={resetOtpFlow}
                          className="text-[11px] font-bold text-[#0E7438] hover:underline shrink-0"
                        >
                          Change Number
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Enter 6-Digit Verification OTP
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl tracking-widest font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleSendOtp('login')}
                          disabled={resendCooldown > 0 || isBusy}
                          className="text-xs font-semibold text-[#0E7438] disabled:text-slate-400 flex items-center gap-1 hover:underline"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyOtp('login')}
                        disabled={isBusy}
                        className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Option 2: Email Address + Password */}
              {loginMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setActiveTab('forgot');
                          clearErrors();
                        }}
                        className="text-[11px] font-semibold text-[#0E7438] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
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

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{isEmailSubmitting ? 'Signing In...' : 'Sign In with Email'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    resetOtpFlow();
                  }}
                  className="text-xs font-semibold text-[#0E7438] hover:underline"
                >
                  New to TORSHA BAZAAR? Create your customer account
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: NEW REGISTRATION / COMPLETE PROFILE            */}
          {/* ===================================================== */}
          {activeTab === 'register' && (
            <div>
              {regSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0E7438] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Profile Saved!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Welcome to TORSHA BAZAAR, <strong>{name || 'Customer'}</strong>! {regSuccessMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setRegSuccess(false); onClose(); }}
                    className="mt-2 px-4 py-2 bg-[#0E7438] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : pendingProfileAuthMode ? (
                /* Step 2 after Mobile OTP verification, Google Sign-In, or incomplete Email Sign-In */
                <form onSubmit={handleSaveCompletedProfile} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#0E7438] mt-0.5" />
                    <span>
                      {pendingProfileAuthMode === 'phone'
                        ? `Mobile ${verifiedPhoneE164 || phone} verified via OTP! Complete your locality profile below.`
                        : pendingProfileAuthMode === 'google'
                          ? `Signed in with Google (${email}). Please add your delivery phone and locality to complete your profile.`
                          : 'Please complete your delivery phone and locality details.'}
                    </span>
                  </div>

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
                        readOnly={pendingProfileAuthMode === 'phone' && Boolean(verifiedPhoneE164)}
                        placeholder="9832012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full text-xs p-2.5 border border-slate-300 rounded-xl ${
                          pendingProfileAuthMode === 'phone' && verifiedPhoneE164 ? 'bg-slate-100 font-semibold' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Email Address {pendingProfileAuthMode === 'google' ? '' : '(Optional)'}
                      </label>
                      <input
                        type="email"
                        readOnly={pendingProfileAuthMode === 'google' && Boolean(email)}
                        placeholder="user@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full text-xs p-2.5 border border-slate-300 rounded-xl ${
                          pendingProfileAuthMode === 'google' && email ? 'bg-slate-100' : ''
                        }`}
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
                        required
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

                  {regError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingProfileAuthMode(null);
                        clearErrors();
                      }}
                      className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="flex-1 py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      {isSavingProfile ? 'Saving Profile...' : 'Save Customer Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Option 3: Continue with Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isBusy}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-[10px] uppercase font-bold text-slate-400">or register using</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>

                  {/* Registration Method Toggle */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setRegisterMethod('phone'); resetOtpFlow(); }}
                      className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        registerMethod === 'phone' ? 'bg-white text-[#0E7438] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Mobile OTP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRegisterMethod('email'); clearErrors(); }}
                      className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        registerMethod === 'email' ? 'bg-white text-[#0E7438] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email & Password</span>
                    </button>
                  </div>

                  {/* Mobile Registration: Verify OTP first, then create/update profile */}
                  {registerMethod === 'phone' && (
                    <div className="space-y-3">
                      {!otpSentTo ? (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Mobile Number *
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                              <input
                                type="tel"
                                placeholder="e.g. 9832012345"
                                value={otpPhoneInput}
                                onChange={(e) => setOtpPhoneInput(e.target.value)}
                                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                            <strong>Step 1 of 2:</strong> Verify your mobile number via Firebase Phone OTP, then complete your delivery profile. (Live SMS requires Blaze plan; test numbers work on Spark.)
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSendOtp('register')}
                            disabled={isBusy}
                            className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <span>{isSendingOtp ? 'Sending Verification OTP...' : 'Send Verification OTP'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                            <span>OTP sent to <strong>{otpSentTo}</strong></span>
                            <button
                              type="button"
                              onClick={resetOtpFlow}
                              className="text-[11px] font-bold text-[#0E7438] hover:underline shrink-0"
                            >
                              Change Number
                            </button>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Enter 6-Digit OTP *
                            </label>
                            <div className="relative">
                              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6-digit OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl tracking-widest font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSendOtp('register')}
                              disabled={resendCooldown > 0 || isBusy}
                              className="text-xs font-semibold text-[#0E7438] disabled:text-slate-400 flex items-center gap-1 hover:underline"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>
                                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVerifyOtp('register')}
                            disabled={isBusy}
                            className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Continue'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {regError && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{regError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Registration: createUserWithEmailAndPassword */}
                  {registerMethod === 'email' && (
                    <form onSubmit={handleEmailRegister} className="space-y-3">
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
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
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
                            required
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
                          minLength={6}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>

                      {regError && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{regError}</span>
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="w-full py-2.5 px-4 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          {isEmailSubmitting ? 'Creating Account...' : 'Create Account & Register'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 3: FORGOT PASSWORD (EMAIL RESET)                  */}
          {/* ===================================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#0E7438] mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Password Reset Email Sent</h3>
                  <p className="text-xs text-slate-600">
                    If an Email & Password account exists for <strong>{forgotEmail}</strong>, Firebase has sent a reset link. Check your inbox and spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSuccess(false);
                      setActiveTab('login');
                      setLoginMethod('email');
                    }}
                    className="mt-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Back to Email Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Enter the email address registered with your Email & Password customer account to receive a Firebase password reset link. Mobile OTP accounts do not require a password.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 bg-[#0E7438] hover:bg-[#0c6330] disabled:opacity-60 text-white font-semibold text-xs rounded-xl"
                  >
                    {isSendingReset ? 'Sending Reset Link...' : 'Send Password Reset Email'}
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

