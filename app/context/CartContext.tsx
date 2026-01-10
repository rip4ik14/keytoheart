'use client';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  price: number; // цена за 1 шт
  quantity: number;
  imageUrl: string;
  production_time?: number | null;
}

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed: CartItem[] = JSON.parse(saved);
        setItems(
          Array.isArray(parsed)
            ? parsed.map((item) => ({ ...item, id: String(item.id) }))
            : [],
        );
      } catch {
        localStorage.removeItem('cart');
      }
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

        // ✅ ключевой момент: цена должна быть минимальной (чтобы комбо-скидка не терялась)
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

      newItems.forEach((newItem) => {
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
