import React from 'react';
import FullLayout from '@components/FullLayout';
import HeaderMain from '@components/HeaderMain';
import AdminLogin from '@components/AdminLogin';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';

const LoginPage = () => (
  <FullLayout
    metaInfo={{
      title: 'Author sign in | SinghBuildsTech',
      metaDesc: 'Private SinghBuildsTech author workspace.',
      noIndex: true
    }}
  >
    <HeaderMain />
    <AdminLogin />
  </FullLayout>
);

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const session = await getServerSession(req, res, authOptions);
    if (isAdminSession(session)) {
      return { redirect: { destination: '/admin/articles/new', permanent: false } };
    }
  } catch (error) {
    console.error('Failed to get session on /admin/login:', error);
  }
  return { props: {} };
};

export default LoginPage;
