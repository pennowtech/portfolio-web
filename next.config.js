// https://stackoverflow.com/a/70047180
const removeImports = require('next-remove-imports')();

module.exports = removeImports({
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true // triggers 308
      }
    ];
  },
  images: {
    domains: ['www.nasa.gov', 'images.unsplash.com', 'pixabay.com', 'www.google.com', 'pennow.tech'],

    loader: 'akamai',
    path: ''
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  }
});
