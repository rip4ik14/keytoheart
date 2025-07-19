'use client';

import { useRef, useEffect, useState } from 'react';

const baseTextItems = [
  '•Фото букета перед доставкой•',
  '•Доставка от 60 минут•',
  '•1000 бонусных рублей при первом заказе на сайте•',
  '•Кешбэк с каждого заказа до 15%•',
];

function getRepeatCount(itemCount: number, containerWidth: number, avgItemWidth = 220) {
  // avgItemWidth — средняя ширина одной фразы (регулируй по желанию)
  const minMarqueeLength = containerWidth * 2.2; // пусть лента будет в 2.2 раза длиннее экрана
  const totalBaseLength = itemCount * avgItemWidth;
  return Math.max(2, Math.ceil(minMarqueeLength / totalBaseLength));
}

export default function TopBar() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [repeat, setRepeat] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const containerWidth = window.innerWidth;
      setRepeat(getRepeatCount(baseTextItems.length, containerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Повторяем массив, чтобы лента была длиннее ширины окна (и не было склеек)
  const textItems = Array(repeat).fill(baseTextItems).flat();

  useEffect(() => {
    if (marqueeRef.current) {
      setWidth(marqueeRef.current.scrollWidth);
    }
  }, [textItems]);

  return (
    <div className="bg-black text-white overflow-hidden h-10 relative select-none">
      <div className="relative w-full h-full">
        <div
          className="absolute top-0 left-0 flex h-10"
          style={{
            width: width ? width * 2 : '100%',
            animation: width
              ? `marquee-scroll ${Math.max(12, width / 100)}s linear infinite`
              : 'none',
          }}
        >
          <div ref={marqueeRef} className="flex items-center whitespace-nowrap">
            {textItems.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm">{text}</span>
            ))}
          </div>
          <div className="flex items-center whitespace-nowrap" aria-hidden="true">
            {textItems.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm">{text}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
