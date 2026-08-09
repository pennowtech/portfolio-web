import React from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import { DUMMY_ARTICLE } from '@utils/dummyArticle';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../utils/consts';
import PostList from '../../components/PostList';

import Link from 'next/link';
import ImageWithFallback from '@components/ImageWithFallback';
import PostCategories from '@components/Post/PostCategories';
import PostDate from '@components/Post/PostDate';
import PostTags from '@components/Post/PostTags';

const Index = ({ postsToShow, totalPosts, recentPosts }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const metaInfo = {
    title: 'Software Architecture and Engineering Articles | SinghBuildsTech',
    metaKeywords: 'Software Architecture, Embedded Systems, Rust, C++, Python, Distributed Systems',
    metaDesc:
      'Practical articles on software architecture, embedded systems, distributed platforms, programming, and engineering decisions.'
  };

  const featuredHeroPost = postsToShow?.[0];
  const remainingPosts = postsToShow?.slice(1) ?? [];

  const categoriesList = [
    'All',
    ...new Set(postsToShow?.flatMap((p) => p.categories?.name || p.categories || []).filter(Boolean))
  ];

  const filteredPosts =
    selectedCategory === 'All'
      ? remainingPosts
      : remainingPosts.filter((p) => {
          const cats = p.categories?.name || p.categories || [];
          return Array.isArray(cats) ? cats.includes(selectedCategory) : cats === selectedCategory;
        });

  return (
    <PostsLayout pageTitle='Articles' metaInfo={metaInfo} recentPosts={recentPosts}>
      {/* Featured Hero Article */}
      {featuredHeroPost && (
        <article className='not-prose group mb-12 relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:border-orange-500/40 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90'>
          <div className='grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]'>
            <div className='relative min-h-[18rem] overflow-hidden lg:min-h-[24rem]'>
              <ImageWithFallback
                src={featuredHeroPost.thumbnailUrl}
                alt={featuredHeroPost.title}
                className='object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105'
                layout='fill'
                priority
                sizes='(max-width: 1023px) 100vw, 58vw'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent' />
              <span className='absolute top-4 left-4 rounded-full border border-orange-500/40 bg-slate-950/80 px-3 py-1 font-Monda text-xs font-bold text-orange-400 backdrop-blur-md shadow-md'>
                🔥 Featured Article
              </span>
              <PostCategories categories={featuredHeroPost.categories} variant='card' />
            </div>
            <div className='flex flex-col justify-center p-6 sm:p-8 lg:p-10'>
              <Link href={`/blog/${featuredHeroPost.slug}`}>
                <h2 className='mb-4 mt-2 font-Neuton text-3xl font-semibold leading-tight text-slate-900 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400 sm:text-4xl'>
                  {featuredHeroPost.title}
                </h2>
              </Link>
              <p className='mb-6 line-clamp-3 text-base leading-relaxed text-slate-600 dark:text-slate-300'>
                {featuredHeroPost.description}
              </p>
              <div className='mt-auto border-t border-slate-100 pt-4 dark:border-slate-800/80'>
                <PostDate
                  date={featuredHeroPost.date}
                  readingTime={featuredHeroPost.readingTime?.minutes ?? featuredHeroPost.readingTime}
                  variant='hero'
                />
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Category Pills Filter */}
      <div className='mb-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800'>
        <span className='mr-2 font-Monda text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300'>
          Filter by:
        </span>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type='button'
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 font-Monda text-xs font-bold transition duration-200 ${
              selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-md dark:bg-orange-500'
                : 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredPosts.length > 0 ? (
        <PostList posts={filteredPosts} />
      ) : (
        <p className='py-8 text-center text-slate-500 dark:text-slate-300 font-Monda'>
          No articles found in this category.
        </p>
      )}
      <div className='mt-10'>
        <Pagination totalPosts={totalPosts} postName='page' />
      </div>
    </PostsLayout>
  );
};
export const getStaticProps = async () => {
  const notionPosts = await getPublishedBlogPosts();
  // TODO(dummy-content): Keep the local fixture in the full listing until explicitly removed.
  const posts = [{ ...DUMMY_ARTICLE, thumbnailUrl: `/${DUMMY_ARTICLE.thumbnailUrl}` }, ...notionPosts];
  // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  // const data = await res.json();

  const startIndex = 0; // index page is always zero.
  const postsToShow = posts?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  const totalPosts = posts.length;

  return {
    props: {
      postsToShow,
      totalPosts,
      recentPosts: posts.slice(0, RECENT_POSTS_COUNT)
    },
    revalidate: 60
  };
};

export default Index;
