'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';
import AuthWithCall from '@components/AuthWithCall';

interface Props {
  form: {
    phone: string;
    whatsapp: boolean;
    email: string;
    name: string;
    agreedToTerms?: boolean;
  };
  phoneError: string;
  emailError: string;
  nameError: string;
  agreedToTermsError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // optional auth panel (если не передашь - кнопка входа не появится)
  isAuthenticated?: boolean;
  authChecked?: boolean;
  bonusBalance?: number;
  showAuthPanel?: boolean;
  setShowAuthPanel?: (v: boolean) => void;
  onAuthSuccess?: (phone: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Step1ContactDetails({
  form,
  phoneError,
  emailError,
  nameError,
  agreedToTermsError,
  onFormChange,

  isAuthenticated = false,
  authChecked = true,
  bonusBalance = 0,
  showAuthPanel,
  setShowAuthPanel,
  onAuthSuccess,
}: Props) {
  const canToggleAuth = typeof setShowAuthPanel === 'function' && typeof showAuthPanel === 'boolean';

  return (
    <div className="space-y-4">
      {/* Телефон */}
      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <label htmlFor="phone" className="block text-xs text-gray-500">
          Телефон для связи*
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
            <Image src="/icons/phone.svg" alt="" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={onFormChange}
            placeholder="+7XXXXXXXXXX"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
              phoneError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!phoneError}
          />
        </div>
        {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
      </motion.div>

      {/* Имя */}
      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <label htmlFor="name" className="block text-xs text-gray-500">
          Как вас зовут?*
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
            <Image src="/icons/user.svg" alt="" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            placeholder="Ваше имя"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
              nameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            autoComplete="name"
            aria-invalid={!!nameError}
          />
        </div>
        {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
      </motion.div>

      {/* Email */}
      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <label htmlFor="email" className="block text-xs text-gray-500">
          Email (по желанию)
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
            <Image src="/icons/envelope.svg" alt="" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="email"
            name="email"
            value={form.email}
            onChange={onFormChange}
            placeholder="example@mail.ru"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
              emailError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            autoComplete="email"
            aria-invalid={!!emailError}
          />
        </div>
        {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
      </motion.div>

      {/* WhatsApp */}
      <motion.div
        className="flex items-center gap-2 mt-3"
        initial="hidden"
        animate="visible"
        custom={3}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="whatsapp"
          checked={form.whatsapp}
          onChange={onFormChange}
          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          aria-label="Связаться через WhatsApp"
        />
        <Image src="/icons/whatsapp.svg" alt="" width={16} height={16} loading="lazy" />
        <span className="text-sm text-gray-700">
          Можно присылать информацию по заказу в WhatsApp
        </span>
      </motion.div>

      {/* Бонусы и вход - мягко, без принуждения */}
      <motion.div
        className="mt-4 p-4 border border-gray-200 rounded-lg bg-white space-y-2"
        initial="hidden"
        animate="visible"
        custom={4}
        variants={containerVariants}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Бонусы и личный кабинет</p>

            {isAuthenticated ? (
              <>
                <p className="text-xs text-gray-600">
                  Вы вошли, бонусы начисляются автоматически
                </p>
                <p className="text-xs text-gray-600">
                  Баланс: <span className="font-semibold">{bonusBalance}</span>
                </p>
              </>
            ) : !authChecked ? (
              <p className="text-xs text-gray-500">Проверяем авторизацию...</p>
            ) : (
              <p className="text-xs text-gray-600">
                Вход по звонку нужен только для бонусов и истории заказов. Оформить заказ можно без входа.
              </p>
            )}
          </div>

          {!isAuthenticated && authChecked && canToggleAuth && (
            <button
              type="button"
              onClick={() => setShowAuthPanel(!showAuthPanel)}
              className="shrink-0 border border-[#bdbdbd] rounded-lg px-3 py-2 font-bold text-[10px] uppercase tracking-tight bg-white text-[#535353] hover:bg-[#535353] hover:text-white transition"
            >
              {showAuthPanel ? 'Скрыть' : 'Войти для бонусов'}
            </button>
          )}
        </div>

        {!isAuthenticated && authChecked && canToggleAuth && showAuthPanel && (
          <div className="pt-2">
            <AuthWithCall
              onSuccess={(p: string) => {
                onAuthSuccess?.(p);
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Согласие */}
      <motion.div
        className={`flex items-start gap-2 mt-4 ${
          agreedToTermsError ? 'text-red-500' : 'text-gray-700'
        }`}
        initial="hidden"
        animate="visible"
        custom={5}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="agreedToTerms"
          checked={form.agreedToTerms || false}
          onChange={onFormChange}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          aria-label="Согласие с офертой и политикой"
          required
        />
        <span className="text-xs">
          Я согласен(-на) с{' '}
          <TrackedLink href="/offer" className="underline text-black">
            условиями оферты
          </TrackedLink>{' '}
          и{' '}
          <TrackedLink href="/policy" className="underline text-black">
            политикой конфиденциальности
          </TrackedLink>
        </span>
      </motion.div>

      {agreedToTermsError && (
        <p className="text-red-500 text-xs">{agreedToTermsError}</p>
      )}
    </div>
  );
}
