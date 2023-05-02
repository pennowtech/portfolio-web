/* eslint-disable react/destructuring-assignment */
import React, { useState } from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS } from '../../utils/consts';
import PostList from '../../components/PostList';
import Pagination from '../../components/Pagination';

const totalPagesCount = (totalPostsCount) => Math.ceil(totalPostsCount / PER_PAGE_BLOGS);

const Blog = ({ data }) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  const [currentPage, setCurrentPage] = useState(1);

  const onPageChange = (page) => {
    setCurrentPage(page);
  };
  const totalPages = totalPagesCount(data.length ?? 0);

  return (
    <PostsLayout
      pageTitle="Articles"
      metaInfo={metaInfo}
      recentPosts={data.slice(1, 3)}
    >
      <PostList posts={data ?? []} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        postName="blog"
        onPageChange={onPageChange}
      />
    </PostsLayout>
  );
};

export async function getStaticProps() {
  const response = await getPublishedBlogPosts();
  return {
    props: {
      data: response,
    },
  };
}

export default Blog;
