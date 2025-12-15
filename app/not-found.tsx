import Link from 'next/link';
import Image from 'next/image';
import PopularProductsServer from '@components/PopularProductsServer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center pb-24">
      {/* Секция 404 */}
      <div className="w-full flex flex-col items-center justify-center py-12 mb-6">
        <div className="mb-6">
          <Image
            src="/404-mascot.png"
            alt="404 – Страница не найдена"
            width={200}
            height={200}
            className="mx-auto rounded-full shadow-md bg-white border"
            priority
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900 text-center">
          Упс! Такой страницы нет
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-6 text-center max-w-xl">
          Возможно, страница удалена или её никогда не существовало.
          <br className="hidden md:block" />
          Попробуйте выбрать из популярных товаров или вернуться на главную.
        </p>
        <Link
          href="/"
          className="mb-8 inline-block bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition"
        >
          На главную
        </Link>
      </div>

      {/* Популярные товары */}
      <section className="w-full max-w-6xl px-2">
        <h2 className="text-2xl font-bold mb-5 text-center">Популярные товары</h2>
        <PopularProductsServer />
      </section>
    </div>
  );
}

export const revalidate = 3600;
