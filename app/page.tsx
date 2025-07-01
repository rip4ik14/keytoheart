import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <section className="relative w-full aspect-[16/9]">
        <Image
          src="/lcp-test-banner.webp"
          alt="Клубничный букет"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </section>
    </main>
  );
}
