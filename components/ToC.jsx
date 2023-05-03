/* eslint-disable no-console */
/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';

// const ToC1 = ({ content, props }) => {
//   const tocRef = useRef(null);
//   useEffect(() => {
//     // console.log(document.getElementById("post").innerHTML);
//     const finalMarkup = generateLinkMarkup(document.getElementById("post"));

//     document.getElementById("name").innerHTML = finalMarkup;
//   });
//   console.log("33");

//   return (
//     <div
//       className="toc border-2 rounded-md py-4 overflow-hidden"
//       ref={tocRef}
//     ></div>
//   );
// };

import parse from 'html-react-parser';

function generateLinkMarkup(contentElement) {
  const x = 'fdfdfd';
  const headings = [...contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const parsedHeadings = headings.map((heading) => ({
    title: heading.innerText,
    depth: heading.nodeName.replace(/\D/g, ''),
    id: heading.getAttribute('id')
  }));
  const htmlMarkup = parsedHeadings.map((h) => {
    const indent = h.depth > 1 ? `"pl-${(h.depth - 1) * 4}"` : '';
    return `
  <li className="my-0 ${indent}">
    <a href="#${h.id}">${h.title}</a>
  </li>
  `;
  });
  const finalMarkup = `<ol className="list-decimal my-0">${htmlMarkup.join('')}</ol>`;
  return finalMarkup;
}

const generateLinkMarkupv2 = (contentElement) => {
  const headings = [...contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const parsedHeadings = headings.map((heading) => ({
    title: heading.innerText,
    depth: heading.nodeName.replace(/\D/g, ''),
    id: heading.getAttribute('id')
  }));
  let prev_depth = 1;
  const htmlMarkup = parsedHeadings.map((h) => {
    let str = '';
    const depth = Math.abs(h.depth - prev_depth);
    if (prev_depth < h.depth) {
      str = '<ul class="list-decimal my-0">'.repeat(depth);
      str += `<li class="my-0"><a href="#${h.id}">${h.title}</a>`;
    } else if (prev_depth > h.depth) {
      str = '</ul></li>'.repeat(depth);
      str += `<li class="my-0"><a href="#${h.id}">${h.title}</a>`;
    } else {
      str = `</li><li class="my-0"><a href="#${h.id}">${h.title}</a>`;
    }
    prev_depth = h.depth;
    return str;
  });
  // return `${htmlMarkup.join('')}</li></ul>`;
  return parse(`${htmlMarkup.join('')}</li></ul>`);
};

function ToC({ content, props }) {
  // const htmlFromMarkdown = marked(content, { sanitize: true });
  const [tocContent, setTocContent] = useState('');
  useEffect(() => {
    const finalMarkup = generateLinkMarkupv2(document.getElementById('post'));
    setTocContent(finalMarkup);
  }, [content]);
  return (
    <div id='name' className='border-2 pt-0 rounded-md py-4 overflow-hidden'>
      <p className='mt-0 px-4 bg-slate-400 text-white font-semibold'>Content at a glance</p>
      {tocContent}
    </div>
  );
}

export default ToC;
