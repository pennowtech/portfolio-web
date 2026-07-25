import React from 'react';
import { useTheme } from 'next-themes';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark, a11yLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const parseLineRanges = (value = '') =>
  value.split(',').flatMap((part) => {
    const [start, end = start] = part.split('-').map(Number);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  });

function Code({ node, inline, className, ...props }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const codeTheme = isDark ? a11yDark : a11yLight;
  const lineHighlight = isDark ? '#14532d66' : '#dcfce7cc';

  const language = /language-(\w+)/.exec(className || '')?.[1];
  const metadata = node?.data?.meta?.replace(/\s/g, '') ?? '';
  const lineRange = /{([\d,-]+)}/.exec(metadata)?.[1] ?? '';
  const highlightedLines = parseLineRanges(lineRange);

  const lineProps = (lineNumber) => ({
    style: highlightedLines.includes(lineNumber)
      ? {
          display: 'block',
          marginLeft: '-0.75rem',
          paddingLeft: '0.5rem',
          backgroundColor: lineHighlight,
          borderLeft: '4px solid #15803d'
        }
      : { display: 'block' }
  });

  if (!language) {
    return (
      <code
        className={`${className || ''} rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100`}
        {...props}
      />
    );
  }

  return (
    <SyntaxHighlighter
      style={codeTheme}
      language={language}
      PreTag='div'
      className='codeStyle max-w-full overflow-x-auto rounded-xl text-sm font-medium md:text-base'
      customStyle={{ margin: 0, padding: '1rem', minWidth: 0 }}
      codeTagProps={{ style: { whiteSpace: 'pre' } }}
      showLineNumbers
      wrapLines
      wrapLongLines={false}
      useInlineStyles
      lineProps={lineProps}
    >
      {String(props.children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
}

export default Code;
