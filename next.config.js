const sanitizeAuthUrl = (name) => {
  let val = process.env[name];
  if (typeof val === 'string') {
    val = val.trim();
    if (!val) {
      delete process.env[name];
      return;
    }
    if (!/^https?:\/\//i.test(val)) {
      val = `https://${val}`;
    }
    try {
      new URL(val);
      process.env[name] = val;
    } catch {
      delete process.env[name];
    }
  }
};

['NEXTAUTH_URL', 'NEXTAUTH_URL_INTERNAL', 'VERCEL_URL'].forEach(sanitizeAuthUrl);

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL;
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://singhbuildstech.com';
}

module.exports = {
  allowedDevOrigins: ['192.168.0.79'],
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
