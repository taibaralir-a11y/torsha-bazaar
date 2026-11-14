import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  Phone, 
  MapPin, 
  ChevronDown, 
  PackageCheck,
  AlertTriangle,
  Filter,
  Check
} from 'lucide-react';
import { Order, OrderStatus, PublicRiderCard, Shop } from '../../types';

interface ShopOrdersTabProps {
  shop: Shop;
  orders: Order[];
  isAdmin?: boolean;
  approvedRiders?: PublicRiderCard[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, extra?: { rejectionReason?: string; riderId?: string; riderName?: string }) => void;
}

export const ShopOrdersTab: React.FC<ShopOrdersTabProps> = ({
  shop,
  orders,
  isAdmin = false,
  approvedRiders = [],
  onUpdateOrderStatus
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Item out of stock in Kalchini mandi');
  const [selectedRiderByOrder, setSelectedRiderByOrder] = useState<Record<string, string>>({});

  // Filter orders relevant to this shop
  const shopOrders = orders.filter((o) => !o.shopId || o.shopId === shop.id);

  const filteredOrders = shopOrders.filter((order) => {
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'in_progress') {
      return ['confirmed', 'preparing', 'ready_for_dispatch', 'out_for_delivery', 'packed'].includes(order.status);
    }
    if (filter === 'completed') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
    return true;
  });

  const handleAcceptOrder = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'confirmed');
  };

  const handleConfirmReject = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'rejected', { rejectionReason });
    setRejectingOrderId(null);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'ready_for_dispatch':
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'New Order Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing / Packing';
      case 'ready_for_dispatch':
      case 'packed': return 'Ready for Dispatch';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled by Customer';
      case 'rejected': return 'Rejected by Shop';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: `All (${shopOrders.length})` },
          { id: 'pending', label: `Pending (${shopOrders.filter((o) => o.status === 'pending').length})` },
          { id: 'in_progress', label: `In Fulfillment (${shopOrders.filter((o) => ['confirmed', 'preparing', 'ready_for_dispatch', 'out_for_delivery', 'packed'].includes(o.status)).length})` },
          { id: 'completed', label: `Delivered (${shopOrders.filter((o) => o.status === 'delivered').length})` },
          { id: 'cancelled', label: 'Cancelled / Rejected' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-[#0E7438] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">No orders in this category</h4>
          <p className="text-xs text-gray-400">
            {filter === 'pending'
              ? 'Great job! You have no pending orders waiting for review.'
              : 'Orders placed by customers in Torsa & Kalchini will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isTerminal = order.status === 'delivered' || order.status === 'cancelled' || order.status === 'rejected';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all space-y-3 ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-gray-900">#{order.id}</span>
                    <span className="text-[11px] text-gray-400">{order.date || 'Today'}</span>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                    {formatStatusLabel(order.status)}
                  </span>
                </div>

                {/* Customer Delivery Details */}
                <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{order.customerName || 'Customer'}</span>
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0E7438] bg-white px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order Items</span>
                  <div className="divide-y divide-gray-100 bg-gray-50 rounded-xl p-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 space-y-1 text-gray-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-gray-900">
                              {item.quantity}x {item.product.name}
                            </span>
                            {item.selectedWeightGrams ? (
                              <span className="block text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded w-fit mt-0.5">
                                ⚖️ Butcher Cut: {item.selectedWeightGrams}g (₹{item.product.pricePerKg ? Math.round(item.product.pricePerKg * (item.selectedWeightGrams / 1000)) : item.product.price} each)
                              </span>
                            ) : (
                              <span className="text-gray-500 text-[11px] block">
                                {item.product.unit} • {item.product.category}
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-gray-900">
                            ₹{item.selectedWeightGrams && item.product.pricePerKg 
                              ? Math.round(item.product.pricePerKg * (item.selectedWeightGrams / 1000)) * item.quantity 
                              : item.product.price * item.quantity}
                          </span>
                        </div>

                        {/* Prescription preview button if medicine */}
                        {item.prescriptionUrl && (
                          <div className="pt-1">
                            <a
                              href={item.prescriptionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200"
                            >
                              <span>📄 View Doctor's Prescription</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill & Payment */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-gray-500">Payment: </span>
                    <span className="font-semibold text-gray-800">{order.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Order Total: </span>
                    <span className="text-sm font-black text-gray-900">₹{order.total}</span>
                  </div>
                </div>

                {/* Rejection notice if rejected */}
                {order.rejectionReason && (
                  <div className="text-[11px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">
                    <strong>Rejection Reason:</strong> {order.rejectionReason}
                  </div>
                )}

                {/* Actions & Status Updater */}
                {!isTerminal && (
                  <div className="pt-2 border-t border-gray-100">
                    {isPending ? (
                      /* Accept or Reject buttons */
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="w-1/2 bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => setRejectingOrderId(order.id)}
                          className="w-1/2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      /* Status Advancement Selector */
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          Update Fulfillment Status
                        </label>
                        {order.riderName && order.riderId && (
                          <div className="text-[11px] bg-orange-50 text-orange-900 border border-orange-200 px-2.5 py-1.5 rounded-lg font-medium">
                            Assigned Rider: <strong>{order.riderName}</strong> ({order.riderId})
                          </div>
                        )}
                        {(order.status === 'ready_for_dispatch' || order.status === 'packed') && (
                          <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <label className="text-[10px] font-bold text-slate-600 block">
                              Select Verified Approved Fleet Rider (Required for Dispatch)
                            </label>
                            {approvedRiders.length === 0 ? (
                              <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                No approved riders loaded from fleet directory. Rider assignment blocked until an approved rider record is available.
                              </p>
                            ) : (
                              <select
                                value={selectedRiderByOrder[order.id] || ''}
                                onChange={(e) =>
                                  setSelectedRiderByOrder((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value
                                  }))
                                }
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                              >
                                <option value="">-- Choose Approved Rider --</option>
                                {approvedRiders.map((rider) => (
                                  <option key={rider.id} value={rider.id}>
                                    {rider.name} ({rider.locality}){rider.isOnline ? ' • Online' : ''}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                            disabled={order.status === 'preparing'}
                            className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                              order.status === 'preparing'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Preparing
                          </button>

                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'ready_for_dispatch')}
                            disabled={order.status === 'ready_for_dispatch'}
                            className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                              order.status === 'ready_for_dispatch' || order.status === 'packed'
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Ready / Packed
                          </button>

                          <button
                            onClick={() => {
                              const chosenId = selectedRiderByOrder[order.id];
                              const chosenRider = approvedRiders.find((r) => r.id === chosenId);
                              if (!chosenRider) return;
                              onUpdateOrderStatus(order.id, 'out_for_delivery', {
                                riderId: chosenRider.id,
                                riderName: chosenRider.name
                              });
                            }}
                            disabled={
                              order.status === 'out_for_delivery' ||
                              !approvedRiders.some((r) => r.id === selectedRiderByOrder[order.id])
                            }
                            className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                              order.status === 'out_for_delivery'
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 disabled:opacity-50'
                            }`}
                          >
                            Out for Delivery 🛵
                          </button>

                          <button
                            onClick={() => isAdmin && onUpdateOrderStatus(order.id, 'delivered')}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Admin complete delivery' : 'Assigned rider marks delivery completion'}
                            className={`text-xs py-1.5 px-2 rounded-lg font-bold shadow-xs transition-colors ${
                              isAdmin
                                ? 'bg-[#0E7438] hover:bg-emerald-800 text-white'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            {isAdmin ? 'Delivered ✓' : 'Rider Completes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-gray-900">Reject Order #{rejectingOrderId}</h4>
            <p className="text-xs text-gray-500">
              Please select or enter a reason for rejecting this order so the customer is notified.
            </p>

            <div className="space-y-2">
              {[
                'Item out of stock in Kalchini mandi',
                'Shop closed for the day',
                'Cannot deliver to this distance in Torsa',
                'Price or quantity mismatch'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className={`w-full text-left text-xs p-2.5 rounded-xl border font-medium ${
                    rejectionReason === reason
                      ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrderId(null)}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingOrderId)}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
