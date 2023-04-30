import React, { useEffect, useState } from 'react';
import { getSinglePage } from '@utils/notion';
import ReactMarkdown from 'react-markdown';
import HeaderMain from '../components/HeaderMain';
import AboutSection from '../components/Intro/AboutSection';
import IntroHighlight from '../components/Intro/IntroHighlight';

const AboutMe = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { blocks } = await getSinglePage('About-Me'); // assuming that getSinglePage() takes a page ID as input
      setBlocks(blocks);
    }
    fetchData();
  }, []);

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 style={{ color: 'red' }}>{children}</h1>,
        p: ({ children }) => <p style={{ fontSize: '16px' }}>{children}</p>,
      }}
    >
      {blocks}
    </ReactMarkdown>
  );
};

export default AboutMe;
