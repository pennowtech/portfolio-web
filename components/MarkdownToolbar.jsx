import React, { useMemo } from 'react';
import {
  FiBold,
  FiCheckSquare,
  FiCode,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
  FiMoreVertical,
  FiTable,
  FiHash,
  FiType
} from 'react-icons/fi';
import { LuBraces, LuListOrdered, LuListTree, LuQuote, LuUndo, LuRedo } from 'react-icons/lu';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { FaLinkedin, FaYoutube, FaXTwitter } from 'react-icons/fa6';
import { MdHighlight } from 'react-icons/md';

const headingSlug = (value) =>
  value
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const MarkdownToolbar = ({
  getEditorView,
  markdown,
  onHelp,
  showLineNumbers,
  onToggleLineNumbers,
  compact = false
}) => {
  const headings = useMemo(
    () =>
      [...markdown.matchAll(/^(#{2,6})\s+(.+)$/gm)].map((match) => ({
        level: match[1].length,
        title: match[2].trim(),
        position: match.index
      })),
    [markdown]
  );

  const replaceSelection = (before, after = '', placeholder = 'text') => {
    const editorView = getEditorView();
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const selected = editorView.state.sliceDoc(selection.from, selection.to) || placeholder;
    editorView.dispatch({
      changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
      selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length }
    });
    editorView.focus();
  };

  const toggleSelection = (before, after = before, placeholder = 'text') => {
    const editorView = getEditorView();
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const selected = editorView.state.sliceDoc(selection.from, selection.to);
    const wrappedSelection =
      selected.startsWith(before) && selected.endsWith(after) && selected.length >= before.length + after.length;
    const wrappedOutside =
      selection.from >= before.length &&
      editorView.state.sliceDoc(selection.from - before.length, selection.from) === before &&
      editorView.state.sliceDoc(selection.to, selection.to + after.length) === after;

    if (wrappedSelection) {
      const insert = selected.slice(before.length, selected.length - after.length);
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert },
        selection: { anchor: selection.from, head: selection.from + insert.length }
      });
    } else if (wrappedOutside) {
      editorView.dispatch({
        changes: [
          { from: selection.to, to: selection.to + after.length, insert: '' },
          { from: selection.from - before.length, to: selection.from, insert: '' }
        ],
        selection: {
          anchor: selection.from - before.length,
          head: selection.to - before.length
        }
      });
    } else {
      const content = selected || placeholder;
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `${before}${content}${after}` },
        selection: {
          anchor: selection.from + before.length,
          head: selection.from + before.length + content.length
        }
      });
    }
    editorView.focus();
  };

  const formatLines = (formatter) => {
    const editorView = getEditorView();
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const startLine = editorView.state.doc.lineAt(selection.from);
    const endLine = editorView.state.doc.lineAt(selection.to);
    const original = editorView.state.sliceDoc(startLine.from, endLine.to);
    editorView.dispatch({
      changes: { from: startLine.from, to: endLine.to, insert: original.split('\n').map(formatter).join('\n') }
    });
    editorView.focus();
  };

  const setHeading = (level) =>
    formatLines((line) => {
      const current = line.match(/^(#{1,6})\s+/)?.[1].length || 0;
      const content = line.replace(/^#{1,6}\s+/, '');
      return level && current !== level ? `${'#'.repeat(level)} ${content}` : content;
    });

  const toggleLink = () => {
    const editorView = getEditorView();
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const selected = editorView.state.sliceDoc(selection.from, selection.to);
    const complete = selected.match(/^\[([^\]]+)]\([^)]+\)$/);
    const suffix = editorView.state.sliceDoc(selection.to, Math.min(selection.to + 500, editorView.state.doc.length));
    const outsideSuffix = suffix.match(/^]\([^)]+\)/)?.[0];
    const wrappedOutside =
      selection.from > 0 && editorView.state.sliceDoc(selection.from - 1, selection.from) === '[' && outsideSuffix;
    if (complete) {
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: complete[1] },
        selection: { anchor: selection.from, head: selection.from + complete[1].length }
      });
    } else if (wrappedOutside) {
      editorView.dispatch({
        changes: [
          { from: selection.to, to: selection.to + outsideSuffix.length, insert: '' },
          { from: selection.from - 1, to: selection.from, insert: '' }
        ],
        selection: { anchor: selection.from - 1, head: selection.to - 1 }
      });
    } else {
      replaceSelection('[', '](https://example.com)', 'link text');
      return;
    }
    editorView.focus();
  };

  const insertBlock = (content) => {
    const editorView = getEditorView();
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const prefix =
      selection.from > 0 && editorView.state.sliceDoc(selection.from - 1, selection.from) !== '\n' ? '\n\n' : '';
    editorView.dispatch({ changes: { from: selection.from, to: selection.to, insert: `${prefix}${content}` } });
    editorView.focus();
  };

  const jumpToHeading = (position) => {
    const editorView = getEditorView();
    if (!editorView || position === '') return;
    const offset = Number(position);
    editorView.dispatch({
      selection: { anchor: offset },
      effects: EditorView.scrollIntoView(offset, { y: 'start', yMargin: 12 })
    });
    editorView.focus();
  };

  const tools = [
    { icon: FiBold, title: 'Toggle bold (Ctrl/⌘ B)', action: () => toggleSelection('**') },
    { icon: FiItalic, title: 'Toggle italic (Ctrl/⌘ I)', action: () => toggleSelection('*') },
    {
      icon: MdHighlight,
      title: 'Toggle highlighted text',
      action: () => toggleSelection('<highlight>', '</highlight>', 'highlighted text')
    },
    { icon: FiLink, title: 'Toggle link', action: toggleLink },
    {
      icon: LuQuote,
      title: 'Toggle blockquote',
      action: () => formatLines((line) => (/^>\s?/.test(line) ? line.replace(/^>\s?/, '') : `> ${line}`))
    },
    { icon: FiCode, title: 'Toggle inline code', action: () => toggleSelection('`', '`', 'code') },
    { icon: LuBraces, title: 'Toggle fenced code block', action: () => toggleSelection('```text\n', '\n```', 'code') },
    {
      icon: FiList,
      title: 'Toggle bulleted list',
      action: () => formatLines((line) => (/^[-*+]\s+/.test(line) ? line.replace(/^[-*+]\s+/, '') : `- ${line}`))
    },
    {
      icon: LuListOrdered,
      title: 'Toggle numbered list',
      action: () =>
        formatLines((line, index) => (/^\d+\.\s+/.test(line) ? line.replace(/^\d+\.\s+/, '') : `${index + 1}. ${line}`))
    },
    {
      icon: FiCheckSquare,
      title: 'Toggle task list',
      action: () =>
        formatLines((line) =>
          /^[-*]\s+\[[ xX]\]\s+/.test(line) ? line.replace(/^[-*]\s+\[[ xX]\]\s+/, '') : `- [ ] ${line}`
        )
    },
    {
      icon: FiTable,
      title: 'GFM table',
      action: () => insertBlock('| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n\n')
    },
    { icon: FiMinus, title: 'Horizontal rule', action: () => insertBlock('\n---\n\n'), extended: true },
    {
      icon: FaYoutube,
      title: 'Embed YouTube video',
      action: () => insertBlock('<youtube>VIDEO_ID</youtube>\n\n'),
      extended: true
    },
    {
      icon: FaLinkedin,
      title: 'Embed LinkedIn post',
      action: () =>
        insertBlock('<linkedin>https://www.linkedin.com/embed/feed/update/urn:li:share:POST_ID</linkedin>\n\n'),
      extended: true
    },
    {
      icon: FaXTwitter,
      title: 'Embed X/Twitter post',
      action: () => insertBlock('<twitter>https://x.com/username/status/POST_ID</twitter>\n\n'),
      extended: true
    },
    {
      icon: FiMoreVertical,
      title: 'More options',
      action: () => insertBlock('<note heading="Design note">\nImportant context\n</note>\n\n'),
      extended: true
    }
  ];

  const insertToc = () =>
    insertBlock(
      `## Table of contents\n\n${headings.length ? headings.map(({ level, title }) => `${'  '.repeat(level - 2)}- [${title}](#${headingSlug(title)})`).join('\n') : '- Add headings first.'}\n\n`
    );

  const handleUndo = () => {
    const editorView = getEditorView();
    if (editorView) {
      undo(editorView);
      editorView.focus();
    }
  };

  const handleRedo = () => {
    const editorView = getEditorView();
    if (editorView) {
      redo(editorView);
      editorView.focus();
    }
  };

  if (compact) {
    const compactButton =
      'inline-flex size-7 items-center justify-center rounded-sm text-sm text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white';
    return (
      <div
        className='flex min-w-0 flex-1 items-center justify-end gap-0.5 px-1'
        role='toolbar'
        aria-label='Markdown formatting'
      >
        <button type='button' className={compactButton} title='Undo' aria-label='Undo' onClick={handleUndo}>
          <LuUndo aria-hidden='true' />
        </button>
        <button type='button' className={compactButton} title='Redo' aria-label='Redo' onClick={handleRedo}>
          <LuRedo aria-hidden='true' />
        </button>
        <span className='mx-1 h-5 border-l border-slate-300 dark:border-slate-600' />
        <label className={`${compactButton} relative cursor-pointer`} title='Text style'>
          <span className='font-Monda text-sm font-medium' aria-hidden='true'>
            H
          </span>
          <span className='sr-only'>Text style</span>
          <select
            defaultValue=''
            onChange={(event) => {
              setHeading(Number(event.target.value));
              event.target.value = '';
            }}
            className='absolute inset-0 size-full cursor-pointer opacity-0'
          >
            <option value='' disabled>
              Text style
            </option>
            <option value='0'>Normal text</option>
            <option value='2'>Heading 2</option>
            <option value='3'>Heading 3</option>
            <option value='4'>Heading 4</option>
          </select>
        </label>
        <button
          type='button'
          className={compactButton}
          title='Bold'
          aria-label='Bold'
          onClick={() => toggleSelection('**')}
        >
          <FiBold aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Italic'
          aria-label='Italic'
          onClick={() => toggleSelection('*')}
        >
          <FiItalic aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Highlight'
          aria-label='Highlight'
          onClick={() => toggleSelection('<highlight>', '</highlight>', 'highlighted text')}
        >
          <MdHighlight aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Blockquote'
          aria-label='Blockquote'
          onClick={() => formatLines((line) => (/^>\s?/.test(line) ? line.replace(/^>\s?/, '') : `> ${line}`))}
        >
          <LuQuote aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Inline code'
          aria-label='Inline code'
          onClick={() => toggleSelection('`', '`', 'code')}
        >
          <FiCode aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Fenced code block'
          aria-label='Fenced code block'
          onClick={() => toggleSelection('```text\n', '\n```', 'code')}
        >
          <LuBraces aria-hidden='true' />
        </button>
        <button type='button' className={compactButton} title='Link' aria-label='Link' onClick={toggleLink}>
          <FiLink aria-hidden='true' />
        </button>
        <span className='mx-1 h-5 border-l border-slate-300 dark:border-slate-600' />
        <button
          type='button'
          className={compactButton}
          title='Bulleted list'
          aria-label='Bulleted list'
          onClick={() => formatLines((line) => (/^[-*+]\s+/.test(line) ? line.replace(/^[-*+]\s+/, '') : `- ${line}`))}
        >
          <FiList aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Numbered list'
          aria-label='Numbered list'
          onClick={() =>
            formatLines((line, index) =>
              /^\d+\.\s+/.test(line) ? line.replace(/^\d+\.\s+/, '') : `${index + 1}. ${line}`
            )
          }
        >
          <LuListOrdered aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Task list'
          aria-label='Task list'
          onClick={() =>
            formatLines((line) =>
              /^[-*]\s+\[[ xX]\]\s+/.test(line) ? line.replace(/^[-*]\s+\[[ xX]\]\s+/, '') : `- [ ] ${line}`
            )
          }
        >
          <FiCheckSquare aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Insert table'
          aria-label='Insert table'
          onClick={() => insertBlock('| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n\n')}
        >
          <FiTable aria-hidden='true' />
        </button>
        <button
          type='button'
          className={compactButton}
          title='Insert note'
          aria-label='Insert note'
          onClick={() => insertBlock('<note heading="Design note">\nImportant context\n</note>\n\n')}
        >
          <FiMoreVertical aria-hidden='true' />
        </button>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? 'flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 border-0 bg-transparent p-0.5 [&_button]:!size-6 [&_select]:!h-6'
          : 'flex flex-wrap items-center gap-1 border-b border-slate-300 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-800'
      }
      role='toolbar'
      aria-label='Markdown formatting'
    >
      <button
        type='button'
        onClick={handleUndo}
        title='Undo (Ctrl/⌘ Z)'
        aria-label='Undo (Ctrl/⌘ Z)'
        className='flex size-9 items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-green-400'
      >
        <LuUndo aria-hidden='true' />
      </button>
      <button
        type='button'
        onClick={handleRedo}
        title='Redo (Ctrl/⌘ Y or Ctrl/⌘ Shift Z)'
        aria-label='Redo (Ctrl/⌘ Y or Ctrl/⌘ Shift Z)'
        className='flex size-9 items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-green-400'
      >
        <LuRedo aria-hidden='true' />
      </button>
      <span className={`${compact ? 'mx-0.5 h-5' : 'mx-1 h-6'} border-l border-slate-300 dark:border-slate-600`} />
      <label className={`relative shrink-0 ${compact ? 'inline-flex size-6 items-center justify-center' : ''}`}>
        <span className='sr-only'>Text style</span>
        {compact && (
          <FiType className='pointer-events-none size-3.5 text-slate-700 dark:text-slate-200' aria-hidden='true' />
        )}
        <select
          onChange={(event) => {
            setHeading(Number(event.target.value));
            event.target.value = '';
          }}
          defaultValue=''
          className={
            compact
              ? 'absolute inset-0 size-6 cursor-pointer opacity-0'
              : 'h-9 rounded-md border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
          }
          title='Paragraph and heading style'
        >
          <option value='' disabled>
            Text style
          </option>
          <option value='0'>Normal text</option>
          <option value='2'>Heading 2</option>
          <option value='3'>Heading 3</option>
          <option value='4'>Heading 4</option>
        </select>
      </label>
      <span className={`${compact ? 'mx-0.5 h-5' : 'mx-1 h-6'} border-l border-slate-300 dark:border-slate-600`} />
      {tools
        .filter(({ extended }) => !compact || !extended)
        .map(({ icon: Icon, title, action }) => (
          <button
            key={title}
            type='button'
            title={title}
            aria-label={title}
            onClick={action}
            className='flex size-9 items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-green-400'
          >
            <Icon aria-hidden='true' />
          </button>
        ))}
      {!compact && <span className='mx-1 h-6 border-l border-slate-300 dark:border-slate-600' />}
      {!compact && (
        <button
          type='button'
          onClick={insertToc}
          title='Insert linked table of contents'
          aria-label='Insert linked table of contents'
          className='flex size-9 items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-green-700 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-green-400'
        >
          <LuListTree aria-hidden='true' />
        </button>
      )}
      {!compact && (
        <label className='ml-auto flex min-w-56 shrink-0 items-center gap-2'>
          <LuListTree className='text-slate-500' aria-hidden='true' />
          <span className='sr-only'>Jump to article heading</span>
          <select
            onChange={(event) => jumpToHeading(event.target.value)}
            defaultValue=''
            className='h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
            title='Article outline'
          >
            <option value=''>Article outline</option>
            {headings.map(({ level, title, position }, index) => (
              <option key={`${position}-${index}`} value={position}>{`${'— '.repeat(level - 2)}${title}`}</option>
            ))}
          </select>
        </label>
      )}
      {!compact && (
        <button
          type='button'
          onClick={onToggleLineNumbers}
          title={`${showLineNumbers ? 'Hide' : 'Show'} line numbers`}
          aria-label={`${showLineNumbers ? 'Hide' : 'Show'} line numbers`}
          aria-pressed={showLineNumbers}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${showLineNumbers ? 'border-green-700 text-green-700 dark:border-green-400 dark:text-green-400' : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}
        >
          <FiHash aria-hidden='true' />
        </button>
      )}
      {!compact && (
        <button
          type='button'
          onClick={onHelp}
          title='Markdown editor help'
          aria-label='Markdown editor help'
          className='flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-base font-semibold text-slate-700 hover:border-green-700 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:border-slate-600 dark:text-slate-100 dark:hover:border-green-400 dark:hover:text-green-400'
        >
          ?
        </button>
      )}
    </div>
  );
};

export default MarkdownToolbar;
