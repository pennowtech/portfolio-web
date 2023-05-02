import React from 'react';
import Image from "next/legacy/image";
import Link from 'next/link';
import ImageWithFallback from '../ImageWithFallback';
import PostTags from './PostTags';
import PostDate from './PostDate';
import PostCategories from './PostCategories';
import PostExcerpt from './PostExcerpt';

const VerticalCard = ({ post }) => (
  <div className="max-w-sm rounded-lg overflow-hidden shadow-lg mb-6 block bg-slate-50  dark:bg-gray-700">

    <div className="grow rounded-lg  ">
      <div className="relative rounded-lg">
        <div className="relative rounded-t-lg overflow-hidden">
          <Link href={`/blog/${post.link}`}>

            <ImageWithFallback
              fallbackSrc="/blank.jpg"
              src={post.thumbnailUrl}
              alt={post.title}
              className="object-cover w-full"
              width={700}
              height={465}
            />
            <PostCategories categories={post.categories} />

          </Link>

          <div className="relative -mt-10 bg-slate-50 dark:bg-gray-700">
            <div
              className="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20 "
              style={{ transform: 'translateZ(0)' }}
            >
              <svg
                className="absolute bottom-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="text-slate-50 dark:text-gray-700  fill-current"
                  points="2560 0 2560 100 0 100"
                />
              </svg>
            </div>
            <Link href={`/blog/${post.link}`}>

              <h3 className="px-6 py-2 my-2 md:text-2xl text-semibold font-Neuton">{post.title}</h3>

            </Link>
            <div className="px-6 py-2">
              <PostDate date={post.date} />
              <PostTags tags={post.tags} />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);
export default VerticalCard;
