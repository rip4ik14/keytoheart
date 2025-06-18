'use client';

export default function TopBar() {
  const textItems = [
    '•Фото букета перед доставкой•',
    '•Доставка от 60 минут•',
    '•1000 бонусных рублей при первом заказе на сайте•',
    '•Кешбэк с каждого заказа до 15%•',
  ];

  return (
    <nav className="bg-black text-white overflow-hidden" aria-label="Информационная панель">
      <div className="max-w-5xl mx-auto px-1 py-2">
        <div
          className="animate-marquee flex w-max whitespace-nowrap text-sm"
          aria-roledescription="marquee"
        >
          {textItems.map((text, idx) => (
            <span
              key={idx}
              className="mx-6"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}