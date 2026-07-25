const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => ({
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: 'export' }),
  images: {
    remotePatterns: [
      new URL('https://www.nasa.gov/**'),
      new URL('https://images.unsplash.com/**'),
      new URL('https://pixabay.com/**'),
      new URL('https://www.google.com/**'),
      new URL('https://pennow.tech/**'),
      new URL('https://tuk-cdn.s3.amazonaws.com/**')
    ],
    loader: 'akamai',
    path: ''
  },
  reactStrictMode: true
});
