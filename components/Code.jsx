import React from 'react';
import { useTheme } from 'next-themes';
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yLight, a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
// import { coldarkDark as darktheme } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// import { atomOneLight as lighttheme } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
// import { a11yLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

function Code({ node, inline, className, ...props }) {

  const { theme, setTheme } = useTheme();
  const codeTheme = theme === 'light' ? a11yLight : a11yDark;
  const lineHighlight = theme === 'light' ? '#dfefffcc' : '#37415180';

  const hasLang = /language-(\w+)/.exec(className || '');
  const hasMeta = node?.data?.meta;

  const applyHighlights = (applyHighlights) => {
    if (hasMeta) {
      const RE = /{([\d,-]+)}/;
      const metadata = node.data.meta?.replace(/\s/g, '');
      const strlineNumbers = RE?.test(metadata) ? RE?.exec(metadata)[1] : '0';
      const highlightLines = rangeParser(strlineNumbers);
      const highlight = highlightLines;
      const data = highlight.includes(applyHighlights) ? 'highlight' : null;
      data.backgroundColor = lineHighlight;
      data.borderLeft = '4px solid #3b82f6';
      data.marginLeft = '-4px';
      data.marginLeft = '-4px';
      return { data };
    } else {
      return {};
    }
  };

  return hasLang ? (
    <SyntaxHighlighter
      style={codeTheme}
      language={hasLang[1]}
      PreTag='div'
      className='codeStyle text-base'
      showLineNumbers={true}
      wrapLines
      useInlineStyles={true}
      lineProps={applyHighlights}
    >
      {props.children}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props} />
  );
}
export default Code;

