'use client';

import { YM_ID } from '@/utils/ym';
import { callYm, pushDataLayer } from '@/utils/metrics';

type CartEventProduct = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
};

const SS_KEY_ORDER_SUCCESS = 'kth_ym_order_success_ids';

function safeSessionStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readSentOrderIds(): Set<string> {
  const ss = safeSessionStorage();
  if (!ss) return new Set();

  try {
    const raw = ss.getItem(SS_KEY_ORDER_SUCCESS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function markOrderIdSent(orderId: string) {
  const ss = safeSessionStorage();
  if (!ss) return;

  try {
    const ids = readSentOrderIds();
    ids.add(orderId);
    ss.setItem(SS_KEY_ORDER_SUCCESS, JSON.stringify(Array.from(ids).slice(-30)));
  } catch {
    // ignore
  }
}

function unmarkOrderIdSent(orderId: string) {
  const ss = safeSessionStorage();
  if (!ss) return;

  try {
    const ids = readSentOrderIds();
    ids.delete(orderId);
    ss.setItem(SS_KEY_ORDER_SUCCESS, JSON.stringify(Array.from(ids).slice(-30)));
  } catch {
    // ignore
  }
}

function productToEcom(product: CartEventProduct) {
  return {
    id: String(product.id),
    name: product.name,
    price: Number(product.price || 0),
    quantity: Number(product.quantity || 1),
  };
}

export function trackAddToCart(product: CartEventProduct) {
  if (!YM_ID) return;

  try {
    pushDataLayer({ ecommerce: null });
    pushDataLayer({
      event: 'kth_add_to_cart',
      ecommerce: {
        currencyCode: 'RUB',
        add: {
          products: [productToEcom(product)],
        },
      },
    });

    callYm(YM_ID, 'reachGoal', 'add_to_cart', {
      product_id: String(product.id),
      product_name: product.name,
      price: Number(product.price || 0),
      quantity: Number(product.quantity || 1),
      order_price: Number(product.price || 0) * Number(product.quantity || 1),
      currency: 'RUB',
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackAddToCart error', e);
  }
}

export function trackCheckoutStart() {
  if (!YM_ID) return;

  try {
    pushDataLayer({ ecommerce: null });
    pushDataLayer({
      event: 'kth_checkout_start',
      ecommerce: {
        checkout: {
          actionField: { step: 1 },
          products: [],
        },
      },
    });

    callYm(YM_ID, 'reachGoal', 'start_checkout');
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackCheckoutStart error', e);
  }
}

export function trackCheckoutStep(step: number, extra?: Record<string, any>) {
  if (!YM_ID) return;

  try {
    callYm(YM_ID, 'reachGoal', 'checkout_step', {
      step,
      ...(extra || {}),
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackCheckoutStep error', e);
  }
}

export function trackOrderSuccess(params: {
  orderId: string | number;
  revenue: number;
  promoCode?: string;
  products: CartEventProduct[];
}) {
  if (!YM_ID) return;

  const { orderId, revenue, promoCode, products } = params;
  const orderKey = String(orderId);

  if (readSentOrderIds().has(orderKey)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackOrderSuccess dedup - already sent for', orderKey);
    }
    return;
  }

  markOrderIdSent(orderKey);

  try {
    const normalizedProducts = products.map(productToEcom);

    pushDataLayer({ ecommerce: null });
    pushDataLayer({
      event: 'kth_purchase',
      ecommerce: {
        currencyCode: 'RUB',
        purchase: {
          actionField: {
            id: orderKey,
            revenue: Number(revenue || 0),
            coupon: promoCode || undefined,
          },
          products: normalizedProducts,
        },
      },
    });

    callYm(YM_ID, 'reachGoal', 'order_success', {
      order_id: orderKey,
      order_price: Number(revenue || 0),
      currency: 'RUB',
      promo: promoCode || undefined,
    });
  } catch (e) {
    unmarkOrderIdSent(orderKey);
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackOrderSuccess error', e);
  }
}
