'use client';

import Image from 'next/image';
import Link from 'next/link';
import MarqueeText from '@components/MarqueeText';

export default function PromoFooterBlock() {
  return (
    <section className="relative w-full border-t border-[#eaeaea] bg-white overflow-hidden">
      {/* Бегущая строка */}
      <div className="pointer-events-none select-none absolute left-0 right-0 bottom-0 z-0 flex items-end h-full">
        <MarqueeText
  text="Ключик к сердцу Ключик к сердцу Ключик к сердцу "
  speed={80}
  className="
    font-marquee text-marquee text-outline
    w-full
    text-[80px] sm:text-[150px] md:text-[308px] 2xl:text-[392px]
    font-black
    leading-[0.8]
    whitespace-nowrap
    tracking-tight
  "
/>

      </div>
      {/* Контент секции */}
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
            >
              Программа лояльности
            </Link>
            <Link
              href="/corporate"
              className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white active:scale-[.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
            >
              Для юрлиц
            </Link>
          </div>
          <div className="w-full max-w-[300px] sm:max-w-[340px] aspect-square rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-sm border border-[#ececec] bg-white">
            <Image
              src="/images/promo-loyalty.jpg"
              alt="Программа лояльности"
              width={340}
              height={340}
              className="object-cover w-full h-full"
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
            >
              VK
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full max-w-[300px] sm:max-w-[340px]">
            <div className="w-full aspect-square max-w-[140px] sm:max-w-[155px] rounded-[16px] sm:rounded-[22px] overflow-hidden border border-[#ececec] bg-white">
              <Image
                src="/images/promo-insta-1.jpg"
                alt="Insta 1"
                width={155}
                height={155}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-full aspect-square max-w-[140px] sm:max-w-[155px] rounded-[16px] sm:rounded-[22px] overflow-hidden border border-[#ececec] bg-white">
              <Image
                src="/images/promo-insta-2.jpg"
                alt="Insta 2"
                width={155}
                height={155}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-full aspect-square max-w-[140px] sm:max-w-[155px] rounded-[16px] sm:rounded-[22px] overflow-hidden border border-[#ececec] bg-white">
              <Image
                src="/images/promo-insta-3.jpg"
                alt="Insta 3"
                width={155}
                height={155}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-full aspect-square max-w-[140px] sm:max-w-[155px] rounded-[16px] sm:rounded-[22px] overflow-hidden border border-[#ececec] bg-white">
              <Image
                src="/images/promo-insta-4.jpg"
                alt="Insta 4"
                width={155}
                height={155}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
