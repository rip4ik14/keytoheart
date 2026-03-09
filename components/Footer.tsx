// ✅ Путь: components/Footer.tsx

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Star } from 'lucide-react';

import type { Category } from '@/types/category';
import FooterMetrics from '@components/FooterMetrics';

type FooterProps = {
  categories: Category[];
};

type MetricMeta = {
  event: string;
  metricKey?: string;
  metricValue?: string;
};

const FLOWWOW_URL = 'https://flowwow.com/shop/key-to-heart/';
const MARKETING_CONSENT_HREF = '/offer';

const serviceLinks = [
  { href: '/dostavka', label: 'Доставка', goal: 'footer_delivery_click' },
  { href: '/payment', label: 'Оплата', goal: 'footer_payment_click' },
  { href: '/faq', label: 'Часто задаваемые вопросы', goal: 'footer_faq_click' },
  { href: '/loyalty', label: 'Программа лояльности', goal: 'footer_loyalty_click' },
  { href: '/corporate', label: 'Корпоративным клиентам', goal: 'footer_corporate_click' },
];

const companyLinks = [
  { href: '/about', label: 'О нас', goal: 'footer_about_click' },
  { href: '/contacts', label: 'Контакты', goal: 'footer_contacts_click' },
  { href: '/news', label: 'Новости', goal: 'footer_news_click' },
  { href: '/articles', label: 'Статьи', goal: 'footer_articles_click' },
  { href: '/occasions', label: 'Праздники', goal: 'footer_occasions_click' },
];

const legalLinks = [
  { href: '/policy', label: 'Политика конфиденциальности', goal: 'policy_click' },
  { href: '/cookie-policy', label: 'Политика cookies', goal: 'cookie_policy_click' },
  { href: '/public-offer', label: 'Публичная оферта', goal: 'public_offer_click' },
  { href: MARKETING_CONSENT_HREF, label: 'Согласие на рекламную рассылку', goal: 'marketing_consent_click' },
  { href: '/terms', label: 'Пользовательское соглашение', goal: 'terms_click' },
];

function metricAttrs(meta?: MetricMeta) {
  if (!meta) return {};

  return {
    'data-kth-footer-event': meta.event,
    ...(meta.metricKey && meta.metricValue
      ? {
          'data-kth-footer-metric-key': meta.metricKey,
          'data-kth-footer-metric-value': meta.metricValue,
        }
      : {}),
  };
}

function FooterLink({
  href,
  label,
  goal,
  metricKey,
  metricValue,
  className,
}: {
  href: string;
  label: string;
  goal: string;
  metricKey?: string;
  metricValue?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        'text-[15px] leading-6 text-gray-600 transition hover:text-black hover:underline',
        className ?? 'block',
      ].join(' ')}
      {...metricAttrs({ event: goal, metricKey, metricValue })}
    >
      {label}
    </Link>
  );
}

function FooterExternalLink({
  href,
  label,
  className,
  children,
  event,
  metricKey,
  metricValue,
  ariaLabel,
}: {
  href: string;
  label: string;
  className: string;
  children: React.ReactNode;
  event: string;
  metricKey?: string;
  metricValue?: string;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel ?? label}
      title={label}
      {...metricAttrs({ event, metricKey, metricValue })}
    >
      {children}
    </a>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-[15px] font-semibold tracking-tight text-black">{children}</h3>;
}

function FlowwowFooterBadge() {
  return (
    <FooterExternalLink
      href={FLOWWOW_URL}
      label="Открыть отзывы на Flowwow"
      event="flowwow_click"
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-50"
      ariaLabel="Открыть отзывы на Flowwow"
    >
      <span className="font-semibold text-black">Flowwow</span>
      <span className="font-bold text-black">4,93</span>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current text-black" strokeWidth={0} />
        ))}
      </span>
      <span className="truncate text-gray-600">более 3000 оценок</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-600" />
    </FooterExternalLink>
  );
}

