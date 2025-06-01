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
  agreedToTermsError: string; // Добавляем проп для ошибки согласия
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhoneChange: (value: string) => void;
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
  handlePhoneChange,
}: Props) {
  return (
    <div className="space-y-4">
      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <label htmlFor="phone" className="block text-xs text-gray-500">
          Телефон
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/phone.svg" alt="Телефон" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm ${
              phoneError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            disabled
            aria-label="Номер телефона"
            aria-invalid={!!phoneError}
          />
        </div>
        {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <label htmlFor="name" className="block text-xs text-gray-500">
          Ваше имя
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/user.svg" alt="Имя" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            placeholder="Введите ваше имя"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm ${
              nameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-label="Ваше имя"
            aria-invalid={!!nameError}
          />
        </div>
        {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <label htmlFor="email" className="block text-xs text-gray-500">
          E-mail (необязательно)
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/envelope.svg" alt="Email" width={16} height={16} loading="lazy" />
          </div>
          <input
            id="email"
            name="email"
            value={form.email}
            onChange={onFormChange}
            placeholder="Введите ваш email"
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm ${
              emailError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-label="Ваш email"
            aria-invalid={!!emailError}
          />
        </div>
        {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
      </motion.div>

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
        <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} loading="lazy" />
        <span className="text-sm text-gray-700">Написать в WhatsApp вместо звонка</span>
      </motion.div>

      {/* Обязательный чекбокс для согласия */}
      <motion.div
        className={`flex items-center gap-2 mt-4 ${agreedToTermsError ? 'text-red-500' : 'text-gray-700'}`}
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
          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          aria-label="Согласие с пользовательским соглашением и политикой конфиденциальности"
          required
        />
        <span className="text-xs">
          Я принимаю{' '}
          <TrackedLink
            href="/terms"
            ariaLabel="Пользовательское соглашение"
            category="Cart"
            action="Open Terms"
            label="Step1 Terms"
            className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            пользовательское соглашение
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
            политику обработки персональных данных
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