import React, { useEffect, useState } from 'react';

const readHeadings = () => {
  const article = document.getElementById('post');
  if (!article) return [];

  return [...article.querySelectorAll('h2, h3, h4')]
    .filter((heading) => heading.id)
    .map((heading) => ({
      id: heading.id,
      title: heading.textContent,
      depth: Number(heading.tagName.slice(1))
    }));
};

const ContentsList = ({ headings }) => (
  <ol className='m-0 list-none space-y-1 p-0'>
    {headings.map((heading) => (
      <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.depth - 2) * 0.85}rem` }}>
        <a
          href={`#${heading.id}`}
          className='block rounded-md px-2 py-1.5 text-sm leading-snug text-slate-600 transition hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-slate-300 dark:hover:text-green-400'
        >
          {heading.title}
        </a>
      </li>
    ))}
  </ol>
);

function ToC({ content }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeadings(readHeadings()));
    return () => window.cancelAnimationFrame(frame);
  }, [content]);

  if (!headings.length) return null;

  return (
    <>
      <details className='rounded-lg border border-slate-200 bg-white dark:border-slate-500 dark:bg-gray-700 xl:hidden'>
        <summary className='min-h-11 cursor-pointer px-4 py-3 font-Monda font-semibold marker:text-slate-500'>
          On this page
        </summary>
        <nav aria-label='Article contents' className='border-t border-slate-200 px-3 py-3 dark:border-slate-500'>
          <ContentsList headings={headings} />
        </nav>
      </details>

      <nav
        aria-label='Article contents'
        className='sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto border-l border-slate-300 pl-5 dark:border-slate-500 xl:block'
      >
        <p className='mb-3 mt-0 font-Monda text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300'>
          On this page
        </p>
        <ContentsList headings={headings} />
      </nav>
    </>
  );
}

export default ToC;
