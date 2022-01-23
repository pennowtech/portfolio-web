import React from 'react';
import Login from '../components/Login';
import FullLayout from '../components/FullLayout';
import HeaderMain from '../components/HeaderMain';

export default function LoginForm() {
  const metaInfo = {
    title: 'Login Form',
    metaKeywords: 'markdown',
    metaDesc: '',
  };

  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      <div className="mt-12" />
      <Login />
    </FullLayout>

  );
}
