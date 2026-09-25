import React from 'react';

/**
 * Renders the "Why Read & Core Value Proposition" section with support for
 * structured key-value bullet points (e.g. "Timeless principles: Description..."),
 * bulleted lists, or standard descriptive text.
 */
export default function WhyReadContent({ text, className = '' }) {
  if (!text || typeof text !== 'string' || !text.trim()) return null;

  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  const parsedItems = rawLines.map((line) => {
    const cleanLine = line.replace(/^([-*•]|\d+[.)])\s*/, '').trim();
    const colonIdx = cleanLine.indexOf(':');

    if (
      colonIdx > 0 &&
      colonIdx < cleanLine.length - 1 &&
      !cleanLine.slice(0, colonIdx).includes('/') &&
      !cleanLine.startsWith('http')
    ) {
      const title = cleanLine.slice(0, colonIdx).trim();
      const description = cleanLine.slice(colonIdx + 1).trim();
      return { title, description };
    }
    return { title: null, description: cleanLine };
  });

  const hasStructuredTitles = parsedItems.some((item) => item.title !== null);

  if (hasStructuredTitles || parsedItems.length > 1) {
    return (
      <ul className={`space-y-2.5 my-1 font-sans ${className}`}>
        {parsedItems.map((item, idx) => (
          <li key={idx} className='flex items-start gap-2.5 group'>
            <span className='shrink-0 mt-1.5 size-2 rounded-full bg-indigo-500/40 dark:bg-indigo-400/50 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 group-hover:scale-125 transition-transform' />
            <div className='text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-neutral-200 min-w-0 font-sans'>
              {item.title ? (
                <>
                  <strong className='font-bold text-slate-900 dark:text-white mr-1.5'>{item.title}:</strong>
                  <span className='text-slate-700 dark:text-neutral-300 font-normal'>{item.description}</span>
                </>
              ) : (
                <span className='text-slate-700 dark:text-neutral-300 font-normal'>{item.description}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={`text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-neutral-200 font-sans font-normal ${className}`}
    >
      {text}
    </p>
  );
}
