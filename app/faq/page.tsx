export const dynamic = "force-dynamic";
export const revalidate = 0;


import { Metadata } from 'next';
import FaqClient from './FaqClient';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage } from 'schema-dts';

export const metadata: Metadata = {
  title: 'FAQ — Часто задаваемые вопросы | KEY TO HEART',
  description: 'Ответы на вопросы о заказе, оплате, доставке и составе клубничных букетов в Краснодаре. Узнайте больше на KEY TO HEART!',
  keywords: [
    'FAQ',
    'KEY TO HEART',
    'клубника в шоколаде Краснодар',
    'букет из клубники',
    'съедобные букеты',
    'доставка букетов Краснодар',
    'оплата',
    'доставка',
  ],
  openGraph: {
    title: 'FAQ | KEY TO HEART',
    description: 'Все ответы о доставке клубники и цветов по Краснодару и пригородам.',
    url: 'https://keytoheart.ru/faq',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-faq.jpg',
        width: 1200,
        height: 630,
        alt: 'FAQ KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | KEY TO HEART',
    description: 'Как заказать и получить букет в Краснодаре? Ответы здесь!',
    images: ['https://keytoheart.ru/og-image-faq.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/faq' },
};

export default function FAQPage() {
  return (
    <main aria-label="Часто задаваемые вопросы">
      <JsonLd<FAQPage>
        item={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Что такое KEY TO HEART?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'KEY TO HEART — это сервис по созданию и доставке стильных букетов и подарочных наборов из клубники в бельгийском шоколаде и свежих цветов с доставкой по Краснодару и пригородам.',
              },
            },
            {
              '@type': 'Question',
              name: 'Какие поводы подходят для заказа букетов и наборов?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Наши букеты и подарочные боксы дарят на: 8 Марта (Международный женский день); 14 Февраля — День всех влюблённых; Дни рождения и юбилеи; Годовщины отношений или свадьбы; Выпускные и Последний звонок; Свадебные торжества и девичники; Рождение ребёнка / выписка из роддома; День Матери, День Отца; Новый год и рождественские праздники; Профессиональные даты (День Учителя, День Медика и др.); просто чтобы порадовать близкого человека. Доставляем по всему Краснодару и пригородам — Пашковский, Яблоновский, Энка и другие.',
              },
            },
            {
              '@type': 'Question',
              name: 'Могу ли я отказаться от заказа?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Отменить заказ или перенести дату можно не позднее 24 часов до предполагаемого времени доставки или самовывоза. При отмене менее чем за 24 часа оплата не возвращается, так как мы закупаем свежую клубнику и цветы индивидуально для каждого клиента.',
              },
            },
            {
              '@type': 'Question',
              name: 'Можно ли заказать индивидуальный букет или набор?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Да. Вы можете изменить состав, цвет упаковки, добавить или убрать ингредиенты — просто укажите пожелания при оформлении заказа.',
              },
            },
            {
              '@type': 'Question',
              name: 'Какие способы оплаты доступны?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Система быстрых платежей (СБП), карта онлайн через CloudPayments, безналичный расчёт для юрлиц.',
              },
            },
            {
              '@type': 'Question',
              name: 'Куда осуществляется доставка?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Мы доставляем заказы по всему Краснодару и ближайшим пригородам. В среднем курьер привозит подарок за 60–120 минут после подтверждения.',
              },
            },
          ],
        }}
      />
      <FaqClient />
    </main>
  );
}