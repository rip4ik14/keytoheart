// ✅ Путь: app/cart/components/ThankYouModal.tsx
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import UiButton from '@/components/ui/UiButton';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: number | string;
  isAnonymous?: boolean;
  askAddressFromRecipient?: boolean;
  trackingUrl?: string;
  isAuthenticated?: boolean;
}

export default function ThankYouModal({
  isOpen,
  onClose,
  orderNumber,
  isAnonymous = false,
  askAddressFromRecipient = false,
  trackingUrl,
  isAuthenticated = false,
}: ThankYouModalProps) {
  const canGoToAccount = Boolean(isAuthenticated && trackingUrl);

  // ✅ Лочим скролл страницы, пока модалка открыта (iOS Safari must-have)
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* клик по фону закрывает */}
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          />

          <motion.div
            className="
              relative z-[70] w-full max-w-md
              rounded-2xl bg-white shadow-xl border border-gray-200
              overflow-hidden
            "
            style={{
              // ✅ dVH корректно учитывает динамическую панель Safari
              maxHeight: 'calc(100dvh - 24px)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Спасибо за заказ"
          >
            {/* ✅ Скролл внутри модалки */}
            <div
              className="
                relative overflow-y-auto
                px-4 py-4 sm:px-6 sm:py-6
              "
              style={{
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              }}
            >
              {/* Кнопка закрытия */}
              <button
                type="button"
                onClick={onClose}
                className="
                  absolute right-3 top-3
                  h-9 w-9 flex items-center justify-center
                  rounded-full
                  text-gray-400 hover:text-gray-600
                  hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-black
                "
                aria-label="Закрыть"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.28 6.28a.75.75 0 0 1 1.06 0L10 8.94l2.66-2.66a.75.75 0 0 1 1.06 1.06L11.06 10l2.66 2.66a.75.75 0 1 1-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 0 1 0-1.06Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {/* Иконка / заголовок */}
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4 pt-1">
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
                      Номер заказа <span className="font-semibold">#{orderNumber}</span>
                    </p>
                  )}

                  {canGoToAccount && (
                    <p className="mt-1 text-[11px] sm:text-xs text-gray-500">
                      Статус и историю заказа вы можете посмотреть в личном кабинете.
                    </p>
                  )}
                </div>
              </div>

              {/* Основной текст */}
              <div className="mt-4 sm:mt-5 space-y-3 text-xs sm:text-sm text-gray-700">
                <p>
                  Мы уже получили ваш заказ и начали его обрабатывать. В ближайшее время
                  менеджер свяжется с вами для подтверждения и отправит ссылку на оплату
                  или реквизиты удобным способом.
                </p>

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 space-y-2">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">Что будет дальше</p>
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
                      Вы указали, что не знаете точный адрес. Мы аккуратно свяжемся с
                      получателем по телефону, уточним адрес и согласуем удобное время доставки,
                      не раскрывая деталей сюрприза.
                    </p>
                  </div>
                )}

                {isAnonymous && (
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                      Анонимный заказ
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-700">
                      Заказ помечен как анонимный. Мы не называем ваше имя получателю,
                      даже если он будет спрашивать, и не указываем отправителя в комментариях к доставке.
                    </p>
                  </div>
                )}

                <p className="text-[11px] sm:text-xs text-gray-500">
                  Если вы заметили ошибку в данных или хотите что-то уточнить, просто напишите
                  нам в WhatsApp или позвоните по телефону, указанному на сайте.
                </p>
              </div>

              {/* Кнопки */}
              <div className="mt-5 sm:mt-6 flex flex-col gap-2">
                {canGoToAccount && trackingUrl && (
                  <UiButton
                    asChild
                    variant="brand"
                    className="w-full rounded-[12px] py-3 text-xs sm:text-sm normal-case"
                  >
                    <Link href={trackingUrl} onClick={onClose}>
                      Отследить заказ
                    </Link>
                  </UiButton>
                )}

                <UiButton
                  type="button"
                  onClick={onClose}
                  variant="brandOutline"
                  className="w-full rounded-[12px] py-3 text-xs sm:text-sm normal-case"
                >
                  Вернуться к покупкам
                </UiButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
