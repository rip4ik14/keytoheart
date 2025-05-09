// ✅ Путь: app/cart/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import type { Database, Json } from '@/lib/supabase/types_new';
import { useCart } from '@context/CartContext';
import OrderStep from '@components/OrderStep';
import StoreBanner from '@components/StoreBanner';
import StoreScheduleNotice from '@components/StoreScheduleNotice';
import CartSummary from './components/CartSummary';
import ThankYouModal from './components/ThankYouModal';
import ErrorModal from './components/ErrorModal';
import UpsellModal from './components/UpsellModal';
import Step1ContactDetails from './components/steps/Step1ContactDetails';
import Step2RecipientDetails from './components/steps/Step2RecipientDetails';
import Step3Address from './components/steps/Step3Address';
import Step4DateTime from './components/steps/Step4DateTime';
import Step5Payment from './components/steps/Step5Payment';
import useCheckoutForm from './hooks/useCheckoutForm';
import { phoneMask } from '@utils/phoneMask';

// Типизация для Yandex Maps API
interface YandexMaps {
  ready: (callback: () => void) => void;
  suggest: (query: string, options: { boundedBy: number[][]; strictBounds: boolean; results: number }) => Promise<{ suggestions: { value: string; displayName: string }[] }>;
  Map: new (container: string | HTMLElement, options: { center: number[]; zoom: number; controls?: string[] }) => any;
  geocode: (address: string, options?: { provider?: string; boundedBy?: number[][]; strictBounds?: boolean }) => Promise<any>;
}

declare global {
  interface Window {
    ymaps: YandexMaps;
  }
}

// Тип для товаров в корзине
interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  production_time?: number | null;
  isUpsell?: false;
}

// Тип для дополнительных товаров (upsell)
export interface UpsellItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category?: 'postcard' | 'balloon';
  isUpsell: true;
}

// Объединённый тип для товаров в корзине
type CartItemType = CartItem | UpsellItem;

interface DaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}

interface StoreSettings {
  order_acceptance_enabled: boolean;
  banner_message: string | null;
  banner_active: boolean;
  order_acceptance_schedule: Record<string, DaySchedule>;
  store_hours: Record<string, DaySchedule>;
}

type Step = 1 | 2 | 3 | 4 | 5;

// Функция для преобразования Json в Record<string, DaySchedule>
const transformSchedule = (schedule: Json): Record<string, DaySchedule> => {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result: Record<string, DaySchedule> = daysOfWeek.reduce((acc, day) => {
    acc[day] = { start: '09:00', end: '18:00' };
    return acc;
  }, {} as Record<string, DaySchedule>);

  if (typeof schedule !== 'object' || schedule === null) {
    return result;
  }

  for (const [key, value] of Object.entries(schedule)) {
    if (daysOfWeek.includes(key) && typeof value === 'object' && value !== null) {
      const { start, end, enabled } = value as any;
      if (
        typeof start === 'string' &&
        typeof end === 'string' &&
        (enabled === undefined || typeof enabled === 'boolean')
      ) {
        result[key] = {
          start,
          end,
          enabled: enabled ?? true,
        };
      }
    }
  }

  return result;
};

