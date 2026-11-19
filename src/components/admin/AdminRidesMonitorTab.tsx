import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Car,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Volume2,
  VolumeX,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  Driver,
  LocalityInfo,
  NotificationTokenRecord,
  PartnerAccount,
  RideBooking,
  RideDispatchSummary,
  RideNotificationLog,
  RoutingServiceCategory,
  UniversalRoutingConfig
} from '../../types';
import {
  getEligiblePartnersForRequest,
  INITIAL_SERVICE_LOCALITIES
} from '../../utils/hyperlocalRouting';
import {
  getActionableRidesForAdmin,
  getRideRemainingSeconds,
  normalizeRideStatus
} from '../../utils/rideLifecycle';

interface AdminRidesMonitorTabProps {
  rideBookings: RideBooking[];
  rideDispatchSummaries: RideDispatchSummary[];
  drivers: Driver[];
  routingConfig: UniversalRoutingConfig;
  partnerAccounts: PartnerAccount[];
  localities?: LocalityInfo[];
  notificationTokens: NotificationTokenRecord[];
  rideNotificationLogs: RideNotificationLog[];
  focusedRideId?: string | null;
  alertAudioStatus?: {
    muted: boolean;
    snoozed: boolean;
    snoozeRemainingSec: number;
    activeCount: number;
    isRinging: boolean;
    unlocked: boolean;
  };
  notificationPermission?: 'granted' | 'denied' | 'default' | 'unsupported';
  onToggleAlertMute?: () => void;
  onSnoozeAlerts?: (durationMs?: number) => void;
  onUnlockAndTestAudio?: () => Promise<boolean> | void;
  onEnablePushNotifications?: () => Promise<void> | void;
  onAssignPartnerWithRouting?: (params: {
    serviceCategory: RoutingServiceCategory;
    requestId: string;
    partnerId: string;
    isReassignment?: boolean;
  }) => { allowed: boolean; error?: string };
  onCancelRide?: (rideId: string) => Promise<{ ok: boolean; error?: string } | void> | void;
  onExpireRide?: (rideId: string) => Promise<{ ok: boolean; error?: string } | void> | void;
}

type RideFilterTab =
  | 'all'
  | 'pending'
  | 'countered'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled';

