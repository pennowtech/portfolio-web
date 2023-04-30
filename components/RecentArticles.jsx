import React from 'react';
import Link from 'next/link';
import { useQuery } from 'urql';
import { FIRST_FIVE_POSTS } from '../queries/queries';
import PostDate from './Post/PostDate';

const RecentArticles = ({ recentPosts }) => (
  <div className="font-medium mx-auto px-2 py-1 md:px-4 whitespace-nowrap overflow-hidden">
    <h4 className="border-b-2">Recent Articles</h4>
    {recentPosts?.map((post) => (
      <div key={post.id} className="text-base py-2">
        <Link href={`/blog/${post.slug}`}>
          <a>{post.title}</a>
        </Link>
        <PostDate date={post.date} readingTime={post.readingTime} />
      </div>
    ))}
  </div>
);

export default RecentArticles;
