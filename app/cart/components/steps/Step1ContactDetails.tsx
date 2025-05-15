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
  };
  phoneError: string;
  emailError: string;
  nameError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePhoneChange: (value: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

export default function Step1ContactDetails({
  form,
  phoneError,
  emailError,
  nameError,
  onFormChange,
  handlePhoneChange,
}: Props) {
  return (
    <div className="space-y-4">
      <motion.div className="mb-2" variants={containerVariants}>
        <label htmlFor="phone" className="text-sm font-medium mb-1 block text-gray-700">
          Телефон
        </label>
        <div className="relative">
          <motion.div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            whileHover={{ scale: 1.1 }}
          >
            <Image src="/icons/phone.svg" alt="Телефон" width={16} height={16} />
          </motion.div>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+7xxxxxxxxxx"
            className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
              phoneError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            disabled
            aria-label="Номер телефона"
            aria-invalid={phoneError ? 'true' : 'false'}
          />
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
      </motion.div>
      <motion.div className="mb-2" variants={containerVariants}>
        <label htmlFor="name" className="text-sm font-medium mb-1 block text-gray-700">
          Ваше имя
        </label>
        <div className="relative">
          <motion.div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            whileHover={{ scale: 1.1 }}
          >
            <Image src="/icons/user.svg" alt="Имя" width={16} height={16} />
          </motion.div>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            placeholder="Введите ваше имя"
            className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
              nameError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-label="Введите ваше имя"
            aria-invalid={nameError ? 'true' : 'false'}
          />
        </div>
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </motion.div>
      <motion.label className="flex items-center gap-2 text-sm text-gray-600" variants={containerVariants}>
        <input
          type="checkbox"
          name="whatsapp"
          checked={form.whatsapp}
          onChange={onFormChange}
          className="form-checkbox h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Связаться через WhatsApp"
        />
        <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
        Не звонить, а написать в WhatsApp
      </motion.label>
      <motion.div className="mb-2" variants={containerVariants}>
        <label htmlFor="email" className="text-sm font-medium mb-1 block text-gray-700">
          E-mail (необязательно)
        </label>
        <div className="relative">
          <motion.div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            whileHover={{ scale: 1.1 }}
          >
            <Image src="/icons/envelope.svg" alt="Email" width={16} height={16} />
          </motion.div>
          <input
            id="email"
            name="email"
            value={form.email}
            onChange={onFormChange}
            placeholder="Введите ваш email"
            className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-label="Введите ваш email"
            aria-invalid={emailError ? 'true' : 'false'}
          />
        </div>
        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
      </motion.div>
      <motion.p
        className="text-xs text-gray-500 text-center mt-2"
        variants={containerVariants}
      >
        Нажимая «Продолжить», вы подтверждаете согласие с{' '}
        <TrackedLink
          href="/policy"
          ariaLabel="Перейти к политике конфиденциальности"
          category="Navigation"
          action="Click Policy Link"
          label="Cart Step 1"
          className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
        >
          политикой обработки персональных данных
        </TrackedLink>{' '}
        и{' '}
        <TrackedLink
          href="/terms"
          ariaLabel="Перейти к пользовательскому соглашению"
          category="Navigation"
          action="Click Terms Link"
          label="Cart Step 1"
          className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
        >
          пользовательским соглашением
        </TrackedLink>
      </motion.p>
    </div>
  );
}
