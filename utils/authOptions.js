import GoogleProvider from 'next-auth/providers/google';

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
