import {
  dedupExchange, cacheExchange, fetchExchange, ssrExchange, defaultExchanges,
} from 'urql/core';
import { initUrqlClient } from 'next-urql';
import { createClient } from 'urql';

import { devtoolsExchange } from '@urql/devtools';
import { getToken } from './token';
import { GRAPHQL_URL } from './consts';

const isServerSide = typeof window === 'undefined';
const ssrCache = ssrExchange({ isClient: !isServerSide });
const gqlClient = () => createClient(
  {
    url: GRAPHQL_URL,
    fetchOptions: () => {
      const token = typeof localStorage !== 'undefined' ? getToken() : undefined;
      return {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      };
    },
    exchanges: [devtoolsExchange, dedupExchange, cacheExchange, ssrCache, fetchExchange],
  },
  false,
);

const gqlAuthClient = (secured = true) => (createClient({
  url: GRAPHQL_URL,
  fetchOptions: () => {
    const token = typeof localStorage !== 'undefined' ? getToken() : undefined;
    return {
      headers: { authorization: token && secured ? `Bearer ${token}` : '' },
    };
  },
  exchanges: [devtoolsExchange, ...defaultExchanges],
}));

export { gqlClient, ssrCache, gqlAuthClient };
