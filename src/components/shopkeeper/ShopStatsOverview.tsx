import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ShieldCheck, 
  Package,
  ArrowRight
} from 'lucide-react';
import { Shop, Order, Product } from '../../types';

interface ShopStatsOverviewProps {
  shop: Shop;
  orders: Order[];
  products: Product[];
  onNavigateToTab: (tab: 'orders' | 'products' | 'profile' | 'history') => void;
}

export const ShopStatsOverview: React.FC<ShopStatsOverviewProps> = ({
  shop,
  orders,
  products,
  onNavigateToTab
}) => {
  const shopOrders = orders.filter((o) => !o.shopId || o.shopId === shop.id);
  const pendingOrders = shopOrders.filter((o) => o.status === 'pending');
  const activeFulfillmentOrders = shopOrders.filter((o) => 
    o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready_for_dispatch' || o.status === 'out_for_delivery'
  );
  const completedOrders = shopOrders.filter((o) => o.status === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0) + (shop.totalRevenue || 0);

  const inStockProducts = products.filter((p) => p.inStock !== false);

  return (
    <div className="space-y-4">
      {/* Shop Status Banner */}
      {shop.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950 text-sm">Shop Status: Pending Admin Verification</h4>
            <p className="text-amber-800 leading-relaxed">
              Your registration has been submitted to the Torsa Bazaar marketplace team in Kalchini. You can configure your store profile, add inventory, and set prices. <strong>Per marketplace security rules, your products will remain private and hidden from customer search until an admin approves your shop.</strong>
            </p>
          </div>
        </div>
      )}

      {shop.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 shadow-xs flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Shop Status: Rejected</h4>
            <p className="text-red-800 leading-relaxed">
              This shop has been rejected by the marketplace admin. Pending or rejected shops are not allowed to sell or accept customer orders. Please review your shop details or contact Kalchini support at +91 94340 12890.
            </p>
          </div>
        </div>
      )}

      {shop.status === 'suspended' && (
        <div className="bg-gray-100 border border-gray-300 rounded-2xl p-4 text-xs text-gray-800 shadow-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Shop Status: Suspended</h4>
            <p className="text-gray-600 leading-relaxed">
              Your merchant account is temporarily suspended. New customer orders cannot be received.
            </p>
          </div>
        </div>
      )}

      {shop.status === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0E7438]" />
            <div>
              <span className="font-bold text-emerald-950 block text-xs">Shop is Approved & Live</span>
              <span className="text-[11px] text-emerald-800">Your inventory is published to customers across Kalchini & Dooars.</span>
            </div>
          </div>
          <span className="bg-[#0E7438] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0E7438] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            ₹{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
            {completedOrders.length} orders fulfilled
          </p>
        </div>

        {/* Pending Orders */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold">New Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-amber-700 leading-tight">
            {pendingOrders.length}
          </h3>
          <p className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-0.5">
            <span>Requires action</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </p>
        </div>

        {/* Active In-Progress */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold">In Fulfillment</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-blue-700 leading-tight">
            {activeFulfillmentOrders.length}
          </h3>
          <p className="text-[10px] text-blue-800 font-semibold mt-1">
            Preparing / Out for delivery
          </p>
        </div>

        {/* Total Products */}
        <div 
          onClick={() => onNavigateToTab('products')}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold">Products</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            {products.length}
          </h3>
          <p className="text-[10px] text-teal-800 font-semibold mt-1">
            {inStockProducts.length} in stock
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateToTab('orders')}
          className="p-3 bg-gradient-to-r from-emerald-700 to-[#0E7438] hover:from-emerald-800 hover:to-emerald-900 text-white rounded-2xl shadow-xs text-left active:scale-95 transition-all flex flex-col justify-between min-h-[85px]"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-bold">Incoming Orders</span>
            <ShoppingBag className="w-4 h-4 text-yellow-300" />
          </div>
          <span className="text-[11px] text-emerald-100">
            {pendingOrders.length > 0 ? `${pendingOrders.length} waiting to accept` : 'View all orders'}
          </span>
        </button>

        <button
          onClick={() => onNavigateToTab('products')}
          className="p-3 bg-white border border-gray-200 hover:border-[#0E7438] text-gray-900 rounded-2xl shadow-xs text-left active:scale-95 transition-all flex flex-col justify-between min-h-[85px]"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-bold text-gray-800">Add Product</span>
            <Package className="w-4 h-4 text-[#0E7438]" />
          </div>
          <span className="text-[11px] text-gray-500">
            Manage inventory & pricing
          </span>
        </button>
      </div>
    </div>
  );
};
