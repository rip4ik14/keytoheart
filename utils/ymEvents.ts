// ✅ Путь: app/utils/ymEvents.ts
'use client';

import { YM_ID } from '@/utils/ym';
import { callYm } from '@/utils/metrics';

type CartEventProduct = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
};

/**
 * Добавление товара в корзину (используется в ProductCard)
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackAddToCart error', e);
    }
  }
}

/**
 * Старт оформления заказа (вход в корзину/чекаут)
 */
export function trackCheckoutStart() {
  if (!YM_ID) return;

  try {
    callYm(YM_ID, 'reachGoal', 'start_checkout');
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackCheckoutStart error', e);
    }
  }
}

/**
 * Переход по шагам чекаута
 */
export function trackCheckoutStep(
  step: number,
  extra?: Record<string, any>
) {
  if (!YM_ID) return;

  try {
    callYm(YM_ID, 'reachGoal', 'checkout_step', {
      step,
      ...(extra || {}),
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackCheckoutStep error', e);
    }
  }
}

/**
 * Успешное оформление заказа
 */
export function trackOrderSuccess(params: {
  orderId: string | number;
  revenue: number;
  promoCode?: string;
  products: CartEventProduct[];
}) {
  if (!YM_ID) return;

  const { orderId, revenue, promoCode, products } = params;

  try {
    callYm(YM_ID, 'reachGoal', 'order_success', {
      order_id: orderId,
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[YM] trackOrderSuccess error', e);
    }
  }
}
