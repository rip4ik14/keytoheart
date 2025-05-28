'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  production_time?: number | null; // Добавляем поле для времени изготовления
}

interface CartContextType {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  addMultipleItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  maxProductionTime: number | null; // Добавляем максимальное время изготовления
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
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
        const updatedItems = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
        toast.success(`${item.title} обновлён в корзине (x${existing.quantity + item.quantity})`);
        window.gtag?.('event', 'update_cart_item', {
          event_category: 'cart',
          item_id: item.id,
          quantity: existing.quantity + item.quantity,
        });
        window.ym?.(96644553, 'reachGoal', 'update_cart_item', {
          item_id: item.id,
          quantity: existing.quantity + item.quantity,
        });
        return updatedItems;
      }
      toast.success(`${item.title} добавлен в корзину`);
      window.gtag?.('event', 'add_to_cart', {
        event_category: 'cart',
        item_id: item.id,
      });
      window.ym?.(96644553, 'reachGoal', 'add_to_cart', { item_id: item.id });
      return [...prev, item];
    });
  };

  const addMultipleItems = (newItems: CartItem[]) => {
    setItems((prev) => {
      const updated = [...prev];
      newItems.forEach((newItem) => {
        const index = updated.findIndex((i) => i.id === newItem.id);
        if (index !== -1) {
          updated[index].quantity += newItem.quantity;
          toast.success(`${newItem.title} обновлён в корзине (x${updated[index].quantity})`);
          window.gtag?.('event', 'update_cart_item', {
            event_category: 'cart',
            item_id: newItem.id,
            quantity: updated[index].quantity,
          });
          window.ym?.(96644553, 'reachGoal', 'update_cart_item', {
            item_id: newItem.id,
            quantity: updated[index].quantity,
          });
        } else {
          updated.push(newItem);
          toast.success(`${newItem.title} добавлен в корзину`);
          window.gtag?.('event', 'add_to_cart', {
            event_category: 'cart',
            item_id: newItem.id,
          });
          window.ym?.(96644553, 'reachGoal', 'add_to_cart', { item_id: newItem.id });
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
        window.gtag?.('event', 'remove_from_cart', {
          event_category: 'cart',
          item_id: id,
        });
        window.ym?.(96644553, 'reachGoal', 'remove_from_cart', { item_id: id });
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (quantity <= 0) {
        if (item) {
          toast.success(`${item.title} удалён из корзины`);
          window.gtag?.('event', 'remove_from_cart', {
            event_category: 'cart',
            item_id: id,
          });
          window.ym?.(96644553, 'reachGoal', 'remove_from_cart', { item_id: id });
        }
        return prev.filter((item) => item.id !== id);
      }
      const updatedItems = prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      if (item) {
        toast.success(`${item.title} обновлён (x${quantity})`);
        window.gtag?.('event', 'update_cart_quantity', {
          event_category: 'cart',
          item_id: id,
          quantity,
        });
        window.ym?.(96644553, 'reachGoal', 'update_cart_quantity', {
          item_id: id,
          quantity,
        });
      }
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
    toast.success('Корзина очищена');
    window.gtag?.('event', 'clear_cart', { event_category: 'cart' });
    window.ym?.(96644553, 'reachGoal', 'clear_cart');
  };

  const maxProductionTime = items.length > 0
    ? Math.max(
        ...items.map((item) => item.production_time ?? 0)
      ) || null
    : null;

  const value: CartContextType = {
    items,
    setItems,
    addItem,
    addMultipleItems,
    removeItem,
    updateQuantity,
    clearCart,
    maxProductionTime, // Добавляем в контекст
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}