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
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /worker\//,
    }
    return config
  },
}

export default nextConfig
