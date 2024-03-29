import React from 'react';
import Link from 'next/link';
import { htmlToText } from 'html-to-text';
import PostDate from './Post/PostDate';
import PostTags from './Post/PostTags';
import PostExcerpt from './Post/PostExcerpt';
import PostCategories from './Post/PostCategories';
import ImageWithFallback from './ImageWithFallback';

const Post = ({ post }) => {
  // const excerpt = htmlToText(DOMPurify.sanitize(post?.excerpt));
  const excerpt = htmlToText(post?.description);
  const blogUrl = `/blog/${post.slug}`;

  // const tags = post?.tags?.edges?.map((tag) => tag.node.name);
  return (
    <div className="border-b-2 border-slate-200 dark:border-slate-500">
      <Link href={blogUrl}>

        <div className="cursor-pointer">
          <div className="relative w-full h-52 md:h-64 lg:h-80">
            <ImageWithFallback
              src={post?.thumbnailUrl}
              fallbackSrc="/blank.jpg"
              layout="fill"
              alt={post?.title}
              title={post.title}
              className="object-cover w-full rounded-xl"
            />
            <PostCategories categories={post.categories} />
          </div>
          <h3 className="mt-4 mb-1 text-3xl ">
            {post.title}
          </h3>
        </div>

      </Link>
      <div className="my-4">
        <PostDate date={post.date} readingTime={post.readingTime} />
        <PostExcerpt
          blogUrl={blogUrl}
          excerpt={excerpt}
          length={180}
          className="my-4 lg:my-8"
        />
        <PostTags tags={post.tags} />
      </div>
    </div>
  );
};
export default Post;
