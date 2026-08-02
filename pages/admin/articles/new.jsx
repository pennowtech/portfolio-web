import React from 'react';
import FullLayout from '@components/FullLayout';
import HeaderMain from '@components/HeaderMain';
import ArticleEditor from '@components/ArticleEditor';
import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';

const NewArticlePage = ({ adminEmail, defaultPublicationDate }) => (
  <FullLayout
    metaInfo={{
      title: 'New article | SinghBuildsTech',
      metaDesc: 'Private SinghBuildsTech author workspace.',
      noIndex: true
    }}
  >
    <HeaderMain />
    <ArticleEditor adminEmail={adminEmail} defaultPublicationDate={defaultPublicationDate} />
  </FullLayout>
);

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return { redirect: { destination: '/admin/login', permanent: false } };
  return { props: { adminEmail: session.user.email, defaultPublicationDate: new Date().toISOString().slice(0, 10) } };
};

export default NewArticlePage;
