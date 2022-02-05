import React from 'react';
import { FlatWPData } from '../utils/FlatData';
import VerticalCard from './Post/VerticalCard';

export default function SelectedPosts({ selectedposts }) {
  return (
    <div className="relativept-8 pb-6 mt-20  w-screen mb-20 bg-gradient-to-r dark:from-slate-400 dark:via-zinc-700 dark:to-gray-900 from-pink-500 to-yellow-500">
      <h3 className="mt-4 pt-8 mb-0 font-Monda  underline-offset-2 mx-auto justify-center text-center">Selected Posts</h3>
      <div className="container mx-auto py-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 px-4 md:px-8 rounded-xl ">
        {selectedposts
        && selectedposts.map((val, i) => {
          if (val.post) {
            const post = FlatWPData(val.post);
            post.excerpt = ''; // dont want to show excerpt
            return (
              <VerticalCard key={val.post.id} post={post} />
            );
          }
          return '';
        })}
      </div>
    </div>
  );
}
