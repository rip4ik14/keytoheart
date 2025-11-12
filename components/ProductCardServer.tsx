import Image from 'next/image';
import Link from 'next/link';
import ProductCardClient from './ProductCardClient';
import type { Product } from '@/types/product';

interface Props {
  product: Product;
  priority?: boolean;
}

export default function ProductCardServer({ product, priority = false }: Props) {
  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus ?? Math.floor(product.price * 0.025);
  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  const discountedPrice = discountPercent
    ? Math.round(product.price * (1 - discountPercent / 100))
    : product.price;
  const discountAmount = discountPercent
    ? (originalPrice > product.price ? originalPrice : product.price) - discountedPrice
    : 0;
  const isPopular = product.is_popular;

  // Склонения слов
  function declineWord(num: number, words: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[(num % 100 > 4 && num % 100 < 20)
      ? 2
      : cases[(num % 10 < 5) ? num % 10 : 5]];
  }

  // Полный формат времени
  function formatProductionTime(minutes: number | null): string | null {
    if (minutes == null || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let r = '';
    if (h > 0) r += `${h} ${declineWord(h, ['час', 'часа', 'часов'])}`;
    if (m > 0) r += `${r ? ' ' : ''}${m} ${declineWord(m, ['минута', 'минуты', 'минут'])}`;
    return r || 'Мгновенно';
  }

  // Короткий формат (в одну строку)
  function formatProductionTimeShort(minutes: number | null): string | null {
    if (minutes == null || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = h ? `${h} ч` : '';
    const mm = m ? `${m} мин` : '';
    return [hh, mm].filter(Boolean).join(' ');
  }

  // Фиксированная высота строки времени
  const TIME_ROW_MIN_H = '1.25rem';

  return (
    <div
      className="relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
      role="article"
      aria-labelledby={`product-${product.id}-title`}
    >
      {/* Стикеры бонуса и популярности */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100">
          +{bonus}₽
        </div>
      )}
      {isPopular && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-[10px] sm:text-sm px-2 py-0.5 rounded-full flex items-center font-bold">
          <span className="mr-1">★</span>Популярно
        </div>
      )}

      {/* Изображение */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full aspect-[3/4] overflow-hidden"
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 280px"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
      </Link>

      {/* Контент */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Заголовок фиксированной высоты */}
        <h3
          id={`product-${product.id}-title`}
          className="text-sm sm:text-[15px] font-medium text-black text-center leading-5"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,          // можно 2, если хочешь компактнее
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.75rem',        // 3 строки * 1.25rem
          }}
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Spacer — тянет всё вверх, а цену с временем вниз */}
        <div className="mt-auto" />

        {/* Цена и время — всегда над кнопкой */}
        <div className="flex flex-col items-center">
          {discountAmount > 0 ? (
            <>
              <div className="flex items-center mb-1">
                <span className="text-xs sm:text-sm text-gray-400 line-through mr-2">
                  {originalPrice > product.price ? originalPrice : product.price}₽
                </span>
                <span className="bg-black text-white rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-bold">
                  -{discountAmount}₽
                </span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-black">{discountedPrice}₽</span>
            </>
          ) : originalPrice > product.price ? (
            <>
              <span className="text-xs sm:text-sm text-gray-400 line-through">{originalPrice}₽</span>
              <span className="text-lg sm:text-2xl font-bold text-black">{product.price}₽</span>
            </>
          ) : (
            <span className="text-lg sm:text-2xl font-bold text-black">{product.price}₽</span>
          )}

          {/* Фиксированная строка времени */}
          {product.production_time != null ? (
            <p
              className="mt-1 text-xs sm:text-sm text-gray-500 text-center truncate whitespace-nowrap"
              style={{ minHeight: TIME_ROW_MIN_H }}
              title={`Время изготовления: ${formatProductionTime(product.production_time)}`}
            >
              Время изготовления: {formatProductionTimeShort(product.production_time)}
            </p>
          ) : (
            <div className="mt-1" style={{ minHeight: TIME_ROW_MIN_H }} />
          )}
        </div>

        {/* Кнопка */}
        <div className="mt-2">
          <ProductCardClient
            id={product.id}
            title={product.title}
            price={discountedPrice}
            imageUrl={imageUrl}
            productionTime={product.production_time ?? null}
          />
        </div>
      </div>
    </div>
  );
}
