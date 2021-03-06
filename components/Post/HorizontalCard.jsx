import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageWithFallback from '../ImageWithFallback';
import PostTags from './PostTags';
import PostDate from './PostDate';
import PostCategories from './PostCategories';
import PostExcerpt from './PostExcerpt';

const HorizontalCard = ({ post }) => (
  <div className="max-w-[100%] block rounded-lg overflow-hidden shadow-sm  bg-slate-50  dark:bg-gray-700 mb-12">

    <div className="rounded-lg">
      <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 lg:gap-8 rounded-l-lg overflow-hidden">
        <div className="relative w-full h-52 md:h-64 lg:h-80">
          <Link href={`/blog/${post.link}`}>
            <a>
              <ImageWithFallback
                src={post?.thumbnailUrl}
                fallbackSrc="/blank.jpg"
                className="object-cover w-full"
                layout="fill"
                alt={post?.altText}
                title={post.title}
              />
              <PostCategories categories={post.categories} />
            </a>
          </Link>
        </div>

        <div className="md:col-span-2 relative">
          <Link href={`/blog/${post.link}`}>
            <a>
              <h3 className="px-6 mt-6 mb-2  md:text-2xl text-semibold font-Neuton">{post.title}</h3>
            </a>
          </Link>
          <div className="px-6 py-2">
            <PostExcerpt className="text-lg leading-8 hidden wide:block lg:mb-4" excerpt={post.excerpt} blogUrl={post.link} length={180} showReadNow={false} />
            <div className="lg:absolute py-2 bottom-0">
              <PostDate date={post.date} />
              <PostTags tags={post.tags} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
export default HorizontalCard;
