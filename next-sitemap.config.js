/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://keytoheart.ru',
  generateRobotsTxt: true,
  changefreq: 'weekly',      // дефолт для большинства страниц
  priority: 0.7,             // дефолт для большинства страниц
  sitemapSize: 5000,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/admin'] },
    ],
  },

  // ▲ кастомизируем конкретные URL
  transform: async (config, url) => {
    // для главной
    if (url === config.siteUrl + '/') {
      return {
        loc: url,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // дефолтная запись для остальных
    return {
      loc: url,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
