/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://keytoheart.ru",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  sourceDir: "app",         // ← для App Router
  outDir: "./public",       // ← ВАЖНО: чтобы файлы сохранялись туда, откуда их отдаёт Next.js
  transform: async (config, url) => {
    if (url.startsWith('/admin')) return null;
    return {
      loc: url,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/admin"] },
    ],
  },
};
