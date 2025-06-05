// ✅ Путь: next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
        hostname: 'example.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'keytoheart.ru',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Поддержка AVIF и WebP
    deviceSizes: [320, 640, 768, 1024, 1280, 1600], // Размеры для разных устройств
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Размеры для inline-изображений
    minimumCacheTTL: 60, // Минимальное время кэширования изображений (60 секунд)
    dangerouslyAllowSVG: false, // Безопасность: отключаем SVG, если не нужен
  },
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'swiper'], // Оптимизация импортов
    optimizeCss: true, // Оптимизация CSS
  },
  async rewrites() {
    return [
      {
        source: '/icons/:path*',
        destination: '/icons/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              // JS для Яндекс Карт, аналитика, поддержка yastatic
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net https://*.yastatic.net https://cdn.turbo.yandex.ru https://yastatic.net/s3/front-maps-static;",
              "style-src 'self' 'unsafe-inline' https://yastatic.net https://*.yastatic.net;",
              "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://example.com https://keytoheart.ru https://*.yandex.net https://*.yandex.ru https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net https://*.yastatic.net;",
              "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net https://ymetrica1.com;",
              "font-src 'self' data: https://yastatic.net https://*.yastatic.net;",
              "frame-src 'self' https://mc.yandex.com https://mc.yandex.ru https://yandex.ru https://*.yandex.ru;",
              "object-src 'none'; base-uri 'self'; worker-src 'self'; form-action 'self'; frame-ancestors 'none';",
            ].join(' '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/about',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/policy',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;