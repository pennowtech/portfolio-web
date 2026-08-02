import React, { useState } from 'react';

const childText = (children) =>
  (Array.isArray(children) ? children : [children])
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .join('')
    .trim();

const EmbedFrame = ({ src, title, provider, className = 'h-[520px]' }) => {
  const [enabled, setEnabled] = useState(false);
  return (
    <span className='my-8 block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
      {enabled ? (
        <iframe
          src={src}
          title={title}
          loading='lazy'
          className={`w-full ${className}`}
          frameBorder='0'
          allowFullScreen
        />
      ) : (
        <span className='flex min-h-44 flex-col items-center justify-center p-6 text-center'>
          <span className='text-sm text-slate-600 dark:text-slate-300'>Loading this post connects to {provider}.</span>
          <button
            type='button'
            onClick={() => setEnabled(true)}
            className='mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800'
          >
            Load {provider} post
          </button>
        </span>
      )}
    </span>
  );
};

const linkedInEmbedUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.linkedin.com' && url.pathname.startsWith('/embed/')
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

export const LinkedInEmbed = ({ children }) => {
  const src = linkedInEmbedUrl(childText(children));
  if (!src)
    return (
      <span
        role='note'
        className='my-6 block rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900'
      >
        LinkedIn embed unavailable. Paste the HTTPS src URL from LinkedIn&apos;s Embed this post option.
      </span>
    );
  return <EmbedFrame src={src} title='Embedded LinkedIn post' provider='LinkedIn' />;
};

export const TwitterEmbed = ({ children }) => {
  const value = childText(children);
  const match = value.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i) || value.match(/^(\d+)$/);
  if (!match)
    return (
      <span
        role='note'
        className='my-6 block rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900'
      >
        X/Twitter embed unavailable. Paste a complete post URL.
      </span>
    );
  return (
    <EmbedFrame
      src={`https://platform.twitter.com/embed/Tweet.html?id=${match[1]}&dnt=true`}
      title='Embedded X or Twitter post'
      provider='X/Twitter'
      className='h-[560px]'
    />
  );
};
