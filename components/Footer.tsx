// ✅ Путь: components/Footer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types/category';
type FooterProps = {
  categories: Category[];
};
export default function Footer({ categories }: FooterProps) {

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
                window.ym?.(96644553, 'reachGoal', 'vk_click');
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
                window.ym?.(96644553, 'reachGoal', 'whatsapp_click');
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
                window.ym?.(96644553, 'reachGoal', 'telegram_click');
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
              window.ym?.(96644553, 'reachGoal', 'yandex_maps_click');
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
                window.ym?.(96644553, 'reachGoal', 'policy_click');
              }}
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/offer"
              className="hover:underline block text-gray-500"
              onClick={() => {
                window.gtag?.('event', 'offer_click', { event_category: 'footer' });
                window.ym?.(96644553, 'reachGoal', 'offer_click');
              }}
            >
              Публичная оферта
            </Link>
            <Link
              href="/terms"
              className="hover:underline block text-gray-500"
              onClick={() => {
                window.gtag?.('event', 'terms_click', { event_category: 'footer' });
                window.ym?.(96644553, 'reachGoal', 'terms_click');
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
                    window.ym?.(96644553, 'reachGoal', 'footer_category_click', {
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
                  window.ym?.(96644553, 'reachGoal', 'footer_occasions_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_delivery_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_corporate_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_faq_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_payment_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_loyalty_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_about_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_contacts_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_news_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_articles_click');
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
                  window.ym?.(96644553, 'reachGoal', 'footer_occasions_click');
                }}
              >
                Праздники
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* СЕРЫЙ блок о разработчике */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-gray-400 font-mono">
            Разработчик: Рыбалко Денис
          </span>
          <a
            href="https://t.me/rip4inskiy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-full text-xs text-gray-500 hover:bg-gray-100 font-mono transition"
            aria-label="Telegram разработчика"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              className="w-4 h-4" stroke="currentColor" strokeWidth={1.7}>
              <path d="M21.998 3.911c-.019-.08-.051-.155-.09-.224-.025-.044-.052-.084-.087-.12-.059-.061-.131-.104-.212-.117-.063-.012-.13-.005-.193.017l-19 6.5c-.165.056-.276.216-.261.391.015.173.143.316.312.352l4.28.88 2.04 6.237c.042.128.157.218.293.229.015.001.03.002.045.002.127 0 .243-.075.292-.191l2.288-5.205 4.825 4.084c.093.078.223.093.328.038.104-.056.164-.168.151-.284l-.608-5.064 5.402-4.837c.073-.065.109-.169.089-.271zm-8.735 8.735l-.804 1.83-1.232-3.771 2.036 1.941zm2.086-4.429l-2.852 2.555c-.076.069-.111.179-.087.284l.743 3.124-2.424-2.311-1.392-4.227 6.012-2.059c-.024.021-.049.041-.072.065zm.492.638l-1.504 1.347 2.024 1.712-1.524-3.059zm-6.427 5.001l-1.653-5.061 2.742 3.24-1.089 1.821zm9.048-6.839l-4.329 3.876c-.066.059-.093.153-.067.238l.547 1.808-3.31-3.156 7.159-2.453zm1.663-2.021c-.007-.023-.02-.044-.038-.06-.019-.017-.044-.027-.07-.029-.024-.002-.048.004-.068.017l-16.329 5.598c-.029.011-.052.036-.061.067-.009.032.002.066.026.089.02.019.048.029.076.026l3.884-.773 2.025 6.194c.012.036.045.062.083.065.038.003.074-.021.089-.057l2.332-5.303 4.953 4.193c.027.023.067.028.099.012.033-.017.049-.054.042-.089l-.63-5.242 5.559-4.98c.03-.026.041-.068.027-.106z" />
            </svg>
            Связаться в Telegram
          </a>
        </div>
      </div>
    </footer>
  );
}
