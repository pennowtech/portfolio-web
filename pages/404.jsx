import React from 'react';

import Link from 'next/link';
import PostsLayout from '../components/PostsLayout';

function Error404({ data }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  const {
    header, footer, headerMenus, footerMenus,
  } = data || {};
  return (
    <PostsLayout pageTitle="Looking ..." metaInfo={metaInfo}>
      <div className="h-almost-screen">
        <section className="text-gray-600 body-font">
          <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
            <div
              className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center"
            >
              <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
                Sorry No result found
              </h1>
              <div className="flex justify-center">
                <Link href="/">
                  <div
                    className="button inline-flex border-0 py-2 px-6 focus:outline-none rounded text-lg text-white"
                  >
                    Back
                    to Home
                  </div>
                </Link>
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
