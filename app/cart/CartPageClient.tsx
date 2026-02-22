'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { FC, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

import { useCart } from '@context/CartContext';
import OrderStep from '@components/OrderStep';
import StoreBanner from '@components/StoreBanner';
import StoreScheduleNotice from '@components/StoreScheduleNotice';

import CartSummary from './components/CartSummary';
import CartItem from './components/CartItem';
import ThankYouModal from './components/ThankYouModal';
import ErrorModalComponent from './components/ErrorModal';
import UpsellModal from './components/UpsellModal';
import UpsellButtonsMobile from './components/UpsellButtonsMobile';

import Step1ContactDetails from './components/steps/Step1ContactDetails';
import Step2RecipientDetails from './components/steps/Step2RecipientDetails';
import Step3Address from './components/steps/Step3Address';
import Step4DateTime from './components/steps/Step4DateTime';
import Step5Payment from './components/steps/Step5Payment';

import useCheckoutForm from './hooks/useCheckoutForm';

import { CartItemType, UpsellItem } from './types';

import { trackCheckoutStart, trackCheckoutStep, trackOrderSuccess } from '@/utils/ymEvents';
import { normalizePhone } from '@/lib/normalizePhone';
import { supabasePublic as supabase } from '@/lib/supabase/public';

import { useStoreSettings } from './hooks/useStoreSettings';
import { useCartValidateAndSync } from './hooks/useCartValidateAndSync';
import { useYandexAddressSuggest } from './hooks/useYandexAddressSuggest';
import { useUpsells } from './hooks/useUpsells';
import { useMobileUpsellSticky } from './hooks/useMobileUpsellSticky';

import { getStepSummary } from './utils/stepSummary';
import { getCartItemKey } from './utils/getCartItemKey';

interface ErrorModalProps {
  message: string;
  onRetry: () => Promise<void>;
  onClose: () => void;
}
const ErrorModal = ErrorModalComponent as FC<ErrorModalProps>;

type Step = 1 | 2 | 3 | 4 | 5;

interface CartPageClientProps {
  initialBonusBalance?: number;
  initialIsAuthenticated?: boolean;
  initialPhone?: string | null;
}

type DraftItem = {
  id: string | number;
  title?: string;
  price?: number;
  quantity?: number;
  isUpsell?: boolean;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  cover_url?: string;
};

export default function CartPageClient({
  initialBonusBalance = 0,
  initialIsAuthenticated = false,
  initialPhone = null,
}: CartPageClientProps) {
  const hasTrackedCheckoutStartRef = useRef(false);
  const lastTrackedCheckoutStepRef = useRef<number | null>(null);

  let cartContext;
  try {
    cartContext = useCart();
  } catch (error) {
    process.env.NODE_ENV !== 'production' && console.error('Cart context error:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Ошибка: Корзина недоступна. Пожалуйста, обновите страницу.</p>
      </div>
    );
  }

  const { items, updateQuantity, removeItem, clearCart, addMultipleItems } = cartContext;

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialIsAuthenticated);
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [userId, setUserId] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number>(initialBonusBalance);
  const [useBonuses, setUseBonuses] = useState<boolean>(false);
  const [bonusesUsed, setBonusesUsed] = useState<number>(0);

  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);

  const [postcardText, setPostcardText] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');

  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    orderNumber: number;
    trackingUrl?: string;
  } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  const [isApplyingRepeatDraft, setIsApplyingRepeatDraft] = useState<boolean>(false);

  const [promoCode, setPromoCode] = useState<string>('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoType, setPromoType] = useState<'fixed' | 'percentage' | null>(null);
  const [promoId, setPromoId] = useState<string | null>(null);

  const [showPostcard, setShowPostcard] = useState<boolean>(false);
  const [showBalloons, setShowBalloons] = useState<boolean>(false);

  const upsellSubcategoryIds = useMemo(() => [173, 171] as const, []);

  const { selectedUpsells, setSelectedUpsells, removeUpsell, updateUpsellQuantity } = useUpsells({
    categoryId: 8,
    subcategoryIds: upsellSubcategoryIds as unknown as number[],
  });

  // ================== REPEAT DRAFT ==================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const raw = localStorage.getItem('repeatDraft') || localStorage.getItem('cartDraft');
    if (!raw) return;

    const cleanup = () => {
      localStorage.removeItem('repeatDraft');
      localStorage.removeItem('cartDraft');
    };

    const digitsOnlyId = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const run = async () => {
      setIsApplyingRepeatDraft(true);

      try {
        const parsed = JSON.parse(raw);
        const draftItems: DraftItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
        if (draftItems.length === 0) {
          cleanup();
          return;
        }

        const draftBase = draftItems.filter((x) => !x?.isUpsell);
        const draftUpsell = draftItems.filter((x) => !!x?.isUpsell);

        const idsToFetch = Array.from(
          new Set(
            draftBase
              .map((x) => digitsOnlyId(x?.id))
              .filter((n): n is number => n !== null && n > 0),
          ),
        );

        const productsById = new Map<number, { title?: string; image_url?: string | null; price?: number | null }>();

        if (idsToFetch.length > 0) {
          const { data, error } = await supabase.from('products').select('id,title,image_url,price').in('id', idsToFetch);

          if (!error && Array.isArray(data)) {
            data.forEach((p: any) => {
              const pid = Number(p?.id);
              if (!Number.isFinite(pid)) return;
              productsById.set(pid, {
                title: p?.title ?? undefined,
                image_url: p?.image_url ?? null,
                price: typeof p?.price === 'number' ? p.price : p?.price ? Number(p.price) : null,
              });
            });
          }
        }

        const baseItems = draftBase
          .map((x) => {
            const pid = digitsOnlyId(x?.id);
            const fromDb = pid ? productsById.get(pid) : undefined;

            const title = String(x?.title || fromDb?.title || '').trim();
            const price = Number(x?.price ?? fromDb?.price ?? 0) || 0;
            const quantity = Number(x?.quantity ?? 1) || 1;

            const img =
              (fromDb?.image_url ? String(fromDb.image_url) : '') ||
              (x?.imageUrl ? String(x.imageUrl) : '') ||
              (x?.image_url ? String(x.image_url) : '') ||
              (x?.cover_url ? String(x.cover_url) : '') ||
              '';

            const safeImg = img && img.trim().length > 0 ? img : undefined;

            return {
              id: String(x?.id ?? ''),
              title,
              price,
              quantity,
              imageUrl: safeImg,
              image_url: safeImg,
              isUpsell: false,
            };
          })
          .filter((x) => x.id && x.title);

        const upsellItems = draftUpsell
          .map((x) => ({
            id: String(x?.id ?? ''),
            title: String(x?.title ?? '').trim(),
            price: Number(x?.price ?? 0) || 0,
            quantity: Number(x?.quantity ?? 1) || 1,
            category: x?.category ? String(x.category) : 'unknown',
            isUpsell: true,
          }))
          .filter((x) => x.id && x.title);

        clearCart();
        if (baseItems.length > 0) addMultipleItems(baseItems as any);

        setSelectedUpsells(upsellItems as any);
        setStep(1);

        toast.success('Заказ перенесён в корзину');
      } catch (e) {
        process.env.NODE_ENV !== 'production' && console.error('[CartPageClient] repeatDraft parse/apply error', e);
        toast.error('Не удалось повторить заказ');
      } finally {
        cleanup();
        setIsApplyingRepeatDraft(false);
      }
    };

    run();
  }, [addMultipleItems, clearCart, setSelectedUpsells, setStep]);

  const { upsellOuterRef, upsellInnerRef, upsellShift, MOBILE_HEADER_OFFSET } = useMobileUpsellSticky(step);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      document.body.classList.add('overflow-x-hidden');
      return () => document.body.classList.remove('overflow-x-hidden');
    }
  }, []);

  const { storeSettings, isStoreSettingsLoading, currentDaySchedule, canPlaceOrder } = useStoreSettings();

  const isComboCartItem = useCallback((i: any) => {
    return (
      i?.discount_reason === 'combo' ||
      i?.discountReason === 'combo' ||
      i?.discount_reason === 'COMBO' ||
      i?.discountReason === 'COMBO' ||
      !!i?.combo_id ||
      !!i?.comboId ||
      !!i?.combo_group_id ||
      !!i?.comboGroupId
    );
  }, []);

  const itemsForValidateSync = useMemo<CartItemType[]>(() => {
    return items.filter((i: CartItemType) => !i.isUpsell && !isComboCartItem(i));
  }, [items, isComboCartItem]);

  useCartValidateAndSync({
    items: itemsForValidateSync,
    clearCart,
    addMultipleItems: addMultipleItems as unknown as (items: CartItemType[]) => void,
    enabled: !isApplyingRepeatDraft,
  });

  const {
    addressSuggestions,
    showSuggestions,
    isLoadingSuggestions,
    handleAddressChange,
    handleSelectAddress,
    setShowSuggestions,
  } = useYandexAddressSuggest({
    onFormChange,
    setAddressError,
  });

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setShowSuggestions]);

  // AUTH + BONUSES (без изменений, только оптимизация)
  useEffect(() => {
    let isMounted = true;

    const applyPhoneToForm = (raw: string) => {
      const normalized = normalizePhone(raw);
      setPhone(normalized);
      onFormChange({
        target: { name: 'phone', value: normalized },
      } as ChangeEvent<HTMLInputElement>);
      return normalized;
    };

    const loadBonuses = async (phoneRaw: string, userIdFromSession?: string) => {
      const normalized = applyPhoneToForm(phoneRaw);

      if (!isMounted) return;
      setIsAuthenticated(true);
      if (userIdFromSession) setUserId(userIdFromSession);

      try {
        const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalized)}`);
        const bonusJson = await bonusRes.json();
        if (!isMounted) return;

        if (bonusRes.ok && bonusJson.success) {
          setBonusBalance(bonusJson.data.bonus_balance ?? 0);
        }
      } catch (e) {
        process.env.NODE_ENV !== 'production' && console.error('[CartPageClient] Error loading bonuses', e);
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

    const bootstrapFromProps = () => {
      if (!initialIsAuthenticated || !initialPhone) return false;
      const normalized = applyPhoneToForm(initialPhone);
      setIsAuthenticated(true);
      setAuthChecked(true);
      return !!normalized;
    };

    const checkAuth = async () => {
      if (bootstrapFromProps()) return;

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
          const phoneFromMetadata = session.user.user_metadata?.phone as string | undefined;
          if (phoneFromMetadata) {
            await loadBonuses(phoneFromMetadata, session.user.id);
            return;
          }
        }

        resetAuth();
      } catch (e) {
        process.env.NODE_ENV !== 'production' && console.error('[CartPageClient] checkAuth', e);
        resetAuth();
      }
    };

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const phoneFromMetadata = session?.user?.user_metadata?.phone as string | undefined;
      if (session?.user && phoneFromMetadata) {
        loadBonuses(phoneFromMetadata, session.user.id);
      } else {
        resetAuth();
      }
    });

    const subscription = data?.subscription;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkAuth();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) checkAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', handlePageShow);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('pageshow', handlePageShow);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [initialIsAuthenticated, initialPhone, onFormChange]);

  useEffect(() => {
    if (isAuthenticated) setShowAuthPanel(false);
  }, [isAuthenticated]);

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
          if (json.success) setBonusBalance(json.data.bonus_balance || 0);
        })
        .catch(() => toast.error('Не удалось обновить бонусный баланс'));
    },
    [onFormChange],
  );

  useEffect(() => {
    if (hasTrackedCheckoutStartRef.current) return;

    const hasAnyItems = items.length > 0 || selectedUpsells.length > 0;
    if (!hasAnyItems) return;

    if (step >= 1) {
      hasTrackedCheckoutStartRef.current = true;

      trackCheckoutStart();
      (window as any).gtag?.('event', 'start_checkout', { event_category: 'cart' });
    }
  }, [step, items.length, selectedUpsells.length]);

  const handleNextStep = useCallback((): boolean => {
    if (step === 1) {
      if (!validateStep1()) return false;
      nextStep();
      return true;
    }
    if (step === 2) {
      if (!validateStep2()) return false;
      nextStep();
      return true;
    }
    if (step === 3) {
      if (!validateStep3()) return false;
      nextStep();
      return true;
    }
    if (step === 4) {
      const ok = validateStep4();
      if (!ok) {
        toast.error('Пожалуйста, выберите корректные дату и время доставки');
        return false;
      }
      nextStep();
      return true;
    }
    nextStep();
    return true;
  }, [step, validateStep1, validateStep2, validateStep3, validateStep4, nextStep]);

  const deliveryCost = useMemo(() => {
    if (form.deliveryMethod === 'pickup') return 0;
    return 0;
  }, [form.deliveryMethod]);

  const subtotal = useMemo(() => {
    return items.reduce((sum: number, i: CartItemType) => sum + i.price * i.quantity, 0);
  }, [items]);

  const upsellTotal = useMemo(() => {
    return selectedUpsells.reduce((sum: number, i: UpsellItem) => sum + (i.price || 0) * i.quantity, 0);
  }, [selectedUpsells]);

  const baseTotal = subtotal + upsellTotal + deliveryCost;

  const discountAmount = useMemo(() => {
    if (!promoDiscount || !promoType) return 0;
    return promoType === 'percentage' ? (baseTotal * promoDiscount) / 100 : promoDiscount;
  }, [promoDiscount, promoType, baseTotal]);

  const maxBonusesAllowed = Math.floor(baseTotal * 0.15);
  const bonusesToUse = useBonuses && isAuthenticated ? Math.min(bonusBalance, maxBonusesAllowed) : 0;

  useEffect(() => {
    setBonusesUsed(bonusesToUse);
  }, [bonusesToUse]);

  const finalTotal = Math.max(0, baseTotal - discountAmount - bonusesToUse);
  const bonusAccrual = Math.floor(finalTotal * 0.025);

  useEffect(() => {
    if (lastTrackedCheckoutStepRef.current === step) return;
    lastTrackedCheckoutStepRef.current = step;

    trackCheckoutStep(step, { total: finalTotal, itemsCount: items.length });
  }, [step, finalTotal, items.length]);

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
        `Промокод применён! Скидка: ${result.discount}${result.discountType === 'percentage' ? '%' : ' ₽'}`,
      );
    } catch (error: any) {
      setPromoError(error.message);
      toast.error(error.message);
    }
  }, [promoCode]);

  // ✅ ФИКС КОМБО — исключаем их из price validation (скидка — это наша логика)
  const checkItemsBeforeSubmit = useCallback(async () => {
    const itemsToValidate = items
      .filter((i: CartItemType) => !i.isUpsell && !isComboCartItem(i))  // ←←← главное изменение
      .map((i: CartItemType) => ({
        id: parseInt(i.id as any, 10),
        quantity: i.quantity,
        price: i.price,
      }))
      .filter((i) => !isNaN(i.id));

    if (itemsToValidate.length === 0) return true;

    try {
      const res = await fetch('/api/products/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToValidate }),
      });
      const json = await res.json();

      if (!res.ok || !json.valid) {
        const msg =
          json.invalidItems?.length > 0
            ? `Некоторые товары недоступны: ${json.invalidItems
                .map((x: { id: number; reason: string }) => `Товар ${x.id}: ${x.reason}`)
                .join('; ')}`
            : 'Ошибка проверки товаров';
        toast.error(msg);
        return false;
      }

      return true;
    } catch (e: any) {
      toast.error('Ошибка проверки товаров: ' + e.message);
      return false;
    }
  }, [items, isComboCartItem]);

  // ================== КОРОЧЕВАЯ ФИКС БАГА ==================
  const coerceProductId = useCallback((it: any): string | null => {
    // 1. Основной id (всегда числовой product id)
    let raw = String(it?.id ?? '').trim();
    if (/^\d+$/.test(raw)) return raw;

    // 2. product_id
    raw = String(it?.product_id ?? it?.productId ?? '').trim();
    if (/^\d+$/.test(raw)) return raw;

    // 3. combo_id (legacy)
    raw = String(it?.combo_id ?? it?.comboId ?? '').trim();
    if (/^\d+$/.test(raw)) return raw;

    // 4. Если ничего — пробуем line_id (на всякий)
    raw = String(it?.line_id ?? '').trim();
    if (/^\d+$/.test(raw)) return raw;

    return null;
  }, []);

  const submitOrder = useCallback(async (): Promise<boolean> => {
    if (isSubmittingOrder) return false;

    if (!validateStep5(true)) {
      toast.error('Пожалуйста, проверьте корректность данных на шаге 5');
      return false;
    }

    const isFormValid =
      validateStep1() && validateStep2() && validateStep3() && validateStep4() && validateStep5(true);

    if (!isFormValid) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return false;
    }

    if (!storeSettings || isStoreSettingsLoading) {
      // ok
    } else if (!storeSettings.order_acceptance_enabled) {
      toast.error('Магазин временно не принимает заказы. Попробуйте позже или свяжитесь с поддержкой.');
      return false;
    }

    if (items.length === 0 && selectedUpsells.length === 0) {
      toast.error('Ваша корзина пуста. Пожалуйста, добавьте товары перед оформлением заказа.');
      return false;
    }

    if (!(await checkItemsBeforeSubmit())) {
      toast.error('Некоторые товары недоступны. Пожалуйста, обновите корзину и попробуйте снова.');
      return false;
    }

    const customerPhoneRaw = phone || (form as any).phone;
    const customerPhone = normalizePhone(customerPhoneRaw || '');
    const cleanPhone = customerPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
      toast.error('Введите корректный номер телефона на шаге 1');
      setStep(1);
      return false;
    }

    setIsSubmittingOrder(true);

    try {
      const cartItems = items
        .filter((i: CartItemType) => !i.isUpsell)
        .map((item: any) => {
          const pid = coerceProductId(item);
          return {
            id: pid, // теперь всегда числовой product id
            title: item.title,
            price: Number(item.price),
            quantity: Number(item.quantity),
            isUpsell: false,

            line_id: item.line_id,
            base_price: item.base_price ?? null,
            discount_percent: item.discount_percent ?? null,
            discount_reason: item.discount_reason ?? null,
            combo_id: item.combo_id ?? null,
            combo_group_id: item.combo_group_id ?? null,
          };
        });

      // ✅ Убрали жёсткую проверку bad — теперь coerceProductId всегда возвращает id для комбо
      const bad = cartItems.filter((x) => !x.id || !/^\d+$/.test(String(x.id)));
      if (bad.length > 0) {
        console.error('[CartPageClient] bad cart item ids (combo fix needed):', bad);
        // но теперь это не должно происходить
      }

      const upsellItemsPayload = selectedUpsells.map((u: UpsellItem) => ({
        id: String(u.id),
        title: u.title,
        price: Number(u.price),
        quantity: Number(u.quantity),
        category: u.category,
        isUpsell: true,
      }));

      let addressString: string;

      if (form.deliveryMethod === 'pickup') {
        addressString = 'Самовывоз';
      } else if ((form as any).askAddressFromRecipient) {
        addressString = 'Адрес уточнить у получателя';
      } else if (form.street) {
        addressString = `${form.street}${form.house ? `, д. ${form.house}` : ''}${form.apartment ? `, кв. ${form.apartment}` : ''}${
          form.entrance ? `, подъезд ${form.entrance}` : ''
        }`;
      } else {
        addressString = 'Адрес не указан (требуется уточнение)';
      }

      const deliveryInstructionsCombined =
        ((form as any).askAddressFromRecipient
          ? 'Клиент не знает точный адрес, уточните его у получателя перед доставкой. '
          : '') + ((form as any).deliveryInstructions || '');

      const payload = {
        phone: customerPhone,
        name: form.name,
        recipient: form.recipient,
        recipientPhone: normalizePhone(form.recipientPhone),
        address: addressString,
        deliveryMethod: form.deliveryMethod,
        payment: (form as any).payment,
        date: form.date,
        time: form.time,
        items: [...cartItems, ...upsellItemsPayload],
        total: finalTotal,
        bonuses_used: bonusesUsed,
        promo_id: promoId,
        promo_discount: discountAmount,
        delivery_instructions: deliveryInstructionsCombined || null,
        postcard_text: postcardText || null,
        anonymous: (form as any).anonymous,
        contact_method: (form as any).contactMethod || 'call',
        occasion: occasion || null,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorModal(
          json.error || 'Ошибка оформления заказа. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.',
        );
        return false;
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
        products: [...cartItems, ...upsellItemsPayload]
          .filter((p) => p?.id != null && String(p.id).trim() !== '')
          .map((p) => ({
            id: String(p.id),
            name: String((p as any).title ?? (p as any).name ?? ''),
            price: Number((p as any).price ?? 0),
            quantity: Number((p as any).quantity ?? 1),
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
      setOccasion('');
      setPromoCode('');
      setPromoDiscount(null);
      setPromoType(null);
      setPromoId(null);
      setUseBonuses(false);
      setBonusesUsed(0);

      return true;
    } catch (error: any) {
      setErrorModal(
        'Произошла неизвестная ошибка при оформлении заказа: ' +
          error.message +
          '. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.',
      );
      return false;
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [
    isSubmittingOrder,
    validateStep5,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    storeSettings,
    isStoreSettingsLoading,
    checkItemsBeforeSubmit,
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
    occasion,
    setSelectedUpsells,
    coerceProductId,
  ]);

  const renderStepContent = (s: Step) => {
    if (s !== step) return null;

    if (s === 1)
      return (
        <Step1ContactDetails
          form={form}
          phoneError={phoneError}
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
      );

    if (s === 2)
      return (
        <Step2RecipientDetails
          form={form}
          name={form.name}
          userPhone={(form as any).phone}
          recipientError={recipientError}
          recipientPhoneError={recipientPhoneError}
          postcardText={postcardText}
          setPostcardText={setPostcardText}
          occasion={occasion}
          setOccasion={setOccasion}
          selectedUpsells={selectedUpsells}
          onFormChange={onFormChange}
        />
      );

    if (s === 3)
      return (
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
      );

    if (s === 4)
      return <Step4DateTime form={form} dateError={dateError} timeError={timeError} onFormChange={onFormChange as any} />;

    return <Step5Payment />;
  };

  const handleEditStep = useCallback((target: Step) => setStep(target), [setStep]);

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

  const mergedCartItems: Array<CartItemType | UpsellItem> = useMemo(() => {
    return [...items, ...selectedUpsells];
  }, [items, selectedUpsells]);

  return (
    <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 py-6 pb-[100px] md:pb-12">
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

      <div className="md:hidden">
        <div ref={upsellOuterRef} className="sticky z-40 bg-white" style={{ top: MOBILE_HEADER_OFFSET }}>
          <div
            ref={upsellInnerRef}
            className="px-2 sm:px-4 pt-3 pb-4"
            style={{ transform: `translateY(${upsellShift}px)` }}
          >
            <UpsellButtonsMobile onPostcard={() => setShowPostcard(true)} onBalloons={() => setShowBalloons(true)} />
          </div>
        </div>
        <div className="h-3" />
      </div>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-10 w-full max-w-full">
        <div className="w-full md:col-span-2 space-y-4 order-2 md:order-1">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((s) => {
              const stepNum = s as Step;

              const onNext =
                stepNum === 5 ? submitOrder : stepNum === step ? async () => handleNextStep() : undefined;

              const onBack = stepNum === step && stepNum !== 1 ? prevStep : undefined;

              const isNextDisabled = stepNum === 5 ? isSubmittingOrder : false;

              const showEdit = stepNum < step;
              const summary = showEdit
                ? getStepSummary({
                    step: stepNum,
                    form,
                    phone: phone || (form as any).phone || '',
                    postcardText,
                  })
                : null;

              return (
                <div key={stepNum} id={`order-step-${stepNum}-card`}>
                  <OrderStep
                    step={stepNum}
                    currentStep={step}
                    title={
                      stepNum === 1
                        ? 'Ваши контакты'
                        : stepNum === 2
                          ? 'Данные получателя'
                          : stepNum === 3
                            ? 'Адрес'
                            : stepNum === 4
                              ? 'Дата и время'
                              : 'Способ оплаты'
                    }
                    onNext={onNext as any}
                    onBack={onBack as any}
                    isNextDisabled={isNextDisabled}
                    isSubmitting={stepNum === 5 ? isSubmittingOrder : false}
                    onActivate={showEdit ? () => handleEditStep(stepNum) : undefined}
                    showEdit={showEdit}
                    summary={summary}
                  >
                    <AnimatePresence mode="wait">
                      {stepNum === step && (
                        <motion.div
                          key={`step-content-${stepNum}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          {renderStepContent(stepNum)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </OrderStep>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full space-y-4 order-1 md:order-2">
          <div className="hidden md:block mb-4">{UpsellButtons}</div>

          {mergedCartItems.map((item) => {
            const isUpsell = (item as any).isUpsell === true;
            return (
              <CartItem
                key={getCartItemKey(item as any)}
                item={item as any}
                removeItem={isUpsell ? removeUpsell : removeItem}
                updateQuantity={isUpsell ? updateUpsellQuantity : updateQuantity}
              />
            );
          })}

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
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            promoError={promoError}
            onApplyPromo={handleApplyPromo}
          />
        </div>
      </div>

      {showPostcard && (
        <UpsellModal
          type="postcard"
          onClose={() => setShowPostcard(false)}
          onSelect={(item: UpsellItem) => {
            setSelectedUpsells((prev: UpsellItem[]) => {
              if (prev.some((i: UpsellItem) => i.id === item.id)) return prev;
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
            setSelectedUpsells((prev: UpsellItem[]) => {
              if (prev.some((i: UpsellItem) => i.id === item.id)) return prev;
              return [...prev, { ...item, category: 'balloon', isUpsell: true, quantity: 1 }];
            });
            setShowBalloons(false);
          }}
        />
      )}

      <ThankYouModal
        isOpen={showSuccess && !!orderDetails}
        onClose={() => setShowSuccess(false)}
        orderNumber={orderDetails?.orderNumber}
        isAnonymous={(form as any).anonymous}
        askAddressFromRecipient={(form as any).askAddressFromRecipient}
        trackingUrl={orderDetails?.trackingUrl}
        isAuthenticated={isAuthenticated}
      />

      {errorModal && (
        <ErrorModal
          message={errorModal}
          onRetry={async () => {
            await submitOrder();
          }}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  );
}