function FooterList({
  items,
  categoryMetric,
}: {
  items: Array<{ href: string; label: string; goal: string }>;
  categoryMetric?: boolean;
}) {
  return (
    <ul className="space-y-2" role="list">
      {items.map((item) => (
        <li key={item.href}>
          <FooterLink
            href={item.href}
            label={item.label}
            goal={item.goal}
            metricKey={categoryMetric ? 'category' : undefined}
            metricValue={categoryMetric ? item.label : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export default function Footer({ categories }: FooterProps) {
  const visibleCategories = categories.slice(0, 8).map((cat) => ({
    href: `/category/${cat.slug}`,
    label: cat.name,
    goal: 'footer_category_click',
  }));

  return (
    <footer data-site-footer="true" aria-label="Нижний колонтитул" className="mt-12 border-t border-gray-200 bg-white">
      <FooterMetrics />

      <div className="hidden lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-10 gap-y-10 px-6 py-12 xl:gap-x-14">
          <div className="col-span-12 xl:col-span-4">
            <h2 className="text-[28px] font-black uppercase tracking-[0.06em] text-black">КЛЮЧ К СЕРДЦУ</h2>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <FooterExternalLink
                href="https://vk.com/key_to_heart_store"
                label="ВКонтакте"
                event="vk_click"
                className="rounded-full border border-gray-200 p-2.5 transition hover:bg-gray-50"
                ariaLabel="Перейти в ВКонтакте"
              >
                <Image src="/icons/vk.svg" alt="ВКонтакте" width={18} height={18} />
              </FooterExternalLink>

              <FooterExternalLink
                href="https://wa.me/79886033821"
                label="WhatsApp"
                event="whatsapp_click"
                className="rounded-full border border-gray-200 p-2.5 transition hover:bg-gray-50"
                ariaLabel="Перейти в WhatsApp"
              >
                <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={18} height={18} />
              </FooterExternalLink>

              <FooterExternalLink
                href="https://t.me/keytomyheart"
                label="Telegram"
                event="telegram_click"
                className="rounded-full border border-gray-200 p-2.5 transition hover:bg-gray-50"
                ariaLabel="Перейти в Telegram"
              >
                <Image src="/icons/telegram.svg" alt="Telegram" width={18} height={18} />
              </FooterExternalLink>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <iframe
                src="https://yandex.ru/sprav/widget/rating-badge/81940019159?type=rating"
                width="150"
                height="50"
                frameBorder="0"
                title="Рейтинг Яндекс"
                loading="lazy"
              />
              <FlowwowFooterBadge />
            </div>

            <div className="mt-6 space-y-2 text-sm leading-6 text-gray-600">
              <p>ИП Рашевская Регина Сергеевна</p>
              <p>ИНН 234810526700, ОГРНИП 324237500032680</p>
              <p>Адрес: Краснодарский край, Северский район, пгт Ильский</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-black">
                <a
                  href="tel:+79886033821"
                  className="transition hover:text-gray-600"
                  aria-label="Позвонить"
                  {...metricAttrs({ event: 'footer_phone_click' })}
                >
                  +7 (988) 603-38-21
                </a>
                <span className="text-gray-300">•</span>
                <a
                  href="mailto:r.rashevskaya@yandex.ru"
                  className="transition hover:text-gray-600"
                  aria-label="Написать на email"
                  {...metricAttrs({ event: 'footer_email_click' })}
                >
                  r.rashevskaya@yandex.ru
                </a>
              </div>
            </div>
          </div>

          <div className="col-span-4 md:col-span-3 xl:col-span-2 xl:col-start-6">
            <SectionTitle>Каталог</SectionTitle>
            <FooterList
              items={[
                ...visibleCategories,
                { href: '/occasions', label: 'Праздники', goal: 'footer_occasions_click' },
              ]}
              categoryMetric
            />
          </div>

          <div className="col-span-4 md:col-span-3 xl:col-span-2">
            <SectionTitle>Сервис</SectionTitle>
            <FooterList items={serviceLinks} />
          </div>

          <div className="col-span-4 md:col-span-3 xl:col-span-2">
            <SectionTitle>Компания</SectionTitle>
            <FooterList items={companyLinks} />
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">© 2026 КЛЮЧ К СЕРДЦУ. Все права защищены.</p>

              <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2" aria-label="Юридические ссылки">
                {legalLinks.map((item) => (
                  <FooterLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    goal={item.goal}
                    className="inline-flex text-sm leading-6"
                  />
                ))}
              </nav>
            </div>

            <FooterExternalLink
              href="https://t.me/rip4inskiy"
              label="Telegram разработчика"
              event="footer_dev_telegram_click"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-500 transition hover:bg-gray-50"
              ariaLabel="Telegram разработчика"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path d="M21.998 3.911c-.019-.08-.051-.155-.09-.224-.025-.044-.052-.084-.087-.12-.059-.061-.131-.104-.212-.117-.063-.012-.13-.005-.193.017l-19 6.5c-.165.056-.276.216-.261.391.015.173.143.316.312.352l4.28.88 2.04 6.237c.042.128.157.218.293.229.015.001.03.002.045.002.127 0 .243-.075.292-.191l2.288-5.205 4.825 4.084c.093.078.223.093.328.038.104-.056.164-.168.151-.284l-.608-5.064 5.402-4.837c.073-.065.109-.169.089-.271z" />
              </svg>
              Связаться в Telegram
            </FooterExternalLink>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-[calc(8rem+env(safe-area-inset-bottom)+var(--kth-bottom-nav-h,0px))] lg:hidden">
        <div className="mx-auto max-w-[860px] rounded-[28px] border border-black/10 bg-white px-4 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-[0.06em] text-black">КЛЮЧ К СЕРДЦУ</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Клубника в шоколаде, цветы и комбо-наборы с доставкой по Краснодару.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <iframe
                src="https://yandex.ru/sprav/widget/rating-badge/81940019159?type=rating"
                width="150"
                height="50"
                frameBorder="0"
                title="Рейтинг Яндекс"
                loading="lazy"
              />
              <FlowwowFooterBadge />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <SectionTitle>Контакты</SectionTitle>
                <div className="space-y-2 text-sm text-gray-600">
                  <a href="tel:+79886033821" className="block text-black" {...metricAttrs({ event: 'footer_phone_click' })}>
                    +7 (988) 603-38-21
                  </a>
                  <a
                    href="mailto:r.rashevskaya@yandex.ru"
                    className="block break-all text-black"
                    {...metricAttrs({ event: 'footer_email_click' })}
                  >
                    r.rashevskaya@yandex.ru
                  </a>
                  <p>ИП Рашевская Регина Сергеевна</p>
                </div>
              </div>

              <div>
                <SectionTitle>Ссылки</SectionTitle>
                <ul className="space-y-2" role="list">
                  {[...serviceLinks.slice(0, 3), ...companyLinks.slice(0, 2)].map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href} label={item.label} goal={item.goal} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2" role="list">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} goal={item.goal} />
                </li>
              ))}
            </ul>

            <div className="text-xs text-gray-400">© 2026 КЛЮЧ К СЕРДЦУ</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
