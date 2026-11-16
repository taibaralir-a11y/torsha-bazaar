import { CartItem, LocalityInfo, Order, OrderStatus, Shop } from '../types';
import { getLocalityByName, INITIAL_SERVICE_LOCALITIES } from './hyperlocalRouting';

/**
 * Customer order cancellation policy:
 * Allowed up until `out_for_delivery` (i.e. pending, placed, confirmed, preparing, packed, ready_for_dispatch).
 * Blocked once `out_for_delivery` or terminal (`delivered`, `cancelled`, `rejected`).
 */
export const CUSTOMER_CANCELLABLE_ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_dispatch'
] as const;

export function isCustomerOrderCancellable(status: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE_ORDER_STATUSES.includes(status);
}

export function getCustomerCancelBlockedReason(status: OrderStatus): string {
  if (status === 'out_for_delivery') {
    return 'Your order is out for delivery. Cancellation is no longer available.';
  }
  if (status === 'delivered') {
    return 'Delivered orders cannot be cancelled. Use Request Return if items were damaged or wrong.';
  }
  if (status === 'cancelled') {
    return 'This order is already cancelled.';
  }
  if (status === 'rejected') {
    return 'This order was rejected by the shop.';
  }
  return 'Cancellation is not available for this order stage.';
}

/**
 * Shared unit & line-item price helper for both Cart and Order views,
 * accurately handling weight-based items (`selectedWeightGrams` & `pricePerKg`).
 */
export function computeCartItemUnitPrice(item: CartItem): number {
  if (item.selectedWeightGrams && item.product.pricePerKg) {
    return Math.round(item.product.pricePerKg * (item.selectedWeightGrams / 1000));
  }
  return Number(item.product.price || 0);
}

export function computeCartItemLineTotal(item: CartItem): number {
  return Math.round(computeCartItemUnitPrice(item) * Number(item.quantity || 0));
}

export function computeShopOrderPricing(shopItems: CartItem[]): {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
} {
  const subtotal = shopItems.reduce((sum, item) => sum + computeCartItemLineTotal(item), 0);
  const deliveryFee = subtotal >= 199 || subtotal === 0 ? 0 : 25;
  const discount = subtotal > 150 ? 15 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return { subtotal, deliveryFee, discount, total };
}

/**
 * Verifies every item in an Order belongs to the exact same `order.shopId`.
 */
export function validateOrderItemsMatchShop(order: Pick<Order, 'shopId' | 'items'>): {
  ok: boolean;
  error?: string;
} {
  if (!order.shopId || !order.shopId.trim()) {
    return { ok: false, error: 'Missing target shopId for order.' };
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { ok: false, error: 'Order must contain at least one item.' };
  }
  const mismatch = order.items.find(
    (item) => !item.product.shopId || item.product.shopId !== order.shopId
  );
  if (mismatch) {
    return {
      ok: false,
      error: `Mixed-shop item detected (${mismatch.product.name}). Each order can only contain items from a single shop.`
    };
  }
  return { ok: true };
}

export interface PlannedShopOrderResult {
  orders: Order[];
  isSplitMultiShop: boolean;
  isCrossLocality: boolean;
  crossLocalityShops: { shopId: string; shopName: string; shopLocality: string }[];
  error?: string;
}

/**
 * Splits a multi-shop cart cleanly into separate per-shop Order payloads
 * so every Order satisfies strict single-shop attribution and per-shop totals.
 */
export function planSplitCartOrders(params: {
  cart: CartItem[];
  shops: Shop[];
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryLocality: string;
  deliveryAddress: string;
  paymentMethod: string;
  localities?: LocalityInfo[];
  now?: string;
  idPrefix?: string;
}): PlannedShopOrderResult {
  const {
    cart,
    shops,
    customerId,
    customerName,
    customerPhone,
    deliveryLocality,
    deliveryAddress,
    paymentMethod,
    localities = INITIAL_SERVICE_LOCALITIES,
    now = new Date().toISOString(),
    idPrefix = 'TB'
  } = params;

  if (!Array.isArray(cart) || cart.length === 0) {
    return {
      orders: [],
      isSplitMultiShop: false,
      isCrossLocality: false,
      crossLocalityShops: [],
      error: 'Your cart is empty.'
    };
  }

  const itemsByShop = new Map<string, CartItem[]>();
  for (const item of cart) {
    const sid = item.product.shopId || '';
    const shop = sid ? shops.find((s) => s.id === sid) : undefined;
    if (!sid || !shop || shop.status !== 'approved' || (item.product.shopStatus && item.product.shopStatus !== 'approved')) {
      return {
        orders: [],
        isSplitMultiShop: false,
        isCrossLocality: false,
        crossLocalityShops: [],
        error: `Shop for "${item.product.name}" is currently suspended or unavailable. Please remove unavailable items.`
      };
    }
    const existing = itemsByShop.get(sid) || [];
    existing.push(item);
    itemsByShop.set(sid, existing);
  }

  const customerLocInfo = getLocalityByName(deliveryLocality, localities);
  const normCustomerLoc = customerLocInfo.name.toLowerCase();
  const crossLocalityShops: { shopId: string; shopName: string; shopLocality: string }[] = [];
  const orders: Order[] = [];
  let index = 0;

  itemsByShop.forEach((shopItems, shopId) => {
    index += 1;
    const targetShop = shops.find((s) => s.id === shopId)!;
    const pricing = computeShopOrderPricing(shopItems);
    const shopLocality = targetShop.locality || deliveryLocality;
    const normShopLoc = getLocalityByName(shopLocality, localities).name.toLowerCase();
    const shopIsCrossLocality = normShopLoc !== normCustomerLoc;
    if (shopIsCrossLocality) {
      crossLocalityShops.push({
        shopId,
        shopName: targetShop.name,
        shopLocality
      });
    }

    const suffix = itemsByShop.size > 1 ? `-${index}` : '';
    const orderId = `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}${suffix}`;

    orders.push({
      id: orderId,
      shopId,
      pickupLocality: shopLocality,
      shopLocality,
      ...(targetShop.ownerId ? { shopOwnerId: targetShop.ownerId } : {}),
      shopName: targetShop.name,
      customerId,
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '',
      items: shopItems,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      discount: pricing.discount,
      total: pricing.total,
      status: 'pending',
      date: 'Today, Just Now',
      deliveryAddress,
      locality: deliveryLocality,
      pincode: customerLocInfo.pincode,
      routingStatus: 'pending_admin_routing',
      estimatedDelivery: shopIsCrossLocality ? '40-50 mins (Cross-Locality)' : '20-30 mins (Local)',
      paymentMethod,
      createdAt: now
    });
  });

  return {
    orders,
    isSplitMultiShop: orders.length > 1,
    isCrossLocality: crossLocalityShops.length > 0,
    crossLocalityShops
  };
}
