// ✅ Путь: components/TopBar.tsx
'use client';

export default function TopBar() {
  const textItems = [
    '• Фото букета перед доставкой •',
    '• Доставка от 2ч •',
    '•  Клубника в шоколаде и авторские букеты •',
    '• Кешбэк с каждого заказа до 15% •',
  ];

  return (
    <div className="bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          <div
            className="animate-marquee flex w-max whitespace-nowrap text-sm py-1"
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