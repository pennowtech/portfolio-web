/* eslint-disable react/destructuring-assignment */
import React, { useState } from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import { Pagination2, paginate } from '@components/Pagination2';
import Pagination from '@components/Pagination';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../utils/consts';
import PostList from '../../components/PostList';

// eslint-disable-next-line react/no-multi-comp
const Index = ({ postsToShow, recentPosts, totalPosts }) => {
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
export const getStaticProps = async ({ params }) => {
  const pageNumber = params.page; // Get Current Page No.

  const posts = await getPublishedBlogPosts();
  // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  // const data = await res.json();

  const startIndex = (pageNumber - 1) * PER_PAGE_BLOGS;
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

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / PER_PAGE_BLOGS);

  return {
    // remove first page, we 're not gonna handle that.
    paths: Array.from({ length: totalPages - 1 }, (_, i) => ({
      params: { page: `${i + 2}` }
    })),
    fallback: true
  };
}

export default Index;
