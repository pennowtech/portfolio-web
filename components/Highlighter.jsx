import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark as darktheme, base16AteliersulphurpoolLight as lighttheme } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const colorMode = 'light';
const theme = colorMode === 'light' ? lighttheme : darktheme;
const lineHighlight = colorMode === 'light' ? '#dfefffcc' : '#37415180';

const convertLineStrToArray = (str) => str.split(',').flatMap((s) => {
  if (!s.includes('-')) return +s;

  const [min, max] = s.split('-');

  return Array.from({ length: max - min + 1 }, (_, n) => n + +min);
});

// const Highlighter = (props) => {
//   const result = props.linesToHighlight.split(",");
//   var linesToHighlight = convertLineStrToArray(props.linesToHighlight);

//   console.log(props.children);
//   return (
// <SyntaxHighlighter
//   language={props.language}
//   wrapLines={true}
//   showLineNumbers={true}
//   style={theme}
//   lineProps={(lineNumber) => {
//     const style = {
//       display: "block",
//       width: "100%",
//     };
//     if (linesToHighlight.includes(lineNumber)) {
//       style.backgroundColor = lineHighlight;
//       style.borderLeft = "4px solid #3b82f6";
//     }
//     return { style };
//   }}
//   children={props.children.trim()}
//     />
//   );
// };
// export default Highlighter;

//---------------------------------

// import React from "react";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

// const Highlighter = {
//   code({ node, inline, className, children, ...props }) {
//     const match = /language-(\w+)/.exec(className || "");
//     return !inline && match ? (
//       <SyntaxHighlighter
//         style={dracula}
//         language={match[1]}
//         PreTag="div"
//         {...props}
//       >
//         {String(children).replace(/\n$/, "")}
//       </SyntaxHighlighter>
//     ) : (
//       <code className={className} {...props}>
//         {children}
//       </code>
//     );
//   },
// };

// export default Highlighter;
