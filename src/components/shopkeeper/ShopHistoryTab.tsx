import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Search, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { Order, Shop } from '../../types';

interface ShopHistoryTabProps {
  shop: Shop;
  orders: Order[];
  onReviewReturnRequest?: (orderId: string, decision: 'approved' | 'rejected', notes?: string) => Promise<{ ok: boolean; error?: string }>;
}

export const ShopHistoryTab: React.FC<ShopHistoryTabProps> = ({
  shop,
  orders,
  onReviewReturnRequest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'returns' | 'cancelled'>('all');
  const [returnNotesByOrder, setReturnNotesByOrder] = useState<Record<string, string>>({});
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewErrorByOrder, setReviewErrorByOrder] = useState<Record<string, string>>({});
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const shopOrders = orders.filter((o) => !o.shopId || o.shopId === shop.id);
  const completedOrCancelledOrders = shopOrders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled' || o.status === 'rejected'
  );

  const filteredOrders = completedOrCancelledOrders.filter((o) => {
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'delivered' && o.status === 'delivered') ||
      (statusFilter === 'returns' && Boolean(o.returnRequest)) ||
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

  const handleReturnDecision = async (orderId: string, decision: 'approved' | 'rejected') => {
    if (!onReviewReturnRequest || reviewingOrderId === orderId) return;
    setReviewingOrderId(orderId);
    setReviewErrorByOrder((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
    try {
      const res = await onReviewReturnRequest(orderId, decision, returnNotesByOrder[orderId]);
      if (!res.ok) {
        setReviewErrorByOrder((prev) => ({
          ...prev,
          [orderId]: res.error || 'Could not update return status.'
        }));
      }
    } finally {
      setReviewingOrderId(null);
    }
  };

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
        <div className="text-right space-y-1">
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full block">
            {completedOrCancelledOrders.filter((o) => o.status === 'delivered').length} Completed Orders
          </span>
          {completedOrCancelledOrders.some((o) => Boolean(o.returnRequest)) && (
            <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">
              {completedOrCancelledOrders.filter((o) => Boolean(o.returnRequest)).length} Return Requests
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(['all', 'delivered', 'returns', 'cancelled'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setStatusFilter(filterKey)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${
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
            const isRejected = order.status === 'rejected';

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
                    <span>{isDelivered ? 'Delivered' : isRejected ? 'Rejected' : 'Cancelled by Customer'}</span>
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

                {order.returnRequest && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Return Request</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          order.returnRequest.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.returnRequest.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {order.returnRequest.status === 'pending_review' ? 'Pending Review' : order.returnRequest.status}
                      </span>
                    </div>
                    <p className="text-gray-900">
                      <strong>Reason:</strong> {order.returnRequest.reason}
                    </p>
                    {order.returnRequest.description && (
                      <p className="text-gray-700">
                        <strong>Note:</strong> {order.returnRequest.description}
                      </p>
                    )}
                    {order.returnRequest.photoEvidenceUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(order.returnRequest?.photoEvidenceUrl || null)}
                        className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-1.5 text-[11px] font-semibold text-gray-800"
                      >
                        <img
                          src={order.returnRequest.photoEvidenceUrl}
                          alt="Return evidence"
                          className="w-10 h-10 rounded-md object-cover border border-gray-200"
                        />
                        <span>Inspect Photo Evidence</span>
                      </button>
                    )}
                    {order.returnRequest.reviewNotes && (
                      <p className="text-[11px] bg-white p-2 rounded-lg border border-amber-200 text-gray-800">
                        <strong>Review Decision Note:</strong> {order.returnRequest.reviewNotes}
                      </p>
                    )}

                    {reviewErrorByOrder[order.id] && (
                      <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-lg text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>{reviewErrorByOrder[order.id]}</span>
                      </div>
                    )}

                    {onReviewReturnRequest && order.returnRequest.status === 'pending_review' && (
                      <div className="pt-2 border-t border-amber-200 space-y-2">
                        <input
                          type="text"
                          placeholder="Review note (optional)..."
                          value={returnNotesByOrder[order.id] || ''}
                          onChange={(e) =>
                            setReturnNotesByOrder((prev) => ({
                              ...prev,
                              [order.id]: e.target.value
                            }))
                          }
                          className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={reviewingOrderId === order.id}
                            onClick={() => handleReturnDecision(order.id, 'approved')}
                            className="flex-1 bg-[#0E7438] hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-1.5 rounded-lg text-xs"
                          >
                            {reviewingOrderId === order.id ? 'Saving...' : 'Approve Return'}
                          </button>
                          <button
                            type="button"
                            disabled={reviewingOrderId === order.id}
                            onClick={() => handleReturnDecision(order.id, 'rejected')}
                            className="flex-1 bg-white hover:bg-red-50 disabled:opacity-50 text-red-700 border border-red-200 font-bold py-1.5 rounded-lg text-xs"
                          >
                            Reject Return
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

      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-md w-full bg-white rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 bg-black/70 text-white rounded-full p-1.5"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhotoUrl} alt="Return evidence" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

