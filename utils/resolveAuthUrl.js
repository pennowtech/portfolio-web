// CommonJS on purpose: next.config.js (plain Node, no bundler) and utils/authOptions.js
// (bundled ESM) both need this before any other module reads process.env.NEXTAUTH_URL, so it
// has to be `require`-able from next.config.js as-is.

// Vercel / environment settings may expose empty strings or domain names without protocols.
// NextAuth requires valid absolute URLs (or inferring VERCEL_URL with protocol) and throws
// TypeError: Invalid URL if given relative paths, empty strings, or un-prefixed hostnames.
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

/**
 * Normalizes NEXTAUTH_URL / NEXTAUTH_URL_INTERNAL / VERCEL_URL and, if NEXTAUTH_URL is still
 * unset, derives it: the real preview deployment URL on Vercel preview builds, localhost in
 * dev, and the canonical custom domain everywhere else. Kept in one place so next.config.js and
 * utils/authOptions.js can never drift apart and reintroduce the OAuthCallback domain mismatch.
 */
const applyNextAuthUrlDefaults = () => {
  ['NEXTAUTH_URL', 'NEXTAUTH_URL_INTERNAL', 'VERCEL_URL'].forEach(sanitizeAuthUrl);

  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = process.env.VERCEL_URL;
    } else if (process.env.NODE_ENV === 'development') {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    } else {
      process.env.NEXTAUTH_URL = 'https://singhbuildstech.com';
    }
  }
};

module.exports = { sanitizeAuthUrl, applyNextAuthUrlDefaults };
