import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';

const Write = () => null;

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  try {
    const session = await getServerSession(req, res, authOptions);
    return {
      redirect: {
        destination: isAdminSession(session) ? '/admin/articles/new' : '/admin/login',
        permanent: false
      }
    };
  } catch (error) {
    console.error('Failed to get session on /write:', error);
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false
      }
    };
  }
};

export default Write;
