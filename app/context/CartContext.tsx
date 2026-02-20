'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  price: number; // цена за 1 шт
  quantity: number;
  imageUrl: string;
  production_time?: number | null;
}

type RepeatDraft = {
  items: CartItem[];
  source?: string;
  order_id?: string;
  created_at?: string;
};

interface CartContextType {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  addMultipleItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
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

function normalizeCartItem(x: any): CartItem | null {
  if (!x) return null;

  const id = String(x.id ?? '');
  const title = String(x.title ?? '');
  const price = Number(x.price ?? 0);
  const quantity = Number(x.quantity ?? 0);
  const imageUrl = String(x.imageUrl ?? x.cover_url ?? x.coverUrl ?? '/no-image.jpg');

  if (!id || !title || !Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) return null;

  return {
    id,
    title,
    price,
    quantity,
    imageUrl,
    production_time: x.production_time ?? null,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const didConsumeRepeatOnce = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const parsed = safeParseJSON<CartItem[]>(saved);
      setItems(
        Array.isArray(parsed)
          ? parsed
              .map((i) => normalizeCartItem(i))
              .filter(Boolean)
              .map((i) => i as CartItem)
          : [],
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (existing) {
        const newQuantity = existing.quantity + item.quantity;

        // ✅ цена минимальная, чтобы комбо-скидка не терялась
        const newUnitPrice = Math.min(existing.price, item.price);

        const updatedItems = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity, price: newUnitPrice } : i,
        );

        toast.success(`${item.title} обновлён в корзине (x${newQuantity})`);

        window.gtag?.('event', 'update_cart_item', {
          event_category: 'cart',
          item_id: item.id,
          quantity: newQuantity,
        });
        if (YM_ID !== undefined) {
          callYm(YM_ID, 'reachGoal', 'update_cart_item', {
            item_id: item.id,
            quantity: newQuantity,
          });
        }

        return updatedItems;
      }

      toast.success(`${item.title} добавлен в корзину`);

      window.gtag?.('event', 'add_to_cart', {
        event_category: 'cart',
        item_id: item.id,
      });
      if (YM_ID !== undefined) {
        callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: item.id });
      }

      return [...prev, { ...item, id: String(item.id) }];
    });
  };

  const addMultipleItems = (newItems: CartItem[]) => {
    setItems((prev) => {
      const updated = [...prev];

      newItems.forEach((raw) => {
        const newItem = normalizeCartItem(raw);
        if (!newItem) return;

        const idx = updated.findIndex((i) => i.id === newItem.id);

        if (idx !== -1) {
          updated[idx].quantity += newItem.quantity;

          // ✅ цена всегда минимальная
          updated[idx].price = Math.min(updated[idx].price, newItem.price);

          toast.success(`${newItem.title} обновлён в корзине (x${updated[idx].quantity})`);

          window.gtag?.('event', 'update_cart_item', {
            event_category: 'cart',
            item_id: newItem.id,
            quantity: updated[idx].quantity,
          });
          if (YM_ID !== undefined) {
            callYm(YM_ID, 'reachGoal', 'update_cart_item', {
              item_id: newItem.id,
              quantity: updated[idx].quantity,
            });
          }
        } else {
          updated.push({ ...newItem, id: String(newItem.id) });

          toast.success(`${newItem.title} добавлен в корзину`);

          window.gtag?.('event', 'add_to_cart', {
            event_category: 'cart',
            item_id: newItem.id,
          });
          if (YM_ID !== undefined) {
            callYm(YM_ID, 'reachGoal', 'add_to_cart', { item_id: newItem.id });
          }
        }
      });

      return updated;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        toast.success(`${item.title} удалён из корзины`);
        window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: id });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: id });
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);

      if (quantity <= 0) {
        if (item) {
          toast.success(`${item.title} удалён из корзины`);
          window.gtag?.('event', 'remove_from_cart', { event_category: 'cart', item_id: id });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'remove_from_cart', { item_id: id });
        }
        return prev.filter((i) => i.id !== id);
      }

      const updatedItems = prev.map((i) => (i.id === id ? { ...i, quantity } : i));

      if (item) {
        toast.success(`${item.title} обновлён (x${quantity})`);
        window.gtag?.('event', 'update_cart_quantity', {
          event_category: 'cart',
          item_id: id,
          quantity,
        });
        if (YM_ID !== undefined) {
          callYm(YM_ID, 'reachGoal', 'update_cart_quantity', { item_id: id, quantity });
        }
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

  // ✅ подхват repeatDraft: по событию и при заходе на /cart?repeat=1
  useEffect(() => {
    const consumeRepeatDraft = () => {
      if (didConsumeRepeatOnce.current) return;

      const qs = typeof window !== 'undefined' ? window.location.search : '';
      const isRepeatUrl = qs.includes('repeat=1');

      const draftRaw = localStorage.getItem('repeatDraft');
      const draft = safeParseJSON<RepeatDraft>(draftRaw);

      if (!draft?.items?.length) return;

      // если пользователь открыл не /cart - можно не подхватывать автоматически
      // но по событию repeatDraft подхватываем всегда
      if (!isRepeatUrl && !draftRaw) return;

      didConsumeRepeatOnce.current = true;

      addMultipleItems(draft.items);

      // очищаем черновик, чтобы не задвоилось после обновления страницы
      localStorage.removeItem('repeatDraft');

      toast.success('Заказ перенесён в корзину');
    };

    const onRepeat = () => consumeRepeatDraft();

    window.addEventListener('repeatDraft', onRepeat);

    // если уже на /cart?repeat=1, подхватим сразу
    consumeRepeatDraft();

    return () => {
      window.removeEventListener('repeatDraft', onRepeat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxProductionTime =
    items.length > 0 ? Math.max(...items.map((item) => item.production_time ?? 0)) : null;

  const value: CartContextType = {
    items,
    setItems,
    addItem,
    addMultipleItems,
    removeItem,
    updateQuantity,
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