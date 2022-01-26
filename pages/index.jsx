import React, { useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { Element } from 'react-scroll';
import algoliasearch from 'algoliasearch/lite';
import { SELECTED_POST_QUERY, LOGIN_WP_USER } from 'queries/queries';
import { SelectedPostsList, GRAPHQL_URL } from '../utils/consts';
import SelectedPosts from '../components/SelectedPosts';
import { gqlClient, ssrCache } from '../utils/gqlclient';
import IntroHighlight from '../components/Intro/IntroHighlight';
import Login from '../components/Login';
import HomeArticles from '../components/HomeArticles';
import 'tailwindcss/tailwind.css';
import ContactForm from '../components/ContactForm';
import FullLayout from '../components/FullLayout';
import AboutSection from '../components/Intro/AboutSection';
import HeaderMain from '../components/HeaderMain';
import PostTags from '../components/Post/PostTags';

function Index({ posts, selectedposts }) {
  // useEffect(() => {
  //   LoginWP();
  // }, []);

  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain homepage />

      <Element id="home" className="element">
        <AboutSection />
        <div className="px-4 container font-Offside mx-auto text-base">
          <p className="">The main purpose of this site is to note down my learnings and share my thoughts.</p>
          <p className="text-pink-500 dark:text-green-400 font-semibold">This whole website is designed by me, from designing till development. </p>
          <PostTags
            limitedTags={false}
            tags={[
              { name: 'ReactJS' },
              { name: 'NodeJS' },
              { name: 'PostgreSQL' },
              { name: 'GraphQL' },
              { name: 'Urql' },
              { name: 'REST API' },
              { name: 'Axios' },
            ]}
          />
        </div>

      </Element>
      <Element id="Selected" className="element">
        <SelectedPosts selectedposts={selectedposts} />
      </Element>
      <Element id="about-me" className="element min-h-[630px]">
        <IntroHighlight />
      </Element>
      <Element id="articles" className="element">
        <HomeArticles posts={posts} />
      </Element>
      <Element id="contact" className="element">

        <ContactForm />
      </Element>
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
  posts.sort((a, b) => Date.parse(b.frontMatter.date) - Date.parse(a.frontMatter.date));
  // posts.forEach((p) => console.log(Date.parse(p.frontMatter.date)));

  const unresolvedPromises = SelectedPostsList.map((postId) => gqlClient().query(
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
