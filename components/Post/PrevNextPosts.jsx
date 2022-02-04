import Link from 'next/link';
import React from 'react';
import { useQuery } from 'urql';
import Image from 'next/image';
import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa';
import { FIND_POST_BY_SLUG } from '../../queries/queries';

const PrevNextPosts = ({ curPostSlug }) => {
  const findPost = {
    query: FIND_POST_BY_SLUG,
    variables: { id: curPostSlug },
  };
  const [result, getPosts] = useQuery(findPost);
  const { data, fetching, error } = result;
  if (fetching) return <div>Fetching</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="border-t-2 pt-8  grid md:grid-cols-2 gap-6 w-full my-8 font-Monda">
      {data?.post?.next && (
        <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
          <Image
            alt="..."
            src="/blank.jpg"
            sizes="100%"
            layout="fill"
            objectFit="cover"
          />
          <div className="absolute opacity-70 bg-zinc-900 h-full w-full" />
          <div className="absolute w-full h-full left-0 px-6 py-4">
            <Link href={`/blog/${data.post.next.slug}`}>
              <a className="flex h-full items-center text-white gap-4">
                <FaArrowCircleLeft className="w-2/12 text-2xl" />
                <div className="w-10/12 mb-3 text-md tracking-tight text-left">
                  {data.post.next.title}
                </div>
              </a>
            </Link>
          </div>
        </div>
      )}
      {data?.post?.next && (
        <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer h-28">
          <Image
            alt="..."
            src="/blank.jpg"
            sizes="100%"
            layout="fill"
            objectFit="cover"
          />
          <div className="absolute opacity-70 bg-zinc-900 h-full w-full" />
          <div className="absolute w-full h-full left-0 px-6 py-4">
            <Link href={`/blog/${data.post.prev.slug}`}>
              <a className="flex h-full items-center text-white gap-4">
                <div className="w-10/12 mb-3 text-md tracking-tight text-left">
                  {data.post.prev.title}
                </div>
                <FaArrowCircleRight className="w-2/12 text-2xl" />
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrevNextPosts;
