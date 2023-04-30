import React from 'react';
import { getSinglePage } from '@utils/notion';

import HeaderMain from '../components/HeaderMain';
import AboutSection from '../components/Intro/AboutSection';
import IntroHighlight from '../components/Intro/IntroHighlight';

const AboutMe = ({ headingBlocks }) => (
  <>
    <HeaderMain />
    <AboutSection />
    <IntroHighlight headingBlocks={headingBlocks} />
  </>
);

export const getStaticProps = async (context) => {
  const { blocks, headingBlocks } = await getSinglePage('About-Me');
  return {
    props: {
      blocks,
      headingBlocks,
    },
  };
};

export default AboutMe;
