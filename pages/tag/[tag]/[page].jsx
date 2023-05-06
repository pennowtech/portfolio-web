import React from 'react';
import { useRouter } from 'next/router';
import { getPublishedBlogPosts, getAllTagsFromPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import PostsLayout from '../../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../../utils/consts';
import PostList from '../../../components/PostList';

export default function TagsPages({ postsToShow, currentTag, tags, totalPosts, recentPosts }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: ''
  };

  const startIndex = 0; // index page is always zero.
  const posts = postsToShow?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  return (
    <PostsLayout pageTitle={`Articles on ${currentTag}`} tags={tags} metaInfo={metaInfo} recentPosts={recentPosts}>
      {posts && <PostList posts={posts} />}
      <Pagination totalPosts={totalPosts} postName={`tag/${currentTag}`} />
    </PostsLayout>
  );
}

export async function getStaticProps({ params }) {
  const currentTag = params.tag;

  const posts = await getPublishedBlogPosts();
  const filteredPosts = posts.filter(
    (post) => post && post.tags && post.tags.some((tag) => tag.name.toUpperCase() === currentTag.toUpperCase())
  );

  const pageNumber = params.page; // Get Current Page No.

  const startIndex = (pageNumber - 1) * PER_PAGE_BLOGS;
  const postsToShow = filteredPosts?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  const totalPosts = filteredPosts.length;
  const tags = await getAllTagsFromPosts(posts);

  return {
    props: {
      postsToShow,
      currentTag,
      totalPosts,
      tags,
      recentPosts: posts.slice(0, RECENT_POSTS_COUNT)
    },
    revalidate: 1
  };
}

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();
  const tags = await getAllTagsFromPosts(posts);

  const paths = Object.keys(tags).map((tag) => ({ params: { tag, page: (tags[tag] / PER_PAGE_BLOGS).toString() } }));
  return {
    paths,
    fallback: true
  };
}
