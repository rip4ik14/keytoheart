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
  {/* Верхняя бегущая строка — ещё выше */}
  <MarqueeText
    text="SWEET FEELING SWEET FEELING SWEET FEELING"
    fontSize="text-[14vw]"
    opacity="opacity-90"
    duration={80}
    direction="left"
    className="absolute left-0 w-full top-[-5%] -translate-y-1/2 pointer-events-none z-0"
    colorClass="text-[#f5f5f5] font-bold"
  />
  {/* Нижняя бегущая строка */}
  <MarqueeText
    text="FEELING SWEET FEELING SWEET FEELING"
    fontSize="text-[14vw]"
    opacity="opacity-90"
    duration={100}
    direction="right"
    className="absolute left-0 w-full top-[55%] -translate-y-1/2 pointer-events-none z-0"
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