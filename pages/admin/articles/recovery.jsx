import React from 'react';
import AdminLayout from '@components/admin/AdminLayout';
import DraftRecoveryPage from '@components/admin/DraftRecoveryPage';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';

const RecoveryPage = ({ adminEmail }) => (
  <AdminLayout
    adminEmail={adminEmail}
    title='Draft History | SinghBuildsTech'
    description='Private SinghBuildsTech draft history and recovery.'
    hideContextSidebar={true}
    hideHeader={true}
  >
    <DraftRecoveryPage adminEmail={adminEmail} />
  </AdminLayout>
);

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (isIssueboardDevAuthBypassEnabled()) return { props: { adminEmail: issueboardDevIdentity } };

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) return { redirect: { destination: '/admin/login', permanent: false } };
    return { props: { adminEmail: session?.user?.email || '' } };
  } catch (error) {
    console.error('Failed to get session on /admin/articles/recovery:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default RecoveryPage;
