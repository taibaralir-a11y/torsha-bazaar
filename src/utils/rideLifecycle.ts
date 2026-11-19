import {
  Driver,
  FareOffer,
  LocalityInfo,
  PartnerAccount,
  PublicDriverCard,
  RequestRoutingStatus,
  RideBooking,
  RideDispatchSummary,
  RideStatus,
  UniversalRoutingConfig,
  VehicleType
} from '../types';
import {
  INITIAL_SERVICE_LOCALITIES,
  evaluatePublicDriverCardsForRide,
  evaluateRideDriverEligibility
} from './hyperlocalRouting';
import { toRideDispatchSummary } from './directorySanitizer';

export const DEFAULT_RIDE_OFFER_TTL_MS = 3 * 60 * 1000; // 3 minutes automatic expiry
export const MAX_RIDE_NEGOTIATION_ROUNDS = 5;
export const ALLOWED_RIDE_VEHICLE_TYPES: readonly VehicleType[] = ['toto', 'auto', 'taxi'] as const;

export type CanonicalRideStatus =
  | 'REQUESTED'
  | 'OFFER_SENT'
  | 'COUNTER_OFFERED'
  | 'CUSTOMER_ACCEPTED'
  | 'RIDER_ACCEPTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type RideActorRole = 'customer' | 'driver' | 'admin' | 'system';

export function normalizeRideStatus(status: RideStatus | string | undefined): CanonicalRideStatus {
  const s = (status || 'REQUESTED').toString().trim();
  const upper = s.toUpperCase();
  switch (upper) {
    case 'REQUESTED':
    case 'SEARCHING':
      return 'REQUESTED';
    case 'OFFER_SENT':
      return 'OFFER_SENT';
    case 'COUNTER_OFFERED':
      return 'COUNTER_OFFERED';
    case 'CUSTOMER_ACCEPTED':
      return 'CUSTOMER_ACCEPTED';
    case 'RIDER_ACCEPTED':
      return 'RIDER_ACCEPTED';
    case 'CONFIRMED':
    case 'ACCEPTED':
      return 'CONFIRMED';
    case 'PICKUP':
    case 'DRIVER_ARRIVING':
      return 'PICKUP';
    case 'IN_PROGRESS':
    case 'RIDE_STARTED':
      return 'IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REJECTED':
      return 'REJECTED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return 'REQUESTED';
  }
}

export const TERMINAL_RIDE_STATUSES: ReadonlySet<CanonicalRideStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED'
]);

export const PENDING_PRE_CONFIRM_STATUSES: ReadonlySet<CanonicalRideStatus> = new Set([
  'REQUESTED',
  'OFFER_SENT',
  'COUNTER_OFFERED',
  'CUSTOMER_ACCEPTED',
  'RIDER_ACCEPTED'
]);

export const CONFIRMED_ACTIVE_STATUSES: ReadonlySet<CanonicalRideStatus> = new Set([
  'CONFIRMED',
  'PICKUP',
  'IN_PROGRESS'
]);

export function isRideTerminalStatus(status: RideStatus | string | undefined): boolean {
  return TERMINAL_RIDE_STATUSES.has(normalizeRideStatus(status));
}

export function isRidePendingActionStatus(status: RideStatus | string | undefined): boolean {
  return PENDING_PRE_CONFIRM_STATUSES.has(normalizeRideStatus(status));
}

export function isRideConfirmedOrInProgress(status: RideStatus | string | undefined): boolean {
  return CONFIRMED_ACTIVE_STATUSES.has(normalizeRideStatus(status));
}

export function isRideOfferExpired(
  ride: Pick<RideBooking, 'status' | 'expiresAt' | 'expiresAtMs' | 'createdAt'>,
  nowMs: number = Date.now()
): boolean {
  const canonical = normalizeRideStatus(ride.status);
  if (canonical === 'EXPIRED') return true;
  if (!isRidePendingActionStatus(canonical)) return false;

  const expMs =
    typeof ride.expiresAtMs === 'number'
      ? ride.expiresAtMs
      : ride.expiresAt
      ? Date.parse(ride.expiresAt)
      : NaN;

  if (!Number.isNaN(expMs) && expMs > 0) {
    return nowMs > expMs;
  }
  return false;
}

