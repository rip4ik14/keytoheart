import type { Metadata } from 'next';
import GiftClient from './GiftClient';

export const metadata: Metadata = {
  title: 'С Новым годом ❤️',
  description: 'Сюрприз для моего цветочка Ри 🎁',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://keytoheart.ru/anya2026' },
};

export default function Page() {
  return <GiftClient />;
}
