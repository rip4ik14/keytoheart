// ✅ Путь: app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/cart', '/checkout', '/order', '/preload', '/api/'],
      },
    ],
    sitemap: 'https://keytoheart.ru/sitemap.xml',
    host: 'https://keytoheart.ru',
  };
}
