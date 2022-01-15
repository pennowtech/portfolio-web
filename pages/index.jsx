import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { Element } from 'react-scroll';
import BlogMain from '../components/BlogMain';
import Login from '../components/Login';
import ThemeToggle from '../components/ThemeToggle';
import Header from '../components/Header';
import HomeArticles from '../components/HomeArticles';
import 'tailwindcss/tailwind.css';
import ContactForm from '../components/ContactForm';
import Layout from '../components/Layout';

function Home({ posts, selectedposts }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  return (
    <Layout metaInfo={metaInfo}>
      {' '}
      <div className="w-full lg:max-w-[1167px] lg:mx-auto p-5">
        <Element id="about-me" className="element min-h-[600px]">
          <Login />
        </Element>
        <Element id="blog" className="element min-h-[630px]">
          <BlogMain />
        </Element>
        <Element id="articles" className="element min-h-[630px]">
          <HomeArticles posts={posts} selectedposts={selectedposts} />
        </Element>
        <Element id="notifications" className="element min-h-[600px]">
          test 3
        </Element>
        <ContactForm />
      </div>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const files = fs.readdirSync(path.join('posts'));
  const posts = files.map((filename) => {
    const markdownWithMeta = fs.readFileSync(
      path.join('posts', filename),
      'utf-8',
    );
    const { data: frontMatter } = matter(markdownWithMeta);
    return {
      frontMatter,
      blog: filename.split('.')[0],
    };
  });

  const res = await fetch('http://localhost:3000/api/selectedposts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const selectedposts = await res.json();

  return {
    props: {
      posts,
      selectedposts: selectedposts.message || [],
    },
  };
};

export default Home;
