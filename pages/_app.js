import Head from 'next/head';
import { Navbar } from '../components/Navbar';
import { Element } from 'react-scroll';

import { BlogMain } from '../components/BlogMain';
// import '../styles/prism/prism.css'
// import '../styles/prism/prism-one-light.css'
// import '../public/prism.js'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>My Personal Blog</title>
        <meta name='description' content='My personal Blog on modern software technologies' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className="container md:max-w-screen-lg xl:max-w-[1167px] mx-auto ">
        <Navbar />

        <main className='min-h-screenshadow-sm '>

          <h1 className="text-3xl font-bold underline items-center text-green-500">
            Hello world!
          </h1>
          <Component {...pageProps} />

          <Element name="home" className="element min-h-[1500px]" >
            test 1
          </Element>

          <Element name="explore" className="element min-h-[1500px]">
            <BlogMain />

          </Element>
          <Element name="notifications" className="element min-h-[1500px]">
            test 3
          </Element>
        </main>
      </div>
    </>
  )
}

export default MyApp
