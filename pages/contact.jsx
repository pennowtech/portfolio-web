import React from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import ContactForm from '../components/ContactForm';

const contact = () => {
  const metaInfo = {
    title: 'Contact Us',
    metaKeywords: '',
    metaDesc: '',
  };
  return (
    <Layout metaInfo={metaInfo}>
      <ContactForm />
    </Layout>
  );
};

export default contact;
