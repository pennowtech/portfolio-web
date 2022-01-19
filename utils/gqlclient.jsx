import {
  dedupExchange, cacheExchange, fetchExchange, ssrExchange,
} from 'urql/core';
import { initUrqlClient } from 'next-urql';

import { devtoolsExchange } from '@urql/devtools';

const isServerSide = typeof window === 'undefined';
const ssrCache = ssrExchange({ isClient: !isServerSide });
const gqlClient = initUrqlClient(
  {
    url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',
    exchanges: [devtoolsExchange, dedupExchange, cacheExchange, ssrCache, fetchExchange],
  },
  false,
);
export { gqlClient, ssrCache };
