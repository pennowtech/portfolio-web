import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';

const Write = () => null;

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const session = await getServerSession(req, res, authOptions);
  return {
    redirect: {
      destination: isAdminSession(session) ? '/admin/articles/new' : '/admin/login',
      permanent: false
    }
  };
};

export default Write;
