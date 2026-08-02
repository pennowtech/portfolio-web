import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import MarkdownToolbar from './MarkdownToolbar';
import ArticleEditorHelp from './ArticleEditorHelp';
import CoverImagePicker from './CoverImagePicker';
import PublicationDatePicker from './PublicationDatePicker';
import ArticleLibrary from './ArticleLibrary';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => <div className='h-[650px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800' />
});
const ArticlePreview = dynamic(() => import('./Article'), { ssr: false });

const INITIAL_MARKDOWN = `## Start with the reader's problem

Open with a concrete engineering situation, the decision that needs to be made, and why it matters.

## Explain the design

Use diagrams, tables, lists, links, and code where they make the architecture easier to understand.

\`\`\`cpp
struct Example {
  bool production_ready{true};
};
\`\`\`

## Close with practical guidance

Summarize the trade-offs and leave the reader with decisions they can apply.`;

const slugify = (value) => {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/@/g, ' at ')
    .replace(/%/g, ' percent ')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (!normalized) {
    const hash = [...value].reduce((result, character) => (result * 31 + character.codePointAt(0)) >>> 0, 2166136261);
    return value.trim() ? `article-${hash.toString(36)}` : '';
  }
  if (normalized.length <= 160) return normalized;
  return (
    normalized
      .slice(0, 160)
      .replace(/-[^-]*$/, '')
      .replace(/-+$/g, '') || normalized.slice(0, 160)
  );
};

const FieldError = ({ children }) =>
  children ? <span className='mt-1 block text-sm text-red-700 dark:text-red-300'>{children}</span> : null;

