import type { NextConfig } from 'next';

const apiProxyUrl = process.env.API_PROXY_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
