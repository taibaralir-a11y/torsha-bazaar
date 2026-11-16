import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Truck,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Camera,
  X,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Order, ReturnReason } from '../types';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import { computeCartItemLineTotal, isCustomerOrderCancellable } from '../utils/checkoutOrder';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface OrdersViewProps {
  orders: Order[];
  currentCustomerUid?: string | null;
  onBackToHome: () => void;
  onTrackOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => Promise<ActionResult>;
  onRequestReturn: (
    orderId: string,
    payload: { reason: ReturnReason; description?: string; photoEvidenceUrl?: string }
  ) => Promise<ActionResult>;
}

const ALLOWED_RETURN_REASONS: ReturnReason[] = [
  'Damaged or defective items',
  'Wrong items delivered'
];

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  currentCustomerUid,
  onBackToHome,
  onTrackOrder,
  onCancelOrder,
  onRequestReturn
}) => {
  const customerOrders = currentCustomerUid
    ? orders.filter((order) => order.customerId === currentCustomerUid)
    : [];

  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderActionError, setOrderActionError] = useState<Record<string, string>>({});
  const [orderActionNotice, setOrderActionNotice] = useState<Record<string, string>>({});

  // Return request modal state
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReturnReason | ''>('');
  const [returnDescription, setReturnDescription] = useState('');
  const [photoEvidenceUrl, setPhotoEvidenceUrl] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [returnFormError, setReturnFormError] = useState<string | null>(null);
  const [submittingReturnOrderId, setSubmittingReturnOrderId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const openReturnModal = (order: Order) => {
    if (!currentCustomerUid || order.customerId !== currentCustomerUid) return;
    if (order.status !== 'delivered' || order.returnRequest) return;
    setReturnModalOrder(order);
    setSelectedReason('');
    setReturnDescription('');
    setPhotoEvidenceUrl('');
    setReturnFormError(null);
  };

  const closeReturnModal = () => {
    if (submittingReturnOrderId) return;
    setReturnModalOrder(null);
    setSelectedReason('');
    setReturnDescription('');
    setPhotoEvidenceUrl('');
    setReturnFormError(null);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReturnFormError(null);
    setPhotoUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setPhotoEvidenceUrl(dataUrl);
    } catch (err: any) {
      setReturnFormError(err?.message || 'Unable to process selected photo.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirmCancel = async (order: Order) => {
    if (!currentCustomerUid || order.customerId !== currentCustomerUid) {
      setOrderActionError((prev) => ({
        ...prev,
        [order.id]: 'You can only cancel orders belonging to your signed-in account.'
      }));
      return;
    }
    if (cancellingOrderId === order.id || order.status === 'cancelled') return;

    setCancellingOrderId(order.id);
    setOrderActionError((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
    try {
      const res = await onCancelOrder(order.id);
      if (!res.ok) {
        setOrderActionError((prev) => ({
          ...prev,
          [order.id]: res.error || 'Could not cancel this order.'
        }));
      } else {
        setConfirmCancelOrderId(null);
        setOrderActionNotice((prev) => ({
          ...prev,
          [order.id]: 'Order cancelled successfully.'
        }));
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder || !currentCustomerUid) return;
    if (returnModalOrder.customerId !== currentCustomerUid) {
      setReturnFormError('You can only request returns for your own orders.');
      return;
    }
    if (returnModalOrder.returnRequest || submittingReturnOrderId === returnModalOrder.id) {
      setReturnFormError('A return request already exists for this order.');
      return;
    }
    if (!selectedReason || !ALLOWED_RETURN_REASONS.includes(selectedReason)) {
      setReturnFormError('Please select one of the eligible return reasons.');
      return;
    }

    setReturnFormError(null);
    setSubmittingReturnOrderId(returnModalOrder.id);
    try {
      const res = await onRequestReturn(returnModalOrder.id, {
        reason: selectedReason,
        description: returnDescription.trim() || undefined,
        photoEvidenceUrl: photoEvidenceUrl || undefined
      });
      if (!res.ok) {
        setReturnFormError(res.error || 'Could not submit return request.');
      } else {
        const orderId = returnModalOrder.id;
        setReturnModalOrder(null);
        setSelectedReason('');
        setReturnDescription('');
        setPhotoEvidenceUrl('');
        setOrderActionNotice((prev) => ({
          ...prev,
          [orderId]: 'Return request submitted for Admin & Shopkeeper review.'
        }));
      }
    } finally {
      setSubmittingReturnOrderId(null);
    }
  };

  const getReturnBadge = (status: NonNullable<Order['returnRequest']>['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Return Approved ✓
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            Return Rejected ✕
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

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
            const isOwner = Boolean(currentCustomerUid && order.customerId === currentCustomerUid);
            const isLive = ['pending', 'confirmed', 'preparing', 'ready_for_dispatch', 'packed', 'out_for_delivery', 'placed'].includes(order.status);
            const canCancel = isOwner && isCustomerOrderCancellable(order.status);
            const isOutForDelivery = order.status === 'out_for_delivery';
            const isDelivered = order.status === 'delivered';
            const isCancellingThis = cancellingOrderId === order.id;

            const getStatusBadge = () => {
              switch (order.status) {
                case 'pending':
                case 'placed':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse">Awaiting Shop Acceptance ⏳</span>;
                case 'confirmed':
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Accepted by Shop ✓</span>;
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
                  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-800">Cancelled</span>;
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-gray-900">#{order.id}</span>
                      {order.locality && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {order.locality}
                        </span>
                      )}
                    </div>
                    {order.shopName && (
                      <span className="text-[11px] text-emerald-800 font-semibold block">
                        {order.shopName}
                      </span>
                    )}
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
                        {item.selectedWeightGrams ? ` (${item.selectedWeightGrams}g)` : ''}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{computeCartItemLineTotal(item)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery info */}
                <div className="bg-gray-50 p-2.5 rounded-xl text-xs flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                </div>

                {/* Rejection reason notice */}
                {order.status === 'rejected' && order.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-xs text-red-800">
                    <strong>Shop Note:</strong> {order.rejectionReason}
                  </div>
                )}

                {/* Out for Delivery Cancellation Lock Notice */}
                {isOutForDelivery && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold">
                        Your order is out for delivery. Cancellation is no longer available.
                      </p>
                      <button
                        type="button"
                        disabled
                        className="mt-1 bg-gray-100 text-gray-400 border border-gray-200 font-bold text-[11px] py-1 px-2.5 rounded-lg cursor-not-allowed inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order Disabled</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Cancel Confirmation */}
                {canCancel && confirmCancelOrderId === order.id && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-red-900">
                      Cancel Order #{order.id}? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isCancellingThis}
                        onClick={() => handleConfirmCancel(order)}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        {isCancellingThis ? 'Cancelling...' : 'Yes, Cancel Order'}
                      </button>
                      <button
                        type="button"
                        disabled={isCancellingThis}
                        onClick={() => setConfirmCancelOrderId(null)}
                        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Return Request Status Card */}
                {isDelivered && order.returnRequest && (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Return Request #{order.returnRequest.id}</span>
                      </span>
                      {getReturnBadge(order.returnRequest.status)}
                    </div>
                    <p className="text-gray-800">
                      <strong>Reason:</strong> {order.returnRequest.reason}
                    </p>
                    {order.returnRequest.description && (
                      <p className="text-gray-700">
                        <strong>Details:</strong> {order.returnRequest.description}
                      </p>
                    )}
                    {order.returnRequest.photoEvidenceUrl && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(order.returnRequest?.photoEvidenceUrl || null)}
                          className="inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg p-1.5 hover:bg-emerald-50"
                        >
                          <img
                            src={order.returnRequest.photoEvidenceUrl}
                            alt="Return photo evidence"
                            className="w-10 h-10 rounded-md object-cover border border-gray-200"
                          />
                          <span>View Submitted Photo Evidence</span>
                        </button>
                      </div>
                    )}
                    {order.returnRequest.reviewNotes && (
                      <p className="text-[11px] bg-white/90 border border-gray-200 rounded-lg p-2 text-gray-800">
                        <strong>Review Note ({order.returnRequest.reviewedBy === 'shopkeeper' ? 'Shopkeeper' : 'Admin'}):</strong>{' '}
                        {order.returnRequest.reviewNotes}
                      </p>
                    )}
                    {order.returnRequest.status === 'pending_review' && (
                      <p className="text-[11px] text-amber-800 font-medium">
                        Under manual review by Admin & Shopkeeper. Duplicate return requests are disabled.
                      </p>
                    )}
                  </div>
                )}

                {/* Feedback Messages */}
                {orderActionError[order.id] && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{orderActionError[order.id]}</span>
                  </div>
                )}
                {orderActionNotice[order.id] && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{orderActionNotice[order.id]}</span>
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="text-sm font-extrabold text-gray-900 ml-1">₹{order.total}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({order.paymentMethod})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && confirmCancelOrderId !== order.id && (
                      <button
                        type="button"
                        disabled={isCancellingThis}
                        onClick={() => setConfirmCancelOrderId(order.id)}
                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 border border-red-200 font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}

                    {isDelivered && isOwner && !order.returnRequest && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(order)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Return</span>
                      </button>
                    )}

                    {isLive ? (
                      <button
                        onClick={() => onTrackOrder(order)}
                        className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Track</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : order.status === 'cancelled' ? (
                      <span className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-gray-500" />
                        Cancelled
                      </span>
                    ) : order.status === 'rejected' ? (
                      <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Order Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-[#0E7438] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-yellow-300" />
                <div>
                  <h3 className="text-sm font-bold">Request Order Return</h3>
                  <p className="text-[11px] text-emerald-100 font-mono">
                    Order #{returnModalOrder.id} • ₹{returnModalOrder.total}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReturnModal}
                disabled={Boolean(submittingReturnOrderId)}
                className="p-1 rounded-full hover:bg-emerald-800 text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-4 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
                Returns are accepted only for damaged/defective items or wrong items delivered. Requests are manually reviewed by Admin and the Shopkeeper before approval.
              </div>

              {/* Eligible Reasons */}
              <div className="space-y-2">
                <label className="font-bold text-gray-800 block">
                  Select Return Reason <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {ALLOWED_RETURN_REASONS.map((reason) => {
                    const active = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setReturnFormError(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl border font-semibold flex items-center justify-between transition-all ${
                          active
                            ? 'bg-emerald-50 border-[#0E7438] text-emerald-950 ring-2 ring-emerald-200'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{reason}</span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            active ? 'border-[#0E7438] bg-[#0E7438]' : 'border-gray-300'
                          }`}
                        >
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Description */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Describe the damaged/defective item or wrong item delivered..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
                />
              </div>

              {/* Optional Photo Evidence */}
              <div className="space-y-2">
                <label className="font-bold text-gray-800 block">
                  Photo Evidence <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                {photoEvidenceUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={photoEvidenceUrl}
                      alt="Return evidence preview"
                      className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoEvidenceUrl('')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-sm"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-[#0E7438] rounded-xl p-3 cursor-pointer bg-gray-50 hover:bg-emerald-50/40 transition-colors">
                    <Camera className="w-4 h-4 text-[#0E7438]" />
                    <span className="font-semibold text-gray-700">
                      {photoUploading ? 'Processing photo...' : 'Upload Photo Evidence'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={photoUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {returnFormError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{returnFormError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeReturnModal}
                  disabled={Boolean(submittingReturnOrderId)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason || photoUploading || Boolean(submittingReturnOrderId)}
                  className="w-1/2 py-2.5 bg-[#0E7438] hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                >
                  {submittingReturnOrderId ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-md w-full bg-white rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 bg-black/70 text-white rounded-full p-1.5"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImageUrl} alt="Return evidence" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

