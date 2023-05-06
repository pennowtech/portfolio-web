import React from 'react';
import Link from 'next/link';
import { BiNews } from 'react-icons/bi';
import PostDate from './Post/PostDate';

const RecentArticles = ({ recentPosts }) => (
  <div className='font-medium px-2 py-1 md:px-4 overflow-hidden'>
    <h4 className='border-b-2 pl-2'>Recent Articles</h4>
    {recentPosts?.map((post) => (
      <div key={post.id} className='py-2 pl-2 w-full '>
        <Link className='' href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
        <PostDate className='text-right justify-end items-end' date={post.date} readingTime={post.readingTime} />
      </div>
    ))}
  </div>
);

export default RecentArticles;
