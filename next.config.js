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
    domains: ['www.nasa.gov', 'pennow.tech', 'pixabay.com', 'www.google.com', 'wordpress-561320-2383780.cloudwaysapps.com'],
  },
  reactStrictMode: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
});
