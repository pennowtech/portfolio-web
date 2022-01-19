import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { Element } from 'react-scroll';

import algoliasearch from 'algoliasearch/lite';
import SelectedPosts from '@components/SelectedPosts';
import { SELECTED_POST_QUERY } from 'queries/queries';
import { gqlClient } from '@utils/gqlclient';
import { SelectedPostsList } from '@utils/consts';
import BlogMain from '../components/BlogMain';
import Login from '../components/Login';
import HomeArticles from '../components/HomeArticles';
import 'tailwindcss/tailwind.css';
import ContactForm from '../components/ContactForm';
import FullLayout from '../components/FullLayout';
import { ssrCache } from '../utils/gqlclient';

function Index({ posts, selectedposts }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  return (
    <FullLayout metaInfo={metaInfo}>

      <Element id="about-me" className="element min-h-[600px]">
        <SelectedPosts selectedposts={selectedposts} />
        <Login />
      </Element>
      <Element id="blog" className="element min-h-[630px]">
        <BlogMain />
      </Element>
      <Element id="articles" className="element">
        <HomeArticles posts={posts} />
      </Element>
      <ContactForm />
    </FullLayout>
  );
}

export const getStaticProps = async () => {
  // Read post
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
  const selectedposts2 = await res.json()?.message;

  const unresolvedPromises = SelectedPostsList.map((postId) => gqlClient.query(
    SELECTED_POST_QUERY,
    {
      id: postId,
    },
  ).toPromise());
  const postResult = await Promise.all(unresolvedPromises);
  const selectedposts = postResult.map((value) => value.data);
  return {
    props: {
      posts,
      selectedposts: selectedposts || [],
      // selectedposts: JSON.stringify(selectedposts) || [],
      urqlState: ssrCache.extractData(),
    },
    revalidate: 600,
  };
};

// export default withUrqlClient(
//   () => ({
//     url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',
//   }),
//   { ssr: false },
// )(Index);

export default Index;
