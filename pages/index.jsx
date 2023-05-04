import React, { useEffect, useRef, useState } from 'react';

import { Element } from 'react-scroll';
import { getPublishedBlogPosts, getSinglePage } from '@utils/notion';
import Hero from '@components/Intro/Hero';

import { WebSiteTags } from '@utils/consts';
import IntroHighlight from '../components/Intro/IntroHighlight';
import HomeArticles from '../components/HomeArticles';
import 'tailwindcss/tailwind.css';
import ContactForm from '../components/ContactForm';
import FullLayout from '../components/FullLayout';
import AboutSection from '../components/Intro/AboutSection';
import HeaderMain from '../components/HeaderMain';
import PostTags from '../components/Post/PostTags';

const Index = ({ posts, headingBlocks }) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: ''
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain homepage />
      <Element id='home' className='element'>
        <AboutSection classProps='font-RobotoSlab text-base leading-8' />
        <div className='px-4 container font-Rajdhani mx-auto text-base'>
          <p className='text-pink-500 dark:text-green-400 font-semibold'>
            This whole website is designed by me, from designing till development.{' '}
          </p>
          <PostTags limitedTags={false} tags={WebSiteTags} />
        </div>
      </Element>
      <Element id='about-me' className='element min-h-[630px]'>
        <IntroHighlight classProps='font-RobotoSlab text-base leading-8' headingBlocks={headingBlocks} />
      </Element>
      <Element id='blog' className='element'>
        <HomeArticles posts={posts} showAsHorizontal={false} />
      </Element>
      <Element id='contact' className='element'>
        <ContactForm />
      </Element>
    </FullLayout>
  );
};

export const getStaticProps = async () => {
  const response = await getPublishedBlogPosts(6);
  const { blocks, headingBlocks } = await getSinglePage('About-Me');
  return {
    props: {
      posts: response,
      headingBlocks
    }
  };
};

export default Index;
