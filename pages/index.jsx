import React, { useEffect, useRef, useState } from 'react';

import { Element } from 'react-scroll';
import { getPublishedBlogPosts } from '@utils/notion';

import { WebSiteTags } from '@utils/consts';
import { DUMMY_ARTICLE } from '@utils/dummyArticle';
import FeaturedProjects from '@components/FeaturedProjects';
import IntroHighlight from '../components/Intro/IntroHighlight';
import HomeArticles from '../components/HomeArticles';
import ContactForm from '../components/ContactForm';
import FullLayout from '../components/FullLayout';
import AboutSection from '../components/Intro/AboutSection';
import HeaderMain from '../components/HeaderMain';
import PostTags from '../components/Post/PostTags';

const Index = ({ posts }) => {
  const metaInfo = {
    title: 'SinghBuildsTech | Sukhdeep Singh, Technical Architect',
    metaKeywords: 'Technical Architect, Software Architecture, Embedded Systems, Rust, C++, Python, Microservices',
    metaDesc:
      'Portfolio of Sukhdeep Singh, a Technical Architect with 18+ years of experience across embedded systems, networking, distributed platforms, and software engineering.'
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain homepage />
      <Element id='home' className='element bg-white dark:bg-gray-600'>
        <AboutSection classProps='font-RobotoSlab text-base leading-8' />
        <div className='container mx-auto px-4 pb-12 font-Rajdhani text-base md:pb-16'>
          <p className='text-pink-500 dark:text-green-400 font-semibold'>
            This whole website is designed by me, from designing till development.{' '}
          </p>
          <PostTags limitedTags={false} tags={WebSiteTags} />
        </div>
      </Element>
      <Element id='about-me' className='element min-h-[630px] bg-slate-50 dark:bg-slate-700/35'>
        <IntroHighlight classProps='font-RobotoSlab text-base leading-8' />
      </Element>
      <Element id='projects' className='element bg-white dark:bg-gray-600'>
        <FeaturedProjects />
      </Element>
      <Element id='page' className='element bg-slate-50 dark:bg-slate-700/35'>
        <HomeArticles posts={posts} showAsHorizontal={false} />
      </Element>
      <Element id='contact' className='element bg-white dark:bg-gray-600'>
        <ContactForm />
      </Element>
    </FullLayout>
  );
};

export const getStaticProps = async () => {
  const response = await getPublishedBlogPosts(5);
  return {
    props: {
      // TODO(dummy-content): Remove this prepend when the real article feed is ready.
      posts: [{ ...DUMMY_ARTICLE, thumbnailUrl: `/${DUMMY_ARTICLE.thumbnailUrl}` }, ...response]
    },
    revalidate: 60
  };
};

export default Index;
