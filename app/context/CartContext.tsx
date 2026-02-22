'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  line_id: string;

  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  production_time?: number | null;

  base_price?: number | null;
  discount_percent?: number | null;
  discount_reason?: 'combo' | 'promo' | 'manual' | null;

  combo_id?: string | null;
  combo_group_id?: string | null;

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

  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;

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

function normalizeComboGroupId(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeCartItem(x: any): CartItem | null {
  if (!x) return null;

  const line_id = typeof x.line_id === 'string' && x.line_id.trim() ? x.line_id.trim() : makeLineId();

  const id = typeof x.id === 'number' ? String(x.id) : String(x.id ?? '').trim();
  const title = String(x.title ?? '').trim();
  const price = Number(x.price ?? 0);
  const quantity = Number(x.quantity ?? 0);

  const imageUrl = normalizeImageUrl(
    x.imageUrl,
    x.cover_url,
    x.coverUrl,
    x.image_url,
    x.main_image,
    x.image,
    x.previewImage,
  );

  if (!id || !title) return null;
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const base_price = normalizeNullableNumber(x.base_price ?? x.basePrice);
  const discount_percent = normalizeNullableNumber(x.discount_percent ?? x.discountPercent);
  const discount_reason = normalizeReason(x.discount_reason ?? x.discountReason);

  const combo_id = typeof (x.combo_id ?? x.comboId) === 'string' && String(x.combo_id ?? x.comboId).trim()
    ? String(x.combo_id ?? x.comboId).trim()
    : null;

  const combo_group_id = normalizeComboGroupId(x.combo_group_id ?? x.comboGroupId);

  return {
    line_id,
    id,
    title,
    price,
    quantity,
    imageUrl,
    production_time: x.production_time ?? x.productionTime ?? null,

    base_price,
    discount_percent,
    discount_reason,
    combo_id,
    combo_group_id,
  };
}

function sameLineForMerge(a: CartItem, b: CartItem) {
  return (
    a.id === b.id &&
    (a.combo_id || null) === (b.combo_id || null) &&
    (a.combo_group_id || null) === (b.combo_group_id || null) &&
    (a.discount_reason || null) === (b.discount_reason || null) &&
    (a.discount_percent ?? null) === (b.discount_percent ?? null) &&
    a.price === b.price
  );
}

function getComboGroupId(it: any): string | null {
  const v = it?.combo_group_id ?? it?.comboGroupId ?? null;
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function getBasePrice(it: any): number | null {
  const v = it?.base_price ?? it?.basePrice ?? null;
  const n = v == null ? null : Number(v);
  return n && Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeCombos(items: CartItem[]): CartItem[] {
  const groups = new Map<string, number[]>();
  for (let i = 0; i < items.length; i++) {
    const gid = getComboGroupId(items[i]);
    if (!gid) continue;
    if (!groups.has(gid)) groups.set(gid, []);
    groups.get(gid)!.push(i);
  }

  if (groups.size === 0) return items;

  const next = items.map((it) => ({ ...it }));

  for (const [gid, idxs] of groups.entries()) {
    const discountedCount = idxs.filter((idx) => {
      const it = next[idx];
      const base = getBasePrice(it);
      return base != null && Number(it.price) < base;
    }).length;

    if (discountedCount < 2) {
      for (const idx of idxs) {
        const it = next[idx];
        const base = getBasePrice(it);

        next[idx] = {
          ...it,
          price: base != null ? base : it.price,

          discount_reason: null,
          discount_percent: null,

          combo_id: null,
          combo_group_id: null,
        };
      }
    }
  }

  return next;
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

    setItems(normalizeCombos(normalized));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
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

        window.gtag?.('event', 'update_cart_item', {
          event_category: 'cart',
          item_id: normalized.id,
          quantity: newQuantity,
        });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_item', { item_id: normalized.id, quantity: newQuantity });

        return normalizeCombos(updated);
      }

      toast.success(`${normalized.title} добавлен в корзину`);

      window.gtag?.('event', 'add_to_cart', { event_category: 'cart', item_id: normalized.id });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: normalized.id });

      return normalizeCombos([...prev, normalized]);
    });
  }, []);

  const addMultipleItems = useCallback((newItems: CartItem[]) => {
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

          window.gtag?.('event', 'update_cart_item', {
            event_category: 'cart',
            item_id: newItem.id,
            quantity: updated[idx].quantity,
          });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_item', { item_id: newItem.id, quantity: updated[idx].quantity });
        } else {
          updated.push(newItem);

          toast.success(`${newItem.title} добавлен в корзину`);

          window.gtag?.('event', 'add_to_cart', { event_category: 'cart', item_id: newItem.id });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: newItem.id });
        }
      });

      return normalizeCombos(updated);
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.line_id === lineId);
      if (item) {
        toast.success(`${item.title} удалён из корзины`);
        window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: item.id });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: item.id });
      }

      const filtered = prev.filter((i) => i.line_id !== lineId);
      return normalizeCombos(filtered);
    });
  }, []);

  const removeAllByProductId = useCallback((productId: string) => {
    setItems((prev) => {
      const has = prev.some((i) => i.id === productId);
      if (has) {
        toast.success('Товар удалён из корзины');
        window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: productId });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: productId });
      }

      const filtered = prev.filter((i) => i.id !== productId);
      return normalizeCombos(filtered);
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.line_id === lineId);

      if (quantity <= 0) {
        if (item) {
          toast.success(`${item.title} удалён из корзины`);
          window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: item.id });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: item.id });
        }

        const filtered = prev.filter((i) => i.line_id !== lineId);
        return normalizeCombos(filtered);
      }

      const updatedItems = prev.map((i) => (i.line_id === lineId ? { ...i, quantity } : i));

      if (item) {
        toast.success(`${item.title} обновлён (x${quantity})`);
        window.gtag?.('event', 'update_cart_quantity', { event_category: 'cart', item_id: item.id, quantity });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_cart_quantity', { item_id: item.id, quantity });
      }

      return normalizeCombos(updatedItems);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
    toast.success('Корзина очищена');
    window.gtag?.('event', 'clear_cart', { event_category: 'cart' });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'clear_cart');
  }, []);

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
  }, [addMultipleItems]);

  const maxProductionTime = useMemo(() => {
    return items.length > 0 ? Math.max(...items.map((item) => item.production_time ?? 0)) : null;
  }, [items]);

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