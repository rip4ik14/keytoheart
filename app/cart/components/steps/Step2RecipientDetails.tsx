'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { UpsellItem } from '../../types';

interface Props {
  form: {
    recipient: string;
    recipientPhone: string;
    anonymous: boolean;
  };
  name: string;
  userPhone: string;
  recipientError: string;
  recipientPhoneError: string;
  postcardText: string;
  selectedUpsells: UpsellItem[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setPostcardText: (text: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function Step2RecipientDetails({
  form,
  name,
  userPhone,
  recipientError,
  recipientPhoneError,
  postcardText,
  selectedUpsells,
  onFormChange,
  setPostcardText,
}: Props) {
  const displayPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('7')) {
      const d = digits.slice(1);
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
    }
    return phone;
  };

  const handlePhone = (val: string) => {
    onFormChange({
      target: { name: 'recipientPhone', value: val },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="space-y-4">
      <motion.label
        className="flex items-center gap-2 mt-4"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          checked={form.recipient === name && form.recipientPhone === userPhone}
          onChange={e => {
            if (e.target.checked) {
              onFormChange({ target: { name: 'recipient', value: name } } as any);
              onFormChange({ target: { name: 'recipientPhone', value: userPhone } } as any);
            } else {
              onFormChange({ target: { name: 'recipient', value: '' } } as any);
              onFormChange({ target: { name: 'recipientPhone', value: '' } } as any);
            }
          }}
          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          aria-label="Я получатель"
        />
        <span className="text-sm text-gray-700">Я получатель</span>
      </motion.label>

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <label htmlFor="recipient" className="block text-xs text-gray-500">
          Имя получателя <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/user.svg" alt="Имя" width={16} height={16} />
          </div>
          <input
            id="recipient"
            name="recipient"
            value={form.recipient}
            onChange={onFormChange}
            placeholder="Имя получателя"
            className={`w-full pl-10 pr-3 py-2 border rounded-md ${
              recipientError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!recipientError}
            required
          />
        </div>
        {recipientError && <p className="text-red-500 text-xs">{recipientError}</p>}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <label htmlFor="recipientPhone" className="block text-xs text-gray-500">
          Телефон получателя <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">+7</span>
          <input
            id="recipientPhone"
            name="recipientPhone"
            value={displayPhone(form.recipientPhone)}
            onChange={e => handlePhone(e.target.value)}
            placeholder="(xxx) xxx-xx-xx"
            className={`w-full pl-12 pr-3 py-2 border rounded-md ${
              recipientPhoneError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!recipientPhoneError}
            required
          />
        </div>
        {recipientPhoneError && <p className="text-red-500 text-xs">{recipientPhoneError}</p>}
      </motion.div>

      {selectedUpsells.some(u => u.category === 'postcard') && (
        <motion.div
          className="space-y-1"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={containerVariants}
        >
          <label htmlFor="postcardText" className="block text-xs text-gray-500">
            Текст открытки
          </label>
          <textarea
            id="postcardText"
            value={postcardText}
            onChange={e => setPostcardText(e.target.value)}
            placeholder="Напишите ваше поздравление"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black min-h-[80px]"
            aria-label="Текст открытки"
          />
        </motion.div>
      )}

      <motion.label
        className="flex items-center gap-2 mt-4"
        initial="hidden"
        animate="visible"
        custom={4}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="anonymous"
          checked={form.anonymous}
          onChange={onFormChange}
          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          aria-label="Анонимный заказ"
        />
        <span className="text-sm text-gray-700">Анонимный заказ</span>
      </motion.label>
      <motion.p
        className="text-xs text-gray-500"
        initial="hidden"
        animate="visible"
        custom={5}
        variants={containerVariants}
      >
        Получатель не узнает, от кого подарок
      </motion.p>
    </div>
  );
}