import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa';
import { BASE_URL } from '../../utils/consts';

const PrevNextPosts = ({ postsNextPrevInfo }) => (
  <div className="border-t-2 pt-8  grid md:grid-cols-2 gap-6 w-full my-8 font-Monda">
    {postsNextPrevInfo?.nextPostLink && (
    <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
      <Image
        alt="..."
        src={`${BASE_URL}${postsNextPrevInfo?.nextPostImg}`}
        sizes="100%"
        layout="fill"
        objectFit="cover"
      />
      <div className="absolute opacity-70 bg-zinc-900 h-full w-full" />
      <div className="absolute w-full h-full left-0 px-6 py-4">
        <Link href={`/blog/${postsNextPrevInfo.nextPostLink}`}>
          <a className="flex h-full items-center text-white gap-4">
            <FaArrowCircleLeft className="w-2/12 text-2xl" />
            <div className="w-10/12 mb-3 text-md tracking-tight text-left">
              {postsNextPrevInfo?.nextPostTitle}
            </div>
          </a>
        </Link>
      </div>
    </div>
    )}
    {postsNextPrevInfo?.prevPostLink && (
    <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
      <Image
        alt="..."
        src={`${BASE_URL}${postsNextPrevInfo?.prevPostImg}`}
        sizes="100%"
        layout="fill"
        objectFit="cover"
      />
      <div className="absolute opacity-70 bg-zinc-900 h-full w-full" />
      <div className="absolute w-full h-full left-0 px-6 py-4">
        <Link href={`/blog/${postsNextPrevInfo.prevPostLink}`}>
          <a className="flex h-full items-center text-white gap-4">
            <div className="w-10/12 mb-3 text-md tracking-tight text-left">
              {postsNextPrevInfo?.prevPostTitle}
            </div>
            <FaArrowCircleRight className="w-2/12 text-2xl" />
          </a>
        </Link>
      </div>
    </div>
    )}
  </div>
);

export default PrevNextPosts;
