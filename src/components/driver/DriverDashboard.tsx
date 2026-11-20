import React, { useState } from 'react';
import { 
  Car, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Power, 
  ShieldCheck, 
  AlertCircle, 
  Navigation, 
  ArrowLeft,
  User,
  Star,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Send,
  Check,
  X,
  MessageSquare,
  LogOut,
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  WifiOff,
  Lock
} from 'lucide-react';
import {
  Driver,
  PartnerAccount,
  RideBooking,
  RideStatus,
  ShopApprovalStatus,
  UniversalRoutingConfig,
  VehicleType,
  FareOffer
} from '../../types';
import {
  getActionableRidesForDriver,
  getRideRemainingSeconds,
  isDriverEligibleForPendingRide,
  isRideOfferExpired,
  normalizeRideStatus,
  validateCounterOfferAmount
} from '../../utils/rideLifecycle';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface DriverActionResult {
  ok: boolean;
  backendRequired?: boolean;
  error?: string;
}

interface DriverDashboardProps {
  driver: Driver;
  rideBookings: RideBooking[];
  routingConfig?: UniversalRoutingConfig;
  partnerAccounts?: PartnerAccount[];
  onSwitchPortal: () => void;
  onUpdateDriver: (updated: Partial<Driver>) => void;
  onUpdateRideStatus: (rideId: string, status: RideStatus) => Promise<DriverActionResult | void> | void;
  onAcceptRide: (
    rideId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    vehicleNumber: string,
    agreedFare?: number
  ) => Promise<DriverActionResult | void> | void;
  onDriverCounterOffer?: (
    rideId: string,
    driver: Driver,
    counterAmount: number,
    note?: string
  ) => Promise<DriverActionResult | void> | void;
  onDriverRejectRide?: (rideId: string, driverId: string) => Promise<DriverActionResult | void> | void;
  onExpireRide?: (rideId: string) => Promise<DriverActionResult | void> | void;
  focusedRideId?: string | null;
  alertAudioStatus?: {
    muted: boolean;
    snoozed: boolean;
    snoozeRemainingSec: number;
    activeCount: number;
    isRinging: boolean;
    unlocked: boolean;
  };
  onToggleAlertMute?: () => void;
  onSnoozeAlerts?: (durationMs?: number) => void;
  onUnlockAndTestAudio?: () => Promise<boolean> | void;
  onEnablePushNotifications?: () => Promise<void> | void;
  notificationPermission?: 'granted' | 'denied' | 'default' | 'unsupported';
  isOnlineNetwork?: boolean;
  onLogout?: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driver,
  rideBookings,
  routingConfig,
  partnerAccounts = [],
  onSwitchPortal,
  onUpdateDriver,
  onUpdateRideStatus,
  onAcceptRide,
  onDriverCounterOffer,
  onDriverRejectRide,
  onExpireRide,
  focusedRideId,
  alertAudioStatus,
  onToggleAlertMute,
  onSnoozeAlerts,
  onUnlockAndTestAudio,
  onEnablePushNotifications,
  notificationPermission = 'default',
  isOnlineNetwork = true,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'rides' | 'active' | 'history' | 'profile'>('rides');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(driver.name);
  const [editPhone, setEditPhone] = useState(driver.phone);
  const [editVehicleType, setEditVehicleType] = useState<VehicleType>(driver.vehicleType);
  const [editVehicleNumber, setEditVehicleNumber] = useState(driver.vehicleNumber);
  const [editLocality, setEditLocality] = useState(driver.locality);

  // Counter offer modal state
  const [counterModalRide, setCounterModalRide] = useState<RideBooking | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(50);
  const [counterNote, setCounterNote] = useState<string>('');

