import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Power, 
  AlertCircle, 
  ArrowLeft,
  User,
  Package,
  Navigation,
  ShieldCheck,
  Star
} from 'lucide-react';
import { DeliveryPerson, DeliveryRequest, DeliveryStatus, Order, OrderStatus } from '../../types';

interface DeliveryDashboardProps {
  rider: DeliveryPerson;
  deliveries: DeliveryRequest[];
  assignedOrders?: Order[];
  onSwitchPortal: () => void;
  onUpdateRider: (updated: Partial<DeliveryPerson>) => void;
  onUpdateDeliveryStatus: (deliveryId: string, status: DeliveryStatus) => void;
  onAcceptDelivery: (deliveryId: string, riderId: string, riderName: string, riderPhone: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  rider,
  deliveries,
  assignedOrders = [],
  onSwitchPortal,
  onUpdateRider,
  onUpdateDeliveryStatus,
  onAcceptDelivery,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history' | 'profile'>('available');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(rider.name);
  const [editPhone, setEditPhone] = useState(rider.phone);
  const [editLocality, setEditLocality] = useState(rider.locality);

  // Available parcel assignments
  const availableDeliveries = deliveries.filter(
    (d) => d.status === 'pending_assignment' || (d.status === 'assigned' && d.assignedDeliveryPersonId === rider.id)
  );

  // Active parcel being fulfilled
  const activeDelivery = deliveries.find(
    (d) => d.assignedDeliveryPersonId === rider.id &&
           (d.status === 'accepted' || d.status === 'picked_up' || d.status === 'on_the_way')
  );

  // Store orders dispatched by approved shopkeepers to this rider
  const activeStoreOrders = assignedOrders.filter(
    (o) => o.riderId === rider.id && ['packed', 'ready_for_dispatch', 'out_for_delivery'].includes(o.status)
  );
  const completedStoreOrders = assignedOrders.filter(
    (o) => o.riderId === rider.id && o.status === 'delivered'
  );

  // Completed parcels
  const completedDeliveries = deliveries.filter(
    (d) => d.assignedDeliveryPersonId === rider.id && (d.status === 'delivered' || d.status === 'failed')
  );

  const totalEarnings = completedDeliveries
    .filter((d) => d.status === 'delivered')
    .reduce((sum, d) => sum + d.estimatedPrice, 0);

  const isApproved = rider.status === 'approved';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRider({
      name: editName,
      phone: editPhone,
      locality: editLocality
    });
    setShowEditModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Delivery Header */}
      <div className="bg-sky-800 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchPortal}
              className="p-1.5 bg-sky-900/60 rounded-lg hover:bg-sky-900 transition-colors"
              title="Switch Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-wide">TORSA FLEET</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-600 text-sky-100">
                  COURIER
                </span>
              </div>
              <p className="text-xs text-sky-200">Delivery Partner Portal</p>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <button
            onClick={() => onUpdateRider({ isOnline: !rider.isOnline })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              rider.isOnline
                ? 'bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-300'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {rider.isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {/* Rider Badge */}
        <div className="bg-sky-900/70 backdrop-blur-xs rounded-xl p-3 flex items-center justify-between border border-sky-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center font-black text-white text-base border-2 border-sky-400">
              {rider.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{rider.name}</p>
              <p className="text-xs text-sky-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400" />
                {rider.locality}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-300 font-bold text-xs justify-end">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>{rider.rating.toFixed(1)}</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                rider.status === 'approved'
                  ? 'bg-emerald-400 text-emerald-950 font-black'
                  : rider.status === 'pending'
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : 'bg-red-400 text-white font-black'
              }`}
            >
              {rider.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Warning if not approved */}
        {!isApproved && (
          <div className="mt-2 bg-amber-500/20 border border-amber-400/40 rounded-lg p-2 text-[11px] text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Partner profile is <strong>{rider.status}</strong>. Admin verification is required before taking parcel assignments.
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex justify-between">
        <button
          onClick={() => setActiveTab('available')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'available'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Assignments ({availableDeliveries.length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Active Run
          {(activeDelivery || activeStoreOrders.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Earnings ({completedDeliveries.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 flex-1">
        {/* TAB 1: AVAILABLE ASSIGNMENTS */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Parcel & Delivery Orders</h3>
              <span className="text-xs text-gray-500">Live Orders</span>
            </div>

            {availableDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Pending Deliveries</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When local stores or customers request delivery, they will appear here for pickup in Kalchini & Dooars.
                </p>
              </div>
            ) : (
              availableDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {delivery.id}
                    </span>
                    <span className="text-base font-black text-sky-800">
                      ₹{delivery.estimatedPrice} Fee
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg text-xs font-medium text-gray-700">
                    📦 <strong>Package:</strong> {delivery.parcelDescription} ({delivery.weightCategory})
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-gray-400 font-medium">Pickup Zone:</span>
                        <p className="font-bold text-gray-900">
                          {delivery.assignedDeliveryPersonId === rider.id && delivery.status !== 'pending_assignment'
                            ? `${delivery.senderName} (${delivery.senderPhone})`
                            : 'Sender details protected until pickup acceptance'}
                        </p>
                        <p className="text-gray-600">
                          {delivery.assignedDeliveryPersonId === rider.id && delivery.status !== 'pending_assignment'
                            ? delivery.senderAddress
                            : `${delivery.senderAddress.split(',')[0] || 'Local Pickup Area'} (Exact address unlocks on accept)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-gray-400 font-medium">Drop Zone:</span>
                        <p className="font-bold text-gray-900">
                          {delivery.assignedDeliveryPersonId === rider.id && delivery.status !== 'pending_assignment'
                            ? `${delivery.receiverName} (${delivery.receiverPhone})`
                            : 'Receiver details protected until pickup acceptance'}
                        </p>
                        <p className="text-gray-600">
                          {delivery.assignedDeliveryPersonId === rider.id && delivery.status !== 'pending_assignment'
                            ? delivery.receiverAddress
                            : `${delivery.receiverAddress.split(',')[0] || 'Local Drop Area'} (Exact address unlocks on accept)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!isApproved || !rider.isOnline}
                    onClick={() => {
                      onAcceptDelivery(delivery.id, rider.id, rider.name, rider.phone);
                      setActiveTab('active');
                    }}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept Parcel Pickup (Earn ₹{delivery.estimatedPrice})
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERY */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeStoreOrders.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-800">
                  Assigned Store Orders ({activeStoreOrders.length})
                </h4>
                {activeStoreOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-emerald-800">{order.id}</span>
                        <p className="font-bold text-gray-900 mt-0.5">{order.shopName || 'Local Store'}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-700">₹{order.total}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">{order.customerName} ({order.customerPhone})</p>
                      <p className="text-gray-600">{order.deliveryAddress}</p>
                      <p className="text-[11px] text-gray-500">Status: <strong className="uppercase">{order.status.replace(/_/g, ' ')}</strong></p>
                    </div>
                    <div className="flex gap-2">
                      {(order.status === 'packed' || order.status === 'ready_for_dispatch') && onUpdateOrderStatus && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')}
                          className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                        >
                          Picked Up & Out for Delivery
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && onUpdateOrderStatus && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                        >
                          Mark Store Order Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDelivery ? (
              <div className="bg-white rounded-2xl border-2 border-sky-500 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping" />
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                      Active Delivery Task
                    </span>
                  </div>
                  <span className="text-sm font-black text-gray-900 bg-sky-50 px-2.5 py-1 rounded-lg">
                    ₹{activeDelivery.estimatedPrice}
                  </span>
                </div>

                {/* Sender details */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pickup Location</span>
                    <a
                      href={`tel:${activeDelivery.senderPhone}`}
                      className="text-sky-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" /> Call Sender
                    </a>
                  </div>
                  <p className="font-bold text-gray-900">{activeDelivery.senderName}</p>
                  <p className="text-gray-600">{activeDelivery.senderAddress}</p>
                </div>

                {/* Receiver details */}
                <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-700 uppercase">Drop Location</span>
                    <a
                      href={`tel:${activeDelivery.receiverPhone}`}
                      className="text-sky-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" /> Call Receiver
                    </a>
                  </div>
                  <p className="font-bold text-gray-900">{activeDelivery.receiverName}</p>
                  <p className="text-gray-600">{activeDelivery.receiverAddress}</p>
                </div>

                {/* Delivery progression buttons */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-gray-700 block">Delivery Stage:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateDeliveryStatus(activeDelivery.id, 'picked_up')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        activeDelivery.status === 'picked_up'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      1. Picked Up Parcel
                    </button>

                    <button
                      onClick={() => onUpdateDeliveryStatus(activeDelivery.id, 'on_the_way')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        activeDelivery.status === 'on_the_way'
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      2. On The Way
                    </button>
                  </div>

                  <button
                    onClick={() => onUpdateDeliveryStatus(activeDelivery.id, 'delivered')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Handed Over & Collect ₹{activeDelivery.estimatedPrice}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Mark delivery as failed?')) {
                        onUpdateDeliveryStatus(activeDelivery.id, 'failed');
                      }
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Failed / Receiver Unavailable
                  </button>
                </div>
              </div>
            ) : activeStoreOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Navigation className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Active Delivery Run</h4>
                <p className="text-xs text-gray-500">
                  Accept an assignment from the assignments tab to begin your delivery route.
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-colors"
                >
                  View Assignments ({availableDeliveries.length})
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: EARNINGS & COMPLETED RUNS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Delivery Pay</span>
                <p className="text-xl font-black text-sky-800 mt-1">₹{totalEarnings}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {completedDeliveries.filter((d) => d.status === 'delivered').length} parcels · {completedStoreOrders.length} store orders
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400">Rider Rating</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-black text-gray-900">{rider.rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-sky-600 font-bold mt-0.5">Verified Delivery Pro</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-gray-800">Delivered History</h4>
              {completedDeliveries.length === 0 && completedStoreOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No completed deliveries yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {completedStoreOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900">Store Order {o.id} ({o.shopName || 'Shop'})</p>
                        <p className="text-[10px] text-gray-500">To: {o.customerName} • {o.deliveryAddress}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-800">₹{o.total}</span>
                        <span className="text-[9px] font-bold block uppercase text-emerald-600">
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {completedDeliveries.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{d.parcelDescription}</p>
                        <p className="text-[10px] text-gray-500">To: {d.receiverName} • {d.receiverAddress}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sky-800">₹{d.estimatedPrice}</span>
                        <span
                          className={`text-[9px] font-bold block uppercase ${
                            d.status === 'delivered' ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-800">Partner Details</h4>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-sky-700 hover:underline"
              >
                Edit Info
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-gray-100">
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-bold text-gray-900">{rider.name}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Contact Phone</span>
                <span className="font-mono font-bold text-gray-900">{rider.phone}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Service Locality</span>
                <span className="font-bold text-gray-900">{rider.locality}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-500">Approval Status</span>
                <span className="font-bold text-sky-800 capitalize">{rider.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Update Fleet Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Rider Name</label>
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
                <label className="font-bold text-gray-700 block mb-1">Base Locality</label>
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
                  className="flex-1 py-2.5 bg-sky-600 text-white font-bold rounded-xl shadow-sm hover:bg-sky-700"
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
