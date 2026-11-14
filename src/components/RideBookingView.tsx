import React, { useState, useEffect } from 'react';
import { RIDE_OPTIONS, LOCATIONS } from '../data/mockData';
import { RideOption, RideBooking, FareOffer, VehicleType } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  Shield, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  Send, 
  XCircle, 
  MessageSquare, 
  Check, 
  X, 
  TrendingUp,
  User,
  Star,
  ChevronRight
} from 'lucide-react';

interface RideBookingViewProps {
  initialVehicleType?: VehicleType;
  currentLocation: string;
  onBackToHome: () => void;
  onBookRide?: (booking: RideBooking) => void;
  rideBookings?: RideBooking[];
  onCustomerAcceptRiderOffer?: (bookingId: string, offerId: string) => void;
  onCustomerRejectOffer?: (bookingId: string, offerId: string) => void;
  onCustomerCounterOffer?: (bookingId: string, newAmount: number) => void;
  onCancelRide?: (bookingId: string) => void;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

export const RideBookingView: React.FC<RideBookingViewProps> = ({
  initialVehicleType = 'toto',
  currentLocation,
  onBackToHome,
  onBookRide,
  rideBookings = [],
  onCustomerAcceptRiderOffer,
  onCustomerRejectOffer,
  onCustomerCounterOffer,
  onCancelRide,
  customerId,
  customerName = 'Customer',
  customerPhone = ''
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(initialVehicleType);
  const [pickup, setPickup] = useState(currentLocation || 'Kalchini');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [drop, setDrop] = useState('Kalchini Market');
  const [dropLandmark, setDropLandmark] = useState('');
  const [customerActiveBookingId, setCustomerActiveBookingId] = useState<string | null>(null);

  // Suggested guidance calculation based on route and vehicle
  const selectedOption: RideOption = RIDE_OPTIONS.find((r) => r.id === selectedVehicle) || RIDE_OPTIONS[0];
  const estimatedKm = pickup === drop ? 1.5 : 3.8;
  const suggestedFare = Math.round(selectedOption.baseFare + estimatedKm * selectedOption.perKm);

  // Proposed fare state (Customer side "Set Your Own Fare")
  const [proposedFare, setProposedFare] = useState<number>(suggestedFare);
  const [isCustomFareInput, setIsCustomFareInput] = useState(false);

  // Counter offer input for customer when countering rider's offer
  const [customerCounterAmount, setCustomerCounterAmount] = useState<number>(suggestedFare);
  const [showCounterModal, setShowCounterModal] = useState<boolean>(false);
  const [activeNegotiatingOffer, setActiveNegotiatingOffer] = useState<FareOffer | null>(null);

  // Expiration timer simulated state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);

  useEffect(() => {
    setCustomerActiveBookingId(null);
  }, [customerId]);

  // Update proposed fare default when vehicle or route changes if user hasn't typed custom
  useEffect(() => {
    if (!isCustomFareInput) {
      setProposedFare(suggestedFare);
    }
  }, [suggestedFare, isCustomFareInput]);

  // Find currently active booking for customer strictly by authenticated customerId
  const liveBooking = rideBookings.find(
    (b) => Boolean(customerId) &&
           b.customerId === customerId &&
           (b.id === customerActiveBookingId ||
            ['REQUESTED', 'OFFER_SENT', 'COUNTER_OFFERED', 'CONFIRMED', 'PICKUP', 'IN_PROGRESS', 'accepted', 'driver_arriving', 'ride_started'].includes(b.status))
  ) || null;

  // Real-time timer countdown for pending offers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (liveBooking && (liveBooking.status === 'COUNTER_OFFERED' || liveBooking.status === 'REQUESTED' || liveBooking.status === 'OFFER_SENT')) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      setSecondsRemaining(90);
    }
    return () => clearInterval(timer);
  }, [liveBooking?.status, liveBooking?.id]);

  // Submit initial ride booking with Customer's proposed fare
  const handleInitiateRideRequest = () => {
    const rideId = `TB-RIDE-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalProposed = Number(proposedFare) > 0 ? Number(proposedFare) : suggestedFare;

    const initialOffer: FareOffer = {
      id: `offer-${Date.now()}-c1`,
      offeredBy: 'customer',
      amount: finalProposed,
      status: 'pending',
      timestamp: new Date().toISOString(),
      roundNumber: 1,
      expiresAt: new Date(Date.now() + 180000).toISOString()
    };

    const newBooking: RideBooking = {
      id: rideId,
      customerId: customerId || '',
      customerName,
      customerPhone,
      vehicleType: selectedVehicle,
      pickupLocation: pickup,
      pickupLandmark: pickupLandmark.trim() || undefined,
      dropLocation: drop,
      dropLandmark: dropLandmark.trim() || undefined,
      distanceKm: estimatedKm,
      estimatedFare: suggestedFare,
      suggestedFare,
      customerProposedFare: finalProposed,
      status: 'OFFER_SENT',
      negotiationHistory: [initialOffer],
      activeDriverOffers: [],
      currentRound: 1,
      maxNegotiationRounds: 5,
      createdAt: new Date().toISOString()
    };

    setCustomerActiveBookingId(rideId);
    if (onBookRide) {
      onBookRide(newBooking);
    }
  };

  const isConfirmed = liveBooking && (
    liveBooking.status === 'CONFIRMED' || 
    liveBooking.status === 'PICKUP' || 
    liveBooking.status === 'IN_PROGRESS' || 
    liveBooking.status === 'accepted' || 
    liveBooking.status === 'driver_arriving' || 
    liveBooking.status === 'ride_started'
  );

  const isNegotiating = liveBooking && (
    liveBooking.status === 'REQUESTED' || 
    liveBooking.status === 'OFFER_SENT' || 
    liveBooking.status === 'COUNTER_OFFERED'
  );

  const latestDriverOffer = liveBooking?.activeDriverOffers?.[0] || 
    liveBooking?.negotiationHistory?.filter((o) => o.offeredBy === 'driver' && o.status === 'pending').slice(-1)[0];

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-14 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {selectedVehicle === 'toto' ? 'Toto (E-Rickshaw) Booking' : selectedVehicle === 'auto' ? 'Auto Rickshaw Booking' : 'Taxi & Cab Booking'}
            </h2>
            <p className="text-xs text-emerald-700 font-medium">Kalchini • Torsa • Dooars Fare Negotiation</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* CASE 1: MUTUALLY CONFIRMED RIDE */}
        {isConfirmed && liveBooking ? (
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {liveBooking.status === 'PICKUP' || liveBooking.status === 'driver_arriving'
                    ? 'Driver Arriving at Pickup'
                    : liveBooking.status === 'IN_PROGRESS' || liveBooking.status === 'ride_started'
                    ? 'Trip in Progress'
                    : 'Ride Confirmed & Agreed!'}
                </span>
              </div>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                {liveBooking.id}
              </span>
            </div>

            {/* Mutually Agreed Fare Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Agreed Final Fare</span>
                <span className="text-2xl font-black text-emerald-900">
                  ₹{liveBooking.agreedFare || liveBooking.customerProposedFare || liveBooking.estimatedFare}
                </span>
              </div>
              <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg">
                Mutual Fare Agreement Locked
              </span>
            </div>

            {/* Driver Profile */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center border-2 border-emerald-400">
                  {liveBooking.driverName ? liveBooking.driverName.charAt(0) : 'D'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{liveBooking.driverName || 'Assigned Driver'}</h4>
                  <p className="text-xs text-gray-600 font-mono font-bold">{liveBooking.vehicleNumber || 'WB-72-E-1049'}</p>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Verified Local Partner ★ {liveBooking.driverRating || 4.9}
                  </p>
                </div>
              </div>

              {liveBooking.driverPhone && (
                <a
                  href={`tel:${liveBooking.driverPhone}`}
                  className="bg-[#0E7438] text-white p-3 rounded-full hover:bg-emerald-800 shadow-md flex items-center justify-center transition-transform active:scale-95"
                  aria-label="Call driver"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Route Details */}
            <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[10px] font-bold">PICKUP LOCATION</span>
                  <span className="font-semibold text-gray-800">{liveBooking.pickupLocation}</span>
                  {liveBooking.pickupLandmark && (
                    <span className="text-gray-500 block text-[11px]">Landmark: {liveBooking.pickupLandmark}</span>
                  )}
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-300 ml-1 h-3" />
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[10px] font-bold">DESTINATION</span>
                  <span className="font-semibold text-gray-800">{liveBooking.dropLocation}</span>
                  {liveBooking.dropLandmark && (
                    <span className="text-gray-500 block text-[11px]">Landmark: {liveBooking.dropLandmark}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Negotiation History Log */}
            {liveBooking.negotiationHistory && liveBooking.negotiationHistory.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Negotiation History ({liveBooking.negotiationHistory.length} rounds)
                </span>
                <div className="space-y-1.5 text-xs">
                  {liveBooking.negotiationHistory.map((hist, idx) => (
                    <div key={hist.id || idx} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-200/60 last:border-none">
                      <span className="text-gray-600">
                        Round {hist.roundNumber}: <strong className="capitalize">{hist.offeredBy}</strong>
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{hist.amount}{' '}
                        <span className={`text-[10px] font-semibold ${hist.status === 'accepted' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          ({hist.status})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pay driver note */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-500">Payment to driver directly:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Cash or UPI
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm('Cancel this ride booking?')) {
                  if (onCancelRide) onCancelRide(liveBooking.id);
                  setCustomerActiveBookingId(null);
                }
              }}
              className="w-full py-2.5 text-xs text-gray-600 hover:text-red-600 font-semibold text-center hover:bg-red-50 rounded-xl transition-colors"
            >
              Cancel Ride
            </button>
          </div>
        ) : isNegotiating && liveBooking ? (
          /* CASE 2: LIVE NEGOTIATION / COUNTER OFFER SCREEN */
          <div className="bg-white rounded-2xl border-2 border-amber-400 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {liveBooking.status === 'COUNTER_OFFERED' ? 'Rider Sent Counter Offer!' : 'Broadcasting Fare to Nearby Drivers...'}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>{secondsRemaining}s</span>
              </div>
            </div>

            {/* Fares Comparison Card */}
            <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Your Proposed Fare</span>
                <span className="text-xl font-black text-gray-900">₹{liveBooking.customerProposedFare || liveBooking.estimatedFare}</span>
                <span className="text-[10px] text-gray-500 block">Round {liveBooking.currentRound || 1} of 5</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Guidance Fare</span>
                <span className="text-base font-bold text-gray-600">₹{liveBooking.suggestedFare || liveBooking.estimatedFare}</span>
                <span className="text-[10px] text-emerald-700 font-medium block">Local rate</span>
              </div>
            </div>

            {/* Rider Counter Offer Present */}
            {latestDriverOffer && (
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {latestDriverOffer.driverName ? latestDriverOffer.driverName.charAt(0) : 'R'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{latestDriverOffer.driverName || 'Nearby Driver'}</h4>
                      <p className="text-[11px] text-gray-500">{latestDriverOffer.driverVehicle || 'Verified Partner'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Counter Offer</span>
                    <span className="text-2xl font-black text-emerald-700">₹{latestDriverOffer.amount}</span>
                  </div>
                </div>

                {latestDriverOffer.note && (
                  <p className="text-xs bg-slate-50 p-2 rounded-lg text-gray-700 italic border border-slate-100">
                    "{latestDriverOffer.note}"
                  </p>
                )}

                {/* 3 Customer Actions for Counter Offer */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Action 1: Accept Rider's Counter Offer */}
                  <button
                    onClick={() => {
                      if (onCustomerAcceptRiderOffer) {
                        onCustomerAcceptRiderOffer(liveBooking.id, latestDriverOffer.id);
                      }
                    }}
                    className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Accept ₹{latestDriverOffer.amount}</span>
                  </button>

                  {/* Action 2: Counter Back with another price */}
                  <button
                    onClick={() => {
                      setActiveNegotiatingOffer(latestDriverOffer);
                      setCustomerCounterAmount(
                        Math.round((Number(liveBooking.customerProposedFare || 30) + latestDriverOffer.amount) / 2)
                      );
                      setShowCounterModal(true);
                    }}
                    className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>Counter Back</span>
                  </button>

                  {/* Action 3: Decline / Reject */}
                  <button
                    onClick={() => {
                      if (onCustomerRejectOffer) {
                        onCustomerRejectOffer(liveBooking.id, latestDriverOffer.id);
                      }
                    }}
                    className="py-2.5 px-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            )}

            {/* Waiting for Drivers State */}
            {!latestDriverOffer && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-800">Searching eligible riders in {liveBooking.pickupLocation}...</p>
                <p className="text-[11px] text-gray-500">
                  Drivers will review your offer of ₹{liveBooking.customerProposedFare}. They can accept instantly or propose a counter fare.
                </p>
              </div>
            )}

            {/* Negotiation History */}
            {liveBooking.negotiationHistory && liveBooking.negotiationHistory.length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                <span className="font-bold text-gray-700 block text-[11px] uppercase tracking-wider">
                  Bidding Timeline ({liveBooking.negotiationHistory.length} events)
                </span>
                <div className="space-y-1.5">
                  {liveBooking.negotiationHistory.map((hist, idx) => (
                    <div key={hist.id || idx} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg text-[11px]">
                      <span className="text-gray-700">
                        {hist.offeredBy === 'customer' ? 'You proposed:' : `${hist.driverName || 'Driver'} countered:`}
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{hist.amount}{' '}
                        <span className="text-[10px] text-gray-400 capitalize">({hist.status})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (onCancelRide) onCancelRide(liveBooking.id);
                setCustomerActiveBookingId(null);
              }}
              className="w-full py-2.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors"
            >
              Cancel Ride Request
            </button>
          </div>
        ) : (
          /* CASE 3: NEW RIDE BOOKING & SET YOUR OWN FARE FORM */
          <>
            {/* Vehicle Selection Tabs (No bike taxi) */}
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl">
              {RIDE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedVehicle(opt.id)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all ${
                    selectedVehicle === opt.id
                      ? 'bg-white shadow-xs font-bold text-gray-900 border border-gray-200/80'
                      : 'text-gray-600 hover:text-gray-900 font-medium'
                  }`}
                >
                  <span className="text-2xl mb-0.5">{opt.icon}</span>
                  <span>{opt.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">from ₹{opt.baseFare}</span>
                </button>
              ))}
            </div>

            {/* Pickup & Destination Locations */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pickup Location</span>
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`pickup-${loc}`} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Optional landmark (e.g. Near Station Gate, SBI ATM)"
                  value={pickupLandmark}
                  onChange={(e) => setPickupLandmark(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <Navigation className="w-3.5 h-3.5 text-red-500" />
                  <span>Destination / Drop</span>
                </label>
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
                >
                  {LOCATIONS.filter((l) => l !== pickup).map((loc) => (
                    <option key={`drop-${loc}`} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Optional landmark (e.g. Near Club Gate, Bazar Chowk)"
                  value={dropLandmark}
                  onChange={(e) => setDropLandmark(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* SET YOUR OWN FARE CARD (PROMINENT FEATURE) */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-2xl border-2 border-emerald-500/80 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    FAIR PRICE BIDDING
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-1">Set Your Own Proposed Fare</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Suggested Guidance</span>
                  <span className="text-sm font-black text-gray-700">₹{suggestedFare}</span>
                </div>
              </div>

              {/* Fare input and quick increment buttons */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-gray-600">Your Fare:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-emerald-700">₹</span>
                  <input
                    type="number"
                    min="10"
                    max="1500"
                    value={proposedFare}
                    onChange={(e) => {
                      setIsCustomFareInput(true);
                      setProposedFare(Number(e.target.value));
                    }}
                    className="w-20 text-xl font-black text-emerald-800 border-b-2 border-emerald-500 text-center focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              {/* Quick adjustment pills */}
              <div className="flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFareInput(true);
                    setProposedFare((prev) => Math.max(10, prev - 10));
                  }}
                  className="flex-1 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-[11px]"
                >
                  -₹10
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFareInput(true);
                    setProposedFare((prev) => Math.max(10, prev - 5));
                  }}
                  className="flex-1 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-[11px]"
                >
                  -₹5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFareInput(false);
                    setProposedFare(suggestedFare);
                  }}
                  className="flex-1 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px]"
                >
                  Reset (₹{suggestedFare})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFareInput(true);
                    setProposedFare((prev) => prev + 5);
                  }}
                  className="flex-1 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-[11px]"
                >
                  +₹5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFareInput(true);
                    setProposedFare((prev) => prev + 10);
                  }}
                  className="flex-1 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-[11px]"
                >
                  +₹10
                </button>
              </div>

              {/* Guidance advice */}
              <div className="text-[11px] text-gray-600 bg-white/80 p-2.5 rounded-lg border border-gray-100 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  {proposedFare < suggestedFare * 0.8
                    ? 'Fare is below average. Drivers may counter-offer or take longer to accept.'
                    : proposedFare >= suggestedFare
                    ? 'Fair & attractive price! High chance of immediate driver acceptance.'
                    : 'Good competitive offer for local Kalchini/Torsa drivers.'}
                </span>
              </div>
            </div>

            {/* Vehicle Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedOption.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedOption.name}</h3>
                    <p className="text-xs text-gray-500">{selectedOption.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Distance</span>
                  <span className="font-bold text-gray-800 text-xs">~{estimatedKm} km</span>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Zero cancellation penalties. Ride is confirmed only when both you and driver agree on price.</span>
            </div>

            {/* Action Button: Submit Fare Request */}
            <button
              onClick={handleInitiateRideRequest}
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Request to Nearby {selectedOption.name.split(' ')[0]}s</span>
              <span className="text-yellow-300 font-extrabold">• ₹{proposedFare}</span>
            </button>
          </>
        )}
      </div>

      {/* Customer Counter Offer Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Propose New Counter Fare</h3>
              <button
                onClick={() => setShowCounterModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-gray-500">Rider: <strong className="text-gray-800">{activeNegotiatingOffer?.driverName || 'Driver'}</strong></p>
              <p className="text-gray-500">Rider's Offer: <strong className="text-emerald-700">₹{activeNegotiatingOffer?.amount}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Your Counter Price (₹)</label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-xl font-black text-emerald-700">₹</span>
                <input
                  type="number"
                  min="10"
                  max="1500"
                  value={customerCounterAmount}
                  onChange={(e) => setCustomerCounterAmount(Number(e.target.value))}
                  className="w-full text-xl font-black text-gray-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* Quick increment buttons */}
              <div className="flex gap-1.5 pt-1">
                {[10, 20, 30].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setCustomerCounterAmount((prev) => prev + inc)}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                  >
                    +₹{inc}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCounterModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (liveBooking && onCustomerCounterOffer) {
                    onCustomerCounterOffer(liveBooking.id, customerCounterAmount);
                  }
                  setShowCounterModal(false);
                }}
                className="flex-1 py-2.5 bg-[#0E7438] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Counter (₹{customerCounterAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
