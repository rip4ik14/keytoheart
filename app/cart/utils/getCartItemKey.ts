// app/cart/utils/getCartItemKey.ts
'use client';

import type { CartItemType, UpsellItem } from '../types';

export function getCartItemKey(item: CartItemType | UpsellItem) {
  const isUpsell = (item as any).isUpsell === true;
  const id = (item as any).id;

  if (isUpsell) {
    const category = (item as any).category || 'upsell';
    return `upsell-${category}-${id}`;
  }

  return `item-${id}`;
}
