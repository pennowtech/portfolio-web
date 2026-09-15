const path = require('path');
const { applyNextAuthUrlDefaults } = require('./utils/resolveAuthUrl');

applyNextAuthUrlDefaults();

module.exports = {
  outputFileTracingRoot: path.resolve(__dirname),
  turbopack: {
    root: path.resolve(__dirname)
  },
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    localeDetection: false
  },
  allowedDevOrigins: ['192.168.0.79', '10.96.36.234'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.nasa.gov',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/**'
      }
    ],
    unoptimized: true
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.singhbuildstech.com' }],
        destination: 'https://singhbuildstech.com/:path*',
        permanent: true
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'portfolio-web-wheat.vercel.app' }],
        destination: 'https://singhbuildstech.com/:path*',
        permanent: true
      }
    ];
  }
};
