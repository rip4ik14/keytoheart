// components/TopBar.tsx
'use client';

const baseTextItems = [
  '•Фото букета перед доставкой•',
  '•Доставка от 60 минут•',
  '•1000 бонусных рублей при первом заказе на сайте•',
  '•Кешбэк с каждого заказа до 15%•',
];

// Просто повторяем массив, чтобы лента всегда была длиннее любого экрана (7 раз обычно хватает)
const LONG_ITEMS = Array(7).fill(baseTextItems).flat();

export default function TopBar() {
  return (
    <div className="bg-black text-white overflow-hidden h-10 relative select-none">
      <div className="relative w-full h-full">
        <div
          className="absolute top-0 left-0 flex h-10"
          style={{
            width: 'max-content',
            minWidth: '220vw', // Всегда больше ширины экрана
            animation: `marquee-scroll 80s linear infinite`,
          }}
        >
          <div className="flex items-center whitespace-nowrap">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm">{text}</span>
            ))}
          </div>
          <div className="flex items-center whitespace-nowrap" aria-hidden="true">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-6 text-sm">{text}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
