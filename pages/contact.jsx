import React from 'react';
import FullLayout from '../components/FullLayout';
import HeaderMain from '../components/HeaderMain';
import ContactForm from '../components/ContactForm';

const contact = () => {
  const metaInfo = {
    title: 'Contact Us',
    metaKeywords: '',
    metaDesc: '',
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      <ContactForm />
    </FullLayout>
  );
};

export default contact;
