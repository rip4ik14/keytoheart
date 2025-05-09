// ✅ Путь: app/cart/components/steps/Step1ContactDetails.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { IMaskInput } from 'react-imask';
import TrackedLink from '@components/TrackedLink';
import { phoneMask } from '@utils/phoneMask';

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
  smsCode: string;
  isCodeSent: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  isAuthenticated: boolean;
  resendCooldown: number;
  resendSmsCode: () => Promise<void>;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePhoneChange: (value: string) => void;
  sendSmsCode: () => Promise<void>;
  verifySmsCode: () => Promise<void>;
  setSmsCode: (code: string) => void;
  setIsCodeSent: (value: boolean) => void; // Добавляем setIsCodeSent
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
  smsCode,
  isCodeSent,
  isSendingCode,
  isVerifyingCode,
  isAuthenticated,
  resendCooldown,
  resendSmsCode,
  onFormChange,
  handlePhoneChange,
  sendSmsCode,
  verifySmsCode,
  setSmsCode,
  setIsCodeSent, // Добавляем в деструктуризацию
}: Props) {
  return (
    <div className="space-y-4">
      <motion.div className="mb-2" variants={containerVariants}>
        <label htmlFor="phone" className="text-sm font-medium mb-1 block text-gray-700">
          Телефон
        </label>
        <div className="flex gap-2 items-center">
          <span className="pt-2 text-gray-600">+7</span>
          <div className="relative flex-1">
            <motion.div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              whileHover={{ scale: 1.1 }}
            >
              <Image src="/icons/phone.svg" alt="Телефон" width={16} height={16} />
            </motion.div>
            <IMaskInput
              id="phone"
              mask="(000) 000-00-00"
              name="phone"
              value={form.phone}
              onAccept={handlePhoneChange}
              placeholder="(___) ___-__-__"
              className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
                phoneError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              disabled={isAuthenticated}
              aria-label="Введите номер телефона"
              aria-invalid={phoneError ? 'true' : 'false'}
            />
          </div>
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
      </motion.div>
      {!isAuthenticated && !isCodeSent && (
        <motion.button
          onClick={sendSmsCode}
          disabled={isSendingCode}
          className={`w-full rounded-lg bg-black py-2 text-white hover:bg-gray-800 flex items-center justify-center gap-2 transition-all duration-300 ${
            isSendingCode ? 'opacity-50 cursor-not-allowed' : ''
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-label="Получить SMS-код"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSendingCode ? (
            <>
              <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
              Отправка...
            </>
          ) : (
            'Получить код'
          )}
        </motion.button>
      )}
      {isCodeSent && !isAuthenticated && (
        <>
          <motion.div className="mb-2" variants={containerVariants}>
            <label htmlFor="smsCode" className="text-sm font-medium mb-1 block text-gray-700">
              Код из SMS
            </label>
            <div className="relative">
              <motion.div
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                whileHover={{ scale: 1.1 }}
              >
                <Image src="/icons/envelope.svg" alt="Код" width={16} height={16} />
              </motion.div>
              <input
                id="smsCode"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Введите код (6 цифр)"
                maxLength={6}
                className={`w-full rounded-lg border border-gray-300 p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                aria-label="Введите SMS-код"
              />
            </div>
          </motion.div>
          <motion.button
            onClick={verifySmsCode}
            disabled={isVerifyingCode}
            className={`w-full rounded-lg bg-black py-2 text-white hover:bg-gray-800 flex items-center justify-center gap-2 transition-all duration-300 ${
              isVerifyingCode ? 'opacity-50 cursor-not-allowed' : ''
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-label="Подтвердить SMS-код"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isVerifyingCode ? (
              <>
                <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
                Проверка...
              </>
            ) : (
              'Подтвердить'
            )}
          </motion.button>
          <motion.div className="flex flex-col gap-2" variants={containerVariants}>
            <button
              type="button"
              onClick={() => {
                setIsCodeSent(false);
                setSmsCode('');
              }}
              className="w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Изменить номер телефона"
            >
              Изменить номер
            </button>
            <button
              type="button"
              onClick={resendSmsCode}
              disabled={resendCooldown > 0 || isSendingCode}
              className={`w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black ${
                resendCooldown > 0 || isSendingCode ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Отправить код повторно"
            >
              {resendCooldown > 0
                ? `Отправить код повторно через ${resendCooldown} сек`
                : 'Отправить код повторно'}
            </button>
          </motion.div>
        </>
      )}
      {isAuthenticated && (
        <>
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
              E-mail
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
          <motion.p className="text-sm text-gray-600" variants={containerVariants}>
            Текст открытки можно написать далее
          </motion.p>
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
        </>
      )}
    </div>
  );
}