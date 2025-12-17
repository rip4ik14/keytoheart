import Link from 'next/link';
import Image from 'next/image';

const quickLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/articles', label: 'Статьи и подборки' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contacts', label: 'Контакты' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center pb-24">
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
          Выберите нужный раздел или вернитесь на главную.
        </p>
        <Link
          href="/"
          className="mb-8 inline-block bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition"
        >
          На главную
        </Link>
        <div className="flex flex-wrap justify-center gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 hover:border-black hover:text-black transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export const revalidate = 3600;
