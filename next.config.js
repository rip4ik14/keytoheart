// ✅ Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

/* ------------------------- Content-Security-Policy ------------------------- */
const buildCsp = () => {
  const COMMON = {
    default: ["'self'"],
    style: ["'self'", "'unsafe-inline'", 'https://yastatic.net', 'https://*.yastatic.net'],
    img: [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co',
      'https://via.placeholder.com',
      'https://keytoheart.ru',
      'https://*.yandex.net',
      'https://*.yandex.ru',
      'https://mc.yandex.com',
      'https://mc.yandex.ru',
      'https://api-maps.yandex.ru',
      'https://yastatic.net',
      'https://*.yastatic.net',
    ],
    connect: [
      "'self'",
      'ws:',
      'wss:',
      'https://*.supabase.co',
      'https://mc.yandex.com',
      'https://mc.yandex.ru',
      'https://api-maps.yandex.ru',
      'https://yastatic.net',
      'https://ymetrica1.com',
    ],
    font: ["'self'", 'data:', 'https://yastatic.net', 'https://*.yastatic.net'],
    frame: ["'self'", 'https://mc.yandex.com', 'https://mc.yandex.ru', 'https://yandex.ru', 'https://*.yandex.ru'],
  };

  const SCRIPT_SRC = [
    "'self'",
    "'unsafe-inline'",
    'https://mc.yandex.com',
    'https://mc.yandex.ru',
    'https://api-maps.yandex.ru',
    'https://yastatic.net',
    'https://*.yastatic.net',
    'https://cdn.turbo.yandex.ru',
  ];

  if (isDev) SCRIPT_SRC.push("'unsafe-eval'"); // для hot-reload’а

  return [
    `default-src ${COMMON.default.join(' ')};`,
    `script-src ${SCRIPT_SRC.join(' ')};`,
    `style-src ${COMMON.style.join(' ')};`,
    `img-src ${COMMON.img.join(' ')};`,
    `connect-src ${COMMON.connect.join(' ')};`,
    `font-src ${COMMON.font.join(' ')};`,
    `frame-src ${COMMON.frame.join(' ')};`,
    "object-src 'none'; base-uri 'self'; worker-src 'self' blob:; form-action 'self'; frame-ancestors 'none';",
  ].join(' ');
};

/* --------------------------- Remote image patterns -------------------------- */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'gwbeabfkknhewwoesqax.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'https',
    hostname: 'via.placeholder.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'keytoheart.ru',
    pathname: '/**',
  },
];

// 👇 дополнительный тестовый домен разрешаем только в dev-режиме
if (isDev) {
  remotePatterns.push({
    protocol: 'https',
    hostname: 'example.com',
    pathname: '/**',
  });
}

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  output: 'standalone',

  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2_592_000, // 30 дней
    dangerouslyAllowSVG: false,
  },

  experimental: {
    optimizePackageImports: ['framer-motion', 'swiper'],
    optimizeCss: true,
  },

  /* ----------------------------- Custom headers ---------------------------- */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ⚠️ Оставляем ТОЛЬКО CSP на стороне Next
          { key: 'Content-Security-Policy', value: buildCsp() },
          // (опционально) общий короткий кэш для ISR-страниц — можно убрать, если не нужен
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      // Агрессивный кэш для статики
      ...['/fonts/:path*', '/icons/:path*', '/uploads/:path*', '/_next/static/:path*'].map(
        (source) => ({
          source,
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        }),
      ),
      // Примеры route-специфичного кэша (можно удалить/изменить)
      ...['/', '/about', '/policy'].map((source) => ({
        source,
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      })),
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
