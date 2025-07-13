/** @type {import('next-sitemap').IConfig} */

/* ------------------------------------------------------------- *
 *  Страницы, которые не должны попадать в XML-sitemap / robots   *
 *  (дубли, корзина, шаги оф-лайна, API и пр.)                   *
 * ------------------------------------------------------------- */
const EXCLUDE = [
  '/admin',
  '/cart',
  '/checkout',
  '/order',
  '/order/*',
  '/product-category',
  '/products',
  '/preload',
  '/api/*',
];

module.exports = {
  siteUrl: 'https://keytoheart.ru',

  /* ---------- Sitemap-общие ---------- */
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,

  /* ---------- Что не индексируем ---------- */
  exclude: EXCLUDE,

  /* ---------- Генерация robots.txt ---------- */
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: EXCLUDE },
    ],
    // если в будущем появятся отдельные sitemaps (например news-sitemap.xml)
    additionalSitemaps: ['https://keytoheart.ru/sitemap.xml'],
  },

  /* ---------- Индивидуальный transform ---------- */
  transform: async (config, url) => {
    // 1) Пропускаем исключённые адреса
    if (
      EXCLUDE.some((path) =>
        url.replace(config.siteUrl, '').startsWith(path.replace('*', '')),
      )
    ) {
      return null; // => не будет в карте
    }

    // 2) Главная страница — повышенный приоритет
    if (url === `${config.siteUrl}/`) {
      return {
        loc: url,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // 3) Дефолт для остальных
    return {
      loc: url,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
