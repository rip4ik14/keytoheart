import Link from 'next/link';
import Image from 'next/image';
import PopularProductsServer from '@components/PopularProductsServer';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12">
      {/* Маскот или иллюстрация */}
      <div className="mb-8">
        <Image
          src="/404-mascot.png" // Добавь картинку в public!
          alt="404 – Страница не найдена"
          width={200}
          height={200}
          className="mx-auto rounded-full shadow-md bg-white"
          priority
        />
      </div>
      {/* Заголовок и подпись */}
      <h1 className="text-4xl font-extrabold mb-2 text-gray-900">Упс! Такой страницы нет</h1>
      <p className="text-lg text-gray-600 mb-6">
        Возможно, страница удалена или её никогда не существовало.<br />
        Попробуйте найти нужное, выбрать из популярных товаров или вернуться на главную.
      </p>
      {/* Кнопка на главную */}
      <Link
        href="/"
        className="mb-8 inline-block bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition"
      >
        На главную
      </Link>
      {/* Форма поиска */}
      <div className="mb-8 w-full max-w-md">
        <form action="/search" method="GET" className="flex">
          <input
            type="text"
            name="q"
            placeholder="Поиск по товарам..."
            className="flex-grow px-4 py-2 border rounded-l-full focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded-r-full font-semibold"
          >
            Искать
          </button>
        </form>
      </div>
      {/* Популярные товары */}
      <section className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Популярные товары</h2>
        <PopularProductsServer />
      </section>
    </div>
  );
}

export const revalidate = 3600;
