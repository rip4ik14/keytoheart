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

  return (
    <div
      className="relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm h-auto sm:h-[400px]"
      role="article"
      aria-labelledby={`product-${product.id}-title`}
    >
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
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full h-56 sm:h-64 rounded-t-lg overflow-hidden aspect-[3/4]"
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 640px) 100vw, 280px"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
      </Link>
      <div className="flex flex-col flex-1 p-3 sm:p-4 min-h-[140px] sm:min-h-[160px]">
        <h3
          id={`product-${product.id}-title`}
          className="text-sm sm:text-[15px] font-medium text-black text-center line-clamp-2 break-words"
        >
          {product.title}
        </h3>
        <div className="flex flex-col items-center mt-2 sm:mt-3">
          {discountAmount > 0 ? (
            <>
              <div className="flex items-center mb-1">
                <span className="text-xs sm:text-sm text-gray-400 line-through mr-1 sm:mr-2">
                  {originalPrice > product.price ? originalPrice : product.price}₽
                </span>
                <span className="bg-black text-white rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold">
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
        </div>
        <ProductCardClient
          id={product.id}
          title={product.title}
          price={discountedPrice}
          imageUrl={imageUrl}
        />
      </div>
    </div>
  );
}