  // Local rejected rides tracking for this driver session
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [confirmCancelRideId, setConfirmCancelRideId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const prevAvailableSignatureRef = React.useRef<string>('');

  const effectiveRoutingConfig: UniversalRoutingConfig = routingConfig || {
    globalCrossLocalityEnabled: false,
    updatedAt: '',
    rulesByLocality: {}
  };

  // Available rides strictly filtered by Admin locality routing, online status, approval, vehicle type & active expiry
  const availableRides = getActionableRidesForDriver({
    rides: rideBookings,
    driver,
    routingConfig: effectiveRoutingConfig,
    partnerAccounts,
    localities: INITIAL_SERVICE_LOCALITIES,
    localRejectedIds: new Set(rejectedRideIds),
    nowMs
  });

  // Active ride currently confirmed or assigned to this driver
  const currentAssignedRide = rideBookings.find(
    (r) =>
      r.driverId === driver.id &&
      ['CONFIRMED', 'PICKUP', 'IN_PROGRESS'].includes(normalizeRideStatus(r.status))
  );

  // Live 1s countdown tick while pending rides exist + expiry trigger
  React.useEffect(() => {
    if (availableRides.length === 0) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNowMs(t);
      if (onExpireRide) {
        availableRides.forEach((ride) => {
          if (isRideOfferExpired(ride, t)) {
            onExpireRide(ride.id);
          }
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [availableRides.length, onExpireRide]);

  // Auto-navigate to relevant tab on new actionable ride or notification deep link
  React.useEffect(() => {
    if (focusedRideId) {
      if (currentAssignedRide?.id === focusedRideId) {
        setActiveTab('active');
        return;
      }
      if (availableRides.some((r) => r.id === focusedRideId)) {
        setActiveTab('rides');
        return;
      }
    }
    const sig = availableRides.map((r) => `${r.id}:${r.currentRound || 1}`).sort().join('|');
    if (availableRides.length > 0 && sig !== prevAvailableSignatureRef.current && !currentAssignedRide) {
      setActiveTab('rides');
    }
    prevAvailableSignatureRef.current = sig;
  }, [focusedRideId, availableRides, currentAssignedRide?.id]);

  // Completed or past rides by this driver
  const myCompletedRides = rideBookings.filter(
    (r) => r.driverId === driver.id && 
           ['COMPLETED', 'completed', 'CANCELLED', 'cancelled'].includes(r.status)
  );

  // Earnings calculations
  const totalEarnings = myCompletedRides
    .filter((r) => r.status === 'COMPLETED' || r.status === 'completed')
    .reduce((sum, r) => sum + (r.agreedFare || r.customerProposedFare || r.estimatedFare || 0), 0);

  const isApproved = driver.status === 'approved';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDriver({
      name: editName,
      phone: editPhone,
      vehicleType: editVehicleType,
      vehicleNumber: editVehicleNumber,
      locality: editLocality
    });
    setShowEditModal(false);
  };

  const getVehicleLabel = (type: VehicleType) => {
    switch (type) {
      case 'toto':
        return 'Toto (E-Rickshaw)';
      case 'auto':
        return 'Auto Rickshaw';
      case 'taxi':
        return 'Taxi / Cab (Dzire, Omni, Bolero)';
      default:
        return type;
    }
  };

  // Open Counter Offer Modal with prefilled recommended fare
  const openCounterModal = (ride: RideBooking) => {
    const baseProposed = ride.customerProposedFare || ride.estimatedFare;
    setCounterModalRide(ride);
    setCounterAmount(baseProposed + 10);
    setCounterNote('');
  };

  const handleSendCounterOffer = async () => {
    if (!counterModalRide || isSubmittingAction) return;
    setActionNotice(null);
    const check = validateCounterOfferAmount({
      amount: counterAmount,
      currentRound: (counterModalRide.currentRound || 1) + 1,
      maxRounds: counterModalRide.maxNegotiationRounds || 5
    });
    if (!check.valid) {
      setActionNotice({ type: 'err', text: check.reason || 'Invalid counter offer fare.' });
      return;
    }
    if (onDriverCounterOffer) {
      setIsSubmittingAction(true);
      try {
        const res = await onDriverCounterOffer(
          counterModalRide.id,
          driver,
          check.amount,
          counterNote.trim() || undefined
        );
        if (res && res.ok === false) {
          setActionNotice({
            type: 'err',
            text: res.error || 'Unable to submit counter-offer.'
          });
          setCounterModalRide(null);
          return;
        }
        setActionNotice({
          type: 'ok',
          text: `Counter-offer ₹${check.amount} sent for ride ${counterModalRide.id}.`
        });
      } finally {
        setIsSubmittingAction(false);
      }
    }
    setCounterModalRide(null);
  };

  const handleRejectRide = async (rideId: string) => {
    if (isSubmittingAction) return;
    setActionNotice(null);
    if (onDriverRejectRide) {
      setIsSubmittingAction(true);
      try {
        const res = await onDriverRejectRide(rideId, driver.id);
        if (res && res.ok === false) {
          setActionNotice({
            type: 'err',
            text: res.error || 'Rejecting shared ride requests requires backend Cloud Functions dispatch.'
          });
          return;
        }
      } finally {
        setIsSubmittingAction(false);
      }
    }
    setRejectedRideIds((prev) => [...prev, rideId]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Driver Header */}
      <div className="bg-emerald-800 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchPortal}
              className="p-1.5 bg-emerald-900/60 rounded-lg hover:bg-emerald-900 transition-colors"
              title="Switch Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-wide">TORSA RIDER</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-emerald-100">
                  {driver.vehicleType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-emerald-200">Fare Bidding & Ride Partner Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />
            {/* Online/Offline Toggle */}
            <button
              onClick={() => onUpdateDriver({ isOnline: !driver.isOnline })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                driver.isOnline
                  ? 'bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-300'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {driver.isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 bg-rose-700/80 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Driver Quick Badge */}
        <div className="bg-emerald-900/70 backdrop-blur-xs rounded-xl p-3 flex items-center justify-between border border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-black text-white text-base border-2 border-emerald-400">
              {driver.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-white flex items-center gap-1.5">
                {driver.name}
                <span className="text-xs font-medium text-emerald-300">({driver.vehicleNumber})</span>
              </p>
              <p className="text-xs text-emerald-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {driver.locality}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-300 font-bold text-xs justify-end">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>{driver.rating.toFixed(1)}</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                driver.status === 'approved'
                  ? 'bg-emerald-400 text-emerald-950 font-black'
                  : driver.status === 'pending'
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : 'bg-red-400 text-white font-black'
              }`}
            >
              {driver.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Warning if not approved */}
        {!isApproved && (
          <div className="mt-2 bg-amber-500/20 border border-amber-400/40 rounded-lg p-2 text-[11px] text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Driver account is <strong>{driver.status}</strong>. Admin approval is required before you can accept passenger trips.
            </span>
          </div>
        )}

        {/* Offline Notice */}
        {isApproved && !driver.isOnline && (
          <div className="mt-2 bg-slate-900/40 rounded-lg p-2 text-[11px] text-slate-300 flex items-center justify-between">
            <span>You are currently OFFLINE. Toggle switch to receive new trip requests.</span>
            <button
              onClick={() => onUpdateDriver({ isOnline: true })}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Go Online
            </button>
          </div>
        )}

        {/* Smart Ride Alert & Sound Control Bar */}
        <div className="mt-2.5 bg-emerald-950/70 border border-emerald-700/70 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <BellRing
              className={`w-4 h-4 ${
                alertAudioStatus?.isRinging ? 'text-amber-300 animate-bounce' : 'text-emerald-300'
              }`}
            />
            <div>
              <span className="font-bold text-white block">
                {alertAudioStatus?.isRinging
                  ? `ALERT RINGING • ${availableRides.length} Pending Ride(s)`
                  : alertAudioStatus?.snoozed
                  ? `Alerts Snoozed (${alertAudioStatus.snoozeRemainingSec}s)`
                  : alertAudioStatus?.muted
                  ? 'Ride Alert Sound Muted'
                  : 'Smart Ride Alerts Ready'}
              </span>
              {!isOnlineNetwork && (
                <span className="text-amber-300 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline — Reconnecting automatically
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleAlertMute && (
              <button
                type="button"
                onClick={onToggleAlertMute}
                className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
                  alertAudioStatus?.muted
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {alertAudioStatus?.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{alertAudioStatus?.muted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}
            {onSnoozeAlerts && (
              <button
                type="button"
                onClick={() => onSnoozeAlerts(alertAudioStatus?.snoozed ? 0 : 5 * 60 * 1000)}
                className="px-2 py-1 rounded-lg font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1"
              >
                {alertAudioStatus?.snoozed ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                <span>{alertAudioStatus?.snoozed ? 'Resume' : 'Snooze 5m'}</span>
              </button>
            )}
            {onUnlockAndTestAudio && (
              <button
                type="button"
                onClick={() => onUnlockAndTestAudio()}
                className="px-2 py-1 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-emerald-200"
              >
                {alertAudioStatus?.unlocked ? 'Test Tone' : 'Enable Sound'}
              </button>
            )}
            {onEnablePushNotifications && notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={() => onEnablePushNotifications()}
                className="px-2 py-1 rounded-lg font-bold bg-sky-600 hover:bg-sky-500 text-white"
              >
                Enable Push
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex justify-between">
        <button
          onClick={() => setActiveTab('rides')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'rides'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Car className="w-4 h-4" />
          Trip Requests
          {availableRides.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
              {availableRides.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Active Trip
          {currentAssignedRide && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Earnings ({myCompletedRides.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 flex-1">
        {actionNotice && (
          <div
            className={`rounded-2xl p-3 text-xs font-semibold flex items-start justify-between gap-2 border ${
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
        {/* TAB 1: NEW TRIP REQUESTS & FARE NEGOTIATION */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                Incoming Ride Requests
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  {availableRides.length} available
                </span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">Bidding Active</span>
            </div>

            {availableRides.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Pending Trip Requests</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When local passengers in Kalchini, Torsa, or Hamiltonganj book a {driver.vehicleType.toUpperCase()} with their proposed fare, you can accept or counter offer here.
                </p>
              </div>
            ) : (
              availableRides.map((ride) => {
                const customerFare = ride.customerProposedFare || ride.estimatedFare;
                const guidanceFare = ride.suggestedFare || ride.estimatedFare;
                const hasDriverCountered = ride.activeDriverOffers?.some((o) => o.driverId === driver.id && o.status === 'pending');
                const myPendingOffer = ride.activeDriverOffers?.find((o) => o.driverId === driver.id && o.status === 'pending');
                const remainingSec = getRideRemainingSeconds(ride, nowMs);
                const isFocused = focusedRideId === ride.id;

                return (
                  <div
                    key={ride.id}
                    className={`bg-white rounded-2xl border-2 p-4 shadow-sm hover:shadow-md transition-all space-y-3 ${
                      isFocused ? 'border-amber-500 ring-2 ring-amber-300/60' : 'border-emerald-200'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {ride.id}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                          {ride.vehicleType.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          Round {ride.currentRound || 1}/{ride.maxNegotiationRounds || 5}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {remainingSec}s
                        </span>
                        <span className="text-xs text-gray-500">~{ride.distanceKm || 3.5} km</span>
                      </div>
                    </div>

                    {/* Customer Fare Banner */}
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">Customer Offered Fare</span>
                        <span className="text-2xl font-black text-emerald-800">₹{customerFare}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Guidance Rate</span>
                        <span className="text-xs font-bold text-gray-600">₹{guidanceFare}</span>
                        {customerFare < guidanceFare ? (
                          <span className="text-[10px] text-amber-600 block font-bold">-₹{guidanceFare - customerFare} from guide</span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 block font-bold">Fair price</span>
                        )}
                      </div>
                    </div>

                    {/* Locations (Locality-level only prior to mutual confirmation) */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <div>
                          <span className="text-gray-400 font-medium">Pickup Area:</span>
                          <p className="font-bold text-gray-900">{ride.pickupLocality || ride.pickupLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                        <div>
                          <span className="text-gray-400 font-medium">Drop Area:</span>
                          <p className="font-bold text-gray-900">{ride.dropLocality || ride.dropLocation}</p>
                        </div>
                      </div>

                      {/* Passenger info (privacy protected until mutual confirmation) */}
                      <div className="pt-2 flex items-center justify-between text-gray-600 bg-slate-50 p-2 rounded-lg text-[11px]">
                        <span>Passenger: <strong>Verified Rider Request</strong></span>
                        <span className="text-gray-400 italic flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Name, phone & landmarks unlock on confirmation
                        </span>
                      </div>
                    </div>

                    {ride.negotiationHistory && ride.negotiationHistory.length > 1 && (
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 flex flex-wrap gap-1">
                        {ride.negotiationHistory.slice(-4).map((h, i) => (
                          <span key={h.id || i} className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700">
                            R{h.roundNumber}: {h.offeredBy === 'customer' ? 'Customer' : 'Rider'} ₹{h.amount}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* If driver already submitted a counter offer, show status */}
                    {hasDriverCountered && myPendingOffer && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Counter offer of <strong>₹{myPendingOffer.amount}</strong> sent! Waiting for customer.</span>
                        </div>
                      </div>
                    )}

                    {/* 3 RIDER ACTIONS: ACCEPT, COUNTER OFFER, REJECT */}
                    <div className="pt-1 grid grid-cols-3 gap-2">
                      {/* Action 1: Accept Customer's Offer */}
                      <button
                        type="button"
                        disabled={!isApproved || !driver.isOnline || isSubmittingAction}
                        onClick={async () => {
                          setActionNotice(null);
                          setIsSubmittingAction(true);
                          try {
                            const res = await onAcceptRide(
                              ride.id,
                              driver.id,
                              driver.name,
                              driver.phone,
                              driver.vehicleNumber,
                              customerFare
                            );
                            if (res && res.ok === false) {
                              setActionNotice({
                                type: 'err',
                                text: res.error || 'Ride acceptance requires backend Cloud Functions dispatch.'
                              });
                              return;
                            }
                            setActiveTab('active');
                          } finally {
                            setIsSubmittingAction(false);
                          }
                        }}
                        className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Check className="w-4 h-4 text-white" />
                        <span>Accept (₹{customerFare})</span>
                      </button>

                      {/* Action 2: Counter Offer */}
                      <button
                        type="button"
                        disabled={!isApproved || !driver.isOnline || isSubmittingAction}
                        onClick={() => openCounterModal(ride)}
                        className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                        <span>Counter Offer</span>
                      </button>

                      {/* Action 3: Reject / Decline */}
                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={() => handleRejectRide(ride.id)}
                        className="py-2.5 px-2 bg-gray-100 hover:bg-red-50 disabled:opacity-50 text-gray-700 hover:text-red-700 font-bold rounded-xl text-xs transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE ASSIGNED TRIP */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {currentAssignedRide ? (
              <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Trip Confirmed & Active
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                    {currentAssignedRide.id}
                  </span>
                </div>

                {/* Mutually Agreed Fare */}
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Agreed Final Fare</span>
                    <span className="text-2xl font-black text-emerald-900">
                      ₹{currentAssignedRide.agreedFare || currentAssignedRide.customerProposedFare || currentAssignedRide.estimatedFare}
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md">
                    Direct Cash / UPI
                  </span>
                </div>

                {/* Locations */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Pick up passenger from</span>
                    <p className="font-bold text-sm text-gray-900">{currentAssignedRide.pickupLocation}</p>
                    {currentAssignedRide.pickupLandmark && (
                      <p className="text-gray-600 mt-0.5">Landmark: {currentAssignedRide.pickupLandmark}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Drop Location</span>
                    <p className="font-bold text-sm text-gray-900">{currentAssignedRide.dropLocation}</p>
                    {currentAssignedRide.dropLandmark && (
                      <p className="text-gray-600 mt-0.5">Landmark: {currentAssignedRide.dropLandmark}</p>
                    )}
                  </div>
                </div>

                {/* Customer Details - Unlocked now */}
                <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Passenger</span>
                    <p className="font-bold text-xs text-emerald-950">{currentAssignedRide.customerName}</p>
                    <p className="text-[11px] text-emerald-700 font-mono font-bold">{currentAssignedRide.customerPhone}</p>
                  </div>
                  <a
                    href={`tel:${currentAssignedRide.customerPhone}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0E7438] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Passenger
                  </a>
                </div>

                {/* Status Progress Stages */}
                {(() => {
                  const activeStage = normalizeRideStatus(currentAssignedRide.status);
                  const isAtConfirmed = activeStage === 'CONFIRMED';
                  const isAtPickup = activeStage === 'PICKUP';
                  const isInProgress = activeStage === 'IN_PROGRESS';
                  return (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-700 block">
                        Trip Stage Progression (Step 1 → Step 2 → Step 3):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingAction || !isAtConfirmed}
                          onClick={async () => {
                            setActionNotice(null);
                            setIsSubmittingAction(true);
                            try {
                              const res = await onUpdateRideStatus(currentAssignedRide.id, 'PICKUP');
                              if (res && res.ok === false) setActionNotice({ type: 'err', text: res.error || 'Could not update ride stage.' });
                            } finally {
                              setIsSubmittingAction(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 ${
                            isAtPickup || isInProgress
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-gray-800 border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {isAtPickup || isInProgress ? '✓ 1. Arrived at Pickup' : '1. Arrived at Pickup'}
                        </button>

                        <button
                          type="button"
                          disabled={isSubmittingAction || !isAtPickup}
                          onClick={async () => {
                            setActionNotice(null);
                            setIsSubmittingAction(true);
                            try {
                              const res = await onUpdateRideStatus(currentAssignedRide.id, 'IN_PROGRESS');
                              if (res && res.ok === false) setActionNotice({ type: 'err', text: res.error || 'Could not update ride stage.' });
                            } finally {
                              setIsSubmittingAction(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                            isInProgress
                              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                              : isAtPickup
                              ? 'bg-white text-blue-700 border-blue-400 hover:bg-blue-50'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          {isInProgress ? '✓ 2. Trip Started' : '2. Start Trip'}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isSubmittingAction || !isInProgress}
                        onClick={async () => {
                          setActionNotice(null);
                          setIsSubmittingAction(true);
                          try {
                            const res = await onUpdateRideStatus(currentAssignedRide.id, 'COMPLETED');
                            if (res && res.ok === false) setActionNotice({ type: 'err', text: res.error || 'Could not complete ride.' });
                          } finally {
                            setIsSubmittingAction(false);
                          }
                        }}
                        className="w-full py-3 bg-[#0E7438] hover:bg-emerald-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        3. Complete Trip & Collect Fare (₹{currentAssignedRide.agreedFare || currentAssignedRide.customerProposedFare || currentAssignedRide.estimatedFare})
                      </button>

                  {confirmCancelRideId === currentAssignedRide.id ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs space-y-2">
                      <p className="font-bold text-red-900">Are you sure you want to cancel this ride?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingAction}
                          onClick={async () => {
                            setActionNotice(null);
                            setIsSubmittingAction(true);
                            try {
                              const res = await onUpdateRideStatus(currentAssignedRide.id, 'CANCELLED');
                              if (res && res.ok === false) {
                                setActionNotice({ type: 'err', text: res.error || 'Could not cancel ride.' });
                                return;
                              }
                              setConfirmCancelRideId(null);
                            } finally {
                              setIsSubmittingAction(false);
                            }
                          }}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg"
                        >
                          {isSubmittingAction ? 'Cancelling...' : 'Yes, Cancel Ride'}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingAction}
                          onClick={() => setConfirmCancelRideId(null)}
                          className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg"
                        >
                          Keep Trip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelRideId(currentAssignedRide.id)}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Ride
                    </button>
                  )}
                </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Navigation className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Trip Currently Active</h4>
                <p className="text-xs text-gray-500">
                  Accept an incoming request from the Trip Requests tab to begin a ride.
                </p>
                <button
                  onClick={() => setActiveTab('rides')}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  View Trip Requests ({availableRides.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS & COMPLETED TRIPS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Earnings</span>
                <p className="text-xl font-black text-emerald-700 mt-1">₹{totalEarnings}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{myCompletedRides.filter((r) => r.status === 'COMPLETED' || r.status === 'completed').length} completed trips</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Driver Rating</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-black text-gray-900">{driver.rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Top Rated Partner</p>
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-gray-800">Trip History & Negotiated Fares</h4>
              {myCompletedRides.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No completed trips yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {myCompletedRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{ride.pickupLocation} → {ride.dropLocation}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {ride.id} • {ride.customerName}
                          {ride.customerProposedFare && ride.agreedFare && ride.customerProposedFare !== ride.agreedFare && (
                            <span className="text-emerald-700 font-semibold ml-1">
                              (Offered ₹{ride.customerProposedFare} → Agreed ₹{ride.agreedFare})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-700">₹{ride.agreedFare || ride.customerProposedFare || ride.estimatedFare}</span>
                        <span
                          className={`text-[9px] font-bold block uppercase ${
                            ride.status === 'COMPLETED' || ride.status === 'completed' ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {ride.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DRIVER PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-800">Driver & Vehicle Details</h4>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Edit Info
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-gray-100">
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Full Name</span>
                <span className="font-bold text-gray-900">{driver.name}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Contact Phone</span>
                <span className="font-mono font-bold text-gray-900">{driver.phone}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Vehicle Type</span>
                <span className="font-bold text-emerald-800">{getVehicleLabel(driver.vehicleType)}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Registration Number</span>
                <span className="font-mono font-bold text-gray-900">{driver.vehicleNumber}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Operating Locality</span>
                <span className="font-bold text-gray-900">{driver.locality}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Account Approval</span>
                <span className="font-bold text-emerald-700 capitalize">{driver.status}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] space-y-1">
              <p className="font-bold">Zero Commission Model</p>
              <p>Keep 100% of your negotiated fare. Direct passenger cash and UPI collections with zero app commission in Kalchini & Dooars.</p>
            </div>
          </div>
        )}
      </div>

      {/* Counter Offer Modal for Rider */}
      {counterModalRide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Send Counter Offer</h3>
              <button
                onClick={() => setCounterModalRide(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Route:</span>
                <span className="font-bold text-gray-800">{counterModalRide.pickupLocation} → {counterModalRide.dropLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Offered:</span>
                <span className="font-black text-amber-700">₹{counterModalRide.customerProposedFare || counterModalRide.estimatedFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guidance Fare:</span>
                <span className="font-bold text-gray-700">₹{counterModalRide.suggestedFare || counterModalRide.estimatedFare}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Your Counter Amount (₹)</label>
              <div className="flex items-center gap-2 bg-emerald-50/60 p-3 rounded-xl border-2 border-emerald-500">
                <span className="text-xl font-black text-emerald-700">₹</span>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(Number(e.target.value))}
                  className="w-full text-xl font-black text-emerald-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* Preset quick chips */}
              <div className="flex gap-1.5 pt-1">
                {[10, 20, 30].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setCounterAmount((counterModalRide.customerProposedFare || counterModalRide.estimatedFare) + inc)}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    +₹{inc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Reason / Note for Customer (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hill gradient road / heavy rain / luggage"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCounterModalRide(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCounterOffer}
                className="flex-1 py-2.5 bg-[#0E7438] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Counter (₹{counterAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Update Driver Details</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Category (No Bike Taxi Allowed)</label>
                <select
                  value={editVehicleType}
                  onChange={(e) => setEditVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="toto">Toto (E-Rickshaw)</option>
                  <option value="auto">Auto Rickshaw</option>
                  <option value="taxi">Taxi / Cab</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Plate / Registration</label>
                <input
                  type="text"
                  required
                  value={editVehicleNumber}
                  onChange={(e) => setEditVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Base Stand / Locality</label>
                <input
                  type="text"
                  required
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
