// utils/ymEvents.ts
'use client';

import { YM_ID } from '@/utils/ym';
import { callYm } from '@/utils/metrics';

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
    const arr = Array.from(ids).slice(-30);
    ss.setItem(SS_KEY_ORDER_SUCCESS, JSON.stringify(arr));
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
    const arr = Array.from(ids).slice(-30);
    ss.setItem(SS_KEY_ORDER_SUCCESS, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

/**
 * Добавление товара в корзину
 */
export function trackAddToCart(product: CartEventProduct) {
  if (!YM_ID) return;

  try {
    callYm(YM_ID, 'reachGoal', 'add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: product.quantity,
      ecommerce: {
        add: {
          products: [
            {
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: product.quantity,
            },
          ],
        },
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackAddToCart error', e);
  }
}

/**
 * Старт оформления заказа
 */
export function trackCheckoutStart() {
  if (!YM_ID) return;

  try {
    callYm(YM_ID, 'reachGoal', 'start_checkout');
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackCheckoutStart error', e);
  }
}

/**
 * Переход по шагам чекаута
 */
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

/**
 * Успешное оформление заказа (order_success) - с дедупом по orderId
 */
export function trackOrderSuccess(params: {
  orderId: string | number;
  revenue: number;
  promoCode?: string;
  products: CartEventProduct[];
}) {
  if (!YM_ID) return;

  const { orderId, revenue, promoCode, products } = params;
  const orderKey = String(orderId);

  const sent = readSentOrderIds();
  if (sent.has(orderKey)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackOrderSuccess dedup - already sent for', orderKey);
    }
    return;
  }

  // mark BEFORE send (anti-race)
  markOrderIdSent(orderKey);

  try {
    callYm(YM_ID, 'reachGoal', 'order_success', {
      order_id: orderKey,
      revenue,
      promo: promoCode || undefined,
      ecommerce: {
        purchase: {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
          })),
        },
      },
    });
  } catch (e) {
    // rollback if failed
    unmarkOrderIdSent(orderKey);
    if (process.env.NODE_ENV !== 'production') console.warn('[YM] trackOrderSuccess error', e);
  }
}
