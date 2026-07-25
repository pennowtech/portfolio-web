import React from 'react';
import FullLayout from '../components/FullLayout';
import HeaderMain from '../components/HeaderMain';
import ContactForm from '../components/ContactForm';

const Contact = () => {
  const metaInfo = {
    title: 'Contact Sukhdeep Singh | Technical Architect',
    metaKeywords: 'Contact Technical Architect, Software Architecture Consulting',
    metaDesc: 'Contact Sukhdeep Singh to discuss software architecture, systems engineering, or technical leadership.'
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      <ContactForm />
    </FullLayout>
  );
};

export default Contact;