export function getRideRemainingSeconds(
  ride: Pick<RideBooking, 'expiresAt' | 'expiresAtMs'>,
  nowMs: number = Date.now()
): number {
  const expMs =
    typeof ride.expiresAtMs === 'number'
      ? ride.expiresAtMs
      : ride.expiresAt
      ? Date.parse(ride.expiresAt)
      : NaN;
  if (Number.isNaN(expMs) || expMs <= 0) return 0;
  return Math.max(0, Math.ceil((expMs - nowMs) / 1000));
}

const VALID_RIDE_TRANSITIONS: Record<CanonicalRideStatus, ReadonlyArray<CanonicalRideStatus>> = {
  REQUESTED: ['OFFER_SENT', 'COUNTER_OFFERED', 'RIDER_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  OFFER_SENT: ['OFFER_SENT', 'COUNTER_OFFERED', 'RIDER_ACCEPTED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  COUNTER_OFFERED: [
    'COUNTER_OFFERED',
    'CUSTOMER_ACCEPTED',
    'RIDER_ACCEPTED',
    'CONFIRMED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED'
  ],
  CUSTOMER_ACCEPTED: ['CONFIRMED', 'CANCELLED', 'EXPIRED', 'REJECTED'],
  RIDER_ACCEPTED: ['CONFIRMED', 'CANCELLED', 'EXPIRED', 'REJECTED'],
  CONFIRMED: ['PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  PICKUP: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: []
};

export function canTransitionRideStatus(
  fromStatus: RideStatus | string | undefined,
  toStatus: RideStatus | string,
  actor: RideActorRole = 'system'
): { allowed: boolean; reason?: string; from: CanonicalRideStatus; to: CanonicalRideStatus } {
  const from = normalizeRideStatus(fromStatus);
  const to = normalizeRideStatus(toStatus);

  if (TERMINAL_RIDE_STATUSES.has(from)) {
    return {
      allowed: false,
      from,
      to,
      reason: `Ride is already in terminal state (${from}) and cannot move to ${to}.`
    };
  }

  const allowedTargets = VALID_RIDE_TRANSITIONS[from] || [];
  if (!allowedTargets.includes(to)) {
    return {
      allowed: false,
      from,
      to,
      reason: `Invalid ride transition from ${from} to ${to}.`
    };
  }

  if (to === 'IN_PROGRESS' && from !== 'PICKUP' && from !== 'CONFIRMED') {
    return { allowed: false, from, to, reason: 'Ride must be confirmed/at pickup before starting trip.' };
  }

  if (to === 'COMPLETED' && actor === 'customer') {
    return { allowed: false, from, to, reason: 'Customer cannot mark a ride COMPLETED directly.' };
  }

  return { allowed: true, from, to };
}

export function validateCounterOfferAmount(params: {
  amount: number;
  currentRound?: number;
  maxRounds?: number;
}): { valid: boolean; amount: number; reason?: string } {
  const rounded = Math.round(Number(params.amount));
  if (!Number.isFinite(rounded) || rounded < 10) {
    return { valid: false, amount: rounded, reason: 'Offer fare must be at least ₹10.' };
  }
  if (rounded > 15000) {
    return { valid: false, amount: rounded, reason: 'Offer fare cannot exceed ₹15,000.' };
  }
  const currentRound = Number(params.currentRound || 1);
  const maxRounds = Number(params.maxRounds || MAX_RIDE_NEGOTIATION_ROUNDS);
  if (currentRound > maxRounds) {
    return {
      valid: false,
      amount: rounded,
      reason: `Maximum ${maxRounds} negotiation rounds reached for this request.`
    };
  }
  return { valid: true, amount: rounded };
}

export function hasActiveUnresolvedCustomerRide(
  rides: RideBooking[],
  customerId: string | undefined,
  nowMs: number = Date.now()
): RideBooking | undefined {
  if (!customerId) return undefined;
  return rides.find((r) => {
    if (r.customerId !== customerId) return false;
    const st = normalizeRideStatus(r.status);
    if (TERMINAL_RIDE_STATUSES.has(st)) return false;
    if (isRidePendingActionStatus(st) && isRideOfferExpired(r, nowMs)) return false;
    return true;
  });
}

export function assertAgreedFareImmutable(
  existingRide: Pick<RideBooking, 'agreedFare' | 'status'>,
  nextAgreedFare: number | undefined
): void {
  if (
    typeof existingRide.agreedFare === 'number' &&
    existingRide.agreedFare > 0 &&
    typeof nextAgreedFare === 'number' &&
    nextAgreedFare !== existingRide.agreedFare
  ) {
    throw new Error(
      `Fare Lock Violation: Agreed fare (₹${existingRide.agreedFare}) is immutable once locked and cannot be changed to ₹${nextAgreedFare}.`
    );
  }
}

export function buildNewRideRequestBundle(params: {
  rideId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  vehicleType: VehicleType;
  pickupLocation: string;
  pickupLocality: string;
  pickupLandmark?: string;
  dropLocation: string;
  dropLocality: string;
  dropLandmark?: string;
  distanceKm: number;
  suggestedFare: number;
  customerProposedFare: number;
  publicDrivers: PublicDriverCard[];
  routingConfig: UniversalRoutingConfig;
  partnerAccounts: PartnerAccount[];
  localities?: LocalityInfo[];
  existingRides?: RideBooking[];
  ttlMs?: number;
  nowMs?: number;
}): {
  booking: RideBooking;
  dispatch: RideDispatchSummary;
  eligibleDriverIds: string[];
  routingStatus: RequestRoutingStatus;
} {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (!ALLOWED_RIDE_VEHICLE_TYPES.includes(params.vehicleType)) {
    throw new Error('Only Toto, Auto, or Taxi rides are supported on TORSHA BAZAAR.');
  }

  const duplicate = hasActiveUnresolvedCustomerRide(
    params.existingRides || [],
    params.customerId,
    nowMs
  );
  if (duplicate) {
    throw new Error(
      `You already have an active ride request (${duplicate.id}) in status ${normalizeRideStatus(duplicate.status)}. Please complete or cancel it first.`
    );
  }

  const fareCheck = validateCounterOfferAmount({
    amount: params.customerProposedFare,
    currentRound: 1,
    maxRounds: MAX_RIDE_NEGOTIATION_ROUNDS
  });
  if (!fareCheck.valid) {
    throw new Error(fareCheck.reason || 'Invalid customer fare proposal.');
  }

  const eligibility = evaluatePublicDriverCardsForRide({
    pickupLocality: params.pickupLocality,
    requestedVehicleType: params.vehicleType,
    config: params.routingConfig,
    approvedDrivers: params.publicDrivers,
    partnerAccounts: params.partnerAccounts,
    localities: params.localities || INITIAL_SERVICE_LOCALITIES
  });

  const eligibleDriverIds = eligibility.eligible.map((r) => r.partnerId);
  const routingStatus: RequestRoutingStatus =
    eligibleDriverIds.length > 0 ? 'pending_admin_routing' : 'unavailable_in_locality';

  const ttlMs = params.ttlMs ?? DEFAULT_RIDE_OFFER_TTL_MS;
  const expiresAtMs = nowMs + ttlMs;
  const expiresAt = new Date(expiresAtMs).toISOString();

  const initialStatus: RideStatus = eligibleDriverIds.length > 0 ? 'OFFER_SENT' : 'REQUESTED';

  const initialOffer: FareOffer = {
    id: `offer-init-${nowMs}`,
    offeredBy: 'customer',
    amount: fareCheck.amount,
    status: 'pending',
    action: initialStatus,
    timestamp: nowIso,
    roundNumber: 1,
    expiresAt,
    expiresAtMs
  };

  const booking: RideBooking = {
    id: params.rideId,
    customerId: params.customerId,
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.trim(),
    vehicleType: params.vehicleType,
    pickupLocation: params.pickupLocation.trim() || params.pickupLocality,
    pickupLocality: params.pickupLocality,
    ...(params.pickupLandmark?.trim() ? { pickupLandmark: params.pickupLandmark.trim() } : {}),
    dropLocation: params.dropLocation.trim() || params.dropLocality,
    dropLocality: params.dropLocality,
    ...(params.dropLandmark?.trim() ? { dropLandmark: params.dropLandmark.trim() } : {}),
    distanceKm: Number(params.distanceKm || 0),
    estimatedFare: Number(params.suggestedFare),
    suggestedFare: Number(params.suggestedFare),
    customerProposedFare: fareCheck.amount,
    status: initialStatus,
    routingStatus,
    eligibleDriverIds,
    rejectedDriverIds: [],
    activeDriverOffers: [],
    negotiationHistory: [initialOffer],
    currentRound: 1,
    maxNegotiationRounds: MAX_RIDE_NEGOTIATION_ROUNDS,
    expiresAt,
    expiresAtMs,
    notificationSummary: {
      eligibleCount: eligibleDriverIds.length,
      adminNotifiedAt: nowIso,
      lastAlertAt: nowIso
    },
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const dispatch = toRideDispatchSummary(booking);
  return { booking, dispatch, eligibleDriverIds, routingStatus };
}

/**
 * Checks if a specific approved, active Driver is strictly eligible for a pending ride request.
 */
export function isDriverEligibleForPendingRide(params: {
  ride: RideBooking | RideDispatchSummary;
  driver: Driver;
  routingConfig: UniversalRoutingConfig;
  partnerAccounts: PartnerAccount[];
  localities?: LocalityInfo[];
  nowMs?: number;
}): { eligible: boolean; reason?: string } {
  const { ride, driver, routingConfig, partnerAccounts, localities = INITIAL_SERVICE_LOCALITIES } = params;
  const nowMs = params.nowMs ?? Date.now();

  if (!ALLOWED_RIDE_VEHICLE_TYPES.includes(driver.vehicleType) || ride.vehicleType !== driver.vehicleType) {
    return { eligible: false, reason: 'Vehicle type mismatch.' };
  }

  const canonical = normalizeRideStatus(ride.status);
  if (!isRidePendingActionStatus(canonical)) {
    return { eligible: false, reason: `Ride is already ${canonical}.` };
  }

  const confirmedDriver =
    ('confirmedDriverId' in ride ? ride.confirmedDriverId : undefined) ||
    ('driverId' in ride ? ride.driverId : undefined);
  if (confirmedDriver && confirmedDriver !== driver.id) {
    return { eligible: false, reason: 'Another rider has already locked this ride.' };
  }

  if (isRideOfferExpired(ride as RideBooking, nowMs)) {
    return { eligible: false, reason: 'Ride offer window has expired.' };
  }

  if (Array.isArray(ride.rejectedDriverIds) && ride.rejectedDriverIds.includes(driver.id)) {
    return { eligible: false, reason: 'You already declined this ride.' };
  }

  // If explicit eligibleDriverIds list exists on the ride, check either inclusion OR live routingConfig match
  const evalReport = evaluateRideDriverEligibility(
    ride.pickupLocality || 'Satali',
    ride.vehicleType,
    driver,
    routingConfig,
    partnerAccounts,
    localities
  );
  if (!evalReport.isEligible) {
    return { eligible: false, reason: evalReport.reasons.join('; ') || 'Not eligible in this locality.' };
  }

  if (
    Array.isArray(ride.eligibleDriverIds) &&
    ride.eligibleDriverIds.length > 0 &&
    !ride.eligibleDriverIds.includes(driver.id)
  ) {
    // Allow only if Admin explicitly reassigned or routing config now includes this driver in the locality
    const stillMappedInList = false;
    if (!stillMappedInList && evalReport.crossLocalityUsed === false && evalReport.isExactLocality) {
      return { eligible: true };
    }
    return { eligible: false, reason: 'Driver not in approved locality dispatch list for this ride.' };
  }

  return { eligible: true };
}

/**
 * Pure transaction preparation when a Driver accepts a customer's proposed/countered fare.
 * Locks the ride atomically to a single winning driver with immutable agreedFare.
 */
export function prepareDriverAcceptTransaction(params: {
  dispatch: RideDispatchSummary;
  driver: Driver;
  nowMs?: number;
}): {
  dispatchPatch: Partial<RideDispatchSummary>;
  bookingPatch: Partial<RideBooking>;
  agreedFare: number;
} {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { dispatch, driver } = params;

  if (dispatch.confirmedDriverId || dispatch.assignedDriverId) {
    throw new Error('RIDE_ALREADY_CONFIRMED: Another driver already confirmed this ride.');
  }

  const transition = canTransitionRideStatus(dispatch.status, 'CONFIRMED', 'driver');
  if (!transition.allowed) {
    throw new Error(transition.reason || 'Ride can no longer be accepted.');
  }

  if (isRideOfferExpired(dispatch as unknown as RideBooking, nowMs)) {
    throw new Error('RIDE_EXPIRED: This ride offer window has expired.');
  }

  if (driver.vehicleType !== dispatch.vehicleType) {
    throw new Error(`Vehicle type mismatch (${driver.vehicleType} vs ${dispatch.vehicleType}).`);
  }

  if (driver.status !== 'approved' || !driver.isOnline) {
    throw new Error('Driver account must be approved and Online to accept rides.');
  }

  // Mutual agreed fare: customerProposedFare -> active counter offer by this driver -> estimatedFare
  const customerLatestOffer = [...(dispatch.negotiationHistory || [])]
    .reverse()
    .find((o) => o.offeredBy === 'customer' && o.status === 'pending');
  const driverExistingCounter = (dispatch.activeDriverOffers || []).find(
    (o) => o.driverId === driver.id && o.status === 'pending'
  );

  const resolvedFare = Number(
    dispatch.agreedFare ??
      customerLatestOffer?.amount ??
      dispatch.customerProposedFare ??
      driverExistingCounter?.amount ??
      dispatch.estimatedFare
  );

  if (!Number.isFinite(resolvedFare) || resolvedFare < 10) {
    throw new Error('Cannot lock ride without a valid agreed fare.');
  }

  assertAgreedFareImmutable({ agreedFare: dispatch.agreedFare, status: dispatch.status }, resolvedFare);

  const nextHistory: FareOffer[] = [
    ...(dispatch.negotiationHistory || []).map((o) =>
      o.status === 'pending' && o.driverId && o.driverId !== driver.id
        ? { ...o, status: 'rejected' as const }
        : o.status === 'pending' && (o.offeredBy === 'customer' || o.driverId === driver.id)
        ? { ...o, status: 'accepted' as const }
        : o
    ),
    {
      id: `offer-rider-acc-${driver.id}-${nowMs}`,
      offeredBy: 'driver',
      driverId: driver.id,
      driverName: driver.name,
      driverVehicle: driver.vehicleType,
      driverPlate: driver.vehicleNumber,
      driverRating: driver.rating,
      amount: resolvedFare,
      action: 'CONFIRMED',
      status: 'accepted',
      timestamp: nowIso,
      roundNumber: Number(dispatch.currentRound || 1)
    }
  ];

  const nextActiveOffers: FareOffer[] = (dispatch.activeDriverOffers || []).map((o) =>
    o.driverId === driver.id
      ? { ...o, status: 'accepted' as const }
      : { ...o, status: 'rejected' as const }
  );

  const dispatchPatch: Partial<RideDispatchSummary> = {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: driver.id,
    confirmedDriverId: driver.id,
    driverName: driver.name,
    vehicleNumber: driver.vehicleNumber,
    driverRating: driver.rating,
    agreedFare: resolvedFare,
    agreedAt: dispatch.agreedAt || nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: nextActiveOffers.map(({ driverPhone: _dp, ...rest }) => rest),
    negotiationHistory: nextHistory.map(({ driverPhone: _dp, ...rest }) => rest),
    updatedAt: nowIso
  };

  const bookingPatch: Partial<RideBooking> = {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    driverLocality: driver.currentLocation || driver.locality || dispatch.pickupLocality,
    vehicleNumber: driver.vehicleNumber,
    driverRating: driver.rating,
    agreedFare: resolvedFare,
    agreedAt: dispatch.agreedAt || nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: nextActiveOffers,
    negotiationHistory: nextHistory,
    updatedAt: nowIso
  };

  return { dispatchPatch, bookingPatch, agreedFare: resolvedFare };
}

/**
 * Pure transaction preparation when Customer accepts a specific Rider's counter offer.
 */
export function prepareCustomerAcceptOfferTransaction(params: {
  ride: RideBooking;
  dispatch: RideDispatchSummary;
  offerId: string;
  nowMs?: number;
}): {
  dispatchPatch: Partial<RideDispatchSummary>;
  bookingPatch: Partial<RideBooking>;
  agreedFare: number;
  winningDriverId: string;
} {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { ride, dispatch, offerId } = params;

  if (dispatch.confirmedDriverId || ride.driverId) {
    throw new Error('RIDE_ALREADY_CONFIRMED: A driver is already confirmed for this ride.');
  }

  const transition = canTransitionRideStatus(dispatch.status, 'CONFIRMED', 'customer');
  if (!transition.allowed) {
    throw new Error(transition.reason || 'Offer can no longer be accepted.');
  }

  if (isRideOfferExpired(dispatch as unknown as RideBooking, nowMs)) {
    throw new Error('RIDE_EXPIRED: Offer validity expired.');
  }

  const activeOffers = dispatch.activeDriverOffers || ride.activeDriverOffers || [];
  const chosenOffer = activeOffers.find((o) => o.id === offerId && o.status === 'pending');
  if (!chosenOffer || !chosenOffer.driverId) {
    throw new Error('Selected rider offer is no longer active.');
  }

  const resolvedFare = Number(chosenOffer.amount);
  assertAgreedFareImmutable(ride, resolvedFare);

  const nextActiveOffers = activeOffers.map((o) =>
    o.id === offerId ? { ...o, status: 'accepted' as const } : { ...o, status: 'rejected' as const }
  );

  const nextHistory: FareOffer[] = [
    ...(dispatch.negotiationHistory || ride.negotiationHistory || []).map((o) =>
      o.id === offerId ? { ...o, status: 'accepted' as const } : o.status === 'pending' ? { ...o, status: 'rejected' as const } : o
    ),
    {
      id: `offer-cust-acc-${nowMs}`,
      offeredBy: 'customer',
      driverId: chosenOffer.driverId,
      driverName: chosenOffer.driverName,
      amount: resolvedFare,
      action: 'CONFIRMED',
      status: 'accepted',
      timestamp: nowIso,
      roundNumber: Number(dispatch.currentRound || ride.currentRound || 1)
    }
  ];

  const dispatchPatch: Partial<RideDispatchSummary> = {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    assignedDriverId: chosenOffer.driverId,
    confirmedDriverId: chosenOffer.driverId,
    driverName: chosenOffer.driverName || 'Verified Driver',
    vehicleNumber: chosenOffer.driverPlate || '',
    driverRating: chosenOffer.driverRating || 4.8,
    agreedFare: resolvedFare,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: nextActiveOffers.map(({ driverPhone: _dp, ...rest }) => rest),
    negotiationHistory: nextHistory.map(({ driverPhone: _dp, ...rest }) => rest),
    updatedAt: nowIso
  };

  const bookingPatch: Partial<RideBooking> = {
    status: 'CONFIRMED',
    routingStatus: 'assigned',
    driverId: chosenOffer.driverId,
    driverName: chosenOffer.driverName || 'Verified Driver',
    driverPhone: chosenOffer.driverPhone || '',
    vehicleNumber: chosenOffer.driverPlate || '',
    driverRating: chosenOffer.driverRating || 4.8,
    agreedFare: resolvedFare,
    agreedAt: nowIso,
    confirmedAt: nowIso,
    activeDriverOffers: nextActiveOffers,
    negotiationHistory: nextHistory,
    updatedAt: nowIso
  };

  return {
    dispatchPatch,
    bookingPatch,
    agreedFare: resolvedFare,
    winningDriverId: chosenOffer.driverId
  };
}

/**
 * Pure patch builder when a Driver submits a counter offer on /rideDispatch/{rideId}.
 */
export function prepareDriverCounterOfferPatch(params: {
  dispatch: RideDispatchSummary;
  driver: Driver;
  counterAmount: number;
  note?: string;
  nowMs?: number;
  extendTtlMs?: number;
}): Partial<RideDispatchSummary> {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { dispatch, driver } = params;

  if (dispatch.confirmedDriverId) {
    throw new Error('Ride already confirmed with another driver.');
  }
  if (isRideOfferExpired(dispatch as unknown as RideBooking, nowMs)) {
    throw new Error('Ride offer window has expired.');
  }
  const transition = canTransitionRideStatus(dispatch.status, 'COUNTER_OFFERED', 'driver');
  if (!transition.allowed) {
    throw new Error(transition.reason || 'Cannot submit counter offer for this ride.');
  }

  const nextRound = Number(dispatch.currentRound || 1) + 1;
  const check = validateCounterOfferAmount({
    amount: params.counterAmount,
    currentRound: nextRound,
    maxRounds: dispatch.maxNegotiationRounds || MAX_RIDE_NEGOTIATION_ROUNDS
  });
  if (!check.valid) {
    throw new Error(check.reason || 'Invalid counter offer.');
  }

  const ttlMs = params.extendTtlMs ?? DEFAULT_RIDE_OFFER_TTL_MS;
  const expiresAtMs = Math.max(dispatch.expiresAtMs || 0, nowMs + ttlMs);
  const expiresAt = new Date(expiresAtMs).toISOString();

  const newOffer: FareOffer = {
    id: `offer-drv-${driver.id}-${nowMs}`,
    offeredBy: 'driver',
    driverId: driver.id,
    driverName: driver.name,
    driverRating: driver.rating,
    driverVehicle: driver.vehicleType,
    driverPlate: driver.vehicleNumber,
    amount: check.amount,
    note: params.note?.trim() || undefined,
    action: 'COUNTER_OFFERED',
    status: 'pending',
    timestamp: nowIso,
    roundNumber: nextRound,
    expiresAt,
    expiresAtMs
  };

  // Mark any previous pending offer from THIS driver as countered
  const prevOffers = (dispatch.activeDriverOffers || []).map((o) =>
    o.driverId === driver.id && o.status === 'pending' ? { ...o, status: 'countered' as const } : o
  );
  const nextActiveOffers = [newOffer, ...prevOffers].map(({ driverPhone: _dp, ...rest }) => rest);
  const nextHistory = [...(dispatch.negotiationHistory || []), newOffer].map(
    ({ driverPhone: _dp, ...rest }) => rest
  );

  return {
    status: 'COUNTER_OFFERED',
    currentRound: nextRound,
    activeDriverOffers: nextActiveOffers,
    negotiationHistory: nextHistory,
    expiresAt,
    expiresAtMs,
    updatedAt: nowIso
  };
}

/**
 * Pure patch builder when a Customer counters back to riders.
 */
export function prepareCustomerCounterBackPatch(params: {
  ride: RideBooking;
  counterAmount: number;
  nowMs?: number;
  extendTtlMs?: number;
}): { bookingPatch: Partial<RideBooking>; dispatchPatch: Partial<RideDispatchSummary> } {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { ride } = params;

  if (ride.driverId) {
    throw new Error('Ride already confirmed; agreed fare cannot be changed.');
  }
  if (isRideOfferExpired(ride, nowMs)) {
    throw new Error('Ride offer window has expired.');
  }
  const transition = canTransitionRideStatus(ride.status, 'COUNTER_OFFERED', 'customer');
  if (!transition.allowed) {
    throw new Error(transition.reason || 'Cannot submit counter offer in current ride state.');
  }

  const nextRound = Number(ride.currentRound || 1) + 1;
  const check = validateCounterOfferAmount({
    amount: params.counterAmount,
    currentRound: nextRound,
    maxRounds: ride.maxNegotiationRounds || MAX_RIDE_NEGOTIATION_ROUNDS
  });
  if (!check.valid) {
    throw new Error(check.reason || 'Invalid counter amount.');
  }

  const ttlMs = params.extendTtlMs ?? DEFAULT_RIDE_OFFER_TTL_MS;
  const expiresAtMs = Math.max(ride.expiresAtMs || 0, nowMs + ttlMs);
  const expiresAt = new Date(expiresAtMs).toISOString();

  const custOffer: FareOffer = {
    id: `offer-cust-${nowMs}`,
    offeredBy: 'customer',
    amount: check.amount,
    action: 'COUNTER_OFFERED',
    status: 'pending',
    timestamp: nowIso,
    roundNumber: nextRound,
    expiresAt,
    expiresAtMs
  };

  const nextActiveOffers = (ride.activeDriverOffers || []).map((o) =>
    o.status === 'pending' ? { ...o, status: 'countered' as const } : o
  );
  const nextHistory = [...(ride.negotiationHistory || []), custOffer];

  const bookingPatch: Partial<RideBooking> = {
    status: 'COUNTER_OFFERED',
    customerProposedFare: check.amount,
    currentRound: nextRound,
    activeDriverOffers: nextActiveOffers,
    negotiationHistory: nextHistory,
    expiresAt,
    expiresAtMs,
    updatedAt: nowIso
  };

  const dispatchPatch: Partial<RideDispatchSummary> = {
    status: 'COUNTER_OFFERED',
    customerProposedFare: check.amount,
    currentRound: nextRound,
    activeDriverOffers: nextActiveOffers.map(({ driverPhone: _dp, ...rest }) => rest),
    negotiationHistory: nextHistory.map(({ driverPhone: _dp, ...rest }) => rest),
    expiresAt,
    expiresAtMs,
    updatedAt: nowIso
  };

  return { bookingPatch, dispatchPatch };
}

/**
 * Pure selector returning rides that currently require urgent foreground audio / notification alerting
 * for a given approved Online Driver. Stops immediately on CONFIRMED / REJECTED / CANCELLED / EXPIRED.
 */
export function getActionableRidesForDriver(params: {
  rides: RideBooking[];
  driver: Driver | null | undefined;
  routingConfig: UniversalRoutingConfig;
  partnerAccounts: PartnerAccount[];
  localities?: LocalityInfo[];
  localRejectedIds?: Set<string>;
  nowMs?: number;
}): RideBooking[] {
  const { rides, driver, routingConfig, partnerAccounts, localities, localRejectedIds, nowMs = Date.now() } = params;
  if (!driver || driver.status !== 'approved' || !driver.isOnline) {
    return [];
  }

  return rides.filter((ride) => {
    if (localRejectedIds?.has(ride.id)) return false;
    const res = isDriverEligibleForPendingRide({
      ride,
      driver,
      routingConfig,
      partnerAccounts,
      localities,
      nowMs
    });
    return res.eligible;
  });
}

/**
 * Pure selector returning pending rides that require Admin monitor attention / alert sound.
 * Stops immediately on CONFIRMED / PICKUP / IN_PROGRESS / COMPLETED / CANCELLED / REJECTED / EXPIRED.
 */
export function getActionableRidesForAdmin(
  rides: RideBooking[],
  nowMs: number = Date.now()
): RideBooking[] {
  return rides.filter((ride) => {
    const canonical = normalizeRideStatus(ride.status);
    if (!isRidePendingActionStatus(canonical)) return false;
    if (isRideOfferExpired(ride, nowMs)) return false;
    return true;
  });
}

/**
 * Builds a deterministic deduplication key for pending ride alert tracking
 * so the same ride state/round never triggers duplicate sound streams.
 */
export function getPendingAlertSignature(rides: RideBooking[]): string {
  if (!rides.length) return '';
  return rides
    .map((r) => `${r.id}:${normalizeRideStatus(r.status)}:${r.currentRound || 1}:${r.customerProposedFare || r.estimatedFare}`)
    .sort()
    .join('|');
}
