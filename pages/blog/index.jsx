/* eslint-disable react/destructuring-assignment */
import React, { useState } from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import { Pagination, paginate } from '@components/Pagination';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS } from '../../utils/consts';
import PostList from '../../components/PostList';

// eslint-disable-next-line react/no-multi-comp
const Index = ({ data }) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: ''
  };
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = PER_PAGE_BLOGS;

  const onPageChange = (page) => {
    setCurrentPage(page);
  };
  const paginatedPosts = paginate(data, currentPage, pageSize);

  return (
    <PostsLayout pageTitle='Articles' metaInfo={metaInfo} recentPosts={data.slice(1, 3)}>
      <PostList posts={paginatedPosts ?? []} />
      <Pagination items={data.length} currentPage={currentPage} pageSize={pageSize} onPageChange={onPageChange} />
    </PostsLayout>
  );
};
export const getStaticProps = async () => {
  // const data = await getPublishedBlogPosts();
  const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  const data = await res.json();
  return {
    props: { data }
  };
};

export default Index;
