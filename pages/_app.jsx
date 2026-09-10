import React from 'react';

import Head from 'next/head';
import Router from 'next/router';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';

import nProgress from 'nprogress';
import '../styles/globals.css';
import Footer from '@components/Footer';
import Analytics from '@components/Analytics';
import PrivacyConsent from '@components/PrivacyConsent';

import { LanguageProvider } from '../utils/LanguageContext';

nProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', () => nProgress.start());
Router.events.on('routeChangeComplete', () => nProgress.done());
Router.events.on('routeChangeError', () => nProgress.done());

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isIssueboard = router.pathname.startsWith('/admin/issues');

  return (
    <LanguageProvider>
      <Analytics />
      <Head>
        <title>SinghBuildsTech | Sukhdeep Singh, Technical Architect</title>
        <meta
          name='description'
          content='Technical Architect sharing practical work and writing on software architecture, embedded systems, distributed platforms, and engineering.'
        />
      </Head>
      <ThemeProvider attribute='class'>
        <div className='appjs flex min-h-screen w-full flex-col'>
          <main className='main flex-1'>
            <Component {...pageProps} />
          </main>
          {!isIssueboard && <Footer />}
          {!isIssueboard && <PrivacyConsent />}
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default MyApp;
