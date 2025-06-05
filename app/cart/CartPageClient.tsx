// ✅ Путь: app/cart/CartPageClient.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useCart } from '@context/CartContext';
import OrderStep from '@components/OrderStep';
import StoreBanner from '@components/StoreBanner';
import StoreScheduleNotice from '@components/StoreScheduleNotice';
import CartSummary from './components/CartSummary';
import CartItem from './components/CartItem';
import ThankYouModal from './components/ThankYouModal';
import ErrorModalComponent from './components/ErrorModal';
import UpsellModal from './components/UpsellModal';
import Step1ContactDetails from './components/steps/Step1ContactDetails';
import Step2RecipientDetails from './components/steps/Step2RecipientDetails';
import Step3Address from './components/steps/Step3Address';
import Step4DateTime from './components/steps/Step4DateTime';
import Step5Payment from './components/steps/Step5Payment';
import AuthWithCall from '@components/AuthWithCall';
import useCheckoutForm from './hooks/useCheckoutForm';
import debounce from 'lodash/debounce';
import { CartItemType, UpsellItem } from './types';
import { AnimatePresence, motion } from 'framer-motion';

// Анимации
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};
const stepVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

// Модалка ошибки
interface ErrorModalProps {
  message: string;
  onRetry: () => Promise<void>;
  onClose: () => void;
}
const ErrorModal = ErrorModalComponent as React.FC<ErrorModalProps>;

// Типы для Yandex Maps
interface YandexMaps {
  suggest: (
    query: string,
    options: { boundedBy: number[][]; strictBounds: boolean; results: number }
  ) => Promise<{ value: string }[]>;
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
type Step = 0 | 1 | 2 | 3 | 4 | 5;

// Телефон нормализация
const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) return `+${cleanPhone}`;
  if (cleanPhone.length === 10) return `+7${cleanPhone}`;
  if (cleanPhone.length === 11 && cleanPhone.startsWith('8')) return `+7${cleanPhone.slice(1)}`;
  return phone.startsWith('+') ? phone : `+${phone}`;
};

