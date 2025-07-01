'use client';

export default function StoreInfoSection() {
  return (
    <section
      role="region"
      aria-label="О магазине"
      className="mx-auto mt-8 mb-12 max-w-5xl px-4 text-[15px] leading-6 text-gray-700"
    >
      <h2 className="mb-2 text-lg font-semibold">Почему выбирают KEY TO HEART?</h2>
      <p className="mb-3">
        Мы создаём клубничные букеты из свежайшей ягоды и бельгийского шоколада, а также цветочные
        шедевры и подарочные наборы. Доставка по Краснодару и до 20 км вокруг — от 60 минут!
      </p>
      <p className="mb-3">
        Фото готового заказа присылаем перед доставкой. Работаем с 8:00 до 22:00, бережно
        упаковываем — от мини-букета до корпоративного подарка.
      </p>
      <h3 className="mb-1 font-medium">Популярные поводы</h3>
      <ul className="list-disc pl-6">
        <li>8 Марта и 14 Февраля</li>
        <li>День рождения и юбилей</li>
        <li>Годовщина и свадьба</li>
        <li>Выписка из роддома</li>
        <li>День учителя и День матери</li>
        <li>Корпоративы и Новый год</li>
      </ul>
    </section>
  );
}
