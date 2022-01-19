import React from 'react';

import Head from 'next/head';
import Script from 'next/script';

import { ThemeProvider } from 'next-themes';
import {
  makeOperation, defaultExchanges,
} from 'urql';
// import {  Provider, createClient,} from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { withUrqlClient } from 'next-urql';
import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import { devtoolsExchange } from '@urql/devtools';
import { Provider as AlertProvider } from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';
import Router from 'next/router';
import nProgress from 'nprogress';
import { GRAPHQL_URL } from '../utils/consts';
import { deleteToken, getToken } from '../utils/token';

nProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', () => nProgress.start());
Router.events.on('routeChangeComplete', () => nProgress.done());
Router.events.on('routeChangeError', () => nProgress.done());

const a = {
  query: `
mutation LoginUser {
  login( input: {
    clientMutationId: "uniqueId",
    username: "sdsingh.developer@gmail.com",
    password: "eTR8b5AHG7"
  } ) {
    authToken
    user {
      id
      name
    }
  }
}`,
};

function MyApp({ Component, pageProps }) {
  // const client = createClient({
  // // url: 'https://pennow.tech/graphql',
  //   url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',
  //   exchanges: [devtoolsExchange, ...defaultExchanges],
  //   fetchOptions: () => {
  //     const token = getToken();
  //     console.log(token);
  //     return {
  //       headers: { Authorization: token ? `Bearer ${token}` : '' },
  //     };
  //   },

  // });

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

        <main className="main min-h-screen">
          <ThemeProvider attribute="class">
            {/* <Provider value={client}> */}
            <AlertProvider template={AlertTemplate}>
              <Component {...pageProps} />
            </AlertProvider>
            {/* </Provider> */}
          </ThemeProvider>

        </main>
      </div>
    </>
  );
}

export default withUrqlClient(
  () => ({
    url: GRAPHQL_URL,
    fetchOptions: () => {
      const token = typeof localStorage !== 'undefined' ? getToken() : undefined;
      return {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      };
    },
    exchanges: [devtoolsExchange, ...defaultExchanges],
  }),
  { ssr: false },
)(MyApp);

// export default MyApp;
