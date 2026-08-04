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
  const [copied, setCopied] = React.useState(false);
  const isDark = resolvedTheme === 'dark';
  const codeTheme = isDark ? a11yDark : a11yLight;
  const lineHighlight = isDark ? '#14532d66' : '#dcfce7cc';

  const language = /language-(\w+)/.exec(className || '')?.[1];
  const metadata = node?.data?.meta?.replace(/\s/g, '') ?? '';
  const lineRange = /{([\d,-]+)}/.exec(metadata)?.[1] ?? '';
  const highlightedLines = parseLineRanges(lineRange);
  const codeString = String(props.children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className='relative group'>
      <button
        type='button'
        onClick={handleCopy}
        className='absolute right-2 top-2 z-10 rounded-lg border border-slate-300 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 backdrop-blur-sm transition duration-200 hover:bg-slate-700 hover:text-white dark:border-slate-700 opacity-90 group-hover:opacity-100'
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
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
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export default Code;
