import GoogleProvider from 'next-auth/providers/google';

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

['NEXTAUTH_URL', 'NEXTAUTH_URL_INTERNAL', 'VERCEL_URL'].forEach(sanitizeAuthUrl);

const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

export const isApprovedAdminEmail = (email) => {
  const approvedEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return Boolean(approvedEmail) && normalizeEmail(email) === approvedEmail;
};

export const isAdminSession = (session) => isApprovedAdminEmail(session?.user?.email);

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'build_fallback_secret_key_12345',
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'online',
          response_type: 'code'
        }
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      return (
        account?.provider === 'google' &&
        profile?.email_verified === true &&
        isApprovedAdminEmail(profile.email || user.email)
      );
    },
    async jwt({ token, user }) {
      if (user?.email) token.adminEmail = normalizeEmail(user.email);
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.adminEmail) session.user.email = token.adminEmail;
      return session;
    }
  }
};
