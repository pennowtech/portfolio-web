import React from 'react';
import HeaderMain from '../components/HeaderMain';
import AboutSection from '../components/Intro/AboutSection';
import IntroHighlight from '../components/Intro/IntroHighlight';
import FullLayout from '../components/FullLayout';

const AboutMe = () => (
  <FullLayout
    metaInfo={{
      title: 'About Sukhdeep Singh | Technical Architect',
      metaKeywords: 'Technical Architect, Embedded Systems, Software Architecture, C++, Rust, Python',
      metaDesc:
        'Career highlights and technical expertise of Sukhdeep Singh, a Technical Architect working across embedded, networked, and distributed software systems.'
    }}
  >
    <HeaderMain />
    <AboutSection />
    <IntroHighlight />
  </FullLayout>
);

export default AboutMe;
