import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import CorporateHero from '@components/CorporateHero';
import CorporateForm from '@components/CorporateForm';
import CorporateHighlights from '@components/CorporateHighlights';
import CorporateSteps from '@components/CorporateSteps';
import CorporateGallerySlider from '@components/CorporateGallerySlider';
import CorporateOfferings from '@components/CorporateOfferings';
import CorporateFooterCTA from '@components/CorporateFooterCTA';

export const metadata: Metadata = {
  title: 'Корпоративные подарки и букеты — KEY TO HEART',
  description: 'Фруктово-цветочные подарки, брендированные боксы и букеты для сотрудников и партнёров. Документы для юрлиц, бесплатная доставка по Краснодару.',
  keywords: ['корпоративные подарки', 'KEY TO HEART', 'доставка', 'корпоративные букеты Краснодар'],
  openGraph: {
    title: 'Корпоративные подарки от KEY TO HEART',
    description: 'Уникальные подарки для коллег и партнёров с доставкой по Краснодару.',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
    url: 'https://keytoheart.ru/corporate',
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/corporate' },
};

export default function CorporatePage() {
  return (
    <main className="bg-white text-black" aria-label="Корпоративные подарки">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Корпоративные подарки',
          url: 'https://keytoheart.ru/corporate',
          description: 'Фруктово-цветочные подарки для бизнеса.',
        }}
      />
      <article>
        <CorporateHero />
        <CorporateForm />
        <CorporateHighlights />
        <CorporateSteps />
        <CorporateGallerySlider />
        <CorporateOfferings />
        <CorporateFooterCTA />
      </article>
    </main>
  );
}