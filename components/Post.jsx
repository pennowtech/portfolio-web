import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCaretRight } from 'react-icons/fa';
import { htmlToText } from 'html-to-text';
import DOMPurify from 'dompurify';
import { FlatWPData } from '@utils/FlatData';
import PostDate from './Post/PostDate';
import PostTags from './Post/PostTags';
import PostExcerpt from './Post/PostExcerpt';
import PostCategories from './Post/PostCategories';

const Post = ({ post }) => {
  // const excerpt = htmlToText(DOMPurify.sanitize(post?.excerpt));
  post = FlatWPData(post);
  const excerpt = htmlToText(post?.excerpt);
  const blogUrl = `/blog/${post.link}`;
  // const tags = post?.tags?.edges?.map((tag) => tag.node.name);
  const featuredImage = post?.featuredImage ? post?.featuredImage.node.sourceUrl : '/blank.jpg';
  return (
    <div className="border-b-2 border-slate-200 dark:border-slate-500">
      <Link href={blogUrl}>
        <a href={blogUrl}>
          <div className="cursor-pointer">
            <div className="relative w-full max-h-[350px]">

              <Image
                src={featuredImage}
                alt={post?.featuredImage?.node.altText}
                title={post.title}
                className="object-cover w-full rounded-xl"
                width={800}
                height={350}
              />
              <PostCategories categories={post.categories} />

            </div>
            <h3 className="mt-4 mb-1 text-3xl text-semibold font-Neuton">{post.title}</h3>
          </div>
        </a>
      </Link>
      <div className="my-4">
        <PostDate date={post.date} readingTime={post.readingTime} />
        <PostExcerpt blogUrl={blogUrl} excerpt={excerpt} length={180} className="my-4 lg:my-8" />
        <PostTags tags={post.tags} />
      </div>
    </div>
  );
};
export default Post;
