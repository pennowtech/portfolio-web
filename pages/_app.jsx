import React, { useEffect } from 'react';

import Head from 'next/head';
import Script from 'next/script';
import Router, { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';

import nProgress from 'nprogress';
import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

import { logPageView } from '@utils/ga';

nProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', () => nProgress.start());
Router.events.on('routeChangeComplete', () => nProgress.done());
Router.events.on('routeChangeError', () => nProgress.done());

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => {
      logPageView(url);
    };

    // when the component is mounted subscribe to router changes
    // and log those views
    router.events.on('routeChangeComplete', handleRouteChange);

    // unsubscribe from route change on unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
      />
      <Script strategy="lazyOnload">
        {`
                  window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                  
                    gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
                `}
      </Script>
      <Head>
        <title>My Personal Blog</title>
        <meta
          name="description"
          content="My personal Blog on modern software technologies"
        />
        <link rel="icon" href="/Logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2??family=Barlow:wght@400;700&family=Comic+Neue:wght@700&family=Inter:wght@400&family=Noto+Sans+JP:wght@400&family=Roboto+Slab:wght@400;700&family=Merriweather&family=Fira+Code:wght@400&family=Roboto+Condensed&family=Monda&family=Neuton:wght@700&family=Offside&family=Rajdhani:wght@300;500&family=Yantramanav:wght@400;500&family=Barlow+Condensed&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://use.fontawesome.com/releases/v5.15.4/css/all.css"
          integrity="sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm"
          crossOrigin="anonymous"
        />
        <Script strategy="beforeInteractive" src="../utils/persistTheme.jsx" />
      </Head>
      {/* <Script
        src="https://www.google.com/recaptcha/api.js?render=6LffScwlAAAAADpicS4xvbjFg3tSTnCVOTkaMrld"
      /> */}
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_GOOGLE_CAPATCHA_SITE_KEY}
        scriptProps={{
          async: false, // optional, default to false,
          defer: true, // optional, default to false
          appendTo: 'body', // optional, default to "head", can be "head" or "body",
          nonce: undefined,
        }}
      >
        <div className="appjs w-full ">
          <main className="main min-h-screen">
            <ThemeProvider attribute="class">
              {/* <Provider value={client}> */}
                <Component {...pageProps} />
              {/* </Provider> */}
            </ThemeProvider>
          </main>
        </div>
      </GoogleReCaptchaProvider>
    </>
  );
}

export default MyApp;
