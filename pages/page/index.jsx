/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../utils/consts';
import PostList from '../../components/PostList';

// eslint-disable-next-line react/no-multi-comp
const Index = ({ postsToShow, totalPosts, recentPosts }) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: ''
  };

  return (
    <PostsLayout pageTitle='Articles' metaInfo={metaInfo} recentPosts={recentPosts}>
      {postsToShow && <PostList posts={postsToShow} />}
      <Pagination totalPosts={totalPosts} postName='page' />
    </PostsLayout>
  );
};
export const getStaticProps = async () => {
  const posts = await getPublishedBlogPosts();
  // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  // const data = await res.json();

  const startIndex = 0; // index page is always zero.
  const postsToShow = posts?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  const totalPosts = posts.length;

  return {
    props: {
      postsToShow,
      totalPosts,
      recentPosts: posts.slice(0, RECENT_POSTS_COUNT)
    },
    revalidate: 1
  };
};

export default Index;
