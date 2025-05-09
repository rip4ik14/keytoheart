'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import AnimatedSection from '@components/AnimatedSection';
import CustomerStories from '@components/CustomerStories';

const TypeAnimation = dynamic(() => import('react-type-animation').then((mod) => mod.TypeAnimation), {
  ssr: false,
});

export default function AboutContent() {
  return (
    <>
      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src="/about-main.jpg"
                alt="О нас - KeyToHeart"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight">
                О нас
              </h1>
              <div className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                <TypeAnimation
                  sequence={[
                    'KeyToHeart — это про эмоции, которые можно подарить через цветы и клубнику в шоколаде.',
                    1000,
                    'KeyToHeart — это про любовь к деталям и качеству.',
                    1000,
                    'KeyToHeart — это про Краснодар и доставку в день заказа.',
                    1000,
                  ]}
                  wrapper="span"
                  cursor={true}
                  repeat={Infinity}
                  speed={50}
                  deletionSpeed={75}
                  style={{ display: 'inline-block' }}
                />
              </div>
              <p className="text-gray-600">
                Мы создаём букеты и подарочные наборы, которые становятся частью ваших самых тёплых моментов.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-black">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/seedling.svg"
                  alt="Свежие цветы"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Свежие цветы</h3>
              <p className="text-gray-600">
                Мы работаем только со свежими цветами, чтобы ваш букет радовал как можно дольше.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/chocolate-bar.svg"
                  alt="Бельгийский шоколад"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Бельгийский шоколад</h3>
              <p className="text-gray-600">
                Используем только премиальный шоколад Callebaut и Sicao для клубники.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/strawberry.svg"
                  alt="Отборная клубника"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Отборная клубника</h3>
              <p className="text-gray-600">
                Каждая ягода проходит строгий отбор, чтобы соответствовать нашим стандартам.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/heart.svg"
                  alt="С любовью"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">С любовью</h3>
              <p className="text-gray-600">
                Каждый букет собирается с заботой, чтобы подарить вам эмоции.
              </p>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-black">
            Наши ценности
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/store.svg"
                  alt="Магазин"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Магазин</h3>
              <p className="text-gray-600">
                Собственный магазин в Краснодаре для самовывоза.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/truck.svg"
                  alt="Быстрая доставка"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Быстрая доставка</h3>
              <p className="text-gray-600">
                Доставка в день заказа по Краснодару и ближайшим районам.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/leaf.svg"
                  alt="Экологичность"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Экологичность</h3>
              <p className="text-gray-600">
                Используем экологичные материалы для упаковки.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-hidden="true"
              >
                <Image
                  src="/icons/hands.svg"
                  alt="Индивидуальность"
                  width={40}
                  height={40}
                  className="text-black"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-black mb-2">Индивидуальность</h3>
              <p className="text-gray-600">
                Каждый заказ собирается с учётом ваших пожеланий.
              </p>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection animation="slideInUp">
        <CustomerStories />
      </AnimatedSection>
    </>
  );
}