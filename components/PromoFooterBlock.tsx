'use client';

import Image from 'next/image';
import WebpImage from './WebpImage';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PromoFooterBlock() {
  // Увеличиваем количество повторений текста для плавного цикла
  const marqueeText = 'КЛЮЧИК К СЕРДЦУ КЛЮЧИК К СЕРДЦУ КЛЮЧИК К СЕРДЦУ КЛЮЧИК К СЕРДЦУ КЛЮЧИК К СЕРДЦУ КЛЮЧИК К СЕРДЦУ ';

  return (
    <section className="relative w-full border-t border-[#eaeaea] bg-white overflow-hidden">
      {/* ——— Бегущая серая строка ——— */}
      <motion.div
        className="pointer-events-none select-none absolute left-0 right-0 bottom-0 z-0 flex w-max"
        initial={{ x: 0 }}
        animate={{ x: -1500 * 2 }} // Увеличиваем дистанцию для плавного цикла
        transition={{ repeat: Infinity, duration: 150, ease: 'linear' }} // Увеличиваем длительность для плавности
      >
        <span
          className="
            font-marquee text-marquee text-gray-200 opacity-30
            whitespace-nowrap
            font-black uppercase
            tracking-tight
            leading-none
            text-[60px] sm:text-[100px] md:text-[200px] 2xl:text-[250px]
          "
          aria-hidden="true"
        >
          {marqueeText}
        </span>
        <span
          className="
            font-marquee text-marquee text-gray-200 opacity-30
            whitespace-nowrap
            font-black uppercase
            tracking-tight
            leading-none
            text-[60px] sm:text-[100px] md:text-[200px] 2xl:text-[250px]
          "
          aria-hidden="true"
        >
          {marqueeText}
        </span>
      </motion.div>

      {/* ——— Контент секции ——— */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row py-8 sm:py-12 lg:py-16 gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Левая колонка */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start md:pr-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight mb-3 text-[#535353]">
            С нами выгодно
          </h2>
          <p className="text-sm sm:text-base text-[#535353] mb-5 text-center md:text-left leading-snug">
            Бонусная программа лояльности для всех покупателей!<br />
            Скидки и специальные условия для корпоративных клиентов
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 w-full mb-6 justify-center md:justify-start">
            <Link
              href="/loyalty"
              className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white active:scale-[.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
              onClick={() => {
                window.gtag?.('event', 'click_loyalty_link', { event_category: 'PromoFooter', event_label: 'Loyalty Program' });
                window.ym?.(12345678, 'reachGoal', 'click_loyalty_link');
              }}
            >
              Программа лояльности
            </Link>
            <Link
              href="/corporate"
              className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white active:scale-[.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
              onClick={() => {
                window.gtag?.('event', 'click_corporate_link', { event_category: 'PromoFooter', event_label: 'Corporate Clients' });
                window.ym?.(12345678, 'reachGoal', 'click_corporate_link');
              }}
            >
              Для юрлиц
            </Link>
          </div>
          <div className="w-full max-w-[300px] sm:max-w-[340px] aspect-square rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-sm border border-[#ececec] bg-white">
            <WebpImage
              src="/images/promo-loyalty.jpg"
              alt="Программа лояльности KeyToHeart"
              width={340}
              height={340}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
        {/* Вертикальная линия на десктопе */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 border-r border-[#eaeaea] w-[1px] transform -translate-x-1/2" />
        {/* Правая колонка */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start md:pl-6 mt-6 md:mt-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight mb-3 text-[#535353]">
            Наши соцсети
          </h2>
          <p className="text-sm sm:text-base text-[#535353] mb-5 text-center md:text-left leading-snug">
            Подписывайтесь, чтобы узнавать о самых выгодных акциях и предложениях первыми!
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 w-full mb-6 justify-center md:justify-start">
            <a
              href="https://www.instagram.com/key_to_heart_store?igshid=YmMyMTA2M2Y%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#bdbdbd] bg-[#535353] text-white rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                transition-all duration-200 shadow-sm
                hover:bg-[#222] hover:text-white active:scale-[.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
              onClick={() => {
                window.gtag?.('event', 'click_instagram_link', { event_category: 'PromoFooter', event_label: 'Instagram' });
                window.ym?.(12345678, 'reachGoal', 'click_instagram_link');
              }}
            >
              @Keytoheart
            </a>
            <a
              href="https://vk.com/key_to_heart_store"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white active:scale-[.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
              onClick={() => {
                window.gtag?.('event', 'click_vk_link', { event_category: 'PromoFooter', event_label: 'VK' });
                window.ym?.(12345678, 'reachGoal', 'click_vk_link');
              }}
            >
              VK
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full max-w-[300px] sm:max-w-[340px]">
            {['promo-insta-1.jpg', 'promo-insta-2.jpg', 'promo-insta-3.jpg', 'promo-insta-4.jpg'].map((file, i) => (
              <div key={i} className="w-full aspect-square max-w-[140px] sm:max-w-[155px] rounded-[16px] sm:rounded-[22px] overflow-hidden border border-[#ececec] bg-white">
                <WebpImage
                  src={`/images/${file}`}
                  alt={`Instagram пост KeyToHeart ${i + 1}`}
                  width={155}
                  height={155}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}