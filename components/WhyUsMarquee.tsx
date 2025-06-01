'use client';

import MarqueeText from './marquee/MarqueeText';
import MarqueeCards from './marquee/MarqueeCards';
import WhyUsCard from './WhyUsCard';
import { whyUsData } from './whyUsData';

export default function WhyUsMarquee() {
  // Проверяем, что whyUsData существует и не пустой
  const data = whyUsData && Array.isArray(whyUsData) && whyUsData.length > 0 ? whyUsData : [];

  return (
    <section className="relative py-16 bg-white overflow-x-hidden w-full select-none no-scrollbar">
  {/* Верхняя бегущая строка */}
  <MarqueeText
    text="SWEET FEELING SWEET FEELING SWEET FEELING"
    fontSize="text-[20vw] sm:text-[18vw] md:text-[14vw] lg:text-[12vw]" // Мобильный размер чуть меньше, десктоп как было
    opacity="opacity-70"
    duration={40}
    direction="left"
    className="
      absolute left-0 w-full
      top-[6vw] sm:top-[5vw] md:top-[-5%]  // На мобилках ниже, на десктопе как было
      pointer-events-none z-0
    "
    colorClass="text-[#f5f5f5] font-bold"
  />

  {/* Нижняя бегущая строка */}
  <MarqueeText
    text="FEELING SWEET FEELING SWEET FEELING"
    fontSize="text-[20vw] sm:text-[18vw] md:text-[14vw] lg:text-[12vw]"
    opacity="opacity-70"
    duration={60}
    direction="right"
    className="
      absolute left-0 w-full
      bottom-[4vw] sm:bottom-[3vw] md:bottom-auto md:top-[55%] // На мобилках - bottom, на десктопе top-55%
      pointer-events-none z-0
    "
    colorClass="text-[#f5f5f5] font-bold"
  />

  <div className="relative z-10">
    <MarqueeCards duration={16}>
      {data.map((item, idx) => (
        <WhyUsCard key={idx} item={item} idx={idx} />
      ))}
    </MarqueeCards>
  </div>
</section>
  );
}