import Image from 'next/image';

export const metadata = {
  title: 'Тест LCP — KeyToHeart',
  description: 'Тестируем, работает ли приоритетная картинка для LCP',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative w-full aspect-[16/7]">
        <Image
          src="/images/lcp-test-banner.webp"
          alt="Тестовая картинка LCP"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </section>
    </main>
  );
}
