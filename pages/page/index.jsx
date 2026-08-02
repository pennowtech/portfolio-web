import React from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import { DUMMY_ARTICLE } from '@utils/dummyArticle';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../utils/consts';
import PostList from '../../components/PostList';

const Index = ({ postsToShow, totalPosts, recentPosts }) => {
  const metaInfo = {
    title: 'Software Architecture and Engineering Articles | SinghBuildsTech',
    metaKeywords: 'Software Architecture, Embedded Systems, Rust, C++, Python, Distributed Systems',
    metaDesc:
      'Practical articles on software architecture, embedded systems, distributed platforms, programming, and engineering decisions.'
  };

  return (
    <PostsLayout pageTitle='Articles' metaInfo={metaInfo} recentPosts={recentPosts}>
      {postsToShow && <PostList posts={postsToShow} />}
      <Pagination totalPosts={totalPosts} postName='page' />
    </PostsLayout>
  );
};
export const getStaticProps = async () => {
  const notionPosts = await getPublishedBlogPosts();
  // TODO(dummy-content): Keep the local fixture in the full listing until explicitly removed.
  const posts = [{ ...DUMMY_ARTICLE, thumbnailUrl: `/${DUMMY_ARTICLE.thumbnailUrl}` }, ...notionPosts];
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
    revalidate: 60
  };
};

export default Index;
