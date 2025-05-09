'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

// Данные site_pages (вставляем предоставленные данные напрямую)
const sitePages = [
  {
    id: 119,
    label: "Клубничные букеты",
    href: "/category/klubnichnye-bukety",
    order_index: 1,
  },
  {
    id: 120,
    label: "Клубничные боксы",
    href: "/category/klubnichnye-boksy",
    order_index: 2,
  },
  {
    id: 121,
    label: "Цветы",
    href: "/category/flowers",
    order_index: 3,
  },
  {
    id: 122,
    label: "Комбо-наборы",
    href: "/category/combo",
    order_index: 4,
  },
  {
    id: 123,
    label: "Premium",
    href: "/category/premium",
    order_index: 5,
  },
  {
    id: 124,
    label: "Коллекции",
    href: "/category/kollekcii",
    order_index: 6,
  },
  {
    id: 125,
    label: "Повод",
    href: "/category/povod",
    order_index: 7,
  },
  {
    id: 126,
    label: "Подарки",
    href: "/category/podarki",
    order_index: 8,
  },
  {
    id: 127,
    label: "Наборы с клубникой",
    href: "/category/klubnichnye-bukety/club-nabory",
    order_index: 9,
  },
  {
    id: 128,
    label: "Букеты в шляпной коробке",
    href: "/category/klubnichnye-bukety/club-box",
    order_index: 10,
  },
  {
    id: 129,
    label: "Шоколадные боксы",
    href: "/category/klubnichnye-boksy/shoko-boxes",
    order_index: 11,
  },
  {
    id: 130,
    label: "Подарочные боксы",
    href: "/category/klubnichnye-boksy/gift-boxes",
    order_index: 12,
  },
  {
    id: 131,
    label: "Розы",
    href: "/category/flowers/roses",
    order_index: 13,
  },
  {
    id: 132,
    label: "Авторские букеты",
    href: "/category/flowers/author-bouquets",
    order_index: 14,
  },
  {
    id: 133,
    label: "Монобукеты",
    href: "/category/flowers/mono-bouquets",
    order_index: 15,
  },
  {
    id: 134,
    label: "Свадебные букеты",
    href: "/category/flowers/wedding-bouquets",
    order_index: 16,
  },
  {
    id: 135,
    label: "Пасха",
    href: "/category/kollekcii/pasha",
    order_index: 17,
  },
  {
    id: 136,
    label: "VESNA",
    href: "/category/kollekcii/vesna",
    order_index: 18,
  },
  {
    id: 137,
    label: "Arabia",
    href: "/category/kollekcii/arabia",
    order_index: 19,
  },
  {
    id: 138,
    label: "Детская коллекция",
    href: "/category/kollekcii/kids",
    order_index: 20,
  },
  {
    id: 139,
    label: "Мужская коллекция",
    href: "/category/kollekcii/men",
    order_index: 21,
  },
  {
    id: 140,
    label: "Маме",
    href: "/category/povod/mame",
    order_index: 22,
  },
  {
    id: 141,
    label: "Любимой",
    href: "/category/povod/lubimoi",
    order_index: 23,
  },
  {
    id: 142,
    label: "Мужчине",
    href: "/category/povod/muzhchine",
    order_index: 24,
  },
  {
    id: 143,
    label: "Коллеге",
    href: "/category/povod/kollege",
    order_index: 25,
  },
  {
    id: 144,
    label: "Детям",
    href: "/category/povod/detyam",
    order_index: 26,
  },
  {
    id: 145,
    label: "Учителю",
    href: "/category/povod/uchitelyu",
    order_index: 27,
  },
  {
    id: 146,
    label: "День рождения",
    href: "/category/povod/bday",
    order_index: 28,
  },
  {
    id: 147,
    label: "Свадьба",
    href: "/category/povod/wedding",
    order_index: 29,
  },
  {
    id: 148,
    label: "Рождение ребенка",
    href: "/category/povod/birth",
    order_index: 30,
  },
  {
    id: 149,
    label: "Выпускной",
    href: "/category/povod/vipusknoi",
    order_index: 31,
  },
  {
    id: 150,
    label: "Последний звонок",
    href: "/category/povod/final-bell",
    order_index: 32,
  },
  {
    id: 151,
    label: "Годовщина",
    href: "/category/povod/anniversary",
    order_index: 33,
  },
  {
    id: 152,
    label: "День учителя",
    href: "/category/povod/teachers-day",
    order_index: 34,
  },
  {
    id: 153,
    label: "14 февраля",
    href: "/category/povod/feb14",
    order_index: 35,
  },
  {
    id: 154,
    label: "8 марта",
    href: "/category/povod/march8",
    order_index: 36,
  },
  {
    id: 155,
    label: "День матери",
    href: "/category/povod/mothers-day",
    order_index: 37,
  },
  {
    id: 156,
    label: "Новый год",
    href: "/category/povod/new-year",
    order_index: 38,
  },
  {
    id: 157,
    label: "23 февраля",
    href: "/category/povod/feb23",
    order_index: 39,
  },
  {
    id: 158,
    label: "1 сентября",
    href: "/category/povod/sep1",
    order_index: 40,
  },
  {
    id: 159,
    label: "День семьи",
    href: "/category/povod/family-day",
    order_index: 41,
  },
  {
    id: 160,
    label: "Наборы",
    href: "/category/podarki/gifts-nabori",
    order_index: 42,
  },
  {
    id: 161,
    label: "Открытки",
    href: "/category/podarki/cards",
    order_index: 43,
  },
  {
    id: 162,
    label: "Уход за цветами",
    href: "/category/podarki/care",
    order_index: 44,
  },
  {
    id: 163,
    label: "Шары",
    href: "/category/podarki/balloons",
    order_index: 45,
  },
  {
    id: 164,
    label: "О нас",
    href: "/about",
    order_index: 46,
  },
  {
    id: 165,
    label: "Доставка",
    href: "/delivery",
    order_index: 47,
  },
  {
    id: 166,
    label: "Часто задаваемые вопросы",
    href: "/faq",
    order_index: 48,
  },
  {
    id: 167,
    label: "Оплата",
    href: "/payment",
    order_index: 49,
  },
  {
    id: 168,
    label: "Программа лояльности",
    href: "/loyalty",
    order_index: 50,
  },
  {
    id: 169,
    label: "Корпоративным клиентам",
    href: "/corporate",
    order_index: 51,
  },
  {
    id: 170,
    label: "Новости",
    href: "/news",
    order_index: 52,
  },
  {
    id: 171,
    label: "Статьи",
    href: "/articles",
    order_index: 53,
  },
  {
    id: 172,
    label: "Праздники",
    href: "/prazdniki",
    order_index: 54,
  },
  {
    id: 173,
    label: "Контакты",
    href: "/contacts",
    order_index: 55,
  },
];

