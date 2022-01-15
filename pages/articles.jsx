import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCaretRight } from 'react-icons/fa';

const posts = [{
  thumbnailUrl: '/builder_design_pattern.png',
  title: 'Builder Design Pattern Explained Easily',
  author: 'Sukhdeep Singh',
  categories:
  ['Design Pattern'],
  date: 'May, 2021',
  description: 'The builder pattern helps to separate the construction of a complex object from its representation so that the same construction process can produce different representations(outputs).',
  post_status: 'publish',
  post_type: 'post',
  link: '/blog/builder-design-pattern-explained-easily',
  tags:
  ['Design Patterns',
    'UML',
    'Programming'],
},
{
  thumbnailUrl: '/laptop.jpg',
  title: 'Builder Design Pattern Explained Easily',
  author: 'Sukhdeep Singh',
  categories:
  ['Design Pattern'],
  date: 'May, 2021',
  description: 'The builder pattern helps to separate the construction of a complex object from its representation so that the same construction process can produce different representations (output). process can produce different representations (outputs).',
  post_status: 'publish',
  post_type: 'post',
  link: '/blog/builder-design-pattern-explained-easily',
  tags:
  ['Design Patterns',
    'UML',
    'Programming'],
}];
export default function Articles({ selectedposts }) {
  return (
    <div className="w-full lg:max-w-[1167px] lg:mx-auto p-4 lg:py-12 ">
      <h1 className="mt-8">Articles</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-8 overflow-hidden ">
        <div className="col-span-2 mb-8">

          {posts.map((post, index) => (
            <div key={index} className="col-span-2 overflow-hidden mb-8">
              <Link href={`/blog/${post.blog}`}>
                <div>
                  <div className="relative w-full max-h-[350px]">
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.title}
                      className="object-cover w-full rounded-xl"
                      width={800}
                      height={350}
                    />
                    {post.categories && (
                    <div className="absolute py-2.5 top-0 inset-x-0 text-white flex text-xs leading-4">
                      <div className="bg-red-500 shadow-xl font-medium font-Offside m-4 rounded-full px-2 py-1 md:px-4">{post.categories}</div>
                    </div>
                    )}

                  </div>
                  <h3 className="hover:text-blue-700 mt-4 mb-1 text-3xl text-semibold font-Neuton">{post.title}</h3>
                </div>
              </Link>
              <div className="mt-4">
                <small className="my-1 text-muted">{post.date}</small>
                <p className="md:my-4">
                  {`${post.description.substring(0, 180)} ...`}
                  <div className="inline-block pl-2">
                    <FaCaretRight className="inline-block mr-1" />
                    <Link href={post.link} prefetch>
                      Read Now
                    </Link>
                  </div>
                </p>
                <p />
                <div className="my-4 flex font-Offside text-xs gap-x-4">
                  {post.tags.slice(0, 2).map((tag, idx) => (
                    <div
                      key={tag + idx}
                      className="bg-gray-100 rounded-full px-2 py-1 md:px-4"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="font-Monda ">
          <div className="font-medium mx-auto rounded-full px-2 py-1 md:px-4 cursor-pointer">
            <Link href="articles">
              View all articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
