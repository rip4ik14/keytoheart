import type { Metadata } from 'next';
import Script from 'next/script';
import Image from 'next/image';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import ContactButton from '@components/ContactButton';

export const metadata: Metadata = {
  title: 'Оплата | KeyToHeart',
  description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные в мастерской, иностранная карта и безнал для юрлиц. Всё прозрачно и удобно.',
  keywords: ['оплата', 'KeyToHeart', 'Краснодар', 'клубничные букеты', 'доставка', 'СБП', 'онлайн-оплата'],
  openGraph: {
    title: 'Оплата | KeyToHeart',
    description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные и другие способы.',
    url: 'https://keytoheart.ru/payment',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-payment.jpg',
        width: 1200,
        height: 630,
        alt: 'Оплата заказов KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Оплата | KeyToHeart',
    description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные и другие способы.',
    images: ['https://keytoheart.ru/og-image-payment.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/payment' },
};

const schemaPayment = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Оплата | KeyToHeart',
  description: 'Подробные условия оплаты букетов и наборов KeyToHeart',
  url: 'https://keytoheart.ru/payment',
  mainEntity: {
    '@type': 'Organization',
    name: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@keytoheart.ru',
      telephone: '+7-988-603-38-21',
      contactType: 'customer service',
    },
  },
};

export default function PaymentPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl bg-white text-black">
      <Script
        id="payment-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPayment) }}
      />

      <ClientAnimatedSection>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-10 text-center tracking-tight">
          Условия оплаты
        </h1>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <p className="text-base sm:text-lg text-gray-700 mb-8 sm:mb-10 leading-relaxed text-center">
          Мы стараемся сделать процесс оформления заказа максимально удобным и прозрачным. Ниже вы найдёте информацию о способах оплаты.
        </p>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <ul className="space-y-6 sm:space-y-8 text-gray-800">
          <li className="flex items-start gap-3">
            <Image src="/icons/qrcode.svg" alt="QR Code" width={24} height={24} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-lg font-semibold">1. Система быстрых платежей (СБП)</strong>
              <br />
              <span className="text-base sm:text-lg leading-relaxed">
                Оплата через любое банковское приложение по QR-коду. Это быстро и удобно.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Image src="/icons/credit-card.svg" alt="Credit Card" width={24} height={24} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-lg font-semibold">2. Онлайн-оплата по ссылке</strong>
              <br />
              <span className="text-base sm:text-lg leading-relaxed">
                Мы отправляем вам индивидуальную ссылку (CloudPayments) — вы можете оплатить картой любого банка, включая иностранные и корпоративные.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Image src="/icons/money-bill-wave.svg" alt="Cash" width={24} height={24} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-lg font-semibold">3. Наличные в мастерской</strong>
              <br />
              <span className="text-base sm:text-lg leading-relaxed">
                Вы можете оплатить заказ наличными, если забираете его лично. Важно: сборка начинается только после оплаты.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Image src="/icons/globe.svg" alt="Globe" width={24} height={24} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-lg font-semibold">4. Иностранная карта</strong>
              <br />
              <span className="text-base sm:text-lg leading-relaxed">
                Мы принимаем оплату картами иностранных банков. Уточните детали у менеджера.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Image src="/icons/file-invoice.svg" alt="Invoice" width={24} height={24} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-lg font-semibold">5. Оплата по реквизитам</strong>
              <br />
              <span className="text-base sm:text-lg leading-relaxed">
                Для юридических лиц возможна оплата по счёту. Заключение договора обязательно.
              </span>
            </div>
          </li>
        </ul>
      </ClientAnimatedSection>

      <ClientAnimatedSection>
        <div className="mt-10 sm:mt-12 bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 p-6 sm:p-8 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <Image src="/icons/exclamation-triangle.svg" alt="Warning" width={24} height={24} className="text-yellow-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-3">Важно знать:</p>
              <ul className="list-disc ml-6 space-y-2 text-gray-700 text-base sm:text-lg">
                <li>Мы работаем по 100% предоплате.</li>
                <li>Оплата при получении не предусмотрена.</li>
                <li>Сборка начинается только после подтверждённой оплаты.</li>
                <li>Каждый заказ индивидуален, закупка ингредиентов производится заранее.</li>
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
    </main>
  );
}