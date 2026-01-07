// ✅ Путь: app/cart/CartPageClient.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FC } from 'react';
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
import useCheckoutForm from './hooks/useCheckoutForm';
import debounce from 'lodash/debounce';
import { CartItemType, UpsellItem } from './types';
import { AnimatePresence, motion } from 'framer-motion';

import {
  trackCheckoutStart,
  trackCheckoutStep,
  trackOrderSuccess,
} from '@/utils/ymEvents';

import { supabasePublic as supabase } from '@/lib/supabase/public';
import { normalizePhone } from '@/lib/normalizePhone';

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
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

interface ErrorModalProps {
  message: string;
  onRetry: () => Promise<void>;
  onClose: () => void;
}
const ErrorModal = ErrorModalComponent as FC<ErrorModalProps>;

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

interface CartPageClientProps {
  initialBonusBalance?: number;
  initialIsAuthenticated?: boolean;
  initialPhone?: string | null;
}

const transformSchedule = (schedule: any): Record<string, DaySchedule> => {
  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const result: Record<string, DaySchedule> = daysOfWeek.reduce((acc, day) => {
    acc[day] = { start: '09:00', end: '18:00' };
    return acc;
  }, {} as Record<string, DaySchedule>);

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

export default function CartPageClient({
  initialBonusBalance = 0,
  initialIsAuthenticated = false,
  initialPhone = null,
}: CartPageClientProps) {
  useEffect(() => {
    trackCheckoutStart();
    if (typeof window !== 'undefined') {
      (window as any).gtag?.('event', 'start_checkout', { event_category: 'cart' });
    }
  }, []);

  let cartContext;
  try {
    cartContext = useCart();
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.error('Cart context error:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">
          Ошибка: Корзина недоступна. Пожалуйста, обновите страницу.
        </p>
      </div>
    );
  }

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    maxProductionTime,
    addMultipleItems,
  } = cartContext;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialIsAuthenticated,
  );
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [userId, setUserId] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number>(initialBonusBalance);
  const [useBonuses, setUseBonuses] = useState<boolean>(false);
  const [bonusesUsed, setBonusesUsed] = useState<number>(0);

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
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] =
    useState<boolean>(true);

  const [promoCode, setPromoCode] = useState<string>('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoType, setPromoType] = useState<'fixed' | 'percentage' | null>(null);
  const [promoId, setPromoId] = useState<string | null>(null);
  const [showPromoField, setShowPromoField] = useState<boolean>(false);

  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // ✅ Управление раскрытием панели входа в Step1 (UX)
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);

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
    setAddressError,
    onFormChange,
    nextStep,
    prevStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    resetForm,
  } = useCheckoutForm();

  const handleAuthSuccess = useCallback(
    (phoneFromAuth: string) => {
      const normalized = normalizePhone(phoneFromAuth);

      setIsAuthenticated(true);
      setPhone(normalized);

      onFormChange({
        target: { name: 'phone', value: normalized },
      } as any);

      fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalized)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setBonusBalance(json.data.bonus_balance || 0);
          }
        })
        .catch(() => {
          toast.error('Не удалось обновить бонусный баланс');
        });
    },
    [onFormChange],
  );

  const UpsellButtons = (
    <div className="grid grid-cols-2 gap-3 w-full">
      <motion.button
        type="button"
        onClick={() => setShowPostcard(true)}
        className="w-full flex flex-col items-center justify-center gap-2 border border-[#bdbdbd] rounded-xl px-3 py-4 font-bold text-xs uppercase tracking-tight bg-white text-[#535353] transition shadow-sm hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
        aria-label="Добавить открытку"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Image src="/icons/postcard.svg" alt="" width={22} height={22} />
        <span className="text-center leading-tight">Добавить открытку</span>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => setShowBalloons(true)}
        className="w-full flex flex-col items-center justify-center gap-2 border border-[#bdbdbd] rounded-xl px-3 py-4 font-bold text-xs uppercase tracking-tight bg-white text-[#535353] transition shadow-sm hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
        aria-label="Добавить шары"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Image src="/icons/balloon.svg" alt="" width={22} height={22} />
        <span className="text-center leading-tight">Добавить шары</span>
      </motion.button>
    </div>
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(`order-step-${step}-title`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offset = 90;
    const top = rect.top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      document.body.classList.add('overflow-x-hidden');
      return () => {
        document.body.classList.remove('overflow-x-hidden');
      };
    }
  }, []);

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
            .filter(
              (invalidItem: { id: number; reason: string }) =>
                invalidItem.reason === 'Товар не найден' ||
                invalidItem.reason === 'Товар отсутствует в наличии' ||
                invalidItem.reason === 'Товар не доступен для заказа',
            )
            .map((invalidItem: { id: number }) => invalidItem.id.toString());

          if (itemsToRemove.length > 0) {
            const removedTitles = items
              .filter((item: CartItemType) => itemsToRemove.includes(item.id))
              .map((item: CartItemType) => item.title)
              .join(', ');

            const updatedItems = items.filter(
              (item: CartItemType) => !itemsToRemove.includes(item.id),
            );

            clearCart();
            if (updatedItems.length > 0) {
              addMultipleItems(updatedItems);
            }

            toast.error(
              `Следующие товары больше не доступны и были удалены из корзины: ${removedTitles}`,
            );
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== 'production' &&
          console.error('Error validating cart items:', error);
        toast.error('Не удалось проверить товары в корзине.');
      }
    };

    validateAndCleanCart();
  }, [items, clearCart, addMultipleItems]);

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
                const itemIndex = updatedItems.findIndex(
                  (item) => parseInt(item.id, 10) === invalidItem.id,
                );
                if (itemIndex !== -1) {
                  updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    price: newPrice,
                  };
                  toast(
                    `Цена товара "${updatedItems[itemIndex].title}" обновлена до ${newPrice} ₽`,
                  );
                }
              }
            }
          });

          clearCart();
          addMultipleItems(updatedItems);
        }
      } catch (error) {
        process.env.NODE_ENV !== 'production' &&
          console.error('Error syncing cart prices:', error);
        toast.error('Не удалось синхронизировать цены корзины');
      }
    };

    syncCartPrices();
  }, [items, clearCart, addMultipleItems]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapFromProps = () => {
  if (!initialIsAuthenticated || !initialPhone) return false;

  const normalized = normalizePhone(initialPhone);

  setIsAuthenticated(true);
  setPhone(normalized);
  setBonusBalance(initialBonusBalance ?? 0);

  onFormChange({
    target: { name: 'phone', value: normalized },
  } as React.ChangeEvent<HTMLInputElement>);

  setAuthChecked(true);
  return true;
};


    const alreadyAuthedFromProps = bootstrapFromProps();

    const loadBonuses = async (phoneRaw: string, userIdFromSession?: string) => {
      const normalized = normalizePhone(phoneRaw);

      if (!isMounted) return;

      setIsAuthenticated(true);
      setPhone(normalized);
      if (userIdFromSession) setUserId(userIdFromSession);

      onFormChange({
        target: { name: 'phone', value: normalized },
      } as React.ChangeEvent<HTMLInputElement>);

      try {
        const bonusRes = await fetch(
          `/api/account/bonuses?phone=${encodeURIComponent(normalized)}`,
        );
        const bonusJson = await bonusRes.json();

        if (!isMounted) return;

        if (bonusRes.ok && bonusJson.success) {
          setBonusBalance(bonusJson.data.bonus_balance ?? 0);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[CartPageClient] Error loading bonuses', error);
        }
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    };

    const resetAuth = () => {
      if (!isMounted) return;
      setIsAuthenticated(false);
      setPhone(null);
      setUserId(null);
      setBonusBalance(0);
      setAuthChecked(true);
    };

    const checkAuth = async () => {
      if (alreadyAuthedFromProps) {
        setAuthChecked(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/check-session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const sessionData = await response.json();

        if (!isMounted) return;

        if (response.ok && sessionData.isAuthenticated && sessionData.phone) {
          await loadBonuses(sessionData.phone, sessionData.userId);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const phoneFromMetadata = session.user.user_metadata?.phone as
            | string
            | undefined;

          if (phoneFromMetadata) {
            await loadBonuses(phoneFromMetadata, session.user.id);
            return;
          }
        }

        resetAuth();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[CartPageClient] Error checking auth session', error);
        }
        if (!alreadyAuthedFromProps) resetAuth();
      }
    };

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const phoneFromMetadata = session.user.user_metadata?.phone as
          | string
          | undefined;

        if (phoneFromMetadata) {
          loadBonuses(phoneFromMetadata, session.user.id);
        } else {
          resetAuth();
        }
      } else {
        resetAuth();
      }
    });

    const subscription = data?.subscription;

    const handleAuthChange = () => {
      checkAuth();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkAuth();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('authChange', handleAuthChange);
      window.addEventListener('pageshow', handlePageShow);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('authChange', handleAuthChange);
        window.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) setShowAuthPanel(false);
  }, [isAuthenticated]);

  const handleNextStep = useCallback(() => {
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) return;
      nextStep();
    } else if (step === 4) {
      const isValid = validateStep4();
      if (!isValid) {
        toast.error('Пожалуйста, выберите корректные дату и время доставки');
        return;
      }
      nextStep();
    } else {
      nextStep();
    }
  }, [step, validateStep1, validateStep4, nextStep]);

  const deliveryCost = useMemo(
    () => (form.deliveryMethod === 'delivery' ? 300 : 0),
    [form.deliveryMethod],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const upsellTotal = useMemo(
    () =>
      selectedUpsells.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0,
      ),
    [selectedUpsells],
  );

  const baseTotal = subtotal + upsellTotal;

  const discountAmount = useMemo(() => {
    if (!promoDiscount || !promoType) return 0;

    const amount =
      promoType === 'percentage'
        ? (baseTotal * promoDiscount) / 100
        : promoDiscount;

    return amount;
  }, [promoDiscount, promoType, baseTotal]);

  const maxBonusesAllowed = Math.floor(baseTotal * 0.15);

  const bonusesToUse =
    useBonuses && isAuthenticated ? Math.min(bonusBalance, maxBonusesAllowed) : 0;

  useEffect(() => {
    setBonusesUsed(bonusesToUse);
  }, [bonusesToUse]);

  const finalTotal = Math.max(0, baseTotal - discountAmount - bonusesToUse);
  const bonusAccrual = Math.floor(finalTotal * 0.025);

  useEffect(() => {
    trackCheckoutStep(step, {
      total: finalTotal,
      itemsCount: items.length,
    });
  }, [step, finalTotal, items.length]);

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
            order_acceptance_schedule: transformSchedule(
              json.data.order_acceptance_schedule,
            ),
            store_hours: transformSchedule(json.data.store_hours),
          });
        } else if (isMounted) {
          toast.error('Не удалось загрузить настройки магазина');
        }
      } catch {
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
    const dayKey = now
      .toLocaleString('en-US', { weekday: 'long' })
      .toLowerCase();

    return {
      orderSchedule: storeSettings.order_acceptance_schedule[dayKey] || null,
      storeHours: storeSettings.store_hours[dayKey] || null,
      currentDay: dayKey,
    };
  }, [storeSettings, isStoreSettingsLoading]);

  useEffect(() => {
    let isMounted = true;

    const loadYandexSuggestScript = () => {
      if (document.querySelector('script[src*="api-maps.yandex.ru"]')) return;

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        if (isMounted && process.env.NODE_ENV !== 'production') {
          console.log('Яндекс.Карты загружены');
        }
      };
      script.onerror = () => {
        if (isMounted) {
          toast.error('Не удалось загрузить автодополнение адресов');
        }
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
      if (
        !query.trim() ||
        typeof window === 'undefined' ||
        !window.ymaps ||
        !window.ymaps.ready
      )
        return;

      setIsLoadingSuggestions(true);

      window.ymaps.ready(async () => {
        try {
          const response = await window.ymaps!.suggest(query, {
            boundedBy: [
              [45.0, 38.9],
              [45.2, 39.1],
            ],
            strictBounds: true,
            results: 5,
          });

          setAddressSuggestions(response.map((item: any) => item.value));
          setShowSuggestions(true);
        } catch {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoadingSuggestions(false);
        }
      });
    }, 300),
    [],
  );

  const handleSelectAddress = useCallback(
    (address: string) => {
      onFormChange({
        target: { name: 'street', value: address },
      } as React.ChangeEvent<HTMLInputElement>);
      setShowSuggestions(false);
      setAddressError('');
    },
    [onFormChange, setAddressError],
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
    [onFormChange, fetchAddressSuggestions],
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
  }, []);

  const updateUpsellQuantity = useCallback((id: string, quantity: number) => {
    setSelectedUpsells((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUpsellItems = async () => {
      setIsUpsellLoading(true);
      try {
        const categoryId = 8;
        const subcategoryIds = [173, 171];

        const fetchPromises = subcategoryIds.map(async (subcategoryId) => {
          const res = await fetch(
            `/api/upsell/products?category_id=${categoryId}&subcategory_id=${subcategoryId}`,
          );
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

          const { success, data, error } = await res.json();
          if (!success)
            throw new Error(error || 'Не удалось загрузить дополнительные товары');

          return data || [];
        });

        const results = await Promise.all(fetchPromises);

        if (isMounted) {
          const upsellWithQuantity = results.flat().map(
            (item: Omit<UpsellItem, 'quantity'>) => ({
              ...item,
              quantity: 1,
            }),
          );

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

      setPromoDiscount(result.discount);
      setPromoType(result.discountType);
      setPromoId(result.promoId);
      setPromoError(null);

      toast.success(
        `Промокод применён! Скидка: ${result.discount}${
          result.discountType === 'percentage' ? '%' : ' ₽'
        }`,
      );
    } catch (error: any) {
      setPromoError(error.message);
      toast.error(error.message);
    }
  }, [promoCode]);

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
        const errorMessage =
          json.invalidItems?.length > 0
            ? `Некоторые товары недоступны: ${json.invalidItems
                .map(
                  (item: { id: number; reason: string }) =>
                    `Товар ${item.id}: ${item.reason}`,
                )
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

  const submitOrder = useCallback(async () => {
    // ✅ чекбокс на шаге 5 убрали, поэтому валидируем Step5 без "agreed"
    if (!validateStep5(true)) {
      toast.error('Пожалуйста, проверьте корректность данных на шаге 5');
      return;
    }

    const isFormValid =
      validateStep1() &&
      validateStep2() &&
      validateStep3() &&
      validateStep4() &&
      validateStep5(true);

    if (!isFormValid) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!canPlaceOrder) {
      toast.error(
        'Магазин временно не принимает заказы. Попробуйте позже или свяжитесь с поддержкой.',
      );
      return;
    }

    if (items.length === 0 && selectedUpsells.length === 0) {
      toast.error('Ваша корзина пуста. Пожалуйста, добавьте товары перед оформлением заказа.');
      return;
    }

    if (!(await checkItems())) {
      toast.error(
        'Некоторые товары недоступны. Пожалуйста, обновите корзину и попробуйте снова.',
      );
      return;
    }

    const customerPhoneRaw = phone || form.phone;
    const customerPhone = normalizePhone(customerPhoneRaw || '');
    const cleanPhone = customerPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
      toast.error('Введите корректный номер телефона на шаге 1');
      setStep(1);
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

      let addressString: string;

      if (form.deliveryMethod === 'pickup') {
        addressString = 'Самовывоз';
      } else if ((form as any).askAddressFromRecipient) {
        addressString = 'Адрес уточнить у получателя';
      } else if (form.street) {
        addressString = `${form.street}${form.house ? `, д. ${form.house}` : ''}${
          form.apartment ? `, кв. ${form.apartment}` : ''
        }${form.entrance ? `, подъезд ${form.entrance}` : ''}`;
      } else {
        addressString = 'Адрес не указан (требуется уточнение)';
      }

      const deliveryInstructionsCombined =
        ((form as any).askAddressFromRecipient
          ? 'Клиент не знает точный адрес, уточните его у получателя перед доставкой. '
          : '') + (form.deliveryInstructions || '');

      const payload = {
        phone: customerPhone,
        name: form.name,
        recipient: form.recipient,
        recipientPhone: normalizePhone(form.recipientPhone),
        address: addressString,
        payment: form.payment,
        date: form.date,
        time: form.time,
        items: [...cartItems, ...upsellItemsPayload],
        total: finalTotal,
        bonuses_used: bonusesUsed,
        promo_id: promoId,
        promo_discount: discountAmount,
        delivery_instructions: deliveryInstructionsCombined || null,
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
        setErrorModal(
          json.error ||
            'Ошибка оформления заказа. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.',
        );
        return;
      }

      if (bonusesUsed > 0 && isAuthenticated) {
        try {
          const bonusRes = await fetch('/api/redeem-bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: customerPhone,
              amount: bonusesUsed,
              order_id: json.order_id,
            }),
          });

          const bonusJson = await bonusRes.json();

          if (bonusRes.ok && bonusJson.success) {
            setBonusBalance(bonusJson.new_balance || 0);
          } else {
            toast.error('Ошибка списания бонусов. Заказ оформлен, но бонусы не списались.');
          }
        } catch {
          toast.error('Ошибка списания бонусов. Заказ оформлен, но бонусы не списались.');
        }
      }

      trackOrderSuccess({
        orderId: json.order_number ?? json.order_id,
        revenue: finalTotal,
        promoCode: promoCode || undefined,
        products: [...cartItems, ...upsellItemsPayload].map((p) => ({
          id: p.id,
          name: p.title,
          price: p.price,
          quantity: p.quantity,
        })),
      });

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
      setErrorModal(
        'Произошла неизвестная ошибка при оформлении заказа: ' +
          error.message +
          '. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.',
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [
    validateStep5,
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
    clearCart,
    resetForm,
    setStep,
    isAuthenticated,
    promoCode,
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 py-6 pb-[80px] md:pb-12">
      <StoreBanner />

      <motion.h1
        className="mb-8 text-center text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight uppercase"
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
        className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-10 w-full max-w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ✅ Оформление: на мобилке после товаров */}
        <div className="w-full max-w-full md:col-span-2 space-y-4 order-2 md:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {step === 1 && (
                <OrderStep
                  step={1}
                  currentStep={step}
                  title="Ваши контакты"
                  onNext={handleNextStep}
                >
                  <Step1ContactDetails
                    form={form}
                    phoneError={phoneError}
                    emailError={emailError}
                    nameError={nameError}
                    agreedToTermsError={agreedToTermsError}
                    onFormChange={onFormChange as any}
                    isAuthenticated={isAuthenticated}
                    authChecked={authChecked}
                    bonusBalance={bonusBalance}
                    showAuthPanel={showAuthPanel}
                    setShowAuthPanel={setShowAuthPanel}
                    onAuthSuccess={handleAuthSuccess}
                  />
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
                  />
                </OrderStep>
              )}

              {step === 4 && (
                <OrderStep
                  step={4}
                  currentStep={step}
                  title="Дата и время"
                  onNext={handleNextStep}
                  onBack={prevStep}
                >
                  <Step4DateTime
                    form={form}
                    dateError={dateError}
                    timeError={timeError}
                    onFormChange={onFormChange as any}
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
                  isNextDisabled={isSubmittingOrder}
                >
                  <Step5Payment />
                </OrderStep>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ✅ Товары: на мобилке первой колонкой */}
        <div className="w-full max-w-full space-y-4 order-1 md:order-2">
          {/* ✅ Кнопки допов сверху (и на мобилке, и на десктопе) */}
          <div className="mb-4">{UpsellButtons}</div>

          {[...items, ...selectedUpsells]
            .filter(
              (item, index, self) =>
                index === self.findIndex((t) => t.id === item.id),
            )
            .map((item, idx) => {
              const isUpsell = 'isUpsell' in item && (item as any).isUpsell;
              return (
                <CartItem
                  key={`${isUpsell ? 'upsell' : 'item'}-${(item as any).id}-${idx}`}
                  item={item as any}
                  removeItem={isUpsell ? removeUpsell : removeItem}
                  updateQuantity={isUpsell ? updateUpsellQuantity : updateQuantity}
                />
              );
            })}

          <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
            <motion.button
              onClick={() => setShowPromoField(!showPromoField)}
              className="inline-flex items-center gap-1 border border-[#bdbdbd] rounded-lg px-3 py-2 font-bold text-xs uppercase tracking-tight bg-white text-[#535353] transition shadow-sm hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd] w-full"
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
                  className="mt-3 p-3 bg-gray-50 rounded-lg shadow-sm"
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
                      className="flex-1 min-w-0 w-full py-3 px-3 text-black border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-sm"
                      aria-label="Введите промокод"
                    />
                    <motion.button
                      onClick={handleApplyPromo}
                      className="w-full sm:w-[110px] flex-shrink-0 border border-[#bdbdbd] rounded-lg px-3 py-2 font-bold text-xs uppercase tracking-tight bg-white text-[#535353] transition shadow-sm hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
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
            deliveryMethod={form.deliveryMethod}
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
              return [
                ...prev,
                {
                  ...item,
                  category: 'postcard',
                  isUpsell: true,
                  quantity: 1,
                },
              ];
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
              return [
                ...prev,
                {
                  ...item,
                  category: 'balloon',
                  isUpsell: true,
                  quantity: 1,
                },
              ];
            });
            setShowBalloons(false);
          }}
        />
      )}

      <ThankYouModal
        isOpen={showSuccess && !!orderDetails}
        onClose={() => setShowSuccess(false)}
        orderNumber={orderDetails?.orderNumber}
        isAnonymous={form.anonymous}
        askAddressFromRecipient={(form as any).askAddressFromRecipient}
        trackingUrl={orderDetails?.trackingUrl}
        isAuthenticated={isAuthenticated}
      />

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