const CartItemComponent = React.memo(
  ({
    item,
    removeItem,
    updateQuantity,
  }: {
    item: CartItem;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
  }) => {
    const handleMinus = () => {
      if (item.quantity > 1) {
        updateQuantity(item.id, item.quantity - 1);
      }
    };

    const handlePlus = () => {
      updateQuantity(item.id, item.quantity + 1);
    };

    return (
      <motion.div
        className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-4 bg-white shadow-sm mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        role="listitem"
        aria-label={`Товар ${item.title} в корзине`}
      >
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={40}
              height={40}
              className="rounded object-cover"
              loading="lazy"
              sizes="40px"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-xs">Нет фото</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-medium text-gray-800">{item.title}</span>
            {item.production_time != null && (
              <span className="text-sm text-gray-600">
                Время изготовления: {item.production_time} {item.production_time === 1 ? 'час' : 'часов'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg bg-gray-50">
            <motion.button
              onClick={handleMinus}
              className="p-1 rounded-l-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
              disabled={item.quantity <= 1}
              aria-label={`Уменьшить количество ${item.title}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="/icons/minus.svg" alt="Уменьшить" width={16} height={16} />
            </motion.button>
            <span className="px-2 text-sm font-medium">{item.quantity}</span>
            <motion.button
              onClick={handlePlus}
              className="p-1 rounded-r-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label={`Увеличить количество ${item.title}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="/icons/plus.svg" alt="Увеличить" width={16} height={16} />
            </motion.button>
          </div>
          <span className="text-sm font-semibold text-gray-800">{item.price * item.quantity} ₽</span>
          <motion.button
            onClick={() => {
              removeItem(item.id);
              window.gtag?.('event', 'remove_cart_item', {
                event_category: 'cart',
                item_id: item.id,
              });
              window.ym?.(12345678, 'reachGoal', 'remove_cart_item', { item_id: item.id });
            }}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label={`Удалить ${item.title} из корзины`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image src="/icons/trash.svg" alt="Удалить" width={16} height={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

export default function CartPage() {
  let cartContext;
  try {
    cartContext = useCart();
  } catch (error) {
    console.error(error);
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Ошибка: Корзина недоступна. Пожалуйста, обновите страницу.</p>
      </div>
    );
  }

  const { items, setItems, updateQuantity, removeItem, clearCart, maxProductionTime, addMultipleItems } = cartContext;

  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [agreed, setAgreed] = useState<boolean>(false);
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
  const [isUpsellLoading, setIsUpsellLoading] = useState<boolean>(true);
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellItem[]>([]);
  const [showPostcard, setShowPostcard] = useState<boolean>(false);
  const [showBalloons, setShowBalloons] = useState<boolean>(false);
  const [postcardText, setPostcardText] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    trackingUrl?: string;
  } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState<boolean>(true);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoType, setPromoType] = useState<'fixed' | 'percentage' | null>(null);
  const [promoId, setPromoId] = useState<string | null>(null);
  const [isYmapsReady, setIsYmapsReady] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const {
    step,
    setStep,
    form,
    phoneError,
    emailError,
    nameError,
    recipientError,
    recipientPhoneError,
    addressError,
    dateError,
    timeError,
    smsCode,
    isCodeSent,
    isSendingCode,
    isVerifyingCode,
    isAuthenticated,
    setPhoneError,
    setEmailError,
    setNameError,
    setRecipientError,
    setRecipientPhoneError,
    setAddressError,
    setDateError,
    setTimeError,
    setSmsCode,
    setIsCodeSent,
    setIsSendingCode,
    setIsVerifyingCode,
    setIsAuthenticated,
    onFormChange,
    nextStep,
    prevStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    validateAllSteps,
    getMinDate,
    resetForm,
  } = useCheckoutForm();

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Проверяем состояние авторизации при загрузке
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { phone: storedPhone, isAuthenticated: storedAuth } = JSON.parse(authData);
      if (storedAuth && storedPhone) {
        setIsAuthenticated(true);
        setIsCodeSent(true);
        onFormChange({
          target: { name: 'phone', value: phoneMask(storedPhone) },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }, [setIsAuthenticated, setIsCodeSent, onFormChange]);

  const deliveryCost = useMemo(
    () => (form.deliveryMethod === 'delivery' ? 300 : 0),
    [form.deliveryMethod]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const upsellTotal = useMemo(
    () => selectedUpsells.reduce((sum, item) => sum + (item.price || 0), 0),
    [selectedUpsells]
  );

  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;
  const discountAmount = useMemo(() => {
    if (!promoDiscount || !promoType) return 0;
    if (promoType === 'percentage') {
      return (totalBeforeDiscounts * promoDiscount) / 100;
    }
    return promoDiscount;
  }, [promoDiscount, promoType, totalBeforeDiscounts]);

  const finalTotal = Math.max(0, totalBeforeDiscounts - discountAmount);
  const bonusAccrual = Math.floor(finalTotal * 0.025);

  const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE || '+79180300643';

  useEffect(() => {
    const fetchStoreSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .single();

        if (error) throw error;

        const transformedData: StoreSettings = {
          order_acceptance_enabled: data.order_acceptance_enabled ?? false,
          banner_message: data.banner_message ?? null,
          banner_active: data.banner_active ?? false,
          order_acceptance_schedule: transformSchedule(data.order_acceptance_schedule),
          store_hours: transformSchedule(data.store_hours),
        };

        setStoreSettings(transformedData);
      } catch (error: any) {
        console.error('Fetch store settings error:', error);
        toast.error('Не удалось загрузить настройки магазина');
      } finally {
        setIsStoreSettingsLoading(false);
      }
    };

    fetchStoreSettings();
  }, []);

  const canPlaceOrder = useMemo(() => {
    if (!storeSettings || isStoreSettingsLoading) return true;

    if (!storeSettings.order_acceptance_enabled) return false;

    const now = new Date();
    const dayKey = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const orderSchedule = storeSettings.order_acceptance_schedule[dayKey];
    if (!orderSchedule) return false;

    const { start, end, enabled } = orderSchedule;
    if (!start || !end || !enabled) return false;

    return currentTime >= start && currentTime <= end;
  }, [storeSettings, isStoreSettingsLoading]);

  const currentDaySchedule = useMemo(() => {
    if (!storeSettings || isStoreSettingsLoading) return null;

    const now = new Date();
    const dayKey = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    return {
      orderSchedule: storeSettings.order_acceptance_schedule[dayKey] || null,
      storeHours: storeSettings.store_hours[dayKey] || null,
      currentDay: dayKey,
    };
  }, [storeSettings, isStoreSettingsLoading]);

  const getStoreHoursForDate = (date: string): DaySchedule | null => {
    if (!storeSettings) return null;

    const selectedDate = new Date(date);
    const dayKey = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    return storeSettings.store_hours[dayKey] || null;
  };

  useEffect(() => {
    const loadYandexSuggestScript = () => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU&load=package.full&mode=release`;
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          console.log('Яндекс.Карты API инициализирован');
          setIsYmapsReady(true);
        });
      };
      script.onerror = () => {
        console.error('Ошибка загрузки Яндекс.Карт API');
        toast.error('Не удалось загрузить карту и автодополнение адресов. Проверьте интернет-соединение или попробуйте позже.');
      };
      document.body.appendChild(script);
    };

    if (!window.ymaps) {
      loadYandexSuggestScript();
    } else {
      window.ymaps.ready(() => {
        setIsYmapsReady(true);
      });
    }

    return () => {
      // Очистка скрипта при размонтировании компонента
      const scripts = document.querySelectorAll(`script[src*="api-maps.yandex.ru"]`);
      scripts.forEach(script => script.remove());
    };
  }, []);

  const fetchAddressSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || !isYmapsReady || !window.ymaps) return;

    setIsLoadingSuggestions(true);
    try {
      const response = await window.ymaps.suggest(query, {
        boundedBy: [
          [45.0, 38.9], // Юго-запад Краснодара
          [45.2, 39.1], // Северо-восток Краснодара
        ],
        strictBounds: true,
        results: 5,
      });

      const suggestions = response.suggestions.map((item: { value: string }) => item.value);
      setAddressSuggestions(suggestions);
      setShowSuggestions(true);

      window.gtag?.('event', 'fetch_address_suggestions', {
        event_category: 'cart',
        query,
      });
      window.ym?.(12345678, 'reachGoal', 'fetch_address_suggestions', { query });
    } catch (error) {
      console.error('Ошибка получения подсказок адреса:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
      toast.error('Не удалось загрузить подсказки адресов');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [isYmapsReady]);

  const handleSelectAddress = (address: string) => {
    onFormChange({
      target: { name: 'street', value: address },
    } as React.ChangeEvent<HTMLInputElement>);
    setShowSuggestions(false);
    setAddressError('');

    window.gtag?.('event', 'select_address_suggestion', {
      event_category: 'cart',
      selected_address: address,
    });
    window.ym?.(12345678, 'reachGoal', 'select_address_suggestion', {
      selected_address: address,
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFormChange(e);
    if (value.length > 2) {
      fetchAddressSuggestions(`Краснодар, ${value}`);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const removeUpsell = (id: string) => {
    setSelectedUpsells((prev) => prev.filter((item) => item.id !== id));
    toast.success('Товар удалён из корзины');
  };

  useEffect(() => {
    const allItems: CartItemType[] = [...items, ...selectedUpsells];
    const idCounts = allItems.reduce((acc, item) => {
      acc[item.id] = (acc[item.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicates = Object.entries(idCounts)
      .filter(([_, count]) => count > 1)
      .map(([id]) => id);
    if (duplicates.length > 0) {
      console.warn('Обнаружены дубликаты ID в корзине:', duplicates);
    }
  }, [items, selectedUpsells]);

  useEffect(() => {
    const fetchUpsellItems = async () => {
      try {
        setIsUpsellLoading(true);
        const res = await fetch(
          `/api/upsell/categories?category=podarki&subcategories=balloons,cards`
        );
        const { success, data, error } = await res.json();
        if (!success) {
          throw new Error(error || 'Не удалось загрузить дополнительные товары');
        }
        setUpsellItems(data || []);
      } catch (err: any) {
        setUpsellItems([]);
        toast.error(err.message || 'Не удалось загрузить дополнительные товары');
      } finally {
        setIsUpsellLoading(false);
      }
    };

    fetchUpsellItems();
  }, []);

  useEffect(() => {
    const cleanPhone = form.phone.replace(/\D/g, '');
    const fullPhone = `+7${cleanPhone}`;
    if (fullPhone === DEV_PHONE && cleanPhone.length === 10) {
      setIsAuthenticated(true);
      setIsCodeSent(true);
      localStorage.setItem('auth', JSON.stringify({ phone: fullPhone, isAuthenticated: true }));
      toast.success('Авторизация для разработчика выполнена автоматически');
    }
  }, [form.phone, setIsAuthenticated, setIsCodeSent]);

  useEffect(() => {
    if (isCodeSent && resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCodeSent, resendCooldown]);

  const handlePhoneChange = useCallback(
    (value: string) => {
      onFormChange({
        target: { name: 'phone', value: phoneMask(value) },
      } as React.ChangeEvent<HTMLInputElement>);
      setPhoneError('');
      setIsAuthenticated(false);
      setIsCodeSent(false);
      setSmsCode('');
      setBonusBalance(0);
      localStorage.removeItem('auth');
    },
    [onFormChange, setPhoneError, setIsAuthenticated, setIsCodeSent, setSmsCode]
  );

  const sendSmsCode = async () => {
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setPhoneError('Введите корректный номер телефона (10 цифр)');
      return;
    }
    setPhoneError('');
    setIsSendingCode(true);
    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${cleanPhone}` }),
      });
      const result = await res.json();
      if (result.success) {
        setIsCodeSent(true);
        setResendCooldown(60);
        toast.success('Код отправлен на ваш номер!');
        window.gtag?.('event', 'send_sms_code', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'send_sms_code');
      } else {
        toast.error(result.error || 'Не удалось отправить SMS-код.');
      }
    } catch {
      toast.error('Не удалось отправить SMS-код.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const resendSmsCode = async () => {
    setResendCooldown(60);
    await sendSmsCode();
  };

  const verifySmsCode = async () => {
    if (!smsCode.trim() || smsCode.length !== 6) {
      toast.error('Введите корректный код из SMS (6 цифр)');
      return;
    }
    setIsVerifyingCode(true);
    try {
      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${form.phone.replace(/\D/g, '')}`, code: smsCode }),
      });
      const result = await res.json();
      if (result.success) {
        setIsAuthenticated(true);
        setBonusBalance(result.bonusBalance || 0);
        localStorage.setItem('auth', JSON.stringify({ phone: `+7${form.phone.replace(/\D/g, '')}`, isAuthenticated: true }));
        toast.success('Авторизация успешна!');
        window.gtag?.('event', 'verify_sms_code', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'verify_sms_code');
      } else {
        toast.error(result.error || 'Неверный код. Попробуйте снова.');
      }
    } catch {
      toast.error('Ошибка проверки кода.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Введите промокод');
      return;
    }

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось применить промокод');
      }

      setPromoDiscount(result.discount);
      setPromoType(result.discountType);
      setPromoId(result.promoId);
      setPromoError(null);
      toast.success(`Промокод применён! Скидка: ${result.discount}${result.discountType === 'percentage' ? '%' : ' ₽'}`);
    } catch (error: any) {
      setPromoError(error.message);
      toast.error(error.message);
    }
  };

  const checkItems = async () => {
    const productIds = items
      .filter((item: CartItemType) => !item.isUpsell)
      .map((item: CartItemType) => parseInt(item.id, 10))
      .filter((id: number) => !isNaN(id));

    if (productIds.length === 0) return true;

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds);

    if (error) {
      console.error('Error checking products:', error);
      toast.error('Ошибка проверки товаров');
      return false;
    }

    const existingIds = new Set(data.map((p: any) => p.id));
    const invalidItems = items.filter((item: CartItemType) => !item.isUpsell && !existingIds.has(parseInt(item.id, 10)));
    if (invalidItems.length > 0) {
      toast.error(`Некоторые товары больше не доступны: ${invalidItems.map((i: CartItemType) => i.title).join(', ')}`);
      const validItems = items.filter((item: CartItemType) => item.isUpsell || existingIds.has(parseInt(item.id, 10)));
      clearCart();
      addMultipleItems(validItems);
      return false;
    }
    return true;
  };

  const submitOrder = async () => {
    console.log('submitOrder called');
    console.log('ValidateStep5 result:', validateStep5(agreed), 'Agreed:', agreed);
    if (!validateStep5(agreed)) {
      console.log('Validation failed for Step 5');
      return;
    }

    if (!validateAllSteps()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    console.log('CanPlaceOrder:', canPlaceOrder);
    if (!canPlaceOrder) {
      console.log('Cannot place order due to store settings');
      toast.error('Магазин временно не принимает заказы. Пожалуйста, выберите другое время или дату на шаге "Дата и время".');
      return;
    }

    if (!(await checkItems())) return;

    setIsSubmittingOrder(true);
    console.log('Submitting order...');
    try {
      const payload = {
        phone: `+7${form.phone.replace(/\D/g, '')}`,
        name: form.name,
        recipient: form.recipient,
        address:
          form.street && form.deliveryMethod !== 'pickup'
            ? `${form.street}${form.house ? `, д. ${form.house}` : ''}${
                form.apartment ? `, кв. ${form.apartment}` : ''}${form.entrance ? `, подъезд ${form.entrance}` : ''}`
            : 'Самовывоз',
        deliveryMethod: form.deliveryMethod,
        date: form.date,
        time: form.time,
        payment: form.payment,
        items: [
          ...items,
          ...selectedUpsells.map((u: UpsellItem) => ({
            id: u.id,
            title: u.title,
            price: u.price,
            quantity: 1,
            imageUrl: u.image_url,
            isUpsell: true,
            category: u.category,
          })),
        ],
        total: finalTotal,
        bonuses_used: 0,
        bonus: bonusAccrual,
        promo_id: promoId,
        promo_discount: discountAmount,
        delivery_instructions: form.deliveryInstructions || null,
        postcard_text: postcardText || null,
        anonymous: form.anonymous,
        whatsapp: form.whatsapp,
      };

      console.log('Order payload:', payload);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log('API response:', json, 'Status:', res.status);

      if (!res.ok || !json.success) {
        if (res.status === 429) {
          setErrorModal('Слишком много запросов. Попробуйте снова через несколько минут.');
        } else if (res.status === 401) {
          setErrorModal('Не авторизован. Пожалуйста, войдите снова.');
          setIsAuthenticated(false);
          setIsCodeSent(false);
          setSmsCode('');
          localStorage.removeItem('auth');
          setStep(1);
        } else {
          setErrorModal(json.error || 'Ошибка оформления заказа.');
        }
        return;
      }

      setOrderDetails({
        orderId: json.order_id,
        trackingUrl: json.tracking_url,
      });
      setShowSuccess(true);
      clearCart();
      resetForm();
      setSelectedUpsells([]);
      setPostcardText('');
      setPromoCode('');
      setPromoDiscount(null);
      setPromoType(null);
      setPromoId(null);
      window.gtag?.('event', 'submit_order', {
        event_category: 'cart',
        order_id: json.order_id,
        total: finalTotal,
      });
      window.ym?.(12345678, 'reachGoal', 'submit_order', {
        order_id: json.order_id,
        total: finalTotal,
      });
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setErrorModal('Произошла неизвестная ошибка при оформлении заказа.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const stepVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 pb-[80px] md:pb-12">
      <StoreBanner />
      <motion.h1
        className="mb-10 text-center text-4xl font-bold tracking-tight"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Оформление заказа
      </motion.h1>

      {!canPlaceOrder && currentDaySchedule && (
        <StoreScheduleNotice
          orderAcceptanceEnabled={storeSettings?.order_acceptance_enabled || false}
          orderSchedule={currentDaySchedule.orderSchedule}
          storeHours={currentDaySchedule.storeHours}
          currentDay={currentDaySchedule.currentDay}
        />
      )}

      <motion.div
        className="mb-6 flex justify-between items-center sticky top-0 z-30 bg-white py-2 md:static"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <motion.div key={s} className="flex items-center" variants={containerVariants}>
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: step >= s ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
              aria-label={`Шаг ${s}`}
            >
              {s}
            </motion.div>
            {s < 5 && (
              <motion.div
                className={`h-1 w-12 mx-2 ${step > s ? 'bg-black' : 'bg-gray-200'}`}
                initial={{ width: '0%', opacity: 0 }}
                animate={{ width: step > s ? '100%' : '0%', opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-6 grid gap-10 md:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 md:col-span-2"
          >
            {step === 1 && (
              <OrderStep step={1} currentStep={step} title="Ваши контакты" onNext={nextStep}>
                <Step1ContactDetails
                  form={form}
                  phoneError={phoneError}
                  emailError={emailError}
                  nameError={nameError}
                  smsCode={smsCode}
                  isCodeSent={isCodeSent}
                  isSendingCode={isSendingCode}
                  isVerifyingCode={isVerifyingCode}
                  isAuthenticated={isAuthenticated}
                  onFormChange={onFormChange}
                  handlePhoneChange={handlePhoneChange}
                  sendSmsCode={sendSmsCode}
                  verifySmsCode={verifySmsCode}
                  resendSmsCode={resendSmsCode}
                  resendCooldown={resendCooldown}
                  setSmsCode={setSmsCode}
                  setIsCodeSent={setIsCodeSent}
                />
                {isAuthenticated && (
                  <motion.div className="flex flex-wrap gap-2 mt-4" variants={containerVariants}>
                    {isUpsellLoading ? (
                      <motion.div
                        className="flex justify-center py-4"
                        variants={containerVariants}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Image src="/icons/spinner.svg" alt="Загрузка" width={24} height={24} className="animate-spin" />
                      </motion.div>
                    ) : (
                      <>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowPostcard(true);
                            window.gtag?.('event', 'open_postcard_modal', { event_category: 'cart' });
                            window.ym?.(12345678, 'reachGoal', 'open_postcard_modal');
                          }}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 hover:shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                          aria-label="Добавить открытку"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image src="/icons/gift.svg" alt="Подарок" width={16} height={16} className="text-gray-600" />
                          Добавить открытку
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowBalloons(true);
                            window.gtag?.('event', 'open_balloons_modal', { event_category: 'cart' });
                            window.ym?.(12345678, 'reachGoal', 'open_balloons_modal');
                          }}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 hover:shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                          aria-label="Добавить шары"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image src="/icons/gift.svg" alt="Подарок" width={16} height={16} className="text-gray-600" />
                          Добавить шары
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}
              </OrderStep>
            )}
            {step === 2 && (
              <OrderStep
                step={2}
                currentStep={step}
                title="Данные получателя"
                onNext={nextStep}
                onBack={prevStep}
              >
                <Step2RecipientDetails
                  form={form}
                  name={form.name}
                  userPhone={form.phone}
                  recipientError={recipientError}
                  recipientPhoneError={recipientPhoneError}
                  postcardText={postcardText}
                  selectedUpsells={selectedUpsells}
                  onFormChange={onFormChange}
                  setPostcardText={setPostcardText}
                />
              </OrderStep>
            )}
            {step === 3 && (
              <OrderStep
                step={3}
                currentStep={step}
                title="Адрес"
                onNext={nextStep}
                onBack={prevStep}
              >
                <Step3Address
                  form={form}
                  addressError={addressError}
                  showSuggestions={showSuggestions}
                  isLoadingSuggestions={isLoadingSuggestions}
                  addressSuggestions={addressSuggestions}
                  onFormChange={onFormChange}
                  handleAddressChange={handleAddressChange}
                  handleSelectAddress={handleSelectAddress}
                  isYmapsReady={isYmapsReady}
                />
              </OrderStep>
            )}
            {step === 4 && (
              <OrderStep
                step={4}
                currentStep={step}
                title="Дата и время"
                onNext={nextStep}
                onBack={prevStep}
              >
                <Step4DateTime
                  form={form}
                  dateError={dateError}
                  timeError={timeError}
                  onFormChange={onFormChange}
                  getMinDate={getMinDate}
                  storeHours={storeSettings?.store_hours || {}}
                  maxProductionTime={maxProductionTime}
                />
              </OrderStep>
            )}
            {step === 5 && (
              <OrderStep
                step={5}
                currentStep={step}
                title="Способ оплаты"
                onNext={submitOrder}
                onBack={prevStep}
              >
                <Step5Payment agreed={agreed} setAgreed={setAgreed} />
              </OrderStep>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="space-y-6">
          {items.map((i, idx) => (
            <CartItemComponent
              key={`item-${i.id}-${idx}`}
              item={i}
              removeItem={removeItem}
              updateQuantity={updateQuantity}
            />
          ))}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Промокод</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Введите промокод"
                className="border rounded-lg p-2 flex-1"
              />
              <button
                onClick={handleApplyPromo}
                className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all"
              >
                Применить
              </button>
            </div>
            {promoError && <p className="text-red-500 mt-2">{promoError}</p>}
            {promoDiscount !== null && (
              <p className="text-green-500 mt-2">
                Промокод применён! Скидка: {promoDiscount}{promoType === 'percentage' ? '%' : ' ₽'}
              </p>
            )}
          </div>
          <CartSummary
            items={items}
            selectedUpsells={selectedUpsells}
            deliveryCost={deliveryCost}
            bonusBalance={bonusBalance}
            bonusAccrual={bonusAccrual}
            finalTotal={finalTotal}
            discountAmount={discountAmount}
            removeUpsell={removeUpsell}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </motion.div>

      {items.length > 0 && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white/90 backdrop-blur px-4 py-3 border-t shadow-md"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => setStep(1)}
            disabled={isSubmittingOrder || !canPlaceOrder}
            className={`w-full rounded-lg bg-black py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isSubmittingOrder || !canPlaceOrder ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={`Оформить заказ за ${finalTotal} ₽`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmittingOrder ? (
              <>
                <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
                Оформление...
              </>
            ) : (
              `Оформить за ${finalTotal} ₽`
            )}
          </motion.button>
        </motion.div>
      )}

      {showPostcard && (
        <UpsellModal
          type="postcard"
          onClose={() => setShowPostcard(false)}
          onSelect={(item: UpsellItem) => {
            setSelectedUpsells((prev) => {
              if (prev.some((i) => i.id === item.id)) {
                return prev;
              }
              return [...prev, { ...item, category: 'postcard', isUpsell: true }];
            });
            setShowPostcard(false);
          }}
        />
      )}
      {showBalloons && (
        <UpsellModal
          type="balloon"
          onClose={() => setShowBalloons(false)}
          onSelect={(item: UpsellItem) => {
            setSelectedUpsells((prev) => {
              if (prev.some((i) => i.id === item.id)) {
                return prev;
              }
              return [...prev, { ...item, category: 'balloon', isUpsell: true }];
            });
            setShowBalloons(false);
          }}
        />
      )}
      {showSuccess && orderDetails && (
        <ThankYouModal
          onClose={() => setShowSuccess(false)}
          orderId={orderDetails.orderId}
          trackingUrl={orderDetails.trackingUrl}
        />
      )}
      {errorModal && (
        <ErrorModal
          message={errorModal}
          onRetry={submitOrder}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  );
}