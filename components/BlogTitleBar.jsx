import React from 'react';

import { BsPencil, BsCalendar3 } from 'react-icons/bs';
import { FiUser } from 'react-icons/fi';
import { BiTimer } from 'react-icons/bi';
import Image from 'next/image';

const BlogTitleBar = ({ frontMatter }) => {
  const [month, year] = frontMatter.date.split(',');
  console.log(year);
  console.log(month);
  const color = ['bg-red-600', 'bg-blue-700', 'bg-green-700'];

  return (
    <div className="relative w-full h-[280px] md:h-[480px] overflow-hidden mb-8 left-0">
      <Image
        src={`/${frontMatter.thumbnailUrl}`}
        alt={frontMatter.title}
        layout="fill"
        className="object-cover w-full bg-center opacity-93  dark:grayscale"
      />
      <div className="absolute bg-gradient-to-b from-[#32323200] to-[#100f0fed] h-full w-full" />
      <div className="w-full absolute text-white font-regular flex flex-col items-end pr-2 drop-shadow-lg">
        <span className="text-xl leading-0 font-semibold">{month.slice(0, 3)}</span>
        <span className="-mt-1 text-3xl ">{year.trim().slice(2, 4)}</span>
      </div>
      <div className="md:max-w-screen-lg xl:max-w-[1167px] mx-auto">
        <div className="absolute mx-4 w-full bottom-0 text-white justify-center leading-4 md:max-w-screen-lg xl:max-w-[1167px] items-center mx-auto">
          <div className="my-4 text-white text-sm md:text-base font-Offside  flex gap-x-4">
            {frontMatter.tags.map((tag, idx) => (
              <div
                key={tag + idx}
                className={`${color[idx]} rounded-full px-2 md:px-6`}
              >
                {tag}
              </div>
            ))}
          </div>

          <div className="flex mb-4">
            <div className=" border-r border-slate-200 mr-4">
              <BsPencil className="mt-3 mr-2 md:m-4 md:pr-4 text-xl md:text-5xl" />
            </div>
            <div className="relative">
              <h1 className="mb-2 font-Neuton text-3xl md:text-6xl pr-4 text-slate-50">
                {frontMatter.title}
              </h1>
              <div className="flex my-4 text-zinc-400 font-Monda text-xs inline gap-x-4 md:gap-x-12">
                <div className="flex">
                  <FiUser className="text-base mr-2" />
                  {frontMatter.author}
                </div>
                <div className="flex">
                  <BsCalendar3 className="text-base mr-2" />
                  {frontMatter.date}
                </div>
                <div className="flex">
                  <BiTimer className="text-base mr-2" />
                  {frontMatter.readingTime.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogTitleBar;
