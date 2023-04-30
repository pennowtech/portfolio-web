import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageWithFallback from '../ImageWithFallback';
import PostTags from './PostTags';
import PostDate from './PostDate';
import PostCategories from './PostCategories';
import PostExcerpt from './PostExcerpt';

const HorizontalCard = ({ post }) => {
  const myRef = useRef(null);

  return (
    <div className="max-w-[100%] block rounded-lg overflow-hidden shadow-sm  bg-slate-50  dark:bg-gray-700 mb-12">
      <div className="rounded-lg">
        <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 lg:gap-8 rounded-l-lg overflow-hidden">
          <div className="relative w-full h-52 md:h-56 lg:h-64">
            <Link href={`/blog/${post.slug}`}>
              <a>
                <ImageWithFallback
                  src={post?.thumbnailUrl}
                  fallbackSrc="/blank.jpg"
                  className="object-cover w-full"
                  layout="fill"
                  alt={post?.altText}
                  title={post.title}
                  ref={myRef}
                />
                <PostCategories categories={post.categories} />
              </a>
            </Link>
          </div>

          <div className="md:col-span-2 relative">
            <Link href={`/blog/${post.slug}`}>
              <a>
                <h3 className="px-6 mt-6 mb-2  md:text-2xl text-semibold">
                  {post.title}
                </h3>

                <div className="px-6 py-2">
                  <PostExcerpt
                    className="text-base leading-8 hidden wide:block lg:mb-4"
                    excerpt={post.description}
                    blogUrl={post.slug}
                    length={180}
                    showReadNow={false}
                  />
                  <div className="lg:absolute py-2 bottom-0">
                    <PostDate date={post.date} />
                    <PostTags tags={post.tags} />
                  </div>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalCard;