const ArticleEditor = ({ adminEmail, defaultPublicationDate }) => {
  const router = useRouter();
  const editorViewRef = useRef(null);
  const taxonomyLoadingRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    coverUrl: '',
    coverUpload: null,
    coverCredit: null,
    publicationDate: defaultPublicationDate,
    category: 'Software Architecture',
    tags: '',
    markdown: INITIAL_MARKDOWN
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [taxonomy, setTaxonomy] = useState({ categories: [], tags: [], articles: [] });
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyMessage, setTaxonomyMessage] = useState('Loading categories and tags from Notion…');
  const [mounted, setMounted] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState('');
  const [articleLoading, setArticleLoading] = useState(false);
  const [editingPublished, setEditingPublished] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-color-mode', resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [resolvedTheme]);

  const loadTaxonomy = useCallback(() => {
    if (taxonomyLoadingRef.current) return;
    taxonomyLoadingRef.current = true;
    fetch('/api/admin/articles')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Taxonomy could not be loaded.');
        return result;
      })
      .then((result) => {
        setTaxonomy(result);
        setTaxonomyMessage('');
        setTaxonomyLoading(false);
        taxonomyLoadingRef.current = false;
      })
      .catch((error) => {
        setTaxonomy({ categories: [], tags: [], articles: [] });
        setTaxonomyMessage(error.message);
        setTaxonomyLoading(false);
        taxonomyLoadingRef.current = false;
      });
  }, []);
  const getEditorView = useCallback(() => editorViewRef.current, []);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    if (!router.isReady) return;
    const articleId = typeof router.query.id === 'string' ? router.query.id : '';
    if (!articleId) {
      setEditingArticleId('');
      setEditingPublished(false);
      return;
    }
    setArticleLoading(true);
    fetch(`/api/admin/articles?id=${encodeURIComponent(articleId)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'The article could not be loaded.');
        return result;
      })
      .then((article) => {
        setEditingArticleId(article.id);
        setEditingPublished(article.published);
        setSlugEdited(true);
        setForm({
          title: article.title,
          slug: article.slug,
          description: article.description,
          coverUrl: article.coverUrl,
          coverUpload: null,
          coverCredit: null,
          publicationDate: article.publicationDate || defaultPublicationDate,
          category: article.category || 'Software Architecture',
          tags: article.tags.join(', '),
          markdown: article.markdown || INITIAL_MARKDOWN
        });
        setMessage({
          type: 'success',
          text: `Loaded ${article.published ? 'published article' : 'draft'} for editing.`
        });
        requestAnimationFrame(() => document.getElementById('article-form')?.scrollIntoView({ behavior: 'smooth' }));
      })
      .catch((error) => setMessage({ type: 'error', text: error.message }))
      .finally(() => setArticleLoading(false));
  }, [defaultPublicationDate, router.isReady, router.query.id]);

  const tags = useMemo(
    () =>
      form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags]
  );
  const wordCount = useMemo(() => {
    const plainText = form.markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!?(?:\[([^\]]*)\])\([^)]+\)/g, '$1')
      .replace(/[#>*_`~|\-[\]]/g, ' ');
    return plainText.trim() ? plainText.trim().split(/\s+/u).length : 0;
  }, [form.markdown]);
  const editorExtensions = useMemo(
    () => [
      markdownLanguage({ codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.theme({
        '.cm-gutters': {
          backgroundColor: 'rgba(22, 101, 52, 0.10)',
          borderRight: '1px solid rgba(22, 101, 52, 0.20)'
        },
        '.cm-lineNumbers .cm-gutterElement': { paddingLeft: '10px', paddingRight: '10px' }
      })
    ],
    []
  );
  const editorTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  const update = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'title' && !slugEdited ? { slug: slugify(value) } : {})
    }));
  };

  const save = async (published) => {
    if (published && !editingPublished && !window.confirm('Publish this article immediately on the portfolio?')) return;
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      const response = await fetch(
        editingArticleId ? `/api/admin/articles?id=${encodeURIComponent(editingArticleId)}` : '/api/admin/articles',
        {
          method: editingArticleId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, tags, published })
        }
      );
      const result = await response.json();
      if (response.status === 401) {
        await router.replace('/admin/login');
        return;
      }
      if (!response.ok) {
        setErrors(result.errors || {});
        throw new Error(result.message || 'The article could not be saved.');
      }
      setMessage({ type: 'success', text: result.message, article: result.article });
      setEditingPublished(published);
      loadTaxonomy();
    } catch (error) {
      setMessage((current) => current || { type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  const handleEditorShortcut = (event) => {
    const editorView = editorViewRef.current;
    if ((!event.ctrlKey && !event.metaKey) || !['b', 'i'].includes(event.key.toLowerCase()) || !editorView) return;
    event.preventDefault();
    const marker = event.key.toLowerCase() === 'b' ? '**' : '*';
    const selection = editorView.state.selection.main;
    const selected = editorView.state.sliceDoc(selection.from, selection.to);
    const wrappedOutside =
      selection.from >= marker.length &&
      editorView.state.sliceDoc(selection.from - marker.length, selection.from) === marker &&
      editorView.state.sliceDoc(selection.to, selection.to + marker.length) === marker;
    if (wrappedOutside) {
      editorView.dispatch({
        changes: [
          { from: selection.to, to: selection.to + marker.length, insert: '' },
          { from: selection.from - marker.length, to: selection.from, insert: '' }
        ],
        selection: { anchor: selection.from - marker.length, head: selection.to - marker.length }
      });
    } else {
      const content = selected || 'text';
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `${marker}${content}${marker}` },
        selection: { anchor: selection.from + marker.length, head: selection.from + marker.length + content.length }
      });
    }
  };

  const inputClass =
    'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white';

  return (
    <main className='mx-auto w-full max-w-[1500px] px-4 py-8 lg:px-8'>
      <div className='mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='font-Monda text-sm font-medium uppercase tracking-[0.16em] text-green-700 dark:text-green-400'>
            Private author workspace
          </p>
          <h1 className='mt-1 font-Neuton text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl'>
            {editingArticleId ? 'Edit article' : 'New article'}
          </h1>
          <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Signed in as {adminEmail}</p>
        </div>
        <div className='flex items-center gap-3 self-start'>
          <button
            type='button'
            onClick={logout}
            className='text-sm font-medium text-slate-600 underline underline-offset-4 dark:text-slate-300'
          >
            Sign out
          </button>
        </div>
      </div>

      <ArticleLibrary articles={taxonomy.articles} loading={taxonomyLoading} message={taxonomyMessage} />

      <section
        id='article-form'
        aria-busy={articleLoading}
        className='grid scroll-mt-24 gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60 lg:grid-cols-2 lg:p-6'
      >
        <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
          Title
          <input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            className={inputClass}
            maxLength={180}
          />
          <FieldError>{errors.title}</FieldError>
        </label>
        <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
          <span className='flex items-center justify-between gap-3'>
            Slug
            <button
              type='button'
              onClick={() => {
                setSlugEdited(false);
                update('slug', slugify(form.title));
              }}
              className='text-xs font-normal text-green-700 underline underline-offset-2 dark:text-green-400'
            >
              Regenerate from title
            </button>
          </span>
          <input
            value={form.slug}
            onChange={(event) => {
              setSlugEdited(true);
              update('slug', slugify(event.target.value));
            }}
            className={inputClass}
            maxLength={180}
          />
          <FieldError>{errors.slug}</FieldError>
        </label>
        <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
          Category
          <select
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className={inputClass}
          >
            {[...new Set([form.category, ...taxonomy.categories])].filter(Boolean).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError>{errors.category}</FieldError>
        </label>
        <PublicationDatePicker
          value={form.publicationDate}
          onChange={(value) => update('publicationDate', value)}
          error={errors.publicationDate}
        />
        <label className='text-sm font-medium text-slate-700 dark:text-slate-200 lg:col-span-2'>
          Description
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            className={`${inputClass} min-h-24`}
            maxLength={500}
          />
          <span className='mt-1 block text-right text-xs text-slate-500'>{form.description.length}/500</span>
          <FieldError>{errors.description}</FieldError>
        </label>
        <div className='grid gap-5 lg:col-span-2'>
          <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
            Tags, comma separated
            <input
              list='notion-tags'
              value={form.tags}
              onChange={(event) => update('tags', event.target.value)}
              className={inputClass}
            />
            <datalist id='notion-tags'>
              {taxonomy.tags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            {taxonomy.tags.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1.5'>
                {taxonomy.tags.map((tag) => (
                  <button
                    key={tag}
                    type='button'
                    onClick={() => {
                      const current = tags.includes(tag) ? tags : [...tags, tag];
                      update('tags', current.join(', '));
                    }}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      tags.includes(tag)
                        ? 'border-green-700 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                        : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <FieldError>{errors.tags}</FieldError>
            {taxonomyMessage && <p className='mt-2 text-xs text-amber-700 dark:text-amber-300'>{taxonomyMessage}</p>}
          </label>
        </div>
        <CoverImagePicker
          coverUrl={form.coverUrl}
          coverUpload={form.coverUpload}
          coverCredit={form.coverCredit}
          onUrlChange={(value) => update('coverUrl', value)}
          onUploadChange={(value) => update('coverUpload', value)}
          onCreditChange={(value) => update('coverCredit', value)}
          error={errors.coverUrl}
        />
      </section>

      <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='font-Neuton text-2xl font-semibold text-slate-900 dark:text-white'>Article content</h2>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Choose a focused view or work with source and preview together.
          </p>
        </div>
        <div
          className='flex rounded-lg border border-slate-300 p-1 dark:border-slate-600'
          role='group'
          aria-label='Editor view mode'
        >
          {['edit', 'preview', 'split'].map((view) => (
            <button
              key={view}
              type='button'
              onClick={() => setViewMode(view)}
              aria-pressed={viewMode === view}
              className={`min-h-11 flex-1 rounded-md px-4 py-2 font-Monda text-sm font-semibold capitalize ${
                viewMode === view ? 'bg-green-700 text-white' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <section
        className={`mt-4 grid min-w-0 gap-6 ${viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}
        data-color-mode={editorTheme}
      >
        {viewMode !== 'preview' && (
          <div className='min-w-0'>
            <div
              onKeyDownCapture={handleEditorShortcut}
              className='overflow-hidden rounded-xl border border-slate-300 shadow-sm dark:border-slate-600'
            >
              <MarkdownToolbar
                getEditorView={getEditorView}
                markdown={form.markdown}
                onHelp={() => setHelpOpen(true)}
                showLineNumbers={showLineNumbers}
                onToggleLineNumbers={() => setShowLineNumbers((current) => !current)}
              />
              <CodeMirror
                value={form.markdown}
                minHeight='650px'
                maxHeight='650px'
                theme={editorTheme}
                extensions={editorExtensions}
                basicSetup={{
                  lineNumbers: showLineNumbers,
                  foldGutter: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true
                }}
                onCreateEditor={(view) => {
                  editorViewRef.current = view;
                }}
                onChange={(value) => update('markdown', value || '')}
              />
            </div>
            <div className='mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400'>
              <span>Markdown, GFM tables, task lists, code fences, HTML and custom article elements</span>
              <span>
                {wordCount.toLocaleString()} words · {form.markdown.length.toLocaleString()} characters
              </span>
            </div>
            <FieldError>{errors.markdown}</FieldError>
          </div>
        )}

        {viewMode !== 'edit' && (
          <div className='min-w-0'>
            <div className='h-[650px] overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900 md:p-8'>
              <ArticlePreview
                mdxSource={`${form.markdown}${
                  form.coverCredit
                    ? `\n\n---\n\n<small>Cover photo by [${form.coverCredit.photographer}](${form.coverCredit.profileUrl}) on [${form.coverCredit.provider}](${form.coverCredit.providerUrl}).</small>`
                    : ''
                }`}
              />
            </div>
          </div>
        )}
      </section>

      {message && (
        <div
          className={`mt-6 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100' : 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100'}`}
        >
          <p>{message.text}</p>
          {message.article?.url && (
            <p className='mt-2 flex flex-wrap gap-4'>
              <a href={message.article.url} target='_blank' rel='noreferrer' className='font-medium underline'>
                Open in Notion
              </a>
              {message.article.published && (
                <Link href={`/blog/${message.article.slug}`} className='font-medium underline'>
                  Open portfolio article
                </Link>
              )}
            </p>
          )}
        </div>
      )}

      <div className='sticky bottom-4 z-20 mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:flex-row sm:justify-end'>
        <button
          type='button'
          disabled={submitting}
          onClick={() => save(false)}
          className='min-h-12 rounded-lg border border-green-700 px-6 py-3 font-Monda font-semibold text-green-800 hover:bg-green-50 disabled:opacity-60 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-950/40'
        >
          {submitting
            ? 'Saving…'
            : editingArticleId
              ? editingPublished
                ? 'Move to draft'
                : 'Update draft'
              : 'Save as Notion draft'}
        </button>
        <button
          type='button'
          disabled={submitting}
          onClick={() => save(true)}
          className='min-h-12 rounded-lg bg-green-700 px-6 py-3 font-Monda font-semibold text-white hover:bg-green-800 disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-500'
        >
          {submitting
            ? 'Publishing…'
            : editingArticleId && editingPublished
              ? 'Update published article'
              : editingArticleId
                ? 'Publish draft'
                : 'Publish article'}
        </button>
      </div>
      <ArticleEditorHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
};

export default ArticleEditor;
