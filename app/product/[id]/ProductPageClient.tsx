// файл: app/product/[id]/ProductPageClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { useCart } from '@context/CartContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';

type Product = {
  id: number;
  title: string;
  price: number;
  category: string;
  short_desc: string | null;
  description: string | null;
  composition: string | null;
  images: string[];
};
type ComboItem = {
  id: number;
  title: string;
  price: number;
  oldPrice: number;
  image: string;
};

function slugifyCategory(name: string) {
  const map: Record<string, string> = {
    'Клубничные букеты': 'klubnichnye-bukety',
    'Клубничные боксы': 'klubnichnye-boksy',
    Цветы: 'flowers',
    'Комбо-наборы': 'combo',
    Premium: 'premium',
    Коллекции: 'kollekcii',
    Повод: 'povod',
    Подарки: 'podarki',
  };
  return map[name] || '';
}

export default function ProductPageClient({
  product,
  combos,
}: {
  product: Product;
  combos: ComboItem[];
}) {
  const { addItem } = useCart();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const oldPrice = Math.floor(product.price * 1.1);
  const bonus = Math.floor(product.price * 0.025);

  const handleAdd = (id: number, title: string, price: number, img: string) => {
    addItem({ id, title, price, quantity: 1, imageUrl: img });
    toast.success('Товар добавлен в корзину!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <Toaster position="top-right" />

      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">
          Главная
        </Link>{' '}
        /{' '}
        <Link href="/catalog" className="hover:underline">
          Каталог
        </Link>{' '}
        /{' '}
        <Link
          href={`/catalog/${slugifyCategory(product.category)}`}
          className="hover:underline"
        >
          {product.category}
        </Link>{' '}
        / <span className="text-gray-800">{product.title}</span>
      </nav>

      {/* Галерея и информация */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Левый столбец: слайдер */}
        <div className="relative">
          <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full shadow-md text-sm font-semibold flex gap-2 z-10">
            <span className="line-through text-gray-400">{oldPrice} ₽</span>
            <span>{product.price} ₽</span>
          </div>

          <Swiper
            navigation
            thumbs={thumbsSwiper ? { swiper: thumbsSwiper } : undefined}
            modules={[FreeMode, Navigation, Thumbs]}
            className="rounded-lg overflow-hidden"
          >
            {product.images.map((src, i) => (
              <SwiperSlide key={i}>
                <div className="aspect-square relative">
                  <Image
                    src={src}
                    alt={`Фото ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={4}
            freeMode
            watchSlidesProgress
            modules={[FreeMode, Navigation, Thumbs]}
            className="mt-4"
          >
            {product.images.map((src, i) => (
              <SwiperSlide key={i}>
                <div className="aspect-square border rounded overflow-hidden hover:scale-105 transition cursor-pointer">
                  <Image
                    src={src}
                    alt={`Миниатюра ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Правый столбец: детали */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold uppercase mb-4">
            {product.title}
          </h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-semibold">
              {product.price} ₽
            </span>
            <span className="text-gray-500">+ бонус {bonus} ₽</span>
          </div>

          {/* Кнопка «Добавить в корзину» */}
          <button
            onClick={() =>
              handleAdd(
                product.id,
                product.title,
                product.price,
                product.images[0] || ''
              )
            }
            className="mb-6 py-3 bg-black text-white rounded-full uppercase hover:bg-gray-800 transition"
          >
            Добавить в корзину
          </button>

          {/* Краткий анонс */}
          <p className="text-xs text-gray-500 italic mb-6">
            {product.short_desc}
          </p>

          {/* Полное описание и состав */}
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-2">О товаре:</h2>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">Состав:</h2>
              <p className="whitespace-pre-line">{product.composition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Преимущества */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm text-gray-600">
        {[
          {
            icon: '/icons/guarantee.svg',
            title: 'Гарантия качества',
            text: 'Поменяем букет или вернём деньги',
          },
          {
            icon: '/icons/photo.svg',
            title: 'Фотоконтроль',
            text: 'Отправляем фото заказа',
          },
          {
            icon: '/icons/gift.svg',
            title: 'Подарок для вас',
            text: 'Дарим бокс к первому заказу',
          },
          {
            icon: '/icons/cashback.svg',
            title: 'Кешбэк до 15%',
            text: 'Возвращаем бонусами',
          },
        ].map((blk) => (
          <div key={blk.title} className="space-y-1">
            <Image
              src={blk.icon}
              width={32}
              height={32}
              alt={blk.title}
            />
            <div className="font-medium">{blk.title}</div>
            <div>{blk.text}</div>
          </div>
        ))}
      </div>

      {/* Комбо‑предложения */}
      {combos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Собери комбо и получи скидку до 10%
          </h2>
          <Swiper
            spaceBetween={16}
            slidesPerView={2.5}
            breakpoints={{
              640: { slidesPerView: 3.5 },
              1024: { slidesPerView: 4.5 },
            }}
            freeMode
            modules={[FreeMode]}
          >
            {combos.map((c) => (
              <SwiperSlide key={c.id}>
                <div className="bg-white shadow rounded p-3 hover:shadow-lg transition">
                  <Link href={`/product/${c.id}`}>
                    <div className="aspect-square relative mb-2">
                      <Image
                        src={c.image}
                        alt={c.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="text-sm font-medium mb-1">
                      {c.title}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="line-through text-gray-400 text-xs">
                        {c.oldPrice} ₽
                      </span>
                      <span className="text-base font-semibold">
                        {c.price} ₽
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() =>
                      handleAdd(c.id, c.title, c.price, c.image)
                    }
                    className="mt-3 w-full py-2 text-xs border border-gray-600 rounded-full hover:bg-gray-100 transition"
                  >
                    Добавить
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Доставка / Срок / Оплата */}
      <div className="grid md:grid-cols-3 gap-8 pt-10 border-t text-sm text-gray-700">
        <div>
          <h3 className="font-semibold mb-2">Доставка</h3>
          <p>Доставка по Москве — 500 ₽. В отдалённые районы — индивидуально.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Срок хранения</h3>
          <p>Клубника в шоколаде — до 12 ч, без шоколада — до 24 ч.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Оплата</h3>
          <p>Наличные при получении или онлайн‑оплата после подтверждения заказа.</p>
        </div>
      </div>
    </div>
  );
}
