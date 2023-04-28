// https://stackoverflow.com/a/70047180
const removeImports = require('next-remove-imports')();

module.exports = removeImports({
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true, // triggers 308
      },
    ];
  },
  images: {
    domains: ['www.nasa.gov', 'pennow.tech', 'pixabay.com', 'www.google.com', 'pennow.tech'],

    loader: 'akamai',
    path: '',
  },
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
});
