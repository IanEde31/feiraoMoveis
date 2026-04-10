import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: '80mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atteroccvajbcwxsaoqp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
