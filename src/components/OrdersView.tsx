import React from 'react';
import { ArrowLeft, Clock, MapPin, CheckCircle2, ChevronRight, Phone, ShoppingBag, Truck } from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  currentCustomerUid?: string | null;
  onBackToHome: () => void;
  onTrackOrder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  currentCustomerUid,
  onBackToHome,
  onTrackOrder
}) => {
  const customerOrders = currentCustomerUid
    ? orders.filter((order) => order.customerId === currentCustomerUid)
    : [];

  return (
    <div className="pb-24">
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
              My Orders & Bookings
            </h2>
            <p className="text-xs text-emerald-700 font-medium">Track live deliveries in Kalchini & Torsa</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {customerOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Explore our Best Deals and add items to your cart!</p>
          </div>
        ) : (
          customerOrders.map((order) => {
            const isLive = ['pending', 'confirmed', 'preparing', 'ready_for_dispatch', 'packed', 'out_for_delivery', 'placed'].includes(order.status);

            const getStatusBadge = () => {
              switch (order.status) {
                case 'pending':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse">Awaiting Shop Acceptance ⏳</span>;
                case 'confirmed':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Confirmed by Shop ✓</span>;
                case 'preparing':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">Shop Preparing Items 📦</span>;
                case 'ready_for_dispatch':
                case 'packed':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">Ready for Dispatch 🛵</span>;
                case 'out_for_delivery':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse">Out for Delivery 🛵</span>;
                case 'delivered':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Delivered ✓</span>;
                case 'rejected':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">Rejected by Shop ✕</span>;
                case 'cancelled':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">Cancelled</span>;
                default:
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Processing</span>;
              }
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3"
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <span className="font-mono font-bold text-xs text-gray-900">#{order.id}</span>
                    <span className="text-[11px] text-gray-400 block">{order.date}</span>
                  </div>

                  {getStatusBadge()}
                </div>

                {/* Items summary */}
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery info */}
                <div className="bg-gray-50 p-2.5 rounded-xl text-xs flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="text-sm font-extrabold text-gray-900 ml-1">₹{order.total}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({order.paymentMethod})</span>
                  </div>

                  {isLive ? (
                    <button
                      onClick={() => onTrackOrder(order)}
                      className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Live Track</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Order Complete
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
