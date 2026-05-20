import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  async redirects() {
    return [
      {
        source: '/drift-off',
        destination: '/deep-rest',
        permanent: true,
      },
      {
        source: '/drift-off/:path*',
        destination: '/deep-rest/:path*',
        permanent: true,
      },
      {
        source: '/admin/drift-off',
        destination: '/admin/deep-rest',
        permanent: true,
      },
      {
        source: '/admin/drift-off/:path*',
        destination: '/admin/deep-rest/:path*',
        permanent: true,
      },
      {
        source: '/api/drift-off/:path*',
        destination: '/api/deep-rest/:path*',
        permanent: true,
      },
      {
        source: '/api/admin/drift-off/:path*',
        destination: '/api/admin/deep-rest/:path*',
        permanent: true,
      },
      {
        source: '/api/payments/drift-off/:path*',
        destination: '/api/payments/deep-rest/:path*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/sleep-blog',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: '/sleep-blog/:path*',
        permanent: true,
      },
      {
        source: '/supplements',
        destination: '/sleep-supplements',
        permanent: true,
      },
      {
        source: '/supplements/:path*',
        destination: '/sleep-supplements/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '<https://res.cloudinary.com>; rel=preconnect; crossorigin',
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
        source: '/backgrounds/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/email-assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
