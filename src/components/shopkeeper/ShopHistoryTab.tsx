import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Search, Calendar, Phone } from 'lucide-react';
import { Order, Shop } from '../../types';

interface ShopHistoryTabProps {
  shop: Shop;
  orders: Order[];
}

export const ShopHistoryTab: React.FC<ShopHistoryTabProps> = ({ shop, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');

  const shopOrders = orders.filter((o) => !o.shopId || o.shopId === shop.id);
  const completedOrCancelledOrders = shopOrders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled' || o.status === 'rejected'
  );

  const filteredOrders = completedOrCancelledOrders.filter((o) => {
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'delivered' && o.status === 'delivered') ||
      (statusFilter === 'cancelled' && (o.status === 'cancelled' || o.status === 'rejected'));

    const matchesSearch =
      searchTerm === '' ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(searchTerm));

    return matchesFilter && matchesSearch;
  });

  const totalDeliveredRevenue = completedOrCancelledOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium">Historical Order Value</span>
          <h3 className="text-xl font-black text-gray-900 mt-0.5">
            ₹{totalDeliveredRevenue.toLocaleString()}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
            {completedOrCancelledOrders.filter((o) => o.status === 'delivered').length} Completed Orders
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
          />
        </div>

        <div className="flex gap-1">
          {(['all', 'delivered', 'cancelled'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setStatusFilter(filterKey)}
              className={`text-xs font-bold px-3 py-2 rounded-xl capitalize transition-all ${
                statusFilter === filterKey
                  ? 'bg-[#0E7438] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">No past orders found</h4>
          <p className="text-xs text-gray-400">Completed or cancelled orders will be archived here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-gray-900">#{order.id}</span>
                    <span className="text-[11px] text-gray-400">{order.date}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{isDelivered ? 'Delivered' : 'Cancelled'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{order.customerName || 'Customer'}</span>
                    <p className="text-[11px] text-gray-500">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900">₹{order.total}</span>
                    <p className="text-[10px] text-gray-400">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="text-xs bg-gray-50 p-2 rounded-xl text-gray-600">
                  {order.items.map((i, idx) => (
                    <span key={idx} className="mr-2 inline-block">
                      {i.quantity}x {i.product.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
