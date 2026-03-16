// ✅ Путь: components/account/PersonalForm.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import UiButton from '@components/ui/UiButton';

interface PersonalFormProps {
  onUpdate: () => Promise<void>;
  phone: string;
}

interface ProfileData {
  name: string | null;
  last_name: string | null;
  email: string | null;
  birthday: string | null;
  receive_offers: boolean | null;
}

const CONSENT_TEXT =
  'Я даю согласие на получение рекламных и информационных материалов (акции, новости, персональные предложения) от KeyToHeart по SMS, мессенджерам и иным каналам связи. Я могу отозвать согласие в любой момент в личном кабинете.';

export default function PersonalForm({ onUpdate, phone }: PersonalFormProps) {
  const [name, setName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [receiveOffers, setReceiveOffers] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isConsentLoading, setIsConsentLoading] = useState(false);

  const [error, setError] = useState<string>('');
  const [isBirthdaySet, setIsBirthdaySet] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!phone) {
        setError('Номер телефона не найден. пожалуйста, авторизуйтесь заново.');
        toast.error('Номер телефона не найден');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/account/profile', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();

        if (data.success && data.data) {
          const profileData: ProfileData = data.data;
          setName(profileData.name || '');
          setLastName(profileData.last_name || '');
          setEmail(profileData.email || '');
          setBirthday(profileData.birthday || '');
          setIsBirthdaySet(!!profileData.birthday);
          setReceiveOffers(Boolean(profileData.receive_offers));
        } else {
          throw new Error(data.error || 'Ошибка загрузки данных профиля');
        }
      } catch (e: any) {
        process.env.NODE_ENV !== 'production' && console.error('Ошибка загрузки данных:', e);
        setError('Не удалось загрузить данные');
        toast.error('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [phone]);

  const saveConsent = async (granted: boolean) => {
    setIsConsentLoading(true);
    try {
      const res = await fetch('/api/account/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          granted,
          source: 'account_personal_form',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Не удалось сохранить согласие');

      toast.success(granted ? 'Согласие сохранено' : 'Согласие отозвано');

      window.gtag?.('event', granted ? 'marketing_consent_granted' : 'marketing_consent_revoked', {
        event_category: 'account',
      });
      if (YM_ID !== undefined) {
        callYm(
          YM_ID,
          'reachGoal',
          granted ? 'marketing_consent_granted' : 'marketing_consent_revoked',
        );
      }
    } finally {
      setIsConsentLoading(false);
    }
  };

  const handleConsentToggle = async (next: boolean) => {
    const prev = receiveOffers;

    // оптимистично ставим, но если сервер реально не сохранил - откатываем
    setReceiveOffers(next);

    try {
      await saveConsent(next);
      await onUpdate();
    } catch (e: any) {
      setReceiveOffers(prev);
      toast.error(e?.message || 'Ошибка сохранения согласия');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError('Номер телефона не найден. пожалуйста, авторизуйтесь заново.');
      toast.error('Номер телефона не найден');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите ваше имя');
      toast.error('Введите ваше имя');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Имя не должно превышать 50 символов');
      toast.error('Имя не должно превышать 50 символов');
      return;
    }

    const trimmedLastName = lastName.trim();
    if (trimmedLastName.length > 50) {
      setError('Фамилия не должна превышать 50 символов');
      toast.error('Фамилия не должна превышать 50 символов');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Введите корректный email');
      toast.error('Введите корректный email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          last_name: trimmedLastName,
          email: trimmedEmail,
          birthday,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Ошибка обновления профиля');

      toast.success('Данные успешно обновлены');
      if (birthday) setIsBirthdaySet(true);

      await onUpdate();

      window.gtag?.('event', 'update_profile', { event_category: 'account', value: trimmedName });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'update_profile', { name: trimmedName });
    } catch (e: any) {
      process.env.NODE_ENV !== 'production' && console.error('Ошибка обновления профиля:', e);
      setError(e.message || 'Ошибка обновления данных');
      toast.error(e.message || 'Ошибка обновления данных');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-labelledby="personal-form-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="personal-form-title" className="text-lg font-semibold tracking-tight">
            Личные данные
          </h2>
          <p className="text-sm text-black/55 mt-1">Укажите данные, чтобы быстрее оформлять заказы</p>
        </div>

        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 border border-black/10">
          Профиль
        </span>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-700">{error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-black/75 mb-1">
                Имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  w-full rounded-2xl border border-black/10 bg-white
                  px-4 py-3 text-sm
                  placeholder-black/35
                  focus:outline-none focus:ring-2 focus:ring-black/20
                "
                placeholder="Например, Денис"
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-black/75 mb-1">
                Фамилия
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="
                  w-full rounded-2xl border border-black/10 bg-white
                  px-4 py-3 text-sm
                  placeholder-black/35
                  focus:outline-none focus:ring-2 focus:ring-black/20
                "
                placeholder="Фамилия"
                maxLength={50}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-black/75 mb-1">
                Телефон
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                disabled
                className="
                  w-full rounded-2xl border border-black/10 bg-black/[0.02]
                  px-4 py-3 text-sm text-black/50
                  cursor-not-allowed
                "
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black/75 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-2xl border border-black/10 bg-white
                  px-4 py-3 text-sm
                  placeholder-black/35
                  focus:outline-none focus:ring-2 focus:ring-black/20
                "
                placeholder="E-mail (опционально)"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-semibold text-black/75 mb-1">
              Дата рождения
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="
                w-full rounded-2xl border border-black/10 bg-white
                px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-black/20
              "
              disabled={isLoading || isBirthdaySet}
            />
            <p className="text-xs text-black/45 mt-1">
              Дата рождения указывается один раз и не может быть изменена.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <div className="flex items-start gap-3">
              <input
                id="receiveOffers"
                type="checkbox"
                checked={receiveOffers}
                onChange={(e) => handleConsentToggle(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-black focus:ring-black border-black/20 rounded"
                disabled={isLoading || isConsentLoading}
              />
              <div className="min-w-0">
                <label htmlFor="receiveOffers" className="text-sm text-black/70 leading-relaxed">
                  Я согласен получать предложения и новости
                </label>
                <p className="text-xs text-black/45 mt-1 leading-relaxed">{CONSENT_TEXT}</p>
              </div>
            </div>
            {isConsentLoading && <p className="text-xs text-black/45 mt-2">Сохраняем согласие...</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
            <p className="text-xs text-black/45">Сохраните - и данные будут подставляться при оформлении заказа</p>

            <UiButton
              variant="brand"
              type="submit"
              disabled={isLoading}
              className="rounded-2xl px-6 py-3"
              aria-label="Сохранить изменения профиля"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </UiButton>
          </div>
        </form>
      )}
    </motion.section>
  );
}