import Link from 'next/link';
import React from 'react';
import Image from "next/legacy/image";
import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa';
import { BASE_URL } from '../../utils/consts';

const PrevNextPosts = ({ postsNextPrevInfo }) => (
  <div className="border-t-2 pt-8  grid md:grid-cols-2 gap-6 w-full my-8 font-semibold font-Monda text-lg ">
    {postsNextPrevInfo?.prevPostLink && (
    <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
      <Image alt="..." src={`${postsNextPrevInfo?.prevPostImg}`} sizes="100%" layout="fill" objectFit="cover" />
      <div className="absolute opacity-30 bg-zinc-900 h-full w-full" />
      <div className="absolute w-full h-full left-0 px-6 py-4">
        <Link
          href={`/blog/${postsNextPrevInfo.prevPostLink}`}
          className="flex h-full items-center text-white gap-4">

          <FaArrowCircleLeft className="w-2/12 text-2xl" />
          <div className="w-10/12 mb-3leading-7 tracking-tight text-left">{postsNextPrevInfo?.prevPostTitle}</div>

        </Link>
      </div>
    </div>
    )}
    {postsNextPrevInfo?.nextPostLink && (
    <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
      <Image alt="..." src={`${postsNextPrevInfo?.nextPostImg}`} sizes="100%" layout="fill" objectFit="cover" />
      <div className="absolute opacity-30 bg-zinc-900 h-full w-full" />
      <div className="absolute w-full h-full left-0 px-6 py-4">
        <Link
          href={`/blog/${postsNextPrevInfo.nextPostLink}`}
          className="flex h-full items-center text-white gap-4">

          <div className="w-10/12 mb-3 leading-7 tracking-tight text-left">{postsNextPrevInfo?.nextPostTitle}</div>
          <FaArrowCircleRight className="w-2/12 text-2xl" />

        </Link>
      </div>
    </div>
    )}
  </div>
);

export default PrevNextPosts;
