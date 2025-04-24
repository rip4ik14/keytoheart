import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f9f9f9] text-sm text-gray-700 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* 1. Бренд */}
        <div>
          <h3 className="text-xl font-bold mb-3">KeyToHeart</h3>
          <p className="mb-1">Красиво. Режим работы: 8:00 - 22:00</p>
          <p className="mb-1">+7 (988) 693-39-21</p>
          <p className="text-xs text-gray-400 mt-4">
            &copy; 2025 KeyToHeart. Все права защищены.
          </p>
        </div>

        {/* 2. Каталог */}
        <div>
          <h4 className="text-base font-semibold mb-3">Каталог</h4>
          <ul className="space-y-1">
            <li><Link href="/category/klubnichnye-bukety" className="hover:underline">Клубничные букеты</Link></li>
            <li><Link href="/category/klubnichnye-boksy" className="hover:underline">Клубничные боксы</Link></li>
            <li><Link href="/category/flowers" className="hover:underline">Цветы</Link></li>
            <li><Link href="/category/combo" className="hover:underline">Комбо-наборы</Link></li>
            <li><Link href="/category/premium" className="hover:underline">Premium</Link></li>
            <li><Link href="/category/baskets" className="hover:underline">Корзинки</Link></li>
            <li><Link href="/category/povod" className="hover:underline">Повод</Link></li>
            <li><Link href="/category/podarki" className="hover:underline">Подарки</Link></li>
          </ul>
        </div>

        {/* 3. Сервис */}
        <div>
          <h4 className="text-base font-semibold mb-3">Сервис</h4>
          <ul className="space-y-1">
            <li><Link href="/delivery" className="hover:underline">Доставка</Link></li>
            <li><Link href="/corporate" className="hover:underline">Корпоративным клиентам</Link></li>
            <li><Link href="/faq" className="hover:underline">Часто задаваемые вопросы</Link></li>
            <li><Link href="/payment" className="hover:underline">Оплата</Link></li>
            <li><Link href="/returns" className="hover:underline">Возврат</Link></li>
            <li><Link href="/loyalty" className="hover:underline">Программа лояльности</Link></li>
          </ul>
        </div>

        {/* 4. Компания */}
        <div>
          <h4 className="text-base font-semibold mb-3">Компания</h4>
          <ul className="space-y-1">
            <li><Link href="/about" className="hover:underline">О нас</Link></li>
            <li><Link href="/video" className="hover:underline">Видео</Link></li>
            <li><Link href="/contacts" className="hover:underline">Контакты</Link></li>
            <li><Link href="/news" className="hover:underline">Новости</Link></li>
            <li><Link href="/articles" className="hover:underline">Статьи</Link></li>
            <li><Link href="/holidays" className="hover:underline">Праздники</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
