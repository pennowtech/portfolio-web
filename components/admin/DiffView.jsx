import React, { useMemo } from 'react';
import { diffWords } from './wordDiff';

export const DiffView = ({ before, after }) => {
  const parts = useMemo(() => diffWords(before, after), [before, after]);
  return (
    <div className='whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed'>
      {parts.map((part, index) => {
        if (part.type === 'added')
          return (
            <mark
              key={index}
              className='rounded bg-emerald-200/70 text-emerald-950 no-underline dark:bg-emerald-500/30 dark:text-emerald-100'
            >
              {part.value}
            </mark>
          );
        if (part.type === 'removed')
          return (
            <del
              key={index}
              className='rounded bg-rose-200/60 text-rose-900 decoration-rose-700/60 dark:bg-rose-500/25 dark:text-rose-200'
            >
              {part.value}
            </del>
          );
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
};

export default DiffView;
