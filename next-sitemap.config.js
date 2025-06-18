/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://keytoheart.ru",
  sourceDir: "app",            // App Router
  outDir: "public",            // Куда отдаёт Next.js
  generateRobotsTxt: true,     // robots.txt
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
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
}
