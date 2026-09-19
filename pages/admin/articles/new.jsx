import React from 'react';
import AdminLayout from '@components/admin/AdminLayout';
import ArticleEditor from '@components/ArticleEditor';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';

const NewArticlePage = ({ adminEmail, defaultPublicationDate }) => (
  <AdminLayout
    adminEmail={adminEmail}
    title='Write Article | SinghBuildsTech Editorial Studio'
    description='Private SinghBuildsTech author workspace.'
  >
    <div className='p-4 sm:p-6'>
      <ArticleEditor adminEmail={adminEmail} defaultPublicationDate={defaultPublicationDate} />
    </div>
  </AdminLayout>
);

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (isIssueboardDevAuthBypassEnabled()) {
    return {
      props: {
        adminEmail: issueboardDevIdentity,
        defaultPublicationDate: new Date().toISOString().slice(0, 10)
      }
    };
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) return { redirect: { destination: '/admin/login', permanent: false } };
    return {
      props: { adminEmail: session?.user?.email || '', defaultPublicationDate: new Date().toISOString().slice(0, 10) }
    };
  } catch (error) {
    console.error('Failed to get session on /admin/articles/new:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default NewArticlePage;
