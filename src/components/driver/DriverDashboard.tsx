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
  MessageSquare
} from 'lucide-react';
import { Driver, RideBooking, RideStatus, ShopApprovalStatus, VehicleType, FareOffer } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface DriverDashboardProps {
  driver: Driver;
  rideBookings: RideBooking[];
  onSwitchPortal: () => void;
  onUpdateDriver: (updated: Partial<Driver>) => void;
  onUpdateRideStatus: (rideId: string, status: RideStatus) => void;
  onAcceptRide: (
    rideId: string, 
    driverId: string, 
    driverName: string, 
    driverPhone: string, 
    vehicleNumber: string,
    agreedFare?: number
  ) => void;
  onDriverCounterOffer?: (rideId: string, driver: Driver, counterAmount: number, note?: string) => void;
  onDriverRejectRide?: (rideId: string, driverId: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driver,
  rideBookings,
  onSwitchPortal,
  onUpdateDriver,
  onUpdateRideStatus,
  onAcceptRide,
  onDriverCounterOffer,
  onDriverRejectRide
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

  // Available rides for this vehicle type that are waiting for response or in negotiation
  const availableRides = rideBookings.filter((r) => {
    if (rejectedRideIds.includes(r.id)) return false;
    const isMatchingVehicle = !r.vehicleType || r.vehicleType === driver.vehicleType;
    const isWaitingStatus = [
      'requested', 
      'searching', 
      'REQUESTED', 
      'OFFER_SENT', 
      'COUNTER_OFFERED'
    ].includes(r.status);
    
    // Do not show in available if already assigned to someone else
    if (r.driverId && r.driverId !== driver.id) return false;
    
    return isMatchingVehicle && isWaitingStatus;
  });

  // Active ride currently confirmed or assigned to this driver
  const currentAssignedRide = rideBookings.find(
    (r) => r.driverId === driver.id && 
           ['CONFIRMED', 'PICKUP', 'IN_PROGRESS', 'accepted', 'driver_arriving', 'ride_started'].includes(r.status)
  );

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

  const handleSendCounterOffer = () => {
    if (!counterModalRide) return;
    if (onDriverCounterOffer) {
      onDriverCounterOffer(counterModalRide.id, driver, counterAmount, counterNote.trim() || undefined);
    }
    setCounterModalRide(null);
  };

  const handleRejectRide = (rideId: string) => {
    setRejectedRideIds((prev) => [...prev, rideId]);
    if (onDriverRejectRide) {
      onDriverRejectRide(rideId, driver.id);
    }
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

                return (
                  <div
                    key={ride.id}
                    className="bg-white rounded-2xl border-2 border-emerald-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
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
                      </div>
                      <span className="text-xs text-gray-500">~{ride.distanceKm || 3.5} km</span>
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
                          <p className="font-bold text-gray-900">{ride.pickupLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                        <div>
                          <span className="text-gray-400 font-medium">Drop Area:</span>
                          <p className="font-bold text-gray-900">{ride.dropLocation}</p>
                        </div>
                      </div>

                      {/* Passenger info (privacy protected until mutual confirmation) */}
                      <div className="pt-2 flex items-center justify-between text-gray-600 bg-slate-50 p-2 rounded-lg text-[11px]">
                        <span>Passenger: <strong>Verified Rider Request</strong></span>
                        <span className="text-gray-400 italic">Name, phone & landmarks unlock on confirmation</span>
                      </div>
                    </div>

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
                        disabled={!isApproved || !driver.isOnline}
                        onClick={() => {
                          onAcceptRide(
                            ride.id,
                            driver.id,
                            driver.name,
                            driver.phone,
                            driver.vehicleNumber,
                            customerFare
                          );
                          setActiveTab('active');
                        }}
                        className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Check className="w-4 h-4 text-white" />
                        <span>Accept (₹{customerFare})</span>
                      </button>

                      {/* Action 2: Counter Offer */}
                      <button
                        disabled={!isApproved || !driver.isOnline}
                        onClick={() => openCounterModal(ride)}
                        className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                        <span>Counter Offer</span>
                      </button>

                      {/* Action 3: Reject / Decline */}
                      <button
                        onClick={() => handleRejectRide(ride.id)}
                        className="py-2.5 px-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold rounded-xl text-xs transition-colors flex flex-col items-center justify-center gap-1"
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
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-gray-700 block">Trip Stage Progression:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateRideStatus(currentAssignedRide.id, 'PICKUP')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        currentAssignedRide.status === 'PICKUP' || currentAssignedRide.status === 'driver_arriving'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      1. Arrived at Pickup
                    </button>

                    <button
                      onClick={() => onUpdateRideStatus(currentAssignedRide.id, 'IN_PROGRESS')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        currentAssignedRide.status === 'IN_PROGRESS' || currentAssignedRide.status === 'ride_started'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      2. Start Trip
                    </button>
                  </div>

                  <button
                    onClick={() => onUpdateRideStatus(currentAssignedRide.id, 'COMPLETED')}
                    className="w-full py-3 bg-[#0E7438] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Trip & Collect Fare (₹{currentAssignedRide.agreedFare || currentAssignedRide.customerProposedFare || currentAssignedRide.estimatedFare})
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this ride?')) {
                        onUpdateRideStatus(currentAssignedRide.id, 'CANCELLED');
                      }
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Ride
                  </button>
                </div>
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
