const path = require('path');
const { applyNextAuthUrlDefaults } = require('./utils/resolveAuthUrl');

applyNextAuthUrlDefaults();

const sharpBinaries = ['./node_modules/@img/sharp-linux-x64/**/*', './node_modules/@img/sharp-libvips-linux-x64/**/*'];

module.exports = {
  outputFileTracingRoot: path.resolve(__dirname),
  // react-syntax-highlighter is CommonJS but requires refractor, which is ESM-only. Left external, Vercel's
  // runtime throws ERR_REQUIRE_ESM and every page that renders markdown code (the issue board) returns 500.
  // Bundling both lets the bundler resolve the ESM import itself.
  transpilePackages: ['react-syntax-highlighter', 'refractor'],
  // sharp loads libvips (a shared library) at runtime through its native addon, which file tracing can't see, so
  // the Vercel function shipped without it ("libvips-cpp.so ... cannot open shared object file").
  // Attachment handling on the issue routes uses sharp, so include the Linux binaries for those routes.
  outputFileTracingIncludes: {
    '/api/submit-issue': sharpBinaries,
    '/api/issues': sharpBinaries,
    '/api/issueboard/**': sharpBinaries
  },
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
