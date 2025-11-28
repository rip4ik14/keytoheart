// ✅ Путь: app/cart/components/ThankYouModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: number | string;     // 🔴 ВАЖНО: ВОПРОСИК и союз с string
  isAnonymous?: boolean;
  askAddressFromRecipient?: boolean;
}

export default function ThankYouModal({
  isOpen,
  onClose,
  orderNumber,
  isAnonymous = false,
  askAddressFromRecipient = false,
}: ThankYouModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="
              relative z-50 max-w-md w-full rounded-2xl bg-white
              p-5 sm:p-6 shadow-xl border border-gray-200
            "
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Спасибо за заказ"
          >
            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-black rounded-full"
              aria-label="Закрыть"
            >
              <span className="sr-only">Закрыть</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  d="M6.28 6.28a.75.75 0 0 1 1.06 0L10 8.94l2.66-2.66a.75.75 0 0 1 1.06 1.06L11.06 10l2.66 2.66a.75.75 0 1 1-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 0 1 0-1.06Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Иконка / заголовок */}
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center">
  <Image
    src="/icons/thank-you.svg"
    alt="Спасибо"
    width={56}
    height={56}
    className="object-contain"
    loading="lazy"
  />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Спасибо за заказ!
                </h2>
                {orderNumber && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    Номер заказа{' '}
                    <span className="font-semibold">#{orderNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Основной текст */}
            <div className="mt-4 sm:mt-5 space-y-3 text-xs sm:text-sm text-gray-700">
              <p>
                Мы уже получили ваш заказ и начали его обрабатывать. В ближайшее
                время менеджер свяжется с вами для подтверждения и отправит
                ссылку на оплату или реквизиты удобным способом.
              </p>

              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 space-y-2">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Что будет дальше
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] sm:text-xs text-gray-700">
                  <li>Проверим наличие всех позиций из заказа.</li>
                  <li>Согласуем с вами детали по времени и способу доставки.</li>
                  <li>После подтверждения отправим ссылку на оплату или реквизиты.</li>
                </ul>
              </div>

              {askAddressFromRecipient && (
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white space-y-1">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                    Адрес уточним у получателя
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-700">
                    Вы указали, что не знаете точный адрес. Мы аккуратно
                    свяжемся с получателем по телефону, уточним адрес и согласуем
                    удобное время доставки, не раскрывая деталей сюрприза.
                  </p>
                </div>
              )}

              {isAnonymous && (
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white space-y-1">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                    Анонимный заказ
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-700">
                    Заказ помечен как анонимный. Мы не называем ваше имя
                    получателю, даже если он будет спрашивать, и не указываем
                    отправителя в комментариях к доставке.
                  </p>
                </div>
              )}

              <p className="text-[11px] sm:text-xs text-gray-500">
                Если вы заметили ошибку в данных или хотите что-то уточнить,
                просто напишите нам в WhatsApp или позвоните по телефону, указанному
                на сайте.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex items-center justify-center px-6 py-2.5
                  rounded-[10px] border border-[#bdbdbd] bg-white text-xs sm:text-sm font-semibold
                  uppercase tracking-tight text-[#535353] shadow-sm
                  hover:bg-[#535353] hover:text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
                  transition-all duration-200
                "
              >
                Вернуться к покупкам
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
