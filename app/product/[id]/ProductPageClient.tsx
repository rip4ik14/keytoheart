'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';
import { Share2, Heart, Star, Truck } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import styles from './ProductPageClient.module.css';
import { Product } from '@/types/product';

export type ComboItem = {
  id: number;
  title: string;
  price: number;
  image: string;
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const notificationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function ProductPageClient({
  product,
  combos,
}: {
  product: Product;
  combos: ComboItem[];
}) {
  const { addItem } = useCart();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [bonusPercent, setBonusPercent] = useState<number>(0.025);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  console.log('ProductPageClient received props:', { product, combos });

  const levels = [
    { name: 'Бронзовый', percent: 0.025, threshold: 0 },
    { name: 'Серебряный', percent: 0.05, threshold: 10000 },
    { name: 'Золотой', percent: 0.075, threshold: 20000 },
    { name: 'Платиновый', percent: 0.1, threshold: 30000 },
    { name: 'Премиум', percent: 0.15, threshold: 50000 },
  ];

  useEffect(() => {
    try {
      window.gtag?.('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: product.title,
        value: product.price,
      });
      window.ym?.(12345678, 'reachGoal', 'view_item', { product_id: product.id });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [product.id, product.title, product.price]);

  const sizeOptions = [
    { value: 'small', label: 'Маленький', priceMultiplier: 0.8 },
    { value: 'medium', label: 'Средний', priceMultiplier: 1 },
    { value: 'large', label: 'Большой', priceMultiplier: 1.3 },
  ];

  const discountPercent = product.discount_percent ?? 0;
  const basePrice = discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  const adjustedPrice = Math.round(basePrice * (sizeOptions.find(opt => opt.value === selectedSize)?.priceMultiplier || 1));
  const bonus = (adjustedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const handleAdd = (id: number, title: string, price: number, img: string | null, productionTime: number | null) => {
    addItem({ id: `${id}`, title, price, quantity: 1, imageUrl: img || '', production_time: productionTime });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
    try {
      window.gtag?.('event', 'add_to_cart', {
        event_category: 'ecommerce',
        event_label: title,
        value: price,
      });
      window.ym?.(12345678, 'reachGoal', 'add_to_cart', { product_id: id });
    } catch (error) {
      console.error('Add to cart analytics error:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Посмотрите этот букет: ${product.title} на KeyToHeart!`,
        url: window.location.href,
      }).catch((error) => console.error('Share error:', error));
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Ссылка скопирована в буфер обмена!');
      });
    }
  };

  return (
    <section className="min-h-screen bg-white text-black" aria-label={`Товар ${product.title}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <AnimatePresence>
          {showNotification && (
            <motion.div
              className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50"
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Добавлено в корзину!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Галерея изображений товара"
          >
            <Swiper
              navigation={{
                prevEl: `.${styles.customSwiperButtonPrev}`,
                nextEl: `.${styles.customSwiperButtonNext}`,
              }}
              thumbs={thumbsSwiper ? { swiper: thumbsSwiper } : undefined}
              modules={[FreeMode, Navigation, Thumbs]}
              className={`${styles.customSwiper} rounded-lg overflow-hidden relative`}
              aria-label="Основной слайдер изображений"
            >
              {(product.images || []).map((src, i) => (
                <SwiperSlide key={i}>
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    <Image
                      src={src}
                      alt={`${product.title} - фото ${i + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
              <div className={styles.customSwiperButtonPrev}></div>
              <div className={styles.customSwiperButtonNext}></div>
            </Swiper>
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={8}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="mt-3"
              aria-label="Миниатюры изображений"
            >
              {(product.images || []).map((src, i) => (
                <SwiperSlide key={i}>
                  <div className="relative aspect-[4/3] rounded overflow-hidden cursor-pointer shadow-sm">
                    <Image
                      src={src}
                      alt={`${product.title} - миниатюра ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 25vw, 10vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          <motion.div
            className="flex flex-col space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">
              {product.title}
            </h1>
            <div className="flex flex-col gap-2">
              {discountPercent > 0 && (
                <span className="text-lg font-bold text-green-600">
                  {discountPercent}% скидка
                </span>
              )}
              {discountPercent > 0 ? (
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-black">
                    {adjustedPrice} ₽
                  </span>
                  <span className="text-2xl text-gray-500 line-through">
                    {product.price} ₽
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-black">
                  {adjustedPrice} ₽
                </span>
              )}
              <div className="flex items-center gap-2">
                <Image src="/icons/bonus.svg" alt="Бонус" width={20} height={20} />
                <span className="text-base text-black font-medium">
                  +{bonus} ₽ бонус
                </span>
              </div>
              {product.production_time != null && (
                <div className="flex items-center gap-2">
                  <Image src="/icons/clock.svg" alt="Время" width={20} height={20} />
                  <span className="text-base text-black font-medium">
                    Время изготовления: {product.production_time} {product.production_time === 1 ? 'час' : 'часов'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-black" />
                <span className="text-base text-black font-medium">
                  Бесплатная доставка по Краснодару при заказе от 2000 ₽
                </span>
              </div>
            </div>

            {/* Выбор размера букета */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-black">Размер букета:</h2>
              <div className="flex gap-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSize(option.value as 'small' | 'medium' | 'large')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSize === option.value
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    aria-label={`Выбрать размер ${option.label}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={() =>
                  handleAdd(product.id, product.title, adjustedPrice, product.images?.[0] || null, product.production_time ?? null)
                }
                className="flex-1 py-3 bg-green-600 text-white rounded-lg text-base font-medium hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Добавить в корзину"
              >
                Добавить в корзину
              </motion.button>
              <motion.button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorited ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-black hover:bg-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-black`}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label={isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="p-3 rounded-lg border bg-gray-100 text-black hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-black"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Поделиться"
              >
                <Share2 size={20} />
              </motion.button>
            </div>

            <div className="space-y-6">
              {product.description && (
                <div>
                  <h2 className="font-bold text-xl text-black mb-3">
                    Описание товара:
                  </h2>
                  <p className="text-lg text-black leading-loose whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
              {product.composition && (
                <div>
                  <h2 className="font-bold text-xl text-black mb-3">
                    Состав:
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 text-lg text-black leading-loose">
                    {product.composition.split('\n').map((item, index) => (
                      <li key={index}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h2 className="font-bold text-xl text-black mb-3">
                  Уход за букетом:
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-lg text-black leading-loose">
                  <li>Храните букет в прохладном месте, вдали от прямых солнечных лучей.</li>
                  <li>Ежедневно меняйте воду в вазе и подрезайте стебли на 1-2 см.</li>
                  <li>Избегайте попадания воды на ягоды, чтобы сохранить их свежесть.</li>
                </ul>
              </div>
            </div>

            {/* Секция отзывов */}
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-black mb-3">
                Отзывы клиентов:
              </h2>
              <div className="space-y-4">
                {[
                  { name: 'Анна', rating: 5, text: 'Очень красивый букет! Клубника свежая, доставка вовремя.' },
                  { name: 'Мария', rating: 4, text: 'Букет понравился, но хотелось бы больше вариантов размеров.' },
                ].map((review, index) => (
                  <div key={index} className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{review.name}</span>
                      <div className="flex">
                        {Array(review.rating).fill(0).map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-500 fill-current" />
                        ))}
                        {Array(5 - review.rating).fill(0).map((_, i) => (
                          <Star key={i + review.rating} size={16} className="text-gray-300" />
                        ))}
                      </div>
                    </div>
                    <p className="text-base text-gray-700 mt-1">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {combos.length > 0 && (
          <motion.section
            className="mt-8 pt-8 border-t border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Рекомендуемые товары"
          >
            <h2 className="text-2xl font-bold text-black mb-6 tracking-tight">
              Рекомендуемые товары
            </h2>
            <div className="block sm:hidden">
              <Swiper
                spaceBetween={12}
                slidesPerView={1.5}
                freeMode
                modules={[FreeMode]}
                className="pb-4"
                aria-label="Слайдер рекомендуемых товаров"
              >
                {combos.slice(0, 4).map((combo) => (
                  <SwiperSlide key={combo.id}>
                    <motion.div
                      className="flex flex-col items-center group rounded-lg shadow-sm overflow-hidden bg-white"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative w-full aspect-[4/3] bg-gray-100">
                        <Image
                          src={combo.image}
                          alt={combo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-3 w-full">
                        <p className="text-sm text-left">{combo.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-black">
                            {combo.price} ₽
                          </span>
                        </div>
                        <motion.button
                          onClick={() =>
                            handleAdd(combo.id, combo.title, combo.price, combo.image, null)
                          }
                          className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                          variants={buttonVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          aria-label={`Добавить ${combo.title} в корзину`}
                        >
                          Добавить
                        </motion.button>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {combos.slice(0, 4).map((combo) => (
                <motion.div
                  key={combo.id}
                  className="flex flex-col items-center group rounded-lg shadow-sm overflow-hidden bg-white"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                      src={combo.image}
                      alt={combo.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 w-full">
                    <p className="text-sm sm:text-base text-left">{combo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm sm:text-base font-bold text-black">
                        {combo.price} ₽
                      </span>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleAdd(combo.id, combo.title, combo.price, combo.image, null)
                      }
                      className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      aria-label={`Добавить ${combo.title} в корзину`}
                    >
                      Добавить
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </section>
  );
}