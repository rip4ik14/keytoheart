// ✅ Путь: components/TopBar.tsx
'use client';

export default function TopBar() {
  const textItems = [
    '• Фото букета перед доставкой •',
    '• Доставка от 2ч •',
    '• Гарантия на цветы 3 дня •',
    '• Кешбэк с каждого заказа до 15% •',
  ];

  return (
    <div className="bg-black text-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-1">
        <div className="relative">
          <div
            className="animate-marquee flex w-max whitespace-nowrap text-sm py-2"
            role="marquee"
            aria-label="Информационная панель"
          >
            {[...Array(30)].flatMap((_, i) =>
              textItems.map((text, idx) => (
                <span key={`${i}-${idx}`} className="mx-6">
                  {text}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}