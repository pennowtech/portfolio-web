import React from 'react';
import { useTheme } from 'next-themes';
import Image from "next/legacy/image";
import ReactMarkdown from 'react-markdown';
import CodeComponents from './Code';
import YouTube from './YouTube';



import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import {oneLight as lighttheme, oneDark as darktheme } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import cpp from 'react-syntax-highlighter/dist/cjs/languages/prism/cpp';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('json', json);



const MDXComponents = {
  YouTube,
  Image,
};
const Article = ({ mdxSource }) => {

  const syntaxTheme = darktheme;

  const { theme, setTheme } = useTheme();
  const codeTheme = theme === 'light' ? lighttheme : darktheme;
  const lineHighlight = theme === 'light' ? '#dfefffcc' : '#37415180';

  const MarkdownComponents = {
    code({ node, inline, className, ...props }) {
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
          className='codeStyle'
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
  };

  return (
    <article id='post' className='prose-a:text-[#0366d6] dark:prose-a:text-blue-300 text-base leading-7 prose-hr:my-2'>
      <ReactMarkdown components={CodeComponents}>{mdxSource}</ReactMarkdown>
    </article>
  );
}

export default Article;
