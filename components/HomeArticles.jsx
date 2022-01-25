import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomeArticles({ posts, selectedposts }) {
  return (
    <div>
      {selectedposts
        && selectedposts.map((post, i) => (
          <h3 key={post.title + i}>{post.title}</h3>
        ))}
      <div className="py-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <div key={index} className="max-w-sm rounded overflow-hidden shadow-lg mb-6  ">
            <Link href={`/blog/${post.blog}`}>
              <div className="grow rounded-lg cursor-pointer ">
                <div className="rounded-lg">
                  <div className="relative rounded-t-lg overflow-hidden">
                    <Image
                      src={post.frontMatter.thumbnailUrl}
                      alt={post.frontMatter.title}
                      layout="intrinsic"
                      className="object-cover w-full"
                      width={700}
                      height={475}
                    />
                    {post.frontMatter.categories && (
                    <div className="absolute py-2.5 top-0 inset-x-0 text-white flex text-xs leading-4">
                      <div className="bg-red-500 shadow-xl font-medium m-4 rounded-full px-2 py-1 md:px-4">{post.frontMatter.categories}</div>
                    </div>
                    )}

                  </div>
                </div>
                <div className="px-6 py-4">
                  <h3 className="md:text-2xl text-semibold font-Neuton">{post.frontMatter.title}</h3>
                  {/* <p className="md:my-4 md:leading-7 hidden md:block text-sm">{post.frontMatter.description}</p> */}
                  <p>
                    <small className="text-muted">{post.frontMatter.date}</small>
                  </p>
                  <div className="my-4 flex font-Monda text-xs gap-x-4">
                    {post.frontMatter.tags.slice(0, 2).map((tag, idx) => (
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
            </Link>
          </div>
        ))}

      </div>
      <div className="grid font-Monda justify-center">
        <div className="bg-green-600 dark:bg-slate-800 dark:hover:bg-slate-00 text-cyan-100 shadow-xl font-medium mx-auto rounded-full px-2 py-1 md:px-4 cursor-pointer">
          <Link href="/articles">
            View all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
