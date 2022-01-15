import React from 'react';

import Head from 'next/head';
import Script from 'next/script';

import { ThemeProvider } from 'next-themes';
import Header from '../components/Header';
// import '../styles/globals.css'
import 'tailwindcss/tailwind.css';
// import '../styles/prism/prism.css'
// import '../styles/prism/prism-one-light.css'
// import '../public/prism.js'
import '../styles/globals.css';
// import "../styles/articles.module.css";
import ThemeToggle from '../components/ThemeToggle';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>My Personal Blog</title>
        <meta name="description" content="My personal Blog on modern software technologies" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Fira+Code:wght@400&family=Roboto+Condensed&family=Monda&family=Neuton:wght@700&family=Offside&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" integrity="sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm" crossOrigin="anonymous" />
        <Script strategy="beforeInteractive" src="../utils/persistTheme.jsx" />
      </Head>
      <div className="appjs w-full ">

        <main className="min-h-screenshadow-sm font-Merriweather text-base leading-7 dark:bg-gray-600 max-w-[100%] w-full dark:selection:bg-slate-300 dark:selection:text-slate-600  selection:bg-slate-800 selection:text-slate-50 prose dark:prose-invert prose-base prose-a:text-[#f97316] dark:prose-a:text-[#ec4899] hover:prose-a:text-blue-600 prose-a:no-underline prose-pre:p-0 prose-code:text-base md:prose-pre:p-0 lg:prose-pre:p-0 prose-pre:border  prose-pre:bg-inherit dark:prose-ul:marker:bg-white">
          <ThemeProvider attribute="class">

            <Component {...pageProps} />
          </ThemeProvider>

        </main>
      </div>
    </>
  );
}

export default MyApp;
