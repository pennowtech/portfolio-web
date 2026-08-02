import GoogleProvider from 'next-auth/providers/google';

// Vercel preview environments can expose these variables as empty strings.
// NextAuth treats an empty value as an explicit URL and fails while collecting
// page data, so let it infer the preview host when no URL was configured.
['NEXTAUTH_URL', 'NEXTAUTH_URL_INTERNAL'].forEach((name) => {
  if (typeof process.env[name] === 'string' && !process.env[name].trim()) {
    delete process.env[name];
  }
});

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
  secret: process.env.NEXTAUTH_SECRET,
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
