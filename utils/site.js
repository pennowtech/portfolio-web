const rawVercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
const vercelUrl = rawVercelUrl
  ? /^https?:\/\//i.test(rawVercelUrl)
    ? rawVercelUrl
    : `https://${rawVercelUrl}`
  : 'https://portfolio-web-wheat.vercel.app';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl).replace(/\/+$/, '');

export const absoluteUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${path}`;
};
