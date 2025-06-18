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
        hostname: 'keytoheart.ru',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 год
    dangerouslyAllowSVG: false,
  },
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'swiper', 'react-image-gallery'],
    optimizeCss: true,
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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net;",
              "style-src 'self' 'unsafe-inline' https://yastatic.net;",
              "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://keytoheart.ru https://*.yandex.net https://*.yandex.ru https://mc.yandex.com;",
              "connect-src 'self' https://*.supabase.co https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net https://ymetrica1.com;",
              "font-src 'self' data: https://yastatic.net;",
              "frame-src 'self' https://mc.yandex.com https://mc.yandex.ru https://yandex.ru;",
              "object-src 'none'; base-uri 'self'; worker-src 'self' blob:; form-action 'self'; frame-ancestors 'none';",
            ].join(' '),
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      {
        source: '/_next/static/:path*.(js|css|woff2)',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/Uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.(jpg|jpeg|png|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/about',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/policy',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;