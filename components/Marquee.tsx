"use client";

export default function Marquee() {
  const text = "Фото букета перед доставкой • Доставка от 2ч • Гарантия на цветы 3 дня • Кешбэк с каждого заказа до 15% •";

  return (
    <div className="bg-black text-white overflow-hidden whitespace-nowrap text-sm">
      <div className="marquee-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
