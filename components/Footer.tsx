'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@utils/useCategories';

export default function Footer() {
  const categories = useCategories();

  return (
    <footer
      className="bg-white text-sm text-gray-700 mt-12 border-t border-gray-200"
      aria-label="Нижний колонтитул"
    >
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Логотип и социальные сети */}
        <div>
          <h3 className="text-xl font-bold mb-3">KeyToHeart</h3>
          <div className="flex gap-3 mb-4">
            <a
              href="https://vk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border rounded-full hover:bg-gray-100 transition-colors duration-300"
              aria-label="Перейти в ВКонтакте"
              onClick={() => {
                window.gtag?.('event', 'vk_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'vk_click');
              }}
            >
              <Image src="/icons/vk.svg" alt="ВКонтакте" width={16} height={16} />
            </a>
            <a
              href="https://wa.me/79886033821"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border rounded-full hover:bg-gray-100 transition-colors duration-300"
              aria-label="Перейти в WhatsApp"
              onClick={() => {
                window.gtag?.('event', 'whatsapp_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'whatsapp_click');
              }}
            >
              <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
            </a>
            <a
              href="https://t.me/keytomyheart"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border rounded-full hover:bg-gray-100 transition-colors duration-300"
              aria-label="Перейти в Telegram"
              onClick={() => {
                window.gtag?.('event', 'telegram_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'telegram_click');
              }}
            >
              <Image src="/icons/telegram.svg" alt="Telegram" width={16} height={16} />
            </a>
          </div>
          <a
            href="https://yandex.ru/maps/org/klyuch_k_serdtsu/41599607553/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-gray-500 hover:underline"
            aria-label="Рейтинг на Яндекс.Картах"
            onClick={() => {
              window.gtag?.('event', 'yandex_maps_click', { event_category: 'footer' });
              window.ym?.(12345678, 'reachGoal', 'yandex_maps_click');
            }}
          >
            Рейтинг на Яндекс.Картах
          </a>
          <p className="text-xs text-gray-400 mt-4">© 2025 KeyToHeart. Все права защищены.</p>
          <div className="mt-2 space-y-1">
            <Link
              href="/policy"
              className="hover:underline block text-gray-500"
              onClick={() => {
                window.gtag?.('event', 'policy_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'policy_click');
              }}
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/offer"
              className="hover:underline block text-gray-500"
              onClick={() => {
                window.gtag?.('event', 'offer_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'offer_click');
              }}
            >
              Публичная оферта
            </Link>
            <Link
              href="/terms"
              className="hover:underline block text-gray-500"
              onClick={() => {
                window.gtag?.('event', 'terms_click', { event_category: 'footer' });
                window.ym?.(12345678, 'reachGoal', 'terms_click');
              }}
            >
              Пользовательское соглашение
            </Link>
          </div>
        </div>

        {/* Каталог */}
        <div>
          <h4 className="text-base font-semibold mb-3">Каталог</h4>
          <ul className="space-y-1" role="list">
            {categories.map((cat) => (
              <li key={cat.id} role="listitem">
                <Link
                  href={`/category/${cat.slug}`}
                  className="hover:underline text-gray-500"
                  onClick={() => {
                    window.gtag?.('event', 'footer_category_click', {
                      event_category: 'footer',
                      category: cat.name,
                    });
                    window.ym?.(12345678, 'reachGoal', 'footer_category_click', {
                      category: cat.name,
                    });
                  }}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li role="listitem">
              <Link
                href="/occasions"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_occasions_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_occasions_click');
                }}
              >
                Праздники
              </Link>
            </li>
          </ul>
        </div>

        {/* Сервис */}
        <div>
          <h4 className="text-base font-semibold mb-3">Сервис</h4>
          <ul className="space-y-1" role="list">
            <li role="listitem">
              <Link
                href="/dostavka"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_delivery_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_delivery_click');
                }}
              >
                Доставка
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/corporate"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_corporate_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_corporate_click');
                }}
              >
                Корпоративным клиентам
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/faq"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_faq_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_faq_click');
                }}
              >
                Часто задаваемые вопросы
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/payment"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_payment_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_payment_click');
                }}
              >
                Оплата
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/loyalty"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_loyalty_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_loyalty_click');
                }}
              >
                Программа лояльности
              </Link>
            </li>
          </ul>
        </div>

        {/* Компания */}
        <div>
          <h4 className="text-base font-semibold mb-3">Компания</h4>
          <ul className="space-y-1" role="list">
            <li role="listitem">
              <Link
                href="/about"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_about_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_about_click');
                }}
              >
                О нас
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/contacts"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_contacts_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_contacts_click');
                }}
              >
                Контакты
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/news"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_news_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_news_click');
                }}
              >
                Новости
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/articles"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_articles_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_articles_click');
                }}
              >
                Статьи
              </Link>
            </li>
            <li role="listitem">
              <Link
                href="/occasions"
                className="hover:underline text-gray-500"
                onClick={() => {
                  window.gtag?.('event', 'footer_occasions_click', { event_category: 'footer' });
                  window.ym?.(12345678, 'reachGoal', 'footer_occasions_click');
                }}
              >
                Праздники
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}