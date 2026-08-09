import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PostDate from './Post/PostDate';

const normalizeImageUrl = (thumbnailUrl) => {
  if (!thumbnailUrl) return '/blank.jpg';
  if (/^https?:\/\//.test(thumbnailUrl) || thumbnailUrl.startsWith('/')) return thumbnailUrl;
  return `/${thumbnailUrl}`;
};

const BlogTitleBar = ({ postMeta }) => {
  if (!postMeta) return null;

  const tags = postMeta.tags ?? [];
  const readingTime = postMeta.readingTime?.minutes ?? postMeta.readingTime;

  return (
    <header className='relative isolate min-h-[22rem] w-full overflow-hidden md:min-h-[28rem]'>
      <Image
        src={normalizeImageUrl(postMeta.thumbnailUrl)}
        alt=''
        role='presentation'
        fill
        priority
        sizes='100vw'
        className='object-cover object-center dark:grayscale'
      />
      <div className='absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-950/55 to-slate-950/95' />

      <div className='relative mx-auto flex min-h-[22rem] w-full max-w-[1048px] flex-col justify-end px-4 pb-10 text-white md:min-h-[28rem] md:px-6 md:pb-14 lg:px-8'>
        {tags.length > 0 && (
          <div className='mb-5 flex flex-wrap gap-2 font-Monda text-xs font-semibold'>
            {tags.map((tag) => (
              <Link
                href={`/tag/${tag.name}`}
                key={tag.id || tag.name}
                className='rounded-full border border-white/50 bg-slate-950/25 px-3 py-1 text-white backdrop-blur-sm transition hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <h1 className='mb-5 max-w-4xl font-Neuton text-4xl font-semibold leading-[1.05] text-white drop-shadow md:text-6xl'>
          {postMeta.title}
        </h1>

        <PostDate date={postMeta.date} readingTime={readingTime} author={postMeta.author} variant='photoHero' />
      </div>
    </header>
  );
};

export default BlogTitleBar;
