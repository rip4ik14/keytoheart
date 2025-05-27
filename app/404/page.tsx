// app/404.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Страница не найдена</h1>
        <p className="text-lg mb-6">К сожалению, запрошенная страница не существует.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}

export const revalidate = 3600; // Опционально: кэширование на 1 час