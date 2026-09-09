import Head from 'next/head';
import IssueboardWorkspace from '@components/issueboard/IssueboardWorkspace';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';

const IssueboardPage = ({ adminEmail }) => (
  <>
    <Head>
      <title>Issueboard | SinghBuildsTech</title>
      <meta name='description' content='Private SinghBuildsTech project and issue-management workspace.' />
      <meta name='robots' content='noindex, nofollow, noarchive' />
    </Head>
    <IssueboardWorkspace adminEmail={adminEmail} />
  </>
);

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) return { redirect: { destination: '/admin/login', permanent: false } };
    return { props: { adminEmail: session?.user?.email || '' } };
  } catch (error) {
    console.error('Failed to get session on /admin/issues:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default IssueboardPage;
