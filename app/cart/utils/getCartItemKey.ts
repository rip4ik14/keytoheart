// ✅ Путь: app/cart/utils/getCartItemKey.ts
'use client';

import type { CartItemType } from '../types';

export function getCartItemKey(item: CartItemType) {
  const isUpsell = (item as any).isUpsell === true;
  const id = String((item as any).id ?? '');

  if (isUpsell) {
    const category = String((item as any).category || 'upsell');
    return `upsell-${category}-${id}`;
  }

  // ✅ обычные товары: ключ по line_id (иначе комбо/скидки ломают список)
  const lineId = String((item as any).line_id || (item as any).lineId || '');
  return lineId ? `item-${lineId}` : `item-${id}`;
}