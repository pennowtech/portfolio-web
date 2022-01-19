import React from 'react';
import { FlatWPData } from '@utils/FlatData';
import VerticalCard from './Post/VerticalCard';

export default function SelectedPosts({ selectedposts }) {
  return (
    <div className="relative  pt-8 pb-6 mt-20  w-screen mb-20 ">
      <h3 className="mt-4 mb-0 font-Monda  underline-offset-2 mx-auto justify-center text-center">Selected Posts</h3>
      <div className="w-full lg:max-w-[1167px] lg:mx-auto py-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {selectedposts
        && selectedposts.map((val, i) => {
          const post = FlatWPData(val.post);
          return (
            <VerticalCard key={val.post.id} post={post} />
          );
        })}
      </div>
    </div>
  );
}
