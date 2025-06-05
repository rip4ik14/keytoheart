'use client';

import Image from 'next/image';
import WebpImage from './WebpImage';

export default function WhyUsCard({
  item,
  idx,
}: {
  item: { image: string; title: string; description: string };
  idx: number;
}) {
  // Для шахматки
  const marginClass = idx % 2 === 0 ? 'mt-0' : 'mt-12 md:mt-24';

  return (
    <div
      className={`
        relative min-w-[320px] max-w-[370px] h-[390px] rounded-2xl overflow-hidden shadow-xl bg-white/90 flex-shrink-0
        transition-all duration-300 ${marginClass}
      `}
    >
       <WebpImage
        src={item.image}
        alt={item.title}
        fill
        className="object-cover"
        quality={85}
        draggable={false}
        priority={idx < 5}
        sizes="(max-width: 768px) 100vw, 370px"
      />
      <div className="absolute bottom-0 left-0 w-full h-[55%] bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full z-20 p-6 flex flex-col justify-end">
        <div className="text-white text-xl font-semibold mb-2 drop-shadow">
          {item.title}
        </div>
        <div className="text-white text-sm font-normal opacity-90 leading-snug drop-shadow">
          {item.description}
        </div>
      </div>
    </div>
  );
}
