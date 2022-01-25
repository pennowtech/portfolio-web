import React from 'react';
import { useTheme } from 'next-themes';
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yLight as lighttheme, a11yDark as darktheme } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
// import { coldarkDark as darktheme } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// import { atomOneLight as lighttheme } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

const colorMode = 'dark';

const convertLineStrToArray = (str) => {
  if (str === undefined) return [];

  const lineArray = str.split(',').flatMap((s) => {
    if (!s.includes('-')) return +s;

    const [min, max] = s.split('-');

    return Array.from({ length: max - min + 1 }, (_, n) => n + +min);
  });
  return lineArray;
};

function Code({
  className, children, filename, hl, ...props
}) {
  const { theme, setTheme } = useTheme();
  const codeTheme = theme === 'light' ? lighttheme : darktheme;
  const lineHighlight = theme === 'light' ? '#dfefffcc' : '#37415180';

  const linesToHighlight = convertLineStrToArray(hl);
  const codeText = children.trim();

  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    <SyntaxHighlighter
      language={match[1]}
      children={codeText}
      PreTag="div"
      style={codeTheme}
      wrapLines
      showLineNumbers
      lineProps={(lineNumber) => {
        const style = {
          display: 'block',
          width: '100%',
        };
        if (linesToHighlight.includes(lineNumber)) {
          style.backgroundColor = lineHighlight;
          style.borderLeft = '4px solid #3b82f6';
          style.marginLeft = '-4px';
          style.marginLeft = '-4px';
        }
        return { style };
      }}
      {...props}
    />
  ) : (
    <code className={className} {...props} />
  );
}

export default Code;