export const AdminRidesMonitorTab: React.FC<AdminRidesMonitorTabProps> = ({
  rideBookings,
  rideDispatchSummaries,
  drivers,
  routingConfig,
  partnerAccounts,
  localities = INITIAL_SERVICE_LOCALITIES,
  notificationTokens,
  rideNotificationLogs,
  focusedRideId,
  alertAudioStatus,
  notificationPermission = 'default',
  onToggleAlertMute,
  onSnoozeAlerts,
  onUnlockAndTestAudio,
  onEnablePushNotifications,
  onAssignPartnerWithRouting,
  onCancelRide,
  onExpireRide
}) => {
  const [filter, setFilter] = useState<RideFilterTab>('all');
  const [selectedDriverMap, setSelectedDriverMap] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dispatchMap = useMemo(
    () => new Map(rideDispatchSummaries.map((d) => [d.id, d])),
    [rideDispatchSummaries]
  );

  const actionablePending = useMemo(
    () => getActionableRidesForAdmin(rideBookings, nowMs),
    [rideBookings, nowMs]
  );

  const filteredRides = useMemo(() => {
    const sorted = [...rideBookings].sort((a, b) =>
      (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
    );
    return sorted.filter((r) => {
      const st = normalizeRideStatus(r.status);
      if (filter === 'all') return true;
      if (filter === 'pending') return st === 'REQUESTED' || st === 'OFFER_SENT';
      if (filter === 'countered') return st === 'COUNTER_OFFERED';
      if (filter === 'confirmed') return st === 'CONFIRMED';
      if (filter === 'active') return st === 'PICKUP' || st === 'IN_PROGRESS';
      if (filter === 'completed') return st === 'COMPLETED';
      if (filter === 'expired') return st === 'EXPIRED';
      if (filter === 'cancelled') return st === 'CANCELLED' || st === 'REJECTED';
      return true;
    });
  }, [rideBookings, filter]);

  const activeTokens = useMemo(
    () => notificationTokens.filter((t) => t.active !== false),
    [notificationTokens]
  );

  const fcmReadyTokens = useMemo(
    () => activeTokens.filter((t) => t.fcmEnabled),
    [activeTokens]
  );

  const statusBadgeClass = (status: string) => {
    const st = normalizeRideStatus(status);
    switch (st) {
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PICKUP':
      case 'IN_PROGRESS':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'COUNTER_OFFERED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'REQUESTED':
      case 'OFFER_SENT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'COMPLETED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'EXPIRED':
        return 'bg-slate-600/30 text-slate-300 border-slate-500/40';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Sound, Push & Notification Control Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BellRing className={`w-4 h-4 ${alertAudioStatus?.isRinging ? 'text-amber-400 animate-bounce' : 'text-purple-400'}`} />
              <span>Real-Time Ride Dispatch & Smart Alert Monitor</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Persistent alarm rings for pending local rides until confirmed, rejected, cancelled, or expired. Agreed fares lock immutably.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onToggleAlertMute && (
              <button
                type="button"
                onClick={onToggleAlertMute}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-colors ${
                  alertAudioStatus?.muted
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                    : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                }`}
              >
                {alertAudioStatus?.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{alertAudioStatus?.muted ? 'Alerts Muted' : 'Sound Active'}</span>
              </button>
            )}
            {onSnoozeAlerts && (
              <button
                type="button"
                onClick={() => onSnoozeAlerts(alertAudioStatus?.snoozed ? 0 : 5 * 60 * 1000)}
                className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5"
              >
                {alertAudioStatus?.snoozed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>
                  {alertAudioStatus?.snoozed
                    ? `Resume (${alertAudioStatus.snoozeRemainingSec}s)`
                    : 'Snooze 5m'}
                </span>
              </button>
            )}
            {onUnlockAndTestAudio && (
              <button
                type="button"
                onClick={() => onUnlockAndTestAudio()}
                className="px-3 py-1.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Test Alert Tone
              </button>
            )}
          </div>
        </div>

        {/* Metrics & Notification Coverage Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Rides</span>
            <span className="text-lg font-black text-amber-400">{actionablePending.length}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Locked / Active</span>
            <span className="text-lg font-black text-emerald-400">
              {rideBookings.filter((r) => ['CONFIRMED', 'PICKUP', 'IN_PROGRESS'].includes(normalizeRideStatus(r.status))).length}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Alert Tokens</span>
            <span className="text-lg font-black text-sky-400">{activeTokens.length}</span>
            <span className="text-[10px] text-slate-400 block">FCM: {fcmReadyTokens.length}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Browser Alerts</span>
            {notificationPermission === 'granted' ? (
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Granted
              </span>
            ) : onEnablePushNotifications ? (
              <button
                type="button"
                onClick={() => onEnablePushNotifications()}
                className="mt-1 px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
              >
                Enable OS Alerts
              </button>
            ) : (
              <span className="text-[11px] text-amber-300 font-bold">{notificationPermission}</span>
            )}
          </div>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            actionNotice.type === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{actionNotice.text}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'all', label: `All (${rideBookings.length})` },
            { id: 'pending', label: 'Pending' },
            { id: 'countered', label: 'Counter Offered' },
            { id: 'confirmed', label: 'Confirmed 🔒' },
            { id: 'active', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'expired', label: 'Expired' },
            { id: 'cancelled', label: 'Cancelled/Rejected' }
          ] as { id: RideFilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ride Monitor List */}
      {filteredRides.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
          No rides in this filter category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => {
            const st = normalizeRideStatus(ride.status);
            const dispatch = dispatchMap.get(ride.id);
            const remainingSec = getRideRemainingSeconds(ride, nowMs);
            const isPending = ['REQUESTED', 'OFFER_SENT', 'COUNTER_OFFERED', 'CUSTOMER_ACCEPTED', 'RIDER_ACCEPTED'].includes(st);
            const isFocused = focusedRideId === ride.id;
            const reqLocality = ride.pickupLocality || ride.pickupLocation;
            const evalReport = getEligiblePartnersForRequest({
              serviceCategory: 'ride',
              requestLocality: reqLocality,
              requestedVehicleType: ride.vehicleType,
              config: routingConfig,
              drivers,
              partnerAccounts,
              localities
            });
            const selectedDriverId = selectedDriverMap[ride.id] || '';

            return (
              <div
                key={ride.id}
                className={`bg-slate-800/90 rounded-2xl p-4 border space-y-3 transition-all ${
                  isFocused
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : isPending
                    ? 'border-purple-500/40'
                    : 'border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Car className="w-4 h-4 text-sky-400" />
                    <span className="font-mono font-bold text-white">{ride.id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 font-bold uppercase text-[10px]">
                      {ride.vehicleType}
                    </span>
                    <span className={`px-2 py-0.5 rounded border font-bold uppercase text-[10px] ${statusBadgeClass(ride.status)}`}>
                      {st}
                    </span>
                    {typeof ride.agreedFare === 'number' && ride.agreedFare > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 font-bold text-[10px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Agreed ₹{ride.agreedFare}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    {isPending && (
                      <span className="font-mono font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {remainingSec}s
                      </span>
                    )}
                    <span className="font-mono text-slate-400">
                      {(ride.createdAt || '').slice(11, 19) || '—'}
                    </span>
                  </div>
                </div>

                {/* Route & Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-300">
                      <span className="text-slate-400">Customer:</span>{' '}
                      <strong className="text-white">{ride.customerName}</strong>{' '}
                      {ride.customerPhone ? <span className="font-mono text-slate-400">({ride.customerPhone})</span> : null}
                    </p>
                    <p className="text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>{ride.pickupLocality || ride.pickupLocation}</strong> →{' '}
                        <strong>{ride.dropLocality || ride.dropLocation}</strong>
                      </span>
                    </p>
                    {(ride.pickupLandmark || ride.dropLandmark) && (
                      <p className="text-[11px] text-slate-400">
                        Landmarks: {ride.pickupLandmark || '—'} → {ride.dropLandmark || '—'}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-900/70 border border-slate-700/70 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer Offer:</span>
                      <strong className="text-amber-300">₹{ride.customerProposedFare ?? ride.estimatedFare}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Guidance Fare:</span>
                      <span className="text-slate-200 font-semibold">₹{ride.suggestedFare ?? ride.estimatedFare}</span>
                    </div>
                    {ride.driverName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Rider:</span>
                        <span className="text-emerald-300 font-bold">
                          {ride.driverName} ({ride.vehicleNumber || ride.driverId})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Notified Local Riders:</span>
                      <span className="text-sky-300 font-semibold">
                        {(dispatch?.eligibleDriverIds || ride.eligibleDriverIds || evalReport.eligible.map((e) => e.partnerId)).length}
                        {' '}approved / {(dispatch?.rejectedDriverIds || ride.rejectedDriverIds || []).length} declined
                      </span>
                    </div>
                  </div>
                </div>

                {/* Negotiation History */}
                {ride.negotiationHistory && ride.negotiationHistory.length > 0 && (
                  <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Negotiation History (Round {ride.currentRound || 1})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ride.negotiationHistory.map((h, i) => (
                        <span
                          key={h.id || i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200"
                        >
                          R{h.roundNumber}: {h.offeredBy === 'customer' ? 'Customer' : h.driverName || 'Rider'} ₹{h.amount} ({h.status})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Controls: Safe Locality Dispatch, Expire, Cancel */}
                {isPending && (
                  <div className="pt-2 border-t border-slate-700/70 flex flex-col sm:flex-row sm:items-center gap-2">
                    {onAssignPartnerWithRouting && !ride.driverId && (
                      <div className="flex-1 flex items-center gap-2">
                        <select
                          value={selectedDriverId}
                          onChange={(e) =>
                            setSelectedDriverMap((prev) => ({ ...prev, [ride.id]: e.target.value }))
                          }
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="">
                            {evalReport.eligible.length > 0
                              ? `Select Approved ${ride.vehicleType.toUpperCase()} (${evalReport.eligible.length})`
                              : `No Eligible Local ${ride.vehicleType.toUpperCase()} Online`}
                          </option>
                          {evalReport.eligible.map((ev) => (
                            <option key={ev.partnerId} value={ev.partnerId}>
                              {ev.partnerName} — {ev.baseLocality}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedDriverId || busyRideId === ride.id}
                          onClick={() => {
                            if (!selectedDriverId) return;
                            const res = onAssignPartnerWithRouting({
                              serviceCategory: 'ride',
                              requestId: ride.id,
                              partnerId: selectedDriverId
                            });
                            if (!res.allowed) {
                              setActionNotice({ type: 'err', text: res.error || 'Routing policy blocked assignment.' });
                            } else {
                              setActionNotice({ type: 'ok', text: `Dispatched approved local driver for ride ${ride.id}.` });
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl whitespace-nowrap flex items-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Dispatch
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {onExpireRide && remainingSec === 0 && (
                        <button
                          type="button"
                          disabled={busyRideId === ride.id}
                          onClick={async () => {
                            setBusyRideId(ride.id);
                            try {
                              await onExpireRide(ride.id);
                            } finally {
                              setBusyRideId(null);
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Mark Expired
                        </button>
                      )}
                      {onCancelRide && (
                        <button
                          type="button"
                          disabled={busyRideId === ride.id}
                          onClick={async () => {
                            setBusyRideId(ride.id);
                            try {
                              await onCancelRide(ride.id);
                              setActionNotice({ type: 'ok', text: `Ride ${ride.id} cancelled.` });
                            } finally {
                              setBusyRideId(null);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Delivery Audit Timeline */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Notification Delivery Logs ({rideNotificationLogs.length})</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            Spark plan: in-app listeners & PWA local/foreground notifications active
          </span>
        </div>
        {rideNotificationLogs.length === 0 ? (
          <p className="text-slate-400 text-[11px] py-2">
            No ride notification events logged yet. Submitting a new ride or counter-offer records delivery telemetry here.
          </p>
        ) : (
          <div className="divide-y divide-slate-700/60 max-h-60 overflow-y-auto pr-1">
            {rideNotificationLogs.slice(0, 25).map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="font-mono font-bold text-white">{log.rideId}</span>
                  <span className="text-slate-300 ml-2">
                    {log.eventType} → <strong>{log.recipientRole}</strong> ({log.recipientId})
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 font-mono text-[10px]">
                    {log.channel}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {(log.timestamp || '').slice(11, 19)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
