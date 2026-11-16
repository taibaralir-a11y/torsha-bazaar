import React from 'react';
import { X, Phone, CheckCircle2, Truck, XCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import { Order } from '../types';
import { computeCartItemLineTotal } from '../utils/checkoutOrder';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isRejected = order.status === 'rejected';
  const isOut = order.status === 'out_for_delivery';
  const isPacked = order.status === 'ready_for_dispatch' || order.status === 'packed';
  const isPreparing = order.status === 'preparing';
  const isPending = order.status === 'pending' || order.status === 'placed';

  const steps = [
    { 
      title: 'Order Placed by Customer', 
      time: order.date || 'Received', 
      status: 'completed' 
    },
    { 
      title: 'Accepted by Shopkeeper', 
      time: isPending ? 'Pending Review' : 'Confirmed', 
      status: isPending ? 'active' : 'completed' 
    },
    { 
      title: 'Packed & Ready in Shop', 
      time: isPreparing ? 'Packing now' : (isPacked || isOut || isDelivered) ? 'Ready' : 'Waiting', 
      status: isPreparing ? 'active' : (isPacked || isOut || isDelivered) ? 'completed' : 'pending' 
    },
    { 
      title: 'Out for Delivery on Scooter', 
      time: isOut ? 'On Road' : isDelivered ? 'Arrived' : 'Assigning rider', 
      status: isOut ? 'active' : isDelivered ? 'completed' : 'pending' 
    },
    { 
      title: 'Delivered at Doorstep', 
      time: isDelivered ? 'Complete' : order.estimatedDelivery || '15-20 mins', 
      status: isDelivered ? 'completed' : 'pending' 
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${isCancelled || isRejected ? 'bg-slate-800' : 'bg-[#0E7438]'} text-white p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isCancelled || isRejected ? (
              <XCircle className="w-5 h-5 text-red-300" />
            ) : (
              <Truck className="w-5 h-5 text-yellow-300" />
            )}
            <div>
              <h3 className="text-base font-bold">Live Order Tracking</h3>
              <p className="text-[11px] text-emerald-100 font-mono">Order #{order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Map Banner */}
        <div className={`p-4 border-b relative overflow-hidden ${
          isCancelled || isRejected
            ? 'bg-red-50 border-red-100'
            : 'bg-gradient-to-b from-emerald-100/60 to-emerald-50 border-emerald-100'
        }`}>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                isCancelled || isRejected ? 'text-red-800 bg-white' : 'text-emerald-800 bg-white/80'
              }`}>
                {isCancelled ? 'Order Cancelled' : isRejected ? 'Order Rejected' : isDelivered ? 'Delivered' : 'Estimated Arrival'}
              </span>
              <h4 className="text-2xl font-black text-gray-900 leading-tight">
                {isCancelled
                  ? 'Cancelled by Customer'
                  : isRejected
                  ? 'Rejected by Shop'
                  : isDelivered
                  ? 'Delivered ✓'
                  : order.estimatedDelivery}
              </h4>
              <p className="text-xs text-gray-600 font-medium">
                {isCancelled
                  ? 'This order has been cancelled and will not be dispatched.'
                  : isRejected
                  ? order.rejectionReason || 'The shop could not fulfill this order.'
                  : `Heading towards ${order.deliveryAddress.split(',')[0]}`}
              </p>
            </div>

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md ${
              isCancelled || isRejected ? 'bg-red-600 text-white' : 'bg-[#0E7438]'
            }`}>
              {isCancelled || isRejected ? '✕' : '🛵'}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {isOut && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="font-semibold">
                Your order is out for delivery. Cancellation is no longer available.
              </span>
            </div>
          )}

          {order.returnRequest && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Return Request:{' '}
                  {order.returnRequest.status === 'approved'
                    ? 'Approved ✓'
                    : order.returnRequest.status === 'rejected'
                    ? 'Rejected ✕'
                    : 'Pending Review'}
                </span>
              </div>
              <p className="text-gray-700">Reason: {order.returnRequest.reason}</p>
            </div>
          )}

          {!isCancelled && !isRejected && (
            <>
              {/* Delivery Partner Details */}
              <div className="flex items-center justify-between bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold text-base flex items-center justify-center">
                    {order.riderId && order.riderName && order.riderName !== 'Assigned on Dispatch'
                      ? order.riderName.slice(0, 2).toUpperCase()
                      : '--'}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">
                      {order.riderId && order.riderName && order.riderName !== 'Assigned on Dispatch'
                        ? order.riderName
                        : order.routingStatus === 'unavailable_in_locality'
                          ? 'No Local Rider Online — Admin Alerted'
                          : 'Pending Local Rider Assignment'}
                    </h5>
                    <p className="text-xs text-emerald-700 font-medium">
                      {order.riderId
                        ? `${order.riderLocality || order.pickupLocality || order.locality || 'Local'} Delivery Partner ★ 4.9`
                        : `Locality Routing: ${order.pickupLocality || order.locality || 'Local Zone'}`}
                    </p>
                    <p className="text-[10px] text-gray-500">Torsha Fleet Delivery</p>
                  </div>
                </div>

                {order.riderPhone && order.riderId && (
                  <a
                    href={`tel:${order.riderPhone}`}
                    className="bg-[#0E7438] hover:bg-emerald-800 text-white p-2.5 rounded-full shadow-xs flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Call Rider"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Timeline steps */}
              <div className="space-y-3 px-1">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Delivery Progress
                </h5>
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 ${
                          st.status === 'completed'
                            ? 'bg-[#0E7438] text-white'
                            : st.status === 'active'
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {st.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 flex justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            st.status === 'active'
                              ? 'text-gray-900 font-bold'
                              : st.status === 'completed'
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {st.title}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">{st.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Items Summary in Order */}
          <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1.5 border border-gray-100">
            <div className="flex justify-between font-bold text-gray-800 pb-1 border-b border-gray-200/60">
              <span>Order Summary ({order.items.length} items)</span>
              <span>₹{order.total} ({order.paymentMethod})</span>
            </div>
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-gray-600">
                <span>
                  {i.quantity}x {i.product.name}
                  {i.selectedWeightGrams ? ` (${i.selectedWeightGrams}g)` : ''}
                </span>
                <span>₹{computeCartItemLineTotal(i)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

