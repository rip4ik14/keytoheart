'use client';

const baseTextItems = [
  '•Фото букета перед доставкой•',
  '•Доставка от 30 минут•',
  '•1000 бонусных рублей при первом заказе на сайте•',
  '•Кешбэк с каждого заказа до 15%•',
];

const LONG_ITEMS = Array(7).fill(baseTextItems).flat();

export default function TopBar() {
  return (
    <div className="bg-white text-black sm:bg-black sm:text-white overflow-hidden h-10 relative select-none topbar-fade">
      <div className="relative w-full h-full">
        <div
          className="absolute top-0 left-0 flex h-10 items-center"
          style={{
            width: 'max-content',
            minWidth: '220vw',
            animation: `marquee-scroll 80s linear infinite`,
            willChange: 'transform',
          }}
        >
          <div className="flex items-center whitespace-nowrap">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm font-medium">
                {text}
              </span>
            ))}
          </div>

          <div className="flex items-center whitespace-nowrap" aria-hidden="true">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm font-medium">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}