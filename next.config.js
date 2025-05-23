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
  },
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://mc.yandex.com https://mc.yandex.ru https://www.googletagmanager.com https://www.google-analytics.com https://api-maps.yandex.ru; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://example.com https://keytoheart.ru https://*.yandex.net https://*.yandex.ru https://mc.yandex.com https://mc.yandex.ru; connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co wss://gwbeabfkknhewwoesqax.supabase.co https://mc.yandex.com https://mc.yandex.ru https://www.google-analytics.com https://api-maps.yandex.ru; font-src 'self' data:; frame-src 'self' https://mc.yandex.com https://mc.yandex.ru https://yandex.ru https://*.yandex.ru; object-src 'none'; base-uri 'self'; worker-src 'self'; form-action 'self'; frame-ancestors 'none';",
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
    ];
  },
};

module.exports = nextConfig;