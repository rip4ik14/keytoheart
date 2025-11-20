// ✅ Путь: app/cart/components/steps/Step1ContactDetails.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';

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
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function Step1ContactDetails({
  form,
  phoneError,
  emailError,
  nameError,
  agreedToTermsError,
  onFormChange,
}: Props) {
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
          Телефон для связи с вами*
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
            <Image
              src="/icons/phone.svg"
              alt="Телефон"
              width={16}
              height={16}
              loading="lazy"
            />
          </div>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={onFormChange}
            placeholder="+7XXXXXXXXXX или 8XXXXXXXXXX"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
              phoneError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-label="Номер телефона"
            aria-invalid={!!phoneError}
            inputMode="tel"
            autoComplete="tel"
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
            <Image
              src="/icons/user.svg"
              alt="Имя"
              width={16}
              height={16}
              loading="lazy"
            />
          </div>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            placeholder="Введите ваше имя"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
              nameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-label="Ваше имя"
            aria-invalid={!!nameError}
            inputMode="text"
            autoComplete="name"
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
            <Image
              src="/icons/envelope.svg"
              alt="Email"
              width={16}
              height={16}
              loading="lazy"
            />
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
            aria-label="Ваш email"
            aria-invalid={!!emailError}
            inputMode="email"
            autoComplete="email"
          />
        </div>
        {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
      </motion.div>

      {/* WhatsApp */}
      <motion.div
        className="flex items-center gap-2 mt-4"
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
          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          aria-label="Связаться через WhatsApp"
        />
        <Image
          src="/icons/whatsapp.svg"
          alt="WhatsApp"
          width={16}
          height={16}
          loading="lazy"
        />
        <span className="text-sm text-gray-700">
          Можно отправлять информацию по заказу в WhatsApp
        </span>
      </motion.div>

      {/* Согласие с условиями */}
      <motion.div
        className={`flex items-start gap-2 mt-4 ${
          agreedToTermsError ? 'text-red-500' : 'text-gray-700'
        }`}
        initial="hidden"
        animate="visible"
        custom={4}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="agreedToTerms"
          checked={form.agreedToTerms || false}
          onChange={onFormChange}
          className="mt-1 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          aria-label="Согласие с пользовательским соглашением и политикой конфиденциальности"
          required
        />
        <span className="text-xs">
          Я согласен(-на) с{' '}
          <TrackedLink
            href="/offer"
            ariaLabel="Публичная оферта"
            category="Cart"
            action="Open Offer"
            label="Step1 Offer"
            className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            условиями публичной оферты
          </TrackedLink>{' '}
          и{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Политика конфиденциальности"
            category="Cart"
            action="Open Policy"
            label="Step1 Policy"
            className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой обработки персональных данных
          </TrackedLink>
        </span>
      </motion.div>
      {agreedToTermsError && (
        <motion.p
          className="text-red-500 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {agreedToTermsError}
        </motion.p>
      )}
    </div>
  );
}
