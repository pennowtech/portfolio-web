module.exports = {
  images: {
    remotePatterns: [
      new URL('https://www.nasa.gov/**'),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      new URL('https://pixabay.com/**'),
      new URL('https://www.google.com/**')
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
