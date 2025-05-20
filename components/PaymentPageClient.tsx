'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import ContactButton from '@components/ContactButton';

export default function PaymentPageClient() {
  return (
    <>
      <ClientAnimatedSection>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-10 text-center tracking-tight">
          Условия оплаты
        </h1>
        <p className="text-base sm:text-lg text-gray-700 mb-8 sm:mb-10 leading-relaxed text-center">
          Мы стараемся сделать процесс оформления заказа максимально удобным и прозрачным. Ниже вы найдёте информацию о способах оплаты.
        </p>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <ul className="space-y-6 sm:space-y-8 text-gray-800" role="list">
          {[
            {
              icon: '/icons/qrcode.svg',
              alt: 'Иконка QR-кода',
              title: 'Система быстрых платежей (СБП)',
              description: 'Оплата через любое банковское приложение по QR-коду. Это быстро и удобно.',
            },
            {
              icon: '/icons/credit-card.svg',
              alt: 'Иконка кредитной карты',
              title: 'Онлайн-оплата по ссылке',
              description: 'Мы отправляем вам индивидуальную ссылку (CloudPayments) — вы можете оплатить картой любого банка, включая иностранные и корпоративные.',
            },
            {
              icon: '/icons/money-bill-wave.svg',
              alt: 'Иконка наличных',
              title: 'Наличные в мастерской',
              description: 'Вы можете оплатить заказ наличными, если забираете его лично. Важно: сборка начинается только после оплаты.',
            },
            {
              icon: '/icons/globe.svg',
              alt: 'Иконка глобуса',
              title: 'Иностранная карта',
              description: 'Мы принимаем оплату картами иностранных банков. Уточните детали у менеджера.',
            },
            {
              icon: '/icons/file-invoice.svg',
              alt: 'Иконка счёта',
              title: 'Оплата по реквизитам',
              description: 'Для юридических лиц возможна оплата по счёту. Заключение договора обязательно.',
            },
          ].map((item, index) => (
            <motion.li
              key={index}
              className="flex items-start gap-3"
              role="listitem"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src={item.icon}
                alt={item.alt}
                width={24}
                height={24}
                className="flex-shrink-0"
                loading="lazy"
                sizes="(max-width: 640px) 24px, 24px"
              />
              <div>
                <strong className="text-lg font-semibold">{`${index + 1}. ${item.title}`}</strong>
                <br />
                <span className="text-base sm:text-lg leading-relaxed">{item.description}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <div className="mt-10 sm:mt-12 bg-gray-50 border-l-4 border-gray-400 p-6 sm:p-8 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <Image
              src="/icons/exclamation-triangle.svg"
              alt="Иконка предупреждения"
              width={24}
              height={24}
              className="flex-shrink-0"
              loading="lazy"
              sizes="(max-width: 640px) 24px, 24px"
            />
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-3">Важно знать:</p>
              <ul className="list-disc ml-6 space-y-2 text-gray-700 text-base sm:text-lg" role="list">
                <li role="listitem">Мы работаем по 100% предоплате.</li>
                <li role="listitem">Оплата при получении не предусмотрена.</li>
                <li role="listitem">Сборка начинается только после подтверждённой оплаты.</li>
                <li role="listitem">Каждый заказ индивидуален, закупка ингредиентов производится заранее.</li>
              </ul>
            </div>
          </div>
        </div>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-base sm:text-lg text-gray-500 mb-6">
            Остались вопросы? Напишите нам — мы на связи 💬
          </p>
          <ContactButton />
        </div>
      </ClientAnimatedSection>
    </>
  );
}