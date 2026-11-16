import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, MapPin, Check } from 'lucide-react';
import { CartItem, Order, UserProfile, Shop, LocalityInfo } from '../types';
import { INITIAL_SERVICE_LOCALITIES, getLocalityByName } from '../utils/hyperlocalRouting';
import {
  computeCartItemLineTotal,
  computeCartItemUnitPrice,
  computeShopOrderPricing,
  planSplitCartOrders
} from '../utils/checkoutOrder';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onPlaceOrder: (order: Order | Order[]) => Promise<{ ok: boolean; error?: string } | void> | void;
  user: UserProfile;
  currentLocation?: string;
  shops?: Shop[];
  localities?: LocalityInfo[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onPlaceOrder,
  user,
  currentLocation,
  shops = [],
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI / QR Code' | 'Online Card'>('Cash on Delivery');
  const [deliveryLocality, setDeliveryLocality] = useState<string>(() => {
    return user.location || currentLocation?.split(',')[0].trim() || 'Satali';
  });
  const [deliveryAddress, setDeliveryAddress] = useState(user.address || '');
  const [isOrdered, setIsOrdered] = useState(false);
  const [placedOrderCount, setPlacedOrderCount] = useState(1);
  const [approvedCrossLocality, setApprovedCrossLocality] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    setDeliveryLocality(user.location || currentLocation?.split(',')[0].trim() || 'Satali');
    setDeliveryAddress(user.address || '');
    setIsOrdered(false);
    setPlacedOrderCount(1);
    setApprovedCrossLocality(false);
    setCheckoutError('');
  }, [user.id, user.location, user.address, currentLocation, isOpen]);

  if (!isOpen) return null;

  const splitPlan = planSplitCartOrders({
    cart,
    shops,
    customerId: user.id || '',
    customerName: user.name || 'Customer',
    customerPhone: user.phone || '',
    deliveryLocality,
    deliveryAddress: deliveryAddress.trim(),
    paymentMethod,
    localities
  });

  const isSplitMultiShop = splitPlan.isSplitMultiShop;
  const plannedOrders = splitPlan.orders;
  const fallbackPricing = computeShopOrderPricing(cart);
  const subtotal = plannedOrders.length > 0
    ? plannedOrders.reduce((sum, o) => sum + o.subtotal, 0)
    : fallbackPricing.subtotal;
  const deliveryFee = plannedOrders.length > 0
    ? plannedOrders.reduce((sum, o) => sum + o.deliveryFee, 0)
    : fallbackPricing.deliveryFee;
  const discount = plannedOrders.length > 0
    ? plannedOrders.reduce((sum, o) => sum + o.discount, 0)
    : fallbackPricing.discount;
  const total = plannedOrders.length > 0
    ? plannedOrders.reduce((sum, o) => sum + o.total, 0)
    : fallbackPricing.total;

  // Check for cross-locality orders
  // Requirement: "Never send an order to another locality without customer approval."
  const normCustomerLoc = getLocalityByName(deliveryLocality, localities).name.toLowerCase();
  const involvedShops = cart.map((item) => {
    const shop = shops.find((s) => s.id === item.product.shopId);
    return {
      productName: item.product.name,
      shopId: item.product.shopId,
      shopName: shop?.name || item.product.shopName || 'Local Merchant',
      shopLocality: shop?.locality || item.product.sellerLocality || deliveryLocality
    };
  });

  const crossLocalityList = involvedShops.filter((s) => {
    const normShopLoc = getLocalityByName(s.shopLocality, localities).name.toLowerCase();
    return normShopLoc !== normCustomerLoc;
  });

  const unavailableShopItems = cart.filter((item) => {
    if (!item.product.shopId) return true;
    const shop = shops.find((s) => s.id === item.product.shopId);
    if (!shop || shop.status !== 'approved') return true;
    if (item.product.shopStatus && item.product.shopStatus !== 'approved') return true;
    return false;
  });

  const hasUnavailableShop = unavailableShopItems.length > 0;
  const isCrossLocality = crossLocalityList.length > 0;
  const canProceedCheckout = !hasUnavailableShop && !isSubmitting && (!isCrossLocality || approvedCrossLocality);

  const handleCheckout = async () => {
    if (cart.length === 0 || !canProceedCheckout || isSubmitting) return;
    setCheckoutError('');

    if (splitPlan.error || plannedOrders.length === 0) {
      setCheckoutError(splitPlan.error || 'One or more shops in your cart are unavailable.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = plannedOrders.length === 1 ? plannedOrders[0] : plannedOrders;
      const res = await onPlaceOrder(payload);
      if (res && res.ok === false) {
        setCheckoutError(res.error || 'Could not place your order right now. Please try again.');
        return;
      }
      setPlacedOrderCount(plannedOrders.length);
      setIsOrdered(true);
    } catch (err: any) {
      setCheckoutError(err?.message || 'Could not submit your order to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-[#0E7438] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-yellow-300" />
            <h2 className="text-base font-bold">Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen after placing order */}
        {isOrdered ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0E7438] flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900">
              {placedOrderCount > 1
                ? `${placedOrderCount} Shop Orders Placed!`
                : 'Order Placed Successfully!'}
            </h3>
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-950 text-left space-y-1 w-full max-w-xs">
              <p className="font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Destination: {deliveryLocality}</span>
              </p>
              <p className="text-[11px] text-gray-600">
                {placedOrderCount > 1
                  ? 'Your multi-shop cart was split into separate per-shop orders and dispatched for verification.'
                  : 'Dispatched directly to local shopkeeper for verification.'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOrdered(false);
                onClose();
              }}
              className="w-full max-w-xs py-3 bg-[#0E7438] text-white font-bold rounded-2xl shadow-md text-xs sm:text-sm hover:bg-emerald-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3">
            <ShoppingBag className="w-16 h-16 text-gray-200 stroke-1" />
            <p className="text-sm font-bold text-gray-600">Your basket is empty</p>
            <p className="text-xs text-gray-400">Browse fresh produce, kirana, and electronics in your locality.</p>
          </div>
        ) : (
          /* Cart items and checkout form */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Items List */}
            <div className="space-y-3">
              {cart.map((item) => {
                const unitPrice = computeCartItemUnitPrice(item);
                const lineTotal = computeCartItemLineTotal(item);
                return (
                  <div
                    key={`${item.product.id}-${item.selectedWeightGrams || 'std'}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-xl bg-white shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.product.name}</h4>
                      {item.product.shopName && (
                        <p className="text-[10px] text-emerald-700 font-medium truncate">
                          {item.product.shopName}
                        </p>
                      )}
                      <div>
                        {item.selectedWeightGrams ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded inline-block">
                            ⚖️ {item.selectedWeightGrams}g cut • ₹{unitPrice}
                          </span>
                        ) : (
                          <p className="text-[11px] text-gray-500">₹{item.product.price} / {item.product.unit}</p>
                        )}
                        {item.prescriptionUrl && (
                          <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 block w-fit mt-0.5">
                            Rx Attached 📄
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-700"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-700"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900 w-12 text-right">
                        ₹{lineTotal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exact Locality Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs space-y-2">
              <label className="text-xs font-bold text-gray-700 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0E7438]" />
                <span>Delivery Locality & PIN Code</span>
              </label>
              <select
                value={deliveryLocality}
                onChange={(e) => {
                  setDeliveryLocality(e.target.value);
                  setApprovedCrossLocality(false);
                }}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-gray-900"
              >
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name} (PIN: {loc.pincode}) — {loc.parentArea} Area
                  </option>
                ))}
              </select>
            </div>

            {/* CROSS-LOCALITY APPROVAL REQUIREMENT */}
            {isCrossLocality && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2.5 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-bold text-amber-900">Cross-Locality Delivery Notice</h4>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Your items are from <strong>{crossLocalityList[0]?.shopName} ({crossLocalityList[0]?.shopLocality})</strong>, but delivery is to <strong>{deliveryLocality}</strong>.
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      Torsa Bazaar policy: We never route an order across localities without your explicit permission.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-300 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={approvedCrossLocality}
                    onChange={(e) => setApprovedCrossLocality(e.target.checked)}
                    className="w-4 h-4 text-[#0E7438] rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span>I approve cross-locality dispatch to {deliveryLocality}</span>
                </label>
              </div>
            )}

            {hasUnavailableShop && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900">Shop Currently Suspended / Unavailable</h4>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    One or more shops in your cart are currently suspended or inactive. Please remove unavailable items to proceed.
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Specific Street Address & Landmark</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                placeholder="House number, street, landmark..."
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cash on Delivery', 'UPI / QR Code'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      paymentMethod === method
                        ? 'bg-emerald-50 border-[#0E7438] text-[#0E7438] font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Shop Split Summary */}
            {isSplitMultiShop && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-sky-950">
                  <span>Multi-Shop Split Checkout</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    {plannedOrders.length} Separate Orders
                  </span>
                </div>
                <p className="text-[11px] text-sky-800">
                  Items from different shops are cleanly split into per-shop orders for independent preparation and dispatch:
                </p>
                <div className="space-y-1.5">
                  {plannedOrders.map((ord) => (
                    <div key={ord.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-sky-100">
                      <span className="font-semibold text-gray-800 truncate pr-2">
                        {ord.shopName} ({ord.items.reduce((s, i) => s + i.quantity, 0)} items)
                      </span>
                      <span className="font-bold text-gray-900 shrink-0">₹{ord.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee {isSplitMultiShop ? `(${plannedOrders.length} shops)` : ''}</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Special Deal Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>To Pay</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Action */}
        {!isOrdered && cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-2.5">
            {checkoutError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}
            <button
              onClick={handleCheckout}
              disabled={!canProceedCheckout}
              className={`w-full font-bold py-3.5 px-4 rounded-2xl shadow-md text-sm flex items-center justify-between active:scale-95 transition-all ${
                canProceedCheckout
                  ? 'bg-[#0E7438] hover:bg-emerald-800 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Placing Order...'
                  : hasUnavailableShop
                    ? 'Shop Unavailable — Remove Items'
                    : isCrossLocality && !approvedCrossLocality
                      ? 'Approval Required for Cross-Locality'
                      : `Place Order (${paymentMethod})`}
              </span>
              <span className="flex items-center gap-1 font-black text-yellow-300">
                ₹{total} <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
