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
import CartItem from './components/CartItem';
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
import debounce from 'lodash/debounce';
import { CartItemType, UpsellItem } from './types';

// Типизация для Yandex Maps API
interface YandexMaps {
  suggest: (query: string, options: { boundedBy: number[][]; strictBounds: boolean; results: number }) => Promise<{ value: string }[]>;
}

declare global {
  interface Window {
    ymaps: YandexMaps;
  }
}

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
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [showPromoField, setShowPromoField] = useState<boolean>(false);

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
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        console.log('Яндекс.Карты API загружен');
      };
      script.onerror = () => {
        console.error('Ошибка загрузки Яндекс.Карт API');
        toast.error('Не удалось загрузить автодополнение адресов');
      };
      document.body.appendChild(script);
    };

    if (!window.ymaps) {
      loadYandexSuggestScript();
    }
  }, []);

  const fetchAddressSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !window.ymaps) return;

      setIsLoadingSuggestions(true);
      try {
        const response = await window.ymaps.suggest(query, {
          boundedBy: [[45.0, 38.9], [45.2, 39.1]],
          strictBounds: true,
          results: 5,
        });

        setAddressSuggestions(response.map((item: any) => item.value));
        setShowSuggestions(true);

        window.gtag?.('event', 'fetch_address_suggestions', {
          event_category: 'cart',
          event_label: query,
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
    }, 300),
    []
  );

  const handleSelectAddress = useCallback(
    (address: string) => {
      onFormChange({
        target: { name: 'street', value: address },
      } as React.ChangeEvent<HTMLInputElement>);
      setShowSuggestions(false);
      setAddressError('');

      window.gtag?.('event', 'select_address_suggestion', {
        event_category: 'cart',
        event_label: address,
      });
      window.ym?.(12345678, 'reachGoal', 'select_address_suggestion', {
        selected_address: address,
      });
    },
    [onFormChange, setAddressError]
  );

  const handleAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onFormChange(e);
      if (value.length > 2) {
        fetchAddressSuggestions(`Краснодар, ${value}`);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [onFormChange, fetchAddressSuggestions]
  );

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const removeUpsell = useCallback((id: string) => {
    setSelectedUpsells((prev) => prev.filter((item) => item.id !== id));
    toast.success('Товар удалён из корзины');
    window.gtag?.('event', 'remove_upsell', {
      event_category: 'cart',
      event_label: id,
    });
    window.ym?.(12345678, 'reachGoal', 'remove_upsell', { upsell_id: id });
  }, []);

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
        const res = await fetch(`/api/upsell/categories?category=podarki&subcategories=balloons,cards`);
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

  const handlePhoneChange = useCallback(
    (value: string) => {
      const cleanValue = value.replace(/\D/g, '');
      const formattedPhone = phoneMask(cleanValue);
      onFormChange({
        target: { name: 'phone', value: formattedPhone },
      } as React.ChangeEvent<HTMLInputElement>);
      setPhoneError('');
      setIsCodeSent(false);
      setSmsCode('');
      setBonusBalance(0);
    },
    [onFormChange, setPhoneError, setIsCodeSent, setSmsCode]
  );

  const sendSmsCode = useCallback(async () => {
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
      console.log('Ответ от API:', result);
      if (result.success) {
        console.log('Установка isCodeSent в true');
        setIsCodeSent(true);
        toast.success('Код отправлен на ваш номер!');
        window.gtag?.('event', 'send_sms_code', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'send_sms_code');
      } else {
        console.error('Ошибка отправки SMS:', result.error);
        setPhoneError(result.error || 'Не удалось отправить SMS-код.');
        toast.error(result.error || 'Не удалось отправить SMS-код.');
      }
    } catch (error) {
      console.error('Ошибка при вызове API:', error);
      setPhoneError('Не удалось отправить SMS-код.');
      toast.error('Не удалось отправить SMS-код.');
    } finally {
      console.log('Завершение отправки SMS, isSendingCode: false');
      setIsSendingCode(false);
      setTimeout(() => {
        console.log('Текущее состояние после отправки SMS:', { isCodeSent, isAuthenticated, isSendingCode });
      }, 0);
    }
  }, [form.phone, setPhoneError, setIsSendingCode, setIsCodeSent]);

  const resendSmsCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setPhoneError('Введите корректный номер телефона (10 цифр)');
      return;
    }

    setIsSendingCode(true);
    setResendCooldown(90);
    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${cleanPhone}` }),
      });
      const result = await res.json();
      console.log('Ответ от /api/auth/send-sms (resend):', result);
      if (result.success) {
        console.log('Установка isCodeSent в true (resend)');
        setIsCodeSent(true);
        toast.success('Код отправлен повторно!');
        window.gtag?.('event', 'resend_sms_code', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'resend_sms_code');
      } else {
        console.error('Ошибка повторной отправки SMS:', result.error);
        setPhoneError(result.error || 'Не удалось отправить SMS-код.');
        toast.error(result.error || 'Не удалось отправить SMS-код.');
      }
    } catch (error) {
      console.error('Ошибка при повторном вызове API:', error);
      setPhoneError('Не удалось отправить SMS-код.');
      toast.error('Не удалось отправить SMS-код.');
    } finally {
      console.log('Завершение повторной отправки SMS, isSendingCode: false');
      setIsSendingCode(false);
      setTimeout(() => {
        console.log('Текущее состояние после повторной отправки SMS:', { isCodeSent, isAuthenticated, isSendingCode });
      }, 0);
    }
  }, [form.phone, resendCooldown, setPhoneError, setIsSendingCode, setIsCodeSent]);

  const verifySmsCode = useCallback(async () => {
    if (!smsCode.trim()) {
      toast.error('Введите код из SMS');
      return;
    }
    setIsVerifyingCode(true);
    try {
      const fullPhone = `+7${form.phone.replace(/\D/g, '')}`;
      console.log('Отправка в verify-sms:', { phone: fullPhone, code: smsCode });
      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: smsCode }),
      });
      const result = await res.json();
      console.log('Ответ от /api/auth/verify-sms:', result);
      if (result.success) {
        setIsAuthenticated(true);
        setBonusBalance(result.bonusBalance || 0);
        localStorage.setItem('auth', JSON.stringify({ phone: fullPhone, isAuthenticated: true }));
        document.cookie = `auth=${JSON.stringify({ phone: fullPhone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
        console.log('Cookie set after verify in CartPage:', document.cookie);
        setStep(1);
        toast.success('Авторизация успешна!');
        window.gtag?.('event', 'verify_sms_code', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'verify_sms_code');
      } else {
        console.error('Ошибка верификации SMS:', result.error);
        toast.error(result.error || 'Неверный код. Попробуйте снова.');
      }
    } catch (error) {
      console.error('Ошибка при верификации SMS:', error);
      toast.error('Ошибка проверки кода.');
    } finally {
      console.log('Завершение верификации SMS, isVerifyingCode: false');
      setIsVerifyingCode(false);
      console.log('Текущее состояние:', { isCodeSent, isAuthenticated, isVerifyingCode });
    }
  }, [smsCode, form.phone, setIsVerifyingCode, setIsAuthenticated, setBonusBalance, setStep]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleApplyPromo = useCallback(async () => {
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
      window.gtag?.('event', 'apply_promo', {
        event_category: 'cart',
        event_label: promoCode,
      });
      window.ym?.(12345678, 'reachGoal', 'apply_promo', { promo_code: promoCode });
    } catch (error: any) {
      setPromoError(error.message);
      toast.error(error.message);
    }
  }, [promoCode]);

  const checkItems = useCallback(async () => {
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
    const invalidItems = items.filter(
      (item: CartItemType) => !item.isUpsell && !existingIds.has(parseInt(item.id, 10))
    );
    if (invalidItems.length > 0) {
      toast.error(
        `Некоторые товары больше не доступны: ${invalidItems.map((i: CartItemType) => i.title).join(', ')}`
      );
      const validItems = items.filter(
        (item: CartItemType) => item.isUpsell || existingIds.has(parseInt(item.id, 10))
      );
      clearCart();
      addMultipleItems(validItems);
      return false;
    }
    return true;
  }, [items, supabase, clearCart, addMultipleItems]);

  const submitOrder = useCallback(async () => {
    if (!validateStep5(agreed)) {
      return;
    }

    if (!validateAllSteps()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!canPlaceOrder) {
      toast.error(
        'Магазин временно не принимает заказы. Пожалуйста, выберите другое время или дату на шаге "Дата и время".'
      );
      return;
    }

    if (!(await checkItems())) return;

    setIsSubmittingOrder(true);
    try {
      const payload = {
        phone: `+7${form.phone.replace(/\D/g, '')}`,
        name: form.name,
        recipient: form.recipient,
        address:
          form.street && form.deliveryMethod !== 'pickup'
            ? `${form.street}${form.house ? `, д. ${form.house}` : ''}${
                form.apartment ? `, кв. ${form.apartment}` : ''
              }${form.entrance ? `, подъезд ${form.entrance}` : ''}`
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

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 429) {
          setErrorModal('Слишком много запросов. Попробуйте снова через несколько минут.');
        } else if (res.status === 401) {
          setErrorModal('Не авторизован. Пожалуйста, войдите снова.');
          setIsAuthenticated(false);
          setIsCodeSent(false);
          setSmsCode('');
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
        event_label: json.order_id,
        value: finalTotal,
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
  }, [
    validateStep5,
    agreed,
    validateAllSteps,
    canPlaceOrder,
    checkItems,
    form,
    items,
    selectedUpsells,
    finalTotal,
    bonusAccrual,
    promoId,
    discountAmount,
    postcardText,
    setIsSubmittingOrder,
    setErrorModal,
    setOrderDetails,
    setShowSuccess,
    clearCart,
    resetForm,
    setSelectedUpsells,
    setPostcardText,
    setPromoCode,
    setPromoDiscount,
    setPromoType,
    setPromoId,
    setIsAuthenticated,
    setIsCodeSent,
    setSmsCode,
    setStep,
  ]);

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
        className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl"
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
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium sm:w-8 sm:h-8 sm:text-sm ${
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
                className={`h-1 w-6 mx-1 sm:w-10 ${step > s ? 'bg-black' : 'bg-gray-200'}`}
                initial={{ width: '0%', opacity: 0 }}
                animate={{ width: step > s ? '100%' : '0%', opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-6 grid gap-6 md:grid-cols-3 md:gap-10"
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
                  resendCooldown={resendCooldown}
                  resendSmsCode={resendSmsCode}
                  setIsCodeSent={setIsCodeSent}
                  onFormChange={onFormChange}
                  handlePhoneChange={handlePhoneChange}
                  sendSmsCode={sendSmsCode}
                  verifySmsCode={verifySmsCode}
                  setSmsCode={setSmsCode}
                />
                {isAuthenticated && (
                  <motion.div className="flex flex-wrap gap-2 mt-4" variants={containerVariants}>
                    {isUpsellLoading ? (
                      <motion.div
                        className="flex justify-center py-4 w-full"
                        variants={containerVariants}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Image
                          src="/icons/spinner.svg"
                          alt="Иконка загрузки"
                          width={24}
                          height={24}
                          loading="lazy"
                          className="animate-spin"
                        />
                      </motion.div>
                    ) : (
                      <>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowPostcard(true);
                            window.gtag?.('event', 'open_postcard_modal', {
                              event_category: 'cart',
                            });
                            window.ym?.(12345678, 'reachGoal', 'open_postcard_modal');
                          }}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:shadow-sm transition-all duration-300 sm:px-4 sm:py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                          aria-label="Добавить открытку"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image
                            src="/icons/gift.svg"
                            alt="Иконка подарка"
                            width={16}
                            height={16}
                            loading="lazy"
                            className="text-gray-600"
                          />
                          <span>Добавить открытку</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setShowBalloons(true);
                            window.gtag?.('event', 'open_balloons_modal', {
                              event_category: 'cart',
                            });
                            window.ym?.(12345678, 'reachGoal', 'open_balloons_modal');
                          }}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:shadow-sm transition-all duration-300 sm:px-4 sm:py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                          aria-label="Добавить шары"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image
                            src="/icons/gift.svg"
                            alt="Иконка подарка"
                            width={16}
                            height={16}
                            loading="lazy"
                            className="text-gray-600"
                          />
                          <span>Добавить шары</span>
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}
              </OrderStep>
            )}
            {step === 2 && (
              <OrderStep step={2} currentStep={step} title="Данные получателя" onNext={nextStep} onBack={prevStep}>
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
              <OrderStep step={3} currentStep={step} title="Адрес" onNext={nextStep} onBack={prevStep}>
                <Step3Address
                  form={form}
                  addressError={addressError}
                  showSuggestions={showSuggestions}
                  isLoadingSuggestions={isLoadingSuggestions}
                  addressSuggestions={addressSuggestions}
                  onFormChange={onFormChange}
                  handleAddressChange={handleAddressChange}
                  handleSelectAddress={handleSelectAddress}
                />
              </OrderStep>
            )}
            {step === 4 && (
              <OrderStep step={4} currentStep={step} title="Дата и время" onNext={nextStep} onBack={prevStep}>
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
              <OrderStep step={5} currentStep={step} title="Способ оплаты" onNext={submitOrder} onBack={prevStep}>
                <Step5Payment agreed={agreed} setAgreed={setAgreed} />
              </OrderStep>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="space-y-6">
          {[...items, ...selectedUpsells]
            .filter(
              (item, index, self) =>
                index === self.findIndex((t) => t.id === item.id)
            )
            .map((item, idx) => {
              const isUpsell = 'isUpsell' in item && item.isUpsell;
              return (
                <CartItem
                  key={`${isUpsell ? 'upsell' : 'item'}-${item.id}-${idx}`}
                  item={item}
                  removeItem={isUpsell ? removeUpsell : removeItem}
                  updateQuantity={isUpsell ? undefined : updateQuantity}
                />
              );
            })}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sm:p-6">
            <motion.button
              onClick={() => {
                setShowPromoField(!showPromoField);
                window.gtag?.('event', showPromoField ? 'hide_promo_field' : 'show_promo_field', {
                  event_category: 'cart',
                });
                window.ym?.(12345678, 'reachGoal', showPromoField ? 'hide_promo_field' : 'show_promo_field');
              }}
              className="w-full text-sm text-gray-500 underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-black"
              aria-expanded={showPromoField}
              aria-controls="promo-field"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/icons/plus.svg"
                alt={showPromoField ? 'Скрыть поле промокода' : 'Показать поле промокода'}
                width={14}
                height={14}
                loading="lazy"
              />
              {showPromoField ? 'Скрыть промокод' : 'У меня есть промокод'}
            </motion.button>
            <AnimatePresence>
              {showPromoField && (
                <motion.div
                  id="promo-field"
                  className="mt-2 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Введите промокод"
                      className="border rounded-lg p-2 flex-1 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
                      aria-label="Введите промокод"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all sm:px-6 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      aria-label="Применить промокод"
                    >
                      Применить
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-red-500 text-xs mt-1">{promoError}</p>
                  )}
                  {promoDiscount !== null && (
                    <p className="text-green-500 text-xs mt-1">
                      Промокод применён! Скидка: {promoDiscount}
                      {promoType === 'percentage' ? '%' : ' ₽'}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

      {(items.length > 0 || selectedUpsells.length > 0) && step === 1 && form.phone && isAuthenticated && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white/90 backdrop-blur px-4 py-3 border-t shadow-md"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => setStep(1)}
            disabled={isSubmittingOrder || !canPlaceOrder}
            className={`w-full rounded-lg bg-black py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 flex items-center justify-center gap-2 sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isSubmittingOrder || !canPlaceOrder ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={`Оформить заказ за ${finalTotal} ₽`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmittingOrder ? (
              <>
                <Image
                  src="/icons/spinner.svg"
                  alt="Иконка загрузки"
                  width={20}
                  height={20}
                  loading="lazy"
                  className="animate-spin"
                />
                <span>Оформление...</span>
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
        <ErrorModal message={errorModal} onRetry={submitOrder} onClose={() => setErrorModal(null)} />
      )}
    </div>
  );
}