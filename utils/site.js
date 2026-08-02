const DEFAULT_SITE_URL = 'https://singhbuildstech.com';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

export const absoluteUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${path}`;
};
