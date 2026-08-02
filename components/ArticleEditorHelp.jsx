import React, { useEffect } from 'react';

const Example = ({ children }) => (
  <pre className='mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-sm text-slate-100'>
    <code>{children}</code>
  </pre>
);

const HelpSection = ({ title, children, open = false }) => (
  <details className='group border-b border-slate-200 py-3 last:border-0 dark:border-slate-700' open={open}>
    <summary className='cursor-pointer list-none pr-8 font-Monda font-semibold text-slate-900 marker:hidden dark:text-white'>
      <span className='flex items-center justify-between gap-4'>
        {title}
        <span
          aria-hidden='true'
          className='text-xl font-normal text-green-700 group-open:rotate-45 dark:text-green-400'
        >
          +
        </span>
      </span>
    </summary>
    <div className='mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300'>{children}</div>
  </details>
);

const ArticleEditorHelp = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='editor-help-title'
    >
      <button
        type='button'
        className='absolute inset-0 bg-slate-950/70'
        onClick={onClose}
        aria-label='Close editor help'
      />
      <section className='relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
        <header className='flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700'>
          <div>
            <p className='font-Monda text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-400'>
              Author workspace
            </p>
            <h2
              id='editor-help-title'
              className='mt-1 font-Neuton text-3xl font-semibold text-slate-900 dark:text-white'
            >
              Writing and publishing help
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            aria-label='Close editor help'
          >
            ×
          </button>
        </header>

        <div className='max-h-[calc(90vh-7rem)] overflow-y-auto px-5 py-2'>
          <HelpSection title='Start an article' open>
            <p>
              Complete the title, description, category, tags, and cover URL. The title proposes a slug; review it
              before publishing because it becomes the public URL.
            </p>
            <p className='mt-2'>
              Use <strong>Save as Notion draft</strong> for private work or <strong>Publish article</strong> when it is
              ready for the portfolio.
            </p>
          </HelpSection>

          <HelpSection title='Edit, Preview, and Split modes'>
            <p>
              <strong>Edit</strong> gives the Markdown source the full width. <strong>Preview</strong> shows the
              portfolio rendering. <strong>Split</strong> keeps both visible; on narrow screens they are stacked.
            </p>
          </HelpSection>

          <HelpSection title='Headings, links, emphasis, and table of contents'>
            <p>
              Select text before using toolbar actions. The text-style menu applies normal text or H2–H4 headings. The
              Article outline menu lists H2–H6 headings with their hierarchy; selecting one moves the editor directly to
              it. The outline icon inserts a linked table of contents into the article.
            </p>
            <Example>{`## Architecture decisions\n\n**Important**, *emphasized*, and [linked](https://example.com).`}</Example>
          </HelpSection>

          <HelpSection title='Keyboard shortcuts'>
            <p>
              Use <strong>Ctrl+B</strong> or <strong>⌘B</strong> for bold and <strong>Ctrl+I</strong> or{' '}
              <strong>⌘I</strong> for italic while the editor is focused. Selected text is wrapped; with no selection,
              placeholder text is inserted and selected for replacement.
            </p>
          </HelpSection>

          <HelpSection title='Publication date, categories, tags, and cover images'>
            <p>
              The publication date is stored in Notion&apos;s Posted on field and is the date shown publicly. Existing
              Notion categories and tags appear as suggestions. Cover images can come from a permanent link, a local
              image uploaded into Notion, or integrated Unsplash and Pexels search. Pixabay and Openverse shortcuts help
              find other royalty-free images; confirm each image&apos;s licence before use.
            </p>
          </HelpSection>

          <HelpSection title='GFM tables and task lists'>
            <p>GitHub-flavored Markdown adds tables, checked or unchecked tasks, strikethrough, and automatic links.</p>
            <Example>{`| Decision | Status |\n| --- | --- |\n| Event-driven integration | Accepted |\n\n- [x] Capture constraints\n- [ ] Record the decision`}</Example>
          </HelpSection>

          <HelpSection title='Code and syntax highlighting'>
            <p>
              Use inline code for names and fenced blocks for examples. Replace <code>cpp</code> with languages such as{' '}
              <code>rust</code>, <code>python</code>, <code>json</code>, or <code>bash</code>.
            </p>
            <Example>{'```cpp\nstruct ServiceBoundary {\n  bool explicit_contract{true};\n};\n```'}</Example>
          </HelpSection>

          <HelpSection title='Lists, quotes, images, and horizontal rules'>
            <Example>{`1. First decision\n2. Second decision\n\n> A concise architectural observation.\n\n![Diagram description](https://example.com/diagram.png)\n\n---`}</Example>
          </HelpSection>

          <HelpSection title='Custom SinghBuildsTech article elements'>
            <p>
              These elements are rendered by the portfolio article component. Keep opening and closing tags on separate
              lines when they contain block content.
            </p>
            <Example>{`<note heading="Design note">\nExplain an important constraint here.\n</note>\n\n<highlight>Key phrase</highlight>\n\n<youtube>dQw4w9WgXcQ</youtube>\n\n<twitter>https://x.com/username/status/POST_ID</twitter>\n\n<linkedin>https://www.linkedin.com/embed/feed/update/urn:li:share:POST_ID</linkedin>`}</Example>
            <p className='mt-3'>
              For LinkedIn, choose <strong>Embed this post</strong> on LinkedIn and paste only the iframe&apos;s HTTPS{' '}
              <code>src</code> value between the tags. For X/Twitter, paste the normal post URL. Embedded content is
              loaded from the respective third-party platform.
            </p>
          </HelpSection>

          <HelpSection title='Embedding YouTube, LinkedIn, and X/Twitter'>
            <p>
              Use the platform icons in the toolbar to insert a ready-to-edit template. Replace its placeholder without
              removing the opening and closing tags.
            </p>
            <p className='mt-3'>
              <strong>YouTube:</strong> Copy the video ID from a URL such as <code>youtube.com/watch?v=VIDEO_ID</code>{' '}
              or <code>youtu.be/VIDEO_ID</code>, then place only that ID inside <code>&lt;youtube&gt;</code>.
            </p>
            <Example>{'<youtube>dQw4w9WgXcQ</youtube>'}</Example>
            <p className='mt-3'>
              <strong>X/Twitter:</strong> Copy the normal public post URL from the browser or Share menu. Both{' '}
              <code>x.com</code> and <code>twitter.com</code> status URLs are supported.
            </p>
            <Example>{'<twitter>https://x.com/username/status/1234567890</twitter>'}</Example>
            <p className='mt-3'>
              <strong>LinkedIn:</strong> Open the post menu, choose <strong>Embed this post</strong>, and copy the URL
              from the generated iframe&apos;s <code>src</code> attribute. Paste that embed URL—not the ordinary post
              URL—inside the LinkedIn tags.
            </p>
            <Example>
              {'<linkedin>https://www.linkedin.com/embed/feed/update/urn:li:share:1234567890</linkedin>'}
            </Example>
            <p className='mt-3'>
              LinkedIn and X/Twitter posts show a load button to visitors before connecting to the external platform.
              Always use public posts; deleted, private, or audience-restricted content cannot be embedded.
            </p>
          </HelpSection>

          <HelpSection title='Notion storage and visibility'>
            <p>
              Every article is created inside the existing Notion articles database in its current teamspace. Drafts
              have <code>Published = false</code>; published articles have <code>Published = true</code> and appear on
              the portfolio automatically.
            </p>
          </HelpSection>
        </div>
      </section>
    </div>
  );
};

export default ArticleEditorHelp;
