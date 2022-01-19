import React from 'react';
import Link from 'next/link';

import { FlatMDXData } from '@utils/FlatData';
import HorizontalCard from './Post/HorizontalCard';

export default function HomeArticles({ posts }) {
  return (
    <div className="relative bg-slate-200 dark:bg-slate-400 py-4">
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
            className="text-slate-200 dark:text-slate-400  fill-current"
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>
      <h1 className="mt-4 mb-0 font-Offside underline underline-offset-2 mx-auto justify-center text-center">Articles</h1>
      {/* <div className="w-full lg:max-w-[1167px] lg:mx-auto py-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"> */}
      <div className="w-full lg:max-w-[1167px] lg:mx-auto py-10 ">
        {posts.map((post, index) => {
          const postData = FlatMDXData(post);
          return (
            <HorizontalCard post={postData} key={index} />
          );
        })}

      </div>
      <div className="grid font-Monda justify-center">
        <div className="button focus:shadow-outline cursor-pointer">
          <Link href="/blog">
            <a className="text-white">View all articles</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