// Статические названия для других страниц
const staticTitles: Record<string, string> = {
  cart: "Корзина",
  account: "Профиль",
  catalog: "Каталог",
  admin: "Админ-панель",
  policy: "Политика конфиденциальности",
  thank_you: "Спасибо за заказ",
};

type Crumb = {
  href: string;
  label: string;
};

export default function Breadcrumbs({ productTitle }: { productTitle?: string }) {
  const pathname = usePathname();
  const [hasRendered, setHasRendered] = useState(false);

  // Создаём crumbs до вызова хуков
  const crumbs: Crumb[] = [];
  crumbs.push({ href: '/', label: 'Главная' });

  let currentPath = '';
  const segments = pathname.split('/').filter(Boolean);

  // Проверки перенесены ниже хуков
  const shouldRender = !(
    pathname === '/' || // Не рендерим на главной странице
    (hasRendered && productTitle) // Не рендерим, если уже отрендерено и есть productTitle
  );

  if (shouldRender) {
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;

      // Первый сегмент "category"
      if (seg === 'category' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      }
      // Второй сегмент — категория
      else if (idx === 1 && segments[0] === 'category') {
        const page = sitePages.find((p) => p.href === `/category/${seg}`);
        if (page) {
          crumbs.push({ href: page.href, label: page.label });
        } else {
          const label = decodeURIComponent(seg)
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          crumbs.push({ href: currentPath, label });
        }
      }
      // Пропускаем сегмент "subcategory"
      else if (idx === 2 && segments[0] === 'category' && segments[2] === 'subcategory') {
        return;
      }
      // Четвёртый сегмент — подкатегория
      else if (idx === 3 && segments[0] === 'category' && segments[2] === 'subcategory') {
        const page = sitePages.find((p) => p.href === `/category/${segments[1]}/${seg}`);
        if (page) {
          crumbs.push({ href: page.href, label: page.label });
        } else {
          const label = decodeURIComponent(seg)
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          crumbs.push({ href: currentPath, label });
        }
      }
      // Страница товара
      else if (seg === 'product' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      }
      // Пропускаем сегмент "product/[id]"
      else if (seg === 'product' && idx === 1) {
        return;
      }
      // Название товара
      else if (idx === 1 && segments[0] === 'product') {
        // Предположим, что товар относится к категории "Клубничные букеты"
        const productCategory = sitePages.find((p) => p.href === '/category/klubnichnye-bukety');
        if (productCategory) {
          crumbs.push({ href: productCategory.href, label: productCategory.label });
        }
        if (productTitle) {
          crumbs.push({ href: currentPath, label: productTitle });
        } else {
          crumbs.push({ href: currentPath, label: `Товар ${segments[1]}` });
        }
      }
      // Другие страницы (about, delivery, cart и т.д.)
      else {
        const page = sitePages.find((p) => p.href === `/${seg}`);
        const label = page ? page.label : staticTitles[seg] || decodeURIComponent(seg)
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        crumbs.push({ href: currentPath, label });
      }
    });
  }

  // Хуки вызываются после создания crumbs
  useEffect(() => {
    if (!hasRendered && crumbs.length > 0) {
      setHasRendered(true);
    }
  }, [crumbs]);

  useEffect(() => {
    setHasRendered(false);
  }, [pathname]);

  // Рендеринг только после всех хуков
  if (!shouldRender) {
    return null;
  }

  return (
    <nav
      aria-label="Хлебные крошки"
      className="max-w-7xl mx-auto px-4 py-2 text-sm text-gray-500 font-sans"
    >
      <ol className="flex flex-wrap gap-1 items-center" role="list">
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            {i > 0 && (
              <span aria-hidden="true" className="mx-1 text-gray-400">
                /
              </span>
            )}
            <li role="listitem">
              {i === crumbs.length - 1 ? (
                <span className="text-black font-medium" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="hover:underline text-gray-500"
                  onClick={() => {
                    window.gtag?.('event', 'breadcrumb_click', {
                      event_category: 'navigation',
                      path: c.href,
                    });
                    window.ym?.(12345678, 'reachGoal', 'breadcrumb_click', {
                      path: c.href,
                    });
                  }}
                >
                  {c.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}