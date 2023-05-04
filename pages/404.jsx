import React from 'react';

import Link from 'next/link';
import PostsLayout from '../components/PostsLayout';

function Error404({ data }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: ''
  };
  const { header, footer, headerMenus, footerMenus } = data || {};
  return (
    <PostsLayout metaInfo={metaInfo}>
      <div className='h-almost-screen'>
        <section>
          <div className='flex items-center justify-center py-12'>
            <div className=' border rounded-md flex items-center justify-center mx-4 md:w-2/3 '>
              <div className='flex flex-col items-center py-16 '>
                <img className='px-4 hidden md:block' src='https://i.ibb.co/9Vs73RF/undraw-page-not-found-su7k-1-3.png' alt='' />
                <img className='md:hidden' src='https://i.ibb.co/RgYQvV7/undraw-page-not-found-su7k-1.png' alt='' />
                <h1 className='px-4 pt-8 pb-4 text-center text-5xl font-bold leading-10'>OOPS! </h1>
                <p className='px-4 pb-10 font-medium text-base leading-none text-center'>
                  Sorry! we cannot find the page you are looking for{' '}
                </p>
                <div className='flex justify-center'>
                  <Link href='/'>
                    <div className='button inline-flex border-0 py-2 px-6 focus:outline-none rounded text-base md:text-lg'>
                      Back to Home
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PostsLayout>
  );
}

export default Error404;

// export async function getStaticProps() {
//   const { data } = await client.query({
//     query: GET_MENUS,
//   });

//   return {
//     props: {
//       data: data || {},
//     },
//   };
// }
