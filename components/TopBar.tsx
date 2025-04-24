"use client";

export default function TopBar() {
  const textItems = [
    "• Фото букета перед доставкой•",
    "• Доставка от 2ч •",
    "• Гарантия на цветы 3 дня •",
    "• Кешбэк с каждого заказа до 15% •",
  ];

  return (
    <div className="bg-black text-white text-sm overflow-hidden whitespace-nowrap">
      <div className="relative w-full">
        <div className="animate-marquee flex w-max">
          {/* дублируем список 50 раз */}
          {[...Array(50)].flatMap((_, i) =>
            textItems.map((text, idx) => (
              <span key={`${i}-${idx}`} className="mx-6">
                {text}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