const transformSchedule = (schedule: any): Record<string, DaySchedule> => {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result: Record<string, DaySchedule> = daysOfWeek.reduce(
    (acc, day) => {
      acc[day] = { start: '09:00', end: '18:00' };
      return acc;
    },
    {} as Record<string, DaySchedule>
  );
  if (typeof schedule !== 'object' || schedule === null) return result;
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

export default function CartPageClient() {
  let cartContext;
  try {
    cartContext = useCart();
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Cart context error:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Ошибка: Корзина недоступна. Пожалуйста, обновите страницу.</p>
      </div>
    );
  }
  const { items, updateQuantity, removeItem, clearCart, maxProductionTime, addMultipleItems } = cartContext;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [useBonuses, setUseBonuses] = useState<boolean>(false);
  const [bonusesUsed, setBonusesUsed] = useState<number>(0);
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
    orderNumber: number;
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
  const [showPromoField, setShowPromoField] = useState<boolean>(false);
  const [isStep4Valid, setIsStep4Valid] = useState<boolean>(true);
  const [step4ErrorMessage, setStep4ErrorMessage] = useState<string>('');

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
    agreedToTermsError,
    setPhoneError,
    setEmailError,
    setNameError,
    setRecipientError,
    setRecipientPhoneError,
    setAddressError,
    setDateError,
    setTimeError,
    onFormChange,
    nextStep,
    prevStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    getMinDate,
    resetForm,
  } = useCheckoutForm();

  const handleStep4ValidationChange = useCallback((isValid: boolean, errorMessage: string) => {
    setIsStep4Valid(isValid);
    setStep4ErrorMessage(errorMessage);
  }, []);

  // Обработчик изменения телефона
  const handlePhoneChange = useCallback(
    (value: string) => {
      const normalized = normalizePhone(value);
      onFormChange({ target: { name: 'phone', value: normalized } } as React.ChangeEvent<HTMLInputElement>);
      setPhoneError('');
    },
    [onFormChange, setPhoneError]
  );

  // Проверка корзины и удаление невалидных товаров
  useEffect(() => {
    const validateAndCleanCart = async () => {
      if (items.length === 0) return;

      try {
        const productIds = items
          .filter((item: CartItemType) => !item.isUpsell)
          .map((item: CartItemType) => parseInt(item.id, 10))
          .filter((id: number) => !isNaN(id));

        if (productIds.length === 0) return;

        const res = await fetch('/api/products/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: parseInt(item.id, 10),
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });
        const json = await res.json();

        if (!json.valid) {
          const invalidItems = json.invalidItems || [];
          const itemsToRemove = invalidItems
            .filter((invalidItem: { id: number; reason: string }) =>
              invalidItem.reason === 'Товар не найден' ||
              invalidItem.reason === 'Товар отсутствует в наличии' ||
              invalidItem.reason === 'Товар не доступен для заказа'
            )
            .map((invalidItem: { id: number }) => invalidItem.id.toString());

          if (itemsToRemove.length > 0) {
            const removedTitles = items
              .filter((item: CartItemType) => itemsToRemove.includes(item.id))
              .map((item: CartItemType) => item.title)
              .join(', ');

            const updatedItems = items.filter((item: CartItemType) => !itemsToRemove.includes(item.id));
            clearCart();
            if (updatedItems.length > 0) {
              addMultipleItems(updatedItems);
            }
            toast.error(`Следующие товары больше не доступны и были удалены из корзины: ${removedTitles}`);
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Error validating cart items:', error);
        toast.error('Не удалось проверить товары в корзине.');
      }
    };

    validateAndCleanCart();
  }, [items, clearCart, addMultipleItems]);

  // Синхронизация цен в корзине с базой данных
  useEffect(() => {
    const syncCartPrices = async () => {
      if (items.length === 0) return;

      try {
        const productIds = items
          .filter((item: CartItemType) => !item.isUpsell)
          .map((item: CartItemType) => parseInt(item.id, 10))
          .filter((id: number) => !isNaN(id));

        if (productIds.length === 0) return;

        const res = await fetch('/api/products/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: parseInt(item.id, 10),
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });
        const json = await res.json();

        if (!json.valid) {
          const updatedItems = [...items];
          json.invalidItems.forEach((invalidItem: { id: number; reason: string }) => {
            if (invalidItem.reason.includes('Цена изменилась')) {
              const match = invalidItem.reason.match(/текущая (\d+)/);
              if (match) {
                const newPrice = parseInt(match[1], 10);
                const itemIndex = updatedItems.findIndex((item) => parseInt(item.id, 10) === invalidItem.id);
                if (itemIndex !== -1) {
                  updatedItems[itemIndex] = { ...updatedItems[itemIndex], price: newPrice };
                  toast(`Цена товара "${updatedItems[itemIndex].title}" обновлена до ${newPrice} ₽`);
                }
              }
            }
          });

          clearCart();
          addMultipleItems(updatedItems);
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Error syncing cart prices:', error);
        toast.error('Не удалось синхронизировать цены корзины');
      }
    };

    syncCartPrices();
  }, [items, clearCart, addMultipleItems]);

  // Проверка сессии и профиля
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const json = await res.json();
        if (isMounted && res.ok && json.user) {
          const normalizedPhone = normalizePhone(json.user.phone);
          setIsAuthenticated(true);
          setPhone(normalizedPhone);
          setUserId(json.user.id);
          onFormChange({ target: { name: 'phone', value: normalizedPhone } } as React.ChangeEvent<HTMLInputElement>);
          const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`);
          const bonusJson = await bonusRes.json();
          if (isMounted && bonusRes.ok && bonusJson.success) {
            setBonusBalance(bonusJson.data.bonus_balance || 0);
          }
          setStep(1);
        } else if (isMounted) {
          setStep(0);
        }
      } catch (err) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка проверки сессии:', err);
        if (isMounted) setStep(0);
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Добавляем отладку для nextStep
  const handleNextStep = useCallback(() => {
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) {
        // Ошибка уже отобразится через toast.error в validateStep1
        return;
      }
      nextStep();
    } else if (step === 4) {
      const isValid = validateStep4();
      if (!isValid) {
        toast.error('Пожалуйста, выберите корректные дату и время доставки');
        return;
      }
      if (!isStep4Valid) {
        toast.error(step4ErrorMessage);
        return;
      }
      nextStep();
    } else {
      nextStep();
    }
  }, [step, validateStep1, validateStep4, isStep4Valid, step4ErrorMessage, nextStep]);

  // Вычисления для заказа
  const deliveryCost = useMemo(() => (form.deliveryMethod === 'delivery' ? 300 : 0), [form.deliveryMethod]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const upsellTotal = useMemo(
    () => selectedUpsells.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    [selectedUpsells]
  );
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;
  const discountAmount = useMemo(() => {
    if (!promoDiscount || !promoType) return 0;
    const amount = promoType === 'percentage' ? (totalBeforeDiscounts * promoDiscount) / 100 : promoDiscount;
    process.env.NODE_ENV !== "production" && console.log('Calculating discountAmount:', {
      promoDiscount,
      promoType,
      totalBeforeDiscounts,
      amount,
    });
    return amount;
  }, [promoDiscount, promoType, totalBeforeDiscounts]);
  const maxBonusesAllowed = Math.floor(totalBeforeDiscounts * 0.15);
  const bonusesToUse = useBonuses ? Math.min(bonusBalance, maxBonusesAllowed) : 0;
  useEffect(() => {
    setBonusesUsed(bonusesToUse);
  }, [bonusesToUse]);
  const finalTotal = Math.max(0, totalBeforeDiscounts - discountAmount - bonusesToUse);
  const bonusAccrual = Math.floor(finalTotal * 0.025);

  // Загрузка настроек магазина
  useEffect(() => {
    let isMounted = true;
    const fetchStoreSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled: json.data.order_acceptance_enabled ?? false,
            banner_message: json.data.banner_message ?? null,
            banner_active: json.data.banner_active ?? false,
            order_acceptance_schedule: transformSchedule(json.data.order_acceptance_schedule),
            store_hours: transformSchedule(json.data.store_hours),
          });
        } else if (isMounted) {
          toast.error('Не удалось загрузить настройки магазина');
        }
      } catch (error: any) {
        if (isMounted) toast.error('Не удалось загрузить настройки магазина');
      } finally {
        if (isMounted) setIsStoreSettingsLoading(false);
      }
    };
    fetchStoreSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Доступность оформления заказа
  const canPlaceOrder = useMemo(() => {
    if (!storeSettings || isStoreSettingsLoading) return true;
    if (!storeSettings.order_acceptance_enabled) {
      toast.error('Магазин временно не принимает заказы. Попробуйте позже.');
      return false;
    }
    return true;
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

  // Яндекс подсказки
  useEffect(() => {
    let isMounted = true;
    const loadYandexSuggestScript = () => {
      if (document.querySelector('script[src*="api-maps.yandex.ru"]')) return;
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (isMounted) process.env.NODE_ENV !== "production" && console.log('Яндекс.Карты загружены');
      };
      script.onerror = () => {
        if (isMounted) toast.error('Не удалось загрузить автодополнение адресов');
      };
      document.body.appendChild(script);
    };
    loadYandexSuggestScript();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAddressSuggestions = useCallback(
    debounce((query: string) => {
      if (!query.trim() || typeof window === 'undefined' || !window.ymaps || !window.ymaps.ready) return;
      setIsLoadingSuggestions(true);
      window.ymaps.ready(() => {
        window.ymaps!
          .suggest(query, {
            boundedBy: [[45.0, 38.9], [45.2, 39.1]],
            strictBounds: true,
            results: 5,
          })
          .then((response) => {
            setAddressSuggestions(response.map((item: any) => item.value));
            setShowSuggestions(true);
          })
          .catch(() => {
            setAddressSuggestions([]);
            setShowSuggestions(false);
          })
          .finally(() => {
            setIsLoadingSuggestions(false);
          });
      });
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
    const handleClickOutside = (event: MouseEvent) => {
      setShowSuggestions(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Upsell (подарки/открытки)
  const removeUpsell = useCallback((id: string) => {
    setSelectedUpsells((prev) => prev.filter((item) => item.id !== id));
    toast.success('Товар удалён из корзины');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUpsellItems = async () => {
      setIsUpsellLoading(true);
      try {
        const res = await fetch(`/api/upsell/categories?category=podarki&subcategories=balloons,cards`);
        const { success, data, error } = await res.json();
        if (isMounted && !success) throw new Error(error || 'Не удалось загрузить дополнительные товары');
        if (isMounted) {
          const upsellWithQuantity = (data || []).map((item: Omit<UpsellItem, 'quantity'>) => ({
            ...item,
            quantity: 1,
          }));
          setUpsellItems(upsellWithQuantity);
        }
      } catch (err: any) {
        if (isMounted) {
          setUpsellItems([]);
          toast.error(err.message || 'Не удалось загрузить дополнительные товары');
        }
      } finally {
        if (isMounted) setIsUpsellLoading(false);
      }
    };
    fetchUpsellItems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Промокод
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
      if (!response.ok) throw new Error(result.error || 'Не удалось применить промокод');
      
      process.env.NODE_ENV !== "production" && console.log('handleApplyPromo: Result from API:', result);
      setPromoDiscount(result.discount);
      setPromoType(result.discountType);
      setPromoId(result.promoId);
      setPromoError(null);
      process.env.NODE_ENV !== "production" && console.log('handleApplyPromo: State updated:', {
        promoDiscount: result.discount,
        promoType: result.discountType,
        promoId: result.promoId,
      });
      toast.success(`Промокод применён! Скидка: ${result.discount}${result.discountType === 'percentage' ? '%' : ' ₽'}`);
    } catch (error: any) {
      process.env.NODE_ENV !== "production" && console.error('handleApplyPromo: Error:', error);
      setPromoError(error.message);
      toast.error(error.message);
    }
  }, [promoCode]);

  // Проверка валидности товаров
  const checkItems = useCallback(async () => {
    const itemsToValidate = items
      .filter((item: CartItemType) => !item.isUpsell)
      .map((item: CartItemType) => ({
        id: parseInt(item.id, 10),
        quantity: item.quantity,
        price: item.price,
      }))
      .filter((item: { id: number }) => !isNaN(item.id));
    if (itemsToValidate.length === 0) return true;
    try {
      const res = await fetch('/api/products/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToValidate }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) {
        const errorMessage = json.invalidItems?.length > 0
          ? `Некоторые товары недоступны: ${json.invalidItems
              .map((item: { id: number; reason: string }) => `Товар ${item.id}: ${item.reason}`)
              .join('; ')}`
          : 'Ошибка проверки товаров';
        toast.error(errorMessage);
        return false;
      }
      return true;
    } catch (error: any) {
      toast.error('Ошибка проверки товаров: ' + error.message);
      return false;
    }
  }, [items]);

  // Отправка заказа
  const submitOrder = useCallback(async () => {
    if (!validateStep5(agreed)) {
      toast.error('Пожалуйста, согласитесь с условиями на шаге 5');
      return;
    }

    const isFormValid = validateStep1() && validateStep2() && validateStep3() && validateStep4() && validateStep5(agreed);
    if (!isFormValid) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!canPlaceOrder) {
      toast.error('Магазин временно не принимает заказы. Попробуйте позже или свяжитесь с поддержкой.');
      return;
    }

    if (items.length === 0 && selectedUpsells.length === 0) {
      toast.error('Ваша корзина пуста. Пожалуйста, добавьте товары перед оформлением заказа.');
      return;
    }

    if (!(await checkItems())) {
      toast.error('Некоторые товары недоступны. Пожалуйста, обновите корзину и попробуйте снова.');
      return;
    }

    if (!phone) {
      setErrorModal('Телефон не указан. Пожалуйста, авторизуйтесь заново.');
      setIsAuthenticated(false);
      setStep(0);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const cartItems = items.map((item: CartItemType) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        isUpsell: false,
      }));
      const upsellItemsPayload = selectedUpsells.map((u: UpsellItem) => ({
        id: u.id,
        title: u.title,
        price: u.price,
        quantity: u.quantity,
        category: u.category,
        isUpsell: true,
      }));
      const payload = {
        phone: normalizePhone(phone),
        name: form.name,
        recipient: form.recipient,
        recipientPhone: normalizePhone(form.recipientPhone),
        address:
          form.street && form.deliveryMethod !== 'pickup'
            ? `${form.street}${form.house ? `, д. ${form.house}` : ''}${form.apartment ? `, кв. ${form.apartment}` : ''}${form.entrance ? `, подъезд ${form.entrance}` : ''}`
            : 'Самовывоз',
        payment: form.payment,
        date: form.date,
        time: form.time,
        items: [...cartItems, ...upsellItemsPayload],
        total: finalTotal,
        bonuses_used: bonusesUsed,
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
        setErrorModal(json.error || 'Ошибка оформления заказа. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.');
        return;
      }
      if (bonusesUsed > 0) {
        try {
          const bonusRes = await fetch('/api/redeem-bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: normalizePhone(phone),
              amount: bonusesUsed,
              order_id: json.order_id,
            }),
          });
          const bonusJson = await bonusRes.json();
          if (bonusRes.ok && bonusJson.success) {
            setBonusBalance(bonusJson.new_balance || 0);
          } else {
            toast.error('Ошибка списания бонусов. Ваш заказ оформлен, но бонусы не были списаны.');
          }
        } catch (error: any) {
          toast.error('Ошибка списания бонусов. Ваш заказ оформлен, но бонусы не были списаны.');
        }
      }
      setOrderDetails({
        orderId: json.order_id,
        orderNumber: json.order_number,
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
      setUseBonuses(false);
      setBonusesUsed(0);
    } catch (error: any) {
      setErrorModal('Произошла неизвестная ошибка при оформлении заказа: ' + error.message + '. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.');
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [
    validateStep5,
    agreed,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    canPlaceOrder,
    checkItems,
    form,
    items,
    selectedUpsells,
    finalTotal,
    promoId,
    discountAmount,
    postcardText,
    phone,
    bonusesUsed,
    bonusBalance,
    userId,
    clearCart,
    resetForm,
    storeSettings,
    step,
  ]);

  // Рендеринг
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 pb-[80px] md:pb-12">
      <StoreBanner />
      <motion.h1
        className="mb-10 text-center text-4xl sm:text-5xl font-bold tracking-tight uppercase"
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
        className="mb-6 flex items-center justify-center gap-2 sticky top-0 z-30 bg-white py-2 md:static"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <motion.div key={s} className="flex items-center" variants={containerVariants}>
            <motion.div
              className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-medium hover:scale-105 transition-transform duration-200 ${
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
                className={`w-6 h-1 mx-1 sm:w-8 ${step > s ? 'bg-black' : 'bg-gray-200'}`}
                initial={{ width: '0%', opacity: 0 }}
                animate={{ width: step > s ? '100%' : '0%', opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="flex flex-wrap gap-4 mt-6 md:grid md:grid-cols-3 md:gap-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full md:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={stepVariants} initial="initial" animate="animate" exit="exit">
              {step === 0 && (
                <OrderStep step={0} currentStep={step} title="Авторизация">
                  <AuthWithCall
                    onSuccess={(phone: string) => {
                      setIsAuthenticated(true);
                      setPhone(normalizePhone(phone));
                      setStep(1);
                      onFormChange({
                        target: { name: 'phone', value: normalizePhone(phone) },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                  />
                </OrderStep>
              )}
              {step === 1 && (
                <OrderStep step={1} currentStep={step} title="Ваши контакты" onNext={handleNextStep}>
                  <Step1ContactDetails
                    form={form}
                    phoneError={phoneError}
                    emailError={emailError}
                    nameError={nameError}
                    agreedToTermsError={agreedToTermsError}
                    onFormChange={onFormChange}
                    handlePhoneChange={handlePhoneChange}
                  />
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
                <OrderStep step={4} currentStep={step} title="Дата и время" onNext={handleNextStep} onBack={prevStep}>
                  <Step4DateTime
                    form={form}
                    dateError={dateError}
                    timeError={timeError}
                    onFormChange={onFormChange}
                    getMinDate={getMinDate}
                    storeSettings={
                      storeSettings || {
                        order_acceptance_enabled: false,
                        order_acceptance_schedule: {},
                        store_hours: {},
                      }
                    }
                    maxProductionTime={maxProductionTime}
                    onValidationChange={handleStep4ValidationChange}
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
        </div>

        <div className="space-y-6">
          {/* Кнопки "Открытка" и "Шары" над CartItem */}
          <div
            className="
              flex gap-4 mb-4 
              md:flex-row md:gap-8
              w-full justify-center
            "
          >
            {/* Открытка */}
            <motion.button
              type="button"
              onClick={() => setShowPostcard(true)}
              className="
                inline-flex items-center justify-center gap-2
                border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
              "
              aria-label="Добавить открытку"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/icons/postcard.svg"
                alt=""
                width={20}
                height={20}
                className="transition-transform duration-200"
                priority={false}
              />
              <span>Добавить открытку</span>
            </motion.button>

            {/* Шары */}
            <motion.button
              type="button"
              onClick={() => setShowBalloons(true)}
              className="
                inline-flex items-center justify-center gap-2
                border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
              "
              aria-label="Добавить шары"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/icons/balloon.svg"
                alt=""
                width={20}
                height={20}
                className="transition-transform duration-200"
                priority={false}
              />
              <span>Добавить шары</span>
            </motion.button>
          </div>

          {[...items, ...selectedUpsells]
            .filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
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
          <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
            <motion.button
              onClick={() => setShowPromoField(!showPromoField)}
              className="
                inline-flex items-center gap-1
                border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
              "
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
                  className="mt-3 p-4 bg-gray-50 rounded-lg shadow-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0 w-full">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Введите промокод"
                      className="flex-1 min-w-0 w-full py-3 px-4 text-black border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-sm sm:text-base"
                      aria-label="Введите промокод"
                    />
                    <motion.button
                      onClick={handleApplyPromo}
                      className="
                        w-full sm:w-[130px] flex-shrink-0
                        border border-[#bdbdbd] rounded-[10px] px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                        bg-white text-[#535353] transition-all duration-200 shadow-sm
                        hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
                      "
                      aria-label="Применить промокод"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="block w-full text-center tracking-wide">
                        Применить
                      </span>
                    </motion.button>
                  </div>
                  {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
                  {promoDiscount !== null && (
                    <motion.p
                      className="mt-2 text-xs text-green-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      Промокод применён! Скидка: {promoDiscount}
                      {promoType === 'percentage' ? '%' : ' ₽'}
                    </motion.p>
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
            useBonuses={useBonuses}
            setUseBonuses={setUseBonuses}
            bonusesUsed={bonusesUsed}
          />
        </div>
      </motion.div>

      {showPostcard && (
        <UpsellModal
          type="postcard"
          onClose={() => setShowPostcard(false)}
          onSelect={(item: UpsellItem) => {
            setSelectedUpsells((prev) => {
              if (prev.some((i) => i.id === item.id)) return prev;
              return [...prev, { ...item, category: 'postcard', isUpsell: true, quantity: 1 }];
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
              if (prev.some((i) => i.id === item.id)) return prev;
              return [...prev, { ...item, category: 'balloon', isUpsell: true, quantity: 1 }];
            });
            setShowBalloons(false);
          }}
        />
      )}
      {showSuccess && orderDetails && (
        <ThankYouModal
          onClose={() => setShowSuccess(false)}
          orderNumber={orderDetails.orderNumber}
          trackingUrl={orderDetails.trackingUrl}
        />
      )}
      {errorModal && (
        <ErrorModal message={errorModal} onRetry={submitOrder} onClose={() => setErrorModal(null)} />
      )}
    </div>
  );
}