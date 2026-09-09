import Head from 'next/head';
import IssueDetail from '@components/issueboard/IssueDetail';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';

const IssueDetailPage = ({ adminEmail, issueKey }) => (
  <>
    <Head>
      <title>{issueKey} | Issueboard</title>
      <meta name='description' content='Private SinghBuildsTech issue details.' />
      <meta name='robots' content='noindex, nofollow, noarchive' />
    </Head>
    <IssueDetail adminEmail={adminEmail} issueKey={issueKey} />
  </>
);

export const getServerSideProps = async ({ req, res, params }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) return { redirect: { destination: '/admin/login', permanent: false } };
    const issueKey = typeof params?.issueKey === 'string' ? params.issueKey.toUpperCase() : '';
    if (!/^[A-Z][A-Z0-9]{1,9}-\d{1,10}$/.test(issueKey)) return { notFound: true };
    return { props: { adminEmail: session?.user?.email || '', issueKey } };
  } catch (error) {
    console.error('Failed to get session on issue detail:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default IssueDetailPage;
