import { useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import MarkdownToolbar from '@components/MarkdownToolbar';
import { articleMarkdownComponents } from '@components/Article';
import Code from '@components/Code';

const IssuePreviewImage = ({ node, ...props }) => (
  // Issue attachments may be externally hosted, so a native lazy-loaded image is intentional.
  // eslint-disable-next-line @next/next/no-img-element
  <img {...props} className='h-auto w-1/3 max-w-full rounded-lg' alt={props.alt || ''} loading='lazy' />
);

const issueMarkdownComponents = {
  ...articleMarkdownComponents,
  img: IssuePreviewImage,
  code: (props) => <Code {...props} hideCopy />
};

export const MarkdownPreview = ({ children, compact = false }) => (
  <div
    className={`issueboard-markdown-preview prose prose-sm max-w-none break-words font-normal [font-family:inherit] dark:prose-invert prose-code:font-mono prose-pre:border-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:font-mono prose-pre:shadow-none ${compact ? '[&>p]:m-0' : ''}`}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={issueMarkdownComponents}>
      {children || '*Nothing to preview yet.*'}
    </ReactMarkdown>
  </div>
);

const editorHeight = {
  'min-h-48': '192px',
  min: '128px',
  'min-h-32': '128px',
  'min-h-28': '112px',
  'min-h-24': '96px',
  'min-h-20': '80px'
};

const issueEditorTheme = EditorView.theme({
  '&': { fontFamily: 'inherit', fontSize: '14px', fontWeight: '400' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '20px', fontWeight: '400' },
  '.cm-content': { fontFamily: 'inherit', lineHeight: '20px', fontWeight: '400' },
  '.cm-line': { lineHeight: '20px', fontWeight: '400' }
});

const markdownCodeStyle = HighlightStyle.define([
  { tag: tags.monospace, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }
]);

const MarkdownEditor = ({ value, onChange, placeholder, minHeight = 'min-h-32', ariaLabel = 'Markdown editor' }) => {
  const [tab, setTab] = useState('write');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const editorViewRef = useRef(null);
  const extensions = useMemo(
    () => [markdownLanguage(), EditorView.lineWrapping, issueEditorTheme, syntaxHighlighting(markdownCodeStyle)],
    []
  );
  const height = editorHeight[minHeight] || '128px';

  return (
    <div className='issueboard-markdown overflow-hidden rounded-xl border border-slate-300 bg-white [font-family:inherit] dark:border-slate-700 dark:bg-slate-950'>
      <div className='flex flex-wrap items-center border-b border-slate-200 bg-slate-50 px-1 dark:border-slate-800 dark:bg-slate-900'>
        <div className='flex shrink-0'>
          {['write', 'preview'].map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => setTab(item)}
              className={`border-b-2 px-3 py-2 text-xs font-semibold capitalize ${tab === item ? 'border-emerald-600 text-slate-900 dark:text-white' : 'border-transparent text-slate-500'}`}
            >
              {item}
            </button>
          ))}
        </div>
        {tab === 'write' && (
          <MarkdownToolbar
            getEditorView={() => editorViewRef.current}
            markdown={value}
            onHelp={() => setHelpOpen((open) => !open)}
            showLineNumbers={showLineNumbers}
            onToggleLineNumbers={() => setShowLineNumbers((current) => !current)}
            compact
          />
        )}
      </div>
      {tab === 'write' ? (
        <>
          {helpOpen && (
            <p className='border-b border-slate-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-slate-800 dark:bg-emerald-950 dark:text-emerald-100'>
              Use GitHub-flavored Markdown for headings, links, lists, task lists, tables, quotes, and code.
            </p>
          )}
          <CodeMirror
            value={value}
            placeholder={placeholder}
            minHeight={height}
            extensions={extensions}
            basicSetup={{ lineNumbers: showLineNumbers, foldGutter: false }}
            onCreateEditor={(view) => {
              editorViewRef.current = view;
              view.contentDOM.setAttribute('aria-label', ariaLabel);
            }}
            onChange={(nextValue) => onChange(nextValue)}
          />
        </>
      ) : (
        <div className={`${minHeight} p-3`}>
          <MarkdownPreview>{value}</MarkdownPreview>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
