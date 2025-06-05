// components/AboutContent.tsx
'use client';

import Image from 'next/image';
import WebpImage from './WebpImage';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import AnimatedSection from '@components/AnimatedSection';
import WhyUsMarquee from '@components/WhyUsMarquee';
import Link from 'next/link';

const TypeAnimation = dynamic(
  () => import('react-type-animation').then((mod) => mod.TypeAnimation),
  { ssr: false }
);

export default function AboutContent() {
  return (
    <>
      {/* Заголовочная секция */}
      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <WebpImage
                src="/images/about-main.jpg"
                alt="KeyToHeart — клубничные букеты и цветы"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
            {/* Блок справа с правильным расположением кнопки */}
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight">
                О KeyToHeart
              </h1>
              <div className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                <TypeAnimation
                  sequence={[
                    'KeyToHeart — клубничные букеты и цветы, которые создают настроение.',
                    1000,
                    'KeyToHeart — доставляем эмоции в каждый уголок Краснодара.',
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
              <Link
                href="/catalog"
                className="inline-block w-max border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight bg-white text-[#535353] transition-all duration-200 shadow-sm hover:bg-[#535353] hover:text-white active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
                onClick={() => {
                  window.gtag?.('event', 'click_cta_about', { event_category: 'CTA', event_label: 'Order Bouquet' });
                  window.ym?.(96644553, 'reachGoal', 'click_cta_about');
                }}
              >
                Заказать букет
              </Link>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                Дарить тепло через вкус и красоту. Каждый букет — это маленький праздник, собранный с заботой для вас и ваших близких.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Как всё начиналось */}
      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                Как всё начиналось
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                KeyToHeart родился в 2022 году из мечты создавать подарки, которые запоминаются. С домашней кухни мы выросли до собственной мастерской, но сохранили главное — любовь к деталям. Основательница бренда лично отбирает ягоды и цветы, чтобы каждый заказ был идеальным.
              </p>
            </div>
            <motion.div
              className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <WebpImage
                src="/images/about-founder.jpg"
                alt="Основательница KeyToHeart за работой"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* Почему клубника и цветы */}
      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] rounded-lg overflow-hidden shadow-lg order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <WebpImage
                src="/images/strawberry-flowers.jpg"
                alt="Клубника в шоколаде и цветы"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
            <div className="space-y-4 order-1 md:order-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                Почему клубника и цветы?
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Клубника в бельгийском шоколаде — это нежность и страсть. Цветы — это эстетика и свежесть. Вместе они создают магию, которая делает любой момент особенным.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Почему нам доверяют важные моменты */}
      <AnimatedSection animation="slideInUp">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 text-neutral-800">
              ПОЧЕМУ НАМ ДОВЕРЯЮТ ВАЖНЫЕ МОМЕНТЫ?
            </h2>
          </div>
          <WhyUsMarquee />
        </section>
      </AnimatedSection>

      {/* CTA-блок */}
      <AnimatedSection animation="slideInUp">
        <section className="container mx-auto px-4 py-12 md:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-black">
            KeyToHeart — эмоции, которые можно подарить
          </h2>
          <Link
            href="/catalog"
            className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center bg-white text-[#535353] transition-all duration-200 shadow-sm hover:bg-[#535353] hover:text-white active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
            onClick={() => {
              window.gtag?.('event', 'click_cta_footer', { event_category: 'CTA', event_label: 'Order Bouquet Footer' });
              window.ym?.(96644553, 'reachGoal', 'click_cta_footer');
            }}
          >
            Заказать букет
          </Link>
        </section>
      </AnimatedSection>
    </>
  );
}