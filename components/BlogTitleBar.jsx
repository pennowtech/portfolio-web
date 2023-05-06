import React from 'react';

import { BsPencil } from 'react-icons/bs';
import Image from 'next/legacy/image';
import Link from 'next/link';
import PostDate from './Post/PostDate';

const BlogTitleBar = ({ postMeta }) => {
  if (!postMeta) {
    return null;
  }
  const [month, year] = postMeta.date.split(',');
  const readingTime = Math.ceil(postMeta.readingTime.minutes);

  // if colors dont reflect, then add that color under safelist variaable in tailwind.config.js
  const bgColor = postMeta.tags.map((tag) => `bg-${tag.color || 'stone'}-500`);

  return (
    <div className='relative w-full h-[280px] md:h-[480px] overflow-hidden mb-8 left-0'>
      <Image
        src={`/${postMeta.thumbnailUrl}`}
        alt={postMeta.title}
        layout='fill'
        className='object-cover w-full bg-center opacity-93  dark:grayscale'
      />
      <div className='absolute bg-gradient-to-b from-[#32323200] to-[#100f0fed] h-full w-full' />
      <div className='w-full absolute text-white font-RobotoSlab flex flex-col items-end pr-2 drop-shadow-lg'>
        <span className='text-xl leading-0 font-semibold'>{month.slice(0, 3)}</span>
        <span className='-mt-1 text-base '>{year.trim()}</span>
      </div>
      <div className='md:max-w-screen-lg xl:max-w-[1048px] mx-auto'>
        <div className='absolute w-full bottom-0 text-white justify-center leading-4 md:max-w-screen-lg xl:max-w-[1048px] items-center mx-auto'>
          <div className='my-4  text-sm md:text-base font-Comic  flex gap-x-4'>
            {postMeta.tags.map((tag, idx) => (
              <Link
                href={`/tag/${tag.name}`}
                key={tag.id}
                className={`${bgColor[idx]} text-white rounded-full px-2 md:px-3`}
              >
                {tag.name}
              </Link>
            ))}
          </div>

          <div className='flex mb-4'>
            <div className=' border-r border-slate-200 mr-4'>
              <BsPencil className='mt-3 mr-2 md:m-4 md:pr-4 text-xl md:text-5xl' />
            </div>
            <div className='relative'>
              <h1 className='mb-2 font-Neuton text-3xl md:text-5xl pr-4 text-slate-50'>{postMeta.title}</h1>
              <div className='flex my-4 text-zinc-400 font-Monda text-xs gap-x-4 md:gap-x-12'>
                <PostDate date={postMeta.date} readingTime={readingTime} author={postMeta.author} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogTitleBar;
