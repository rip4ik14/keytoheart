// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif','image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gwbeabfkknhewwoesqax.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
