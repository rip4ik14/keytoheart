'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface PromoDiscount {
  amount: number;
  type: '₽' | '%';
  promoId: string;
}

interface UsePromoAndBonusesProps {
  totalBeforeDiscounts: number;
  bonusBalance: number;
}

interface UsePromoAndBonusesReturn {
  promoCode: string;
  promoDiscount: PromoDiscount | null;
  bonusesUsed: number;
  isApplyingPromo: boolean;
  setPromoCode: (code: string) => void;
  setPromoDiscount: (discount: PromoDiscount | null) => void;
  setBonusesUsed: (bonuses: number) => void;
  setIsApplyingPromo: (isApplying: boolean) => void;
  applyPromoCode: () => Promise<void>;
  resetPromoCode: () => void;
  applyBonuses: (maxBonusUse: number) => void;
  resetBonuses: () => void;
}

export function usePromoAndBonuses({
  totalBeforeDiscounts,
  bonusBalance,
}: UsePromoAndBonusesProps): UsePromoAndBonusesReturn {
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);
  const [bonusesUsed, setBonusesUsed] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Введите промокод');
      return;
    }
    setIsApplyingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Недействительный промокод');
        return;
      }
      setPromoDiscount({
        amount: result.discount,
        type: result.type,
        promoId: result.promoId,
      });
      toast.success('Промокод применён!');
      window.gtag?.('event', 'apply_promo_code', {
        event_category: 'cart',
        promo_code: promoCode,
      });
      window.ym?.(96644553, 'reachGoal', 'apply_promo_code', { promo_code: promoCode });
    } catch {
      toast.error('Ошибка при проверке промокода.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const resetPromoCode = () => {
    setPromoCode('');
    setPromoDiscount(null);
    toast.success('Промокод сброшен');
    window.gtag?.('event', 'reset_promo_code', { event_category: 'cart' });
    window.ym?.(96644553, 'reachGoal', 'reset_promo_code');
  };

  const applyBonuses = (maxBonusUse: number) => {
    if (bonusesUsed > maxBonusUse) {
      toast.error(`Максимум можно использовать ${maxBonusUse} бонусов`);
      setBonusesUsed(maxBonusUse);
    } else if (bonusesUsed < 0) {
      toast.error('Количество бонусов не может быть отрицательным');
      setBonusesUsed(0);
    } else {
      toast.success('Бонусы применены!');
      window.gtag?.('event', 'apply_bonuses', {
        event_category: 'cart',
        bonuses_used: bonusesUsed,
      });
      window.ym?.(96644553, 'reachGoal', 'apply_bonuses', { bonuses_used: bonusesUsed });
    }
  };

  const resetBonuses = () => {
    setBonusesUsed(0);
    toast.success('Бонусы сброшены');
    window.gtag?.('event', 'reset_bonuses', { event_category: 'cart' });
    window.ym?.(96644553, 'reachGoal', 'reset_bonuses');
  };

  return {
    promoCode,
    promoDiscount,
    bonusesUsed,
    isApplyingPromo,
    setPromoCode,
    setPromoDiscount,
    setBonusesUsed,
    setIsApplyingPromo,
    applyPromoCode,
    resetPromoCode,
    applyBonuses,
    resetBonuses,
  };
}