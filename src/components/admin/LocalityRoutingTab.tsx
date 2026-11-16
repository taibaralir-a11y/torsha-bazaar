import React, { useMemo, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Car,
  Wrench,
  Store,
  History,
  RefreshCw,
  Globe,
  Lock
} from 'lucide-react';
import {
  AssignmentAuditEntry,
  DeliveryPerson,
  DeliveryRequest,
  Driver,
  LocalityInfo,
  Order,
  PartnerAccount,
  RideBooking,
  RoutingAlert,
  RoutingServiceCategory,
  ServiceProvider,
  ServiceRequest,
  Shop,
  UniversalRoutingConfig
} from '../../types';
import {
  CORE_HUB_LOCALITIES,
  getEligibleDeliveryRidersForOrder,
  getEligiblePartnersForRequest,
  resolveAreaKey
} from '../../utils/hyperlocalRouting';

interface LocalityRoutingTabProps {
  routingConfig: UniversalRoutingConfig;
  routingAlerts: RoutingAlert[];
  localities: LocalityInfo[];
  shops: Shop[];
  deliveryPersons: DeliveryPerson[];
  drivers: Driver[];
  serviceProviders: ServiceProvider[];
  partnerAccounts: PartnerAccount[];
  orders: Order[];
  deliveryRequests: DeliveryRequest[];
  rideBookings: RideBooking[];
  serviceRequests: ServiceRequest[];
  onUpdateRoutingConfig: (next: UniversalRoutingConfig) => void;
  onAssignPartner: (params: {
    serviceCategory: RoutingServiceCategory;
    requestId: string;
    partnerId: string;
    isReassignment?: boolean;
  }) => { allowed: boolean; error?: string };
  onResolveAlert: (alertId: string) => void;
}

export const LocalityRoutingTab: React.FC<LocalityRoutingTabProps> = ({
  routingConfig,
  routingAlerts,
  localities,
  shops,
  deliveryPersons,
  drivers,
  serviceProviders,
  partnerAccounts,
  orders,
  deliveryRequests,
  rideBookings,
  serviceRequests,
  onUpdateRoutingConfig,
  onAssignPartner,
  onResolveAlert
}) => {
  const [subTab, setSubTab] = useState<'dispatch' | 'mappings'>('dispatch');
  const [selectedHub, setSelectedHub] = useState<string>('Hasimara');
  const [serviceFilter, setServiceFilter] = useState<'all' | RoutingServiceCategory>('all');
  const [localityFilter, setLocalityFilter] = useState<string>('all');
  const [selectedPartnerByKey, setSelectedPartnerByKey] = useState<Record<string, string>>({});
  const [expandedIneligible, setExpandedIneligible] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const openAlerts = useMemo(
    () => routingAlerts.filter((a) => a.status === 'open'),
    [routingAlerts]
  );

  const hubList = useMemo(() => {
    const names = Array.from(
      new Set([
        ...CORE_HUB_LOCALITIES,
        ...localities.map((l) => l.name)
      ])
    );
    return names;
  }, [localities]);

  const activeRule = useMemo(() => {
    return (
      routingConfig.rulesByLocality[selectedHub] || {
        localityName: selectedHub,
        crossLocalityEnabled: false,
        nearbyLocalities: [],
        shopIds: [],
        deliveryRiderIds: [],
        rideDriverIds: [],
        serviceProviderIds: []
      }
    );
  }, [routingConfig, selectedHub]);

  const toggleGlobalCross = () => {
    onUpdateRoutingConfig({
      ...routingConfig,
      globalCrossLocalityEnabled: !routingConfig.globalCrossLocalityEnabled,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleHubCross = (hub: string) => {
    const cur = routingConfig.rulesByLocality[hub] || activeRule;
    onUpdateRoutingConfig({
      ...routingConfig,
      rulesByLocality: {
        ...routingConfig.rulesByLocality,
        [hub]: {
          ...cur,
          localityName: hub,
          crossLocalityEnabled: !cur.crossLocalityEnabled,
          updatedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    });
  };

  const toggleNearbyLocality = (hub: string, nearby: string) => {
    const cur = routingConfig.rulesByLocality[hub] || activeRule;
    const exists = cur.nearbyLocalities.includes(nearby);
    const nextNearby = exists
      ? cur.nearbyLocalities.filter((n) => n !== nearby)
      : [...cur.nearbyLocalities, nearby];
    onUpdateRoutingConfig({
      ...routingConfig,
      rulesByLocality: {
        ...routingConfig.rulesByLocality,
        [hub]: {
          ...cur,
          localityName: hub,
          nearbyLocalities: nextNearby,
          updatedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    });
  };

  const togglePartnerMapping = (
    hub: string,
    field: 'shopIds' | 'deliveryRiderIds' | 'rideDriverIds' | 'serviceProviderIds',
    partnerId: string
  ) => {
    const cur = routingConfig.rulesByLocality[hub] || activeRule;
    const list = cur[field] || [];
    const exists = list.includes(partnerId);
    const nextList = exists ? list.filter((id) => id !== partnerId) : [...list, partnerId];
    onUpdateRoutingConfig({
      ...routingConfig,
      rulesByLocality: {
        ...routingConfig.rulesByLocality,
        [hub]: {
          ...cur,
          localityName: hub,
          [field]: nextList,
          updatedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    });
  };

  // Unified normalized queue across ALL 4 service categories
  const unifiedQueue = useMemo(() => {
    type QueueItem = {
      key: string;
      requestId: string;
      serviceCategory: RoutingServiceCategory;
      title: string;
      subtitle: string;
      requestLocality: string;
      statusLabel: string;
      routingStatus?: string;
      assignedPartnerId?: string;
      assignedPartnerName?: string;
      assignedPartnerLocality?: string;
      requestedVehicleType?: 'taxi' | 'auto' | 'toto';
      requestedServiceCategory?: string;
      auditHistory: AssignmentAuditEntry[];
      createdAt: string;
    };

    const items: QueueItem[] = [];

    // 1. Shop Orders
    orders
      .filter((o) => !['delivered', 'cancelled', 'rejected'].includes(o.status))
      .forEach((o) => {
        const svcCat: RoutingServiceCategory = 'shop_order';
        const reqLoc = resolveAreaKey(
          o.pickupLocality || o.shopLocality || o.locality || 'Hasimara',
          localities
        );
        items.push({
          key: `${svcCat}:${o.id}`,
          requestId: o.id,
          serviceCategory: svcCat,
          title: `Shop Order · ${o.shopName || 'Store'}`,
          subtitle: `${o.customerName || 'Customer'} → ${o.deliveryAddress} (Drop: ${resolveAreaKey(
            o.locality || reqLoc,
            localities
          )})`,
          requestLocality: reqLoc,
          statusLabel: o.status,
          routingStatus: o.routingStatus,
          assignedPartnerId: o.riderId,
          assignedPartnerName: o.riderName && o.riderName !== 'Assigned on Dispatch' ? o.riderName : undefined,
          assignedPartnerLocality: o.riderLocality,
          auditHistory: o.assignmentHistory || [],
          createdAt: o.createdAt || ''
        });
      });

    // 3. Delivery Requests
    deliveryRequests
      .filter((d) => !['delivered', 'cancelled', 'failed'].includes(d.status))
      .forEach((d) => {
        const reqLoc = resolveAreaKey(d.pickupLocality || d.senderAddress, localities);
        items.push({
          key: `delivery:${d.id}`,
          requestId: d.id,
          serviceCategory: 'delivery',
          title: `Parcel Delivery · ${d.parcelDescription}`,
          subtitle: `Pickup: ${d.senderAddress} → Drop: ${d.receiverAddress} (${d.weightCategory})`,
          requestLocality: reqLoc,
          statusLabel: d.status,
          routingStatus: d.routingStatus,
          assignedPartnerId: d.assignedDeliveryPersonId,
          assignedPartnerName: d.assignedDeliveryPersonName,
          assignedPartnerLocality: d.assignedDeliveryPersonLocality,
          auditHistory: d.assignmentHistory || [],
          createdAt: d.createdAt || ''
        });
      });

    // 4. Ride Requests (Toto / Auto / Taxi)
    rideBookings
      .filter((r) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'completed', 'cancelled'].includes(r.status))
      .forEach((r) => {
        const reqLoc = resolveAreaKey(r.pickupLocality || r.pickupLocation, localities);
        items.push({
          key: `ride:${r.id}`,
          requestId: r.id,
          serviceCategory: 'ride',
          title: `${r.vehicleType.toUpperCase()} Ride · ${r.pickupLocation} → ${r.dropLocation}`,
          subtitle: `Passenger: ${r.customerName} (${r.customerPhone}) · Est. ₹${r.agreedFare || r.estimatedFare}`,
          requestLocality: reqLoc,
          statusLabel: r.status,
          routingStatus: r.routingStatus,
          assignedPartnerId: r.driverId,
          assignedPartnerName: r.driverName,
          assignedPartnerLocality: r.driverLocality,
          requestedVehicleType: r.vehicleType,
          auditHistory: r.assignmentHistory || [],
          createdAt: r.createdAt || ''
        });
      });

    // 5. Home Service Requests
    serviceRequests
      .filter((s) => !['completed', 'cancelled'].includes(s.status))
      .forEach((s) => {
        const reqLoc = resolveAreaKey(s.locality || s.address, localities);
        items.push({
          key: `service:${s.id}`,
          requestId: s.id,
          serviceCategory: 'service',
          title: `${s.category} Service · ${s.issueDescription}`,
          subtitle: `Customer: ${s.customerName} · ${s.address} (${s.preferredTime})`,
          requestLocality: reqLoc,
          statusLabel: s.status,
          routingStatus: s.routingStatus,
          assignedPartnerId: s.providerId,
          assignedPartnerName: s.providerName,
          assignedPartnerLocality: s.providerLocality,
          requestedServiceCategory: s.category,
          auditHistory: s.assignmentHistory || [],
          createdAt: s.createdAt || ''
        });
      });

    return items
      .filter((item) => serviceFilter === 'all' || item.serviceCategory === serviceFilter)
      .filter(
        (item) =>
          localityFilter === 'all' ||
          item.requestLocality.toLowerCase() === localityFilter.toLowerCase()
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [
    orders,
    deliveryRequests,
    rideBookings,
    serviceRequests,
    localities,
    serviceFilter,
    localityFilter
  ]);

  const handleDoAssign = (
    key: string,
    serviceCategory: RoutingServiceCategory,
    requestId: string,
    defaultEligibleId: string | undefined,
    isReassignment: boolean
  ) => {
    const partnerId = selectedPartnerByKey[key] || defaultEligibleId;
    if (!partnerId) {
      setFeedback({ type: 'err', text: 'Select an eligible local partner before assigning.' });
      return;
    }
    const res = onAssignPartner({
      serviceCategory,
      requestId,
      partnerId,
      isReassignment
    });
    if (res.allowed) {
      setFeedback({
        type: 'ok',
        text: `${isReassignment ? 'Reassigned' : 'Assigned'} ${requestId} with locality verification.`
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.error || 'Assignment blocked by locality routing rules.'
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const categoryIcon = (cat: RoutingServiceCategory) => {
    if (cat === 'shop_order') return <Store className="w-4 h-4 text-emerald-600" />;
    if (cat === 'delivery') return <Truck className="w-4 h-4 text-blue-600" />;
    if (cat === 'ride') return <Car className="w-4 h-4 text-amber-600" />;
    return <Wrench className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Policy & Cross-Locality Master Banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Universal Locality-Based Admin Routing
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Strictly enforces Admin-approved locality boundaries across Shop Orders,
            Parcel Deliveries, Toto/Auto/Taxi Rides, and Home Services. Zero random cross-area
            broadcasts.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleGlobalCross}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition ${
            routingConfig.globalCrossLocalityEnabled
              ? 'bg-emerald-600 text-white border-emerald-700 shadow'
              : 'bg-gray-900 text-white border-gray-900'
          }`}
        >
          {routingConfig.globalCrossLocalityEnabled ? (
            <>
              <Globe className="w-4 h-4" /> Global Cross-Locality: ENABLED (Area Rules Apply)
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" /> Global Cross-Locality: STRICTLY BLOCKED
            </>
          )}
        </button>
      </div>

      {/* Admin Routing Alerts when 0 local partners exist */}
      {openAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Admin Dispatch Alerts — No Local Partner Available ({openAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {openAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-xl p-3 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-gray-900">{alert.message}</span>
                  <p className="text-[11px] text-gray-500">
                    Area: {alert.requestLocality} · Logged {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onResolveAlert(alert.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setSubTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            subTab === 'dispatch'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Live Routing &amp; Dispatch Console ({unifiedQueue.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('mappings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            subTab === 'mappings'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Locality Mappings &amp; Nearby Service Rules
        </button>
      </div>

      {/* SUB-TAB A: LIVE UNIVERSAL DISPATCH CONSOLE */}
      {subTab === 'dispatch' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: 'All 4 Services' },
                  { id: 'shop_order', label: '1. Shop Orders' },
                  { id: 'delivery', label: '2. Delivery Fleet' },
                  { id: 'ride', label: '3. Toto / Auto / Taxi' },
                  { id: 'service', label: '4. Home Services' }
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setServiceFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    serviceFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold bg-white"
            >
              <option value="all">All Localities</option>
              {CORE_HUB_LOCALITIES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {unifiedQueue.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
              <p className="font-bold text-gray-700 text-sm">
                No active pending or in-flight requests in this filter.
              </p>
            </div>
          ) : (
            unifiedQueue.map((item) => {
              // Compute strict Eligible vs Ineligible list using Universal Routing Engine
              const evaluation =
                item.serviceCategory === 'shop_order'
                  ? getEligibleDeliveryRidersForOrder({
                      pickupLocality: item.requestLocality,
                      config: routingConfig,
                      deliveryPersons,
                      partnerAccounts,
                      localities
                    })
                  : getEligiblePartnersForRequest({
                      serviceCategory: item.serviceCategory,
                      requestLocality: item.requestLocality,
                      requestedVehicleType: item.requestedVehicleType,
                      requestedServiceCategory: item.requestedServiceCategory,
                      config: routingConfig,
                      shops,
                      deliveryPersons,
                      drivers,
                      serviceProviders,
                      partnerAccounts,
                      localities
                    });

              const selectedPartnerId =
                selectedPartnerByKey[item.key] || evaluation.eligible[0]?.partnerId || '';
              const showIneligible = Boolean(expandedIneligible[item.key]);

              return (
                <div
                  key={item.key}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {categoryIcon(item.serviceCategory)}
                        <span className="font-black text-gray-900 text-sm">{item.requestId}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Pickup/Area: {item.requestLocality}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                          Status: {item.statusLabel}
                        </span>
                        {item.assignedPartnerName ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Assigned: {item.assignedPartnerName} (
                            {item.assignedPartnerLocality || item.requestLocality})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Pending Local Assignment
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.subtitle}</p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-emerald-700">
                        {evaluation.eligible.length} Eligible
                      </span>{' '}
                      ·{' '}
                      <span className="font-bold text-red-600">
                        {evaluation.ineligible.length} Blocked/Ineligible
                      </span>
                    </div>
                  </div>

                  {/* Eligible Partner Assignment Selector */}
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                    {evaluation.eligible.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          No eligible online partner in {item.requestLocality}. Request remains
                          pending — approve a local partner or enable nearby cross-locality routing
                          in Locality Mappings.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <select
                          value={selectedPartnerId}
                          onChange={(e) =>
                            setSelectedPartnerByKey((prev) => ({
                              ...prev,
                              [item.key]: e.target.value
                            }))
                          }
                          className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                        >
                          {evaluation.eligible.map((rep) => (
                            <option key={rep.partnerId} value={rep.partnerId}>
                              {rep.partnerName} · Base: {rep.baseLocality} · Live:{' '}
                              {rep.currentLocation}{' '}
                              {rep.crossLocalityUsed ? '[Admin Cross-Locality]' : '[Exact Local]'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            handleDoAssign(
                              item.key,
                              item.serviceCategory,
                              item.requestId,
                              evaluation.eligible[0]?.partnerId,
                              Boolean(item.assignedPartnerId)
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {item.assignedPartnerId ? 'Reassign Eligible Partner' : 'Assign Partner'}
                        </button>
                      </div>
                    )}

                    {/* Toggle Ineligible / Blocked Candidates with exact reasons */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIneligible((prev) => ({
                          ...prev,
                          [item.key]: !showIneligible
                        }))
                      }
                      className="text-[11px] font-bold text-gray-600 hover:text-gray-900 underline cursor-pointer"
                    >
                      {showIneligible
                        ? 'Hide Ineligible Partners'
                        : `Inspect ${evaluation.ineligible.length} Blocked / Ineligible Partners & Reasons`}
                    </button>

                    {showIneligible && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {evaluation.ineligible.map((rep) => (
                          <div
                            key={rep.partnerId}
                            className="p-2.5 rounded-lg bg-red-50/70 border border-red-200 text-[11px]"
                          >
                            <p className="font-bold text-red-900">
                              {rep.partnerName} (Base: {rep.baseLocality} · Live:{' '}
                              {rep.currentLocation})
                            </p>
                            <p className="text-red-700 mt-0.5">{rep.reasons.join(' · ')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignment Audit History Timeline */}
                  {item.auditHistory.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3.5 h-3.5" /> Assignment History &amp; Timestamps
                      </p>
                      <div className="space-y-1">
                        {item.auditHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="text-[11px] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-2"
                          >
                            <span>
                              <strong className="uppercase">{entry.action}</strong>{' '}
                              {entry.partnerName ? `→ ${entry.partnerName}` : ''}{' '}
                              {entry.partnerCurrentLocation
                                ? `(${entry.partnerCurrentLocation})`
                                : ''}{' '}
                              · {entry.reason}
                            </span>
                            <span className="text-gray-500 font-mono">
                              {new Date(entry.timestamp).toLocaleString()} · by {entry.assignedBy}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB B: LOCALITY MAPPINGS & NEARBY RULES */}
      {subTab === 'mappings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Locality Selector */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2 h-fit">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
              Service Localities
            </p>
            {hubList.map((hub) => {
              const rule = routingConfig.rulesByLocality[hub];
              return (
                <button
                  key={hub}
                  type="button"
                  onClick={() => setSelectedHub(hub)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                    selectedHub === hub
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {hub}
                  </span>
                  {rule?.crossLocalityEnabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">Cross OK</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Locality Rule & Partner Mapping Checklists */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Routing Rules for {selectedHub}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Only checked partners and approved nearby localities can serve {selectedHub}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHubCross(selectedHub)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    activeRule.crossLocalityEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {selectedHub} Cross-Locality:{' '}
                  {activeRule.crossLocalityEnabled ? 'ALLOWED' : 'DISABLED'}
                </button>
              </div>

              {/* Approved Nearby Localities */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Approved Nearby Localities That Can Serve {selectedHub} (Requires Cross-Locality
                  Enabled):
                </p>
                <div className="flex flex-wrap gap-2">
                  {CORE_HUB_LOCALITIES.filter((h) => h !== selectedHub).map((other) => {
                    const checked = activeRule.nearbyLocalities.includes(other);
                    return (
                      <label
                        key={other}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNearbyLocality(selectedHub, other)}
                        />
                        {other}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4 Partner Category Mappings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Delivery Riders */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-black text-gray-800">
                    Delivery Riders Mapped to {selectedHub}
                  </p>
                  {deliveryPersons.map((rider) => (
                    <label
                      key={rider.id}
                      className="flex items-center justify-between text-xs py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activeRule.deliveryRiderIds.includes(rider.id)}
                          onChange={() =>
                            togglePartnerMapping(selectedHub, 'deliveryRiderIds', rider.id)
                          }
                        />
                        <span className="font-semibold text-gray-900">{rider.name}</span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {resolveAreaKey(rider.currentLocation || rider.locality, localities)} ·{' '}
                        {rider.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Ride Drivers */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-black text-gray-800">
                    Ride Drivers (Toto/Auto/Taxi) Mapped to {selectedHub}
                  </p>
                  {drivers.map((drv) => (
                    <label
                      key={drv.id}
                      className="flex items-center justify-between text-xs py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activeRule.rideDriverIds.includes(drv.id)}
                          onChange={() =>
                            togglePartnerMapping(selectedHub, 'rideDriverIds', drv.id)
                          }
                        />
                        <span className="font-semibold text-gray-900">
                          {drv.name} ({drv.vehicleType.toUpperCase()})
                        </span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {resolveAreaKey(drv.currentLocation || drv.locality || '', localities)} ·{' '}
                        {drv.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Shops */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-black text-gray-800">
                    Local Shops Serving {selectedHub}
                  </p>
                  {shops.map((shop) => (
                    <label
                      key={shop.id}
                      className="flex items-center justify-between text-xs py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activeRule.shopIds.includes(shop.id)}
                          onChange={() =>
                            togglePartnerMapping(selectedHub, 'shopIds', shop.id)
                          }
                        />
                        <span className="font-semibold text-gray-900">{shop.name}</span>
                      </span>
                      <span className="text-[11px] text-gray-500">{shop.locality}</span>
                    </label>
                  ))}
                </div>

                {/* Home Service Providers */}
                <div className="p-3.5 rounded-xl border border-gray-200 space-y-2 md:col-span-2">
                  <p className="text-xs font-black text-gray-800">
                    Home Service Providers Serving {selectedHub}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceProviders.map((sp) => (
                      <label
                        key={sp.id}
                        className="flex items-center justify-between text-xs py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activeRule.serviceProviderIds.includes(sp.id)}
                            onChange={() =>
                              togglePartnerMapping(selectedHub, 'serviceProviderIds', sp.id)
                            }
                          />
                          <span className="font-semibold text-gray-900">
                            {sp.name} ({sp.category})
                          </span>
                        </span>
                        <span className="text-[11px] text-gray-500">{sp.serviceArea}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
