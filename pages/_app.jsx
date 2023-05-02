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
        strategy='lazyOnload'
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
      />
      <Script strategy='lazyOnload'>
        {`
                  window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                  
                    gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
                `}
      </Script>
      <Head>
        <title>My Personal Blog</title>
        <meta name='description' content='My personal Blog on modern software technologies' />
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
          nonce: undefined
        }}
      >
        <div className='appjs w-full '>
          <main className='main min-h-screen'>
            <ThemeProvider attribute='class'>
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
