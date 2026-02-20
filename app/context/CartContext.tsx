'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  line_id: string;

  id: string;
  title: string;
  price: number; // финальная цена за 1 шт
  quantity: number;
  imageUrl: string;
  production_time?: number | null;

  base_price?: number | null;
  discount_percent?: number | null;
  discount_reason?: 'combo' | 'promo' | 'manual' | null;
  combo_id?: string | null;

  isUpsell?: false;
}

type RepeatDraft = {
  items: any[];
  source?: string;
  order_id?: string;
  created_at?: string;
};

interface CartContextType {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;

  addItem: (item: CartItem) => void;
  addMultipleItems: (items: CartItem[]) => void;

  // ✅ по line_id
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;

  // ✅ опционально
  removeAllByProductId: (productId: string) => void;

  clearCart: () => void;
  maxProductionTime: number | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeLineId() {
  const c: any = typeof crypto !== 'undefined' ? crypto : null;
  if (c?.randomUUID) return String(c.randomUUID());
  return `line_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeImageUrl(...candidates: any[]): string {
  for (const v of candidates) {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s && s !== 'null' && s !== 'undefined') return s;
    }
  }
  return '/no-image.jpg';
}

function normalizeNullableNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeReason(v: any): CartItem['discount_reason'] {
  if (v === 'combo' || v === 'promo' || v === 'manual') return v;
  return null;
}

function normalizeCartItem(x: any): CartItem | null {
  if (!x) return null;

  const line_id = typeof x.line_id === 'string' && x.line_id.trim() ? x.line_id.trim() : makeLineId();

  const id = typeof x.id === 'number' ? String(x.id) : String(x.id ?? '').trim();
  const title = String(x.title ?? '').trim();
  const price = Number(x.price ?? 0);
  const quantity = Number(x.quantity ?? 0);

  const imageUrl = normalizeImageUrl(x.imageUrl, x.cover_url, x.coverUrl, x.image_url);

  if (!id || !title) return null;
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const base_price = normalizeNullableNumber(x.base_price);
  const discount_percent = normalizeNullableNumber(x.discount_percent);
  const discount_reason = normalizeReason(x.discount_reason);
  const combo_id = typeof x.combo_id === 'string' && x.combo_id.trim() ? x.combo_id.trim() : null;

  return {
    line_id,
    id,
    title,
    price,
    quantity,
    imageUrl,
    production_time: x.production_time ?? null,

    base_price,
    discount_percent,
    discount_reason,
    combo_id,
  };
}

function sameLineForMerge(a: CartItem, b: CartItem) {
  // Сливаем только если это один и тот же продукт в одинаковом "контексте"
  return (
    a.id === b.id &&
    (a.combo_id || null) === (b.combo_id || null) &&
    (a.discount_reason || null) === (b.discount_reason || null) &&
    (a.discount_percent ?? null) === (b.discount_percent ?? null) &&
    (a.base_price ?? null) === (b.base_price ?? null) &&
    a.price === b.price
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const didConsumeRepeatOnce = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (!saved) return;

    const parsed = safeParseJSON<any[]>(saved);

    const normalized =
      Array.isArray(parsed)
        ? parsed
            .map((i) => normalizeCartItem(i))
            .filter(Boolean)
            .map((i) => i as CartItem)
        : [];

    setItems(normalized);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    const normalized = normalizeCartItem(item);
    if (!normalized) {
      toast.error('Не удалось добавить товар в корзину');
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLineForMerge(i, normalized));

      if (idx !== -1) {
        const existing = prev[idx];
        const newQuantity = existing.quantity + normalized.quantity;

        const updated = prev.map((i, k) => (k === idx ? { ...existing, quantity: newQuantity } : i));

        toast.success(`${normalized.title} обновлён в корзине (x${newQuantity})`);

        window.gtag?.('event', 'update_cart_item', { event_category: 'cart', item_id: normalized.id, quantity: newQuantity });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_item', { item_id: normalized.id, quantity: newQuantity });

        return updated;
      }

      toast.success(`${normalized.title} добавлен в корзину`);

      window.gtag?.('event', 'add_to_cart', { event_category: 'cart', item_id: normalized.id });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: normalized.id });

      return [...prev, normalized];
    });
  };

  const addMultipleItems = (newItems: CartItem[]) => {
    setItems((prev) => {
      const updated = [...prev];

      newItems.forEach((raw) => {
        const newItem = normalizeCartItem(raw);
        if (!newItem) return;

        const idx = updated.findIndex((i) => sameLineForMerge(i, newItem));

        if (idx !== -1) {
          const existing = updated[idx];
          updated[idx] = { ...existing, quantity: existing.quantity + newItem.quantity };

          toast.success(`${newItem.title} обновлён в корзине (x${updated[idx].quantity})`);

          window.gtag?.('event', 'update_cart_item', { event_category: 'cart', item_id: newItem.id, quantity: updated[idx].quantity });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_item', { item_id: newItem.id, quantity: updated[idx].quantity });
        } else {
          updated.push(newItem);

          toast.success(`${newItem.title} добавлен в корзину`);

          window.gtag?.('event', 'add_to_cart', { event_category: 'cart', item_id: newItem.id });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: newItem.id });
        }
      });

      return updated;
    });
  };

  const removeItem = (lineId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.line_id === lineId);
      if (item) {
        toast.success(`${item.title} удалён из корзины`);
        window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: item.id });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: item.id });
      }
      return prev.filter((i) => i.line_id !== lineId);
    });
  };

  const removeAllByProductId = (productId: string) => {
    setItems((prev) => {
      const has = prev.some((i) => i.id === productId);
      if (has) {
        toast.success('Товар удалён из корзины');
        window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: productId });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: productId });
      }
      return prev.filter((i) => i.id !== productId);
    });
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.line_id === lineId);

      if (quantity <= 0) {
        if (item) {
          toast.success(`${item.title} удалён из корзины`);
          window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: item.id });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: item.id });
        }
        return prev.filter((i) => i.line_id !== lineId);
      }

      const updatedItems = prev.map((i) => (i.line_id === lineId ? { ...i, quantity } : i));

      if (item) {
        toast.success(`${item.title} обновлён (x${quantity})`);
        window.gtag?.('event', 'update_cart_quantity', { event_category: 'cart', item_id: item.id, quantity });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_quantity', { item_id: item.id, quantity });
      }

      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
    toast.success('Корзина очищена');
    window.gtag?.('event', 'clear_cart', { event_category: 'cart' });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'clear_cart');
  };

  // repeatDraft: /cart?repeat=1
  useEffect(() => {
    const consumeRepeatDraft = () => {
      if (didConsumeRepeatOnce.current) return;

      const qs = typeof window !== 'undefined' ? window.location.search : '';
      const isRepeatUrl = qs.includes('repeat=1');

      const raw = localStorage.getItem('repeatDraft');
      const draft = safeParseJSON<RepeatDraft>(raw);

      if (!draft?.items?.length) return;
      if (!isRepeatUrl) return;

      didConsumeRepeatOnce.current = true;

      addMultipleItems(draft.items as any);

      localStorage.removeItem('repeatDraft');
      toast.success('Заказ перенесён в корзину');
    };

    const onRepeat = () => consumeRepeatDraft();

    window.addEventListener('repeatDraft', onRepeat);
    consumeRepeatDraft();

    return () => window.removeEventListener('repeatDraft', onRepeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxProductionTime = items.length > 0 ? Math.max(...items.map((item) => item.production_time ?? 0)) : null;

  const value: CartContextType = {
    items,
    setItems,
    addItem,
    addMultipleItems,
    removeItem,
    updateQuantity,
    removeAllByProductId,
    clearCart,
    maxProductionTime,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}