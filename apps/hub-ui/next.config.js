/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.HUB_API_URL || 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/ws/:path*',
        destination: process.env.HUB_WS_URL || 'ws://localhost:8000/ws/:path*',
      },
    ];
  },
};

module.exports = nextConfig;