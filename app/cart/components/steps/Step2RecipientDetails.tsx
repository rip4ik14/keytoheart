'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { IMaskInput } from 'react-imask';
import { phoneMask } from '@utils/phoneMask';

interface Props {
  form: {
    name: string;
    recipient: string;
    recipientPhone: string;
    anonymous: boolean;
  };
  name: string;
  userPhone: string;
  recipientError: string;
  recipientPhoneError: string;
  postcardText: string;
  selectedUpsells: any[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setPostcardText: (text: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
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
  // Добавляем отладочный лог для проверки значения recipientPhone
  console.log('Step2RecipientDetails - form.recipientPhone:', form.recipientPhone);

  return (
    <div className="space-y-4">
      <motion.label
        className="flex items-center gap-2 text-sm text-gray-600"
        variants={containerVariants}
      >
        <input
          type="checkbox"
          checked={form.name === form.recipient}
          onChange={(e) => {
            if (e.target.checked) {
              onFormChange({
                target: { name: 'recipient', value: name },
              } as React.ChangeEvent<HTMLInputElement>);
              onFormChange({
                target: { name: 'recipientPhone', value: userPhone },
              } as React.ChangeEvent<HTMLInputElement>);
            } else {
              onFormChange({
                target: { name: 'recipient', value: '' },
              } as React.ChangeEvent<HTMLInputElement>);
              onFormChange({
                target: { name: 'recipientPhone', value: '' },
              } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          className="form-checkbox h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Я получатель"
        />
        Я получатель
      </motion.label>
      <motion.div className="relative mb-2" variants={containerVariants}>
        <label htmlFor="recipient" className="text-sm font-medium mb-1 block text-gray-700">
          Имя <span className="text-red-500">*</span>
        </label>
        <motion.div
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mt-4"
          whileHover={{ scale: 1.1 }}
        >
          <Image src="/icons/user.svg" alt="Имя" width={16} height={16} />
        </motion.div>
        <input
          id="recipient"
          name="recipient"
          value={form.recipient}
          onChange={onFormChange}
          placeholder="Имя получателя"
          className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
            recipientError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-label="Введите имя получателя"
          aria-invalid={recipientError ? 'true' : 'false'}
          required
        />
        {recipientError && <p className="text-red-500 text-xs mt-1">{recipientError}</p>}
      </motion.div>
      <motion.div className="relative mb-2" variants={containerVariants}>
        <label htmlFor="recipientPhone" className="text-sm font-medium mb-1 block text-gray-700">
          Телефон получателя <span className="text-red-500">*</span>
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
              id="recipientPhone"
              mask="(000) 000-00-00"
              name="recipientPhone"
              value={form.recipientPhone}
              onAccept={(value) =>
                onFormChange({
                  target: { name: 'recipientPhone', value: phoneMask(value) },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              placeholder="(___) ___-__-__"
              className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
                recipientPhoneError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              aria-label="Введите телефон получателя"
              aria-invalid={recipientPhoneError ? 'true' : 'false'}
              required
            />
          </div>
        </div>
        {recipientPhoneError && <p className="text-red-500 text-xs mt-1">{recipientPhoneError}</p>}
      </motion.div>
      {selectedUpsells.some((item) => item.category === 'postcard') && (
        <motion.div className="relative mb-2" variants={containerVariants}>
          <label htmlFor="postcardText" className="text-sm font-medium mb-1 block text-gray-700">
            Текст открытки
          </label>
          <motion.div
            className="absolute left-3 top-3 text-gray-400 mt-4"
            whileHover={{ scale: 1.1 }}
          >
            <Image src="/icons/pen.svg" alt="Текст" width={16} height={16} />
          </motion.div>
          <textarea
            id="postcardText"
            value={postcardText}
            onChange={(e) => setPostcardText(e.target.value)}
            placeholder="Текст открытки"
            className="w-full rounded-lg border border-gray-300 p-2 pl-10 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Введите текст открытки"
          />
        </motion.div>
      )}
      <motion.label className="flex items-center gap-2 text-sm text-gray-600" variants={containerVariants}>
        <input
          type="checkbox"
          name="anonymous"
          checked={form.anonymous}
          onChange={onFormChange}
          className="form-checkbox h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Анонимный заказ"
        />
        Анонимный заказ
      </motion.label>
      <motion.p className="text-xs text-gray-500" variants={containerVariants}>
        Получатель не узнает, от кого подарок
      </motion.p>
    </div>
  );
}