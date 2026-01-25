// ✅ Путь: next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

/* ------------------------- Content-Security-Policy ------------------------- */
/**
 * JivoChat requires:
 * - script-src: https://code.jivo.ru (и иногда *.jivo.ru)
 * - connect-src: https://*.jivosite.com https://node.jivosite.com + wss
 * - img-src: https://*.jivosite.com + data/blob
 * - frame/child-src: https://*.jivosite.com (иногда)
 */
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

      // ✅ Jivo
      'https://*.jivosite.com',
      'https://*.jivo.ru',
      'https://code.jivo.ru',
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

  // ✅ Jivo (API + realtime)
  'https://code.jivo.ru',
  'https://*.jivo.ru',
  'https://*.jivosite.com',
  'https://node.jivosite.com',
  'wss://*.jivosite.com',
  'wss://node.jivosite.com',
],

    font: ["'self'", 'data:', 'https://yastatic.net', 'https://*.yastatic.net'],
    frame: [
      "'self'",
      'https://mc.yandex.com',
      'https://mc.yandex.ru',
      'https://yandex.ru',
      'https://*.yandex.ru',

      // ✅ Jivo
      'https://*.jivosite.com',
    ],
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

    // ✅ Jivo
    'https://code.jivo.ru',
    'https://*.jivo.ru',
  ];

  if (isDev) SCRIPT_SRC.push("'unsafe-eval'");

  return [
    `default-src ${COMMON.default.join(' ')};`,
    `script-src ${SCRIPT_SRC.join(' ')};`,
    `style-src ${COMMON.style.join(' ')};`,
    `img-src ${COMMON.img.join(' ')};`,
    `connect-src ${COMMON.connect.join(' ')};`,
    `font-src ${COMMON.font.join(' ')};`,
    `frame-src ${COMMON.frame.join(' ')};`,
    `child-src ${COMMON.frame.join(' ')};`,
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
  { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
  { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
  { protocol: 'https', hostname: 'keytoheart.ru', pathname: '/**' },
];

if (isDev) {
  remotePatterns.push({ protocol: 'https', hostname: 'example.com', pathname: '/**' });
}

const nextConfig = {
  reactStrictMode: true,
  compress: true,

  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2_592_000,
    dangerouslyAllowSVG: false,
  },

  experimental: {
    optimizePackageImports: ['framer-motion', 'swiper'],
    optimizeCss: true,
  },

  /* ----------------------------- Rewrites ----------------------------- */
  async rewrites() {
    return [{ source: '/sitemap-products/:page.xml', destination: '/sitemap-products/:page' }];
  },

  /* ----------------------------- Custom headers ---------------------------- */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: buildCsp() },
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      ...['/fonts/:path*', '/icons/:path*', '/uploads/:path*', '/_next/static/:path*'].map(
        (source) => ({
          source,
          headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
        }),
      ),
      ...['/', '/about', '/policy'].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }],
      })),
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
