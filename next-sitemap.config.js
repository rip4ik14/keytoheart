/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: "https://keytoheart.ru",   // ← прод‑домен
    generateRobotsTxt: true,            // создаст robots.txt
    changefreq: "weekly",
    priority: 0.7,
    sitemapSize: 5000,
    robotsTxtOptions: {
      policies: [
        { userAgent: "*", allow: "/", disallow: ["/admin"] },
      ],
    },
  };
  