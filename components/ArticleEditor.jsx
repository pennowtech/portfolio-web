import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { FiMoreHorizontal, FiColumns, FiEye, FiCode, FiFileText } from 'react-icons/fi';
import { LuSparkles, LuMaximize2, LuMinimize2 } from 'react-icons/lu';
import MarkdownToolbar from './MarkdownToolbar';
import ArticleEditorHelp from './ArticleEditorHelp';
import ArticleLibrary from './ArticleLibrary';
import ArticleInspector from './admin/ArticleInspector';
import AIConfigModal from './admin/AIConfigModal';
import AIRephraseModal from './admin/AIRephraseModal';
import FrostedSelectionBubble from './admin/FrostedSelectionBubble';
import AmbientWordMeter from './admin/AmbientWordMeter';

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
  const [viewMode, setViewMode] = useState('edit');
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
  const [zenMode, setZenMode] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [rephraseTarget, setRephraseTarget] = useState(null); // { text, from, to, whole }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);

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
        '&': {
          fontFamily:
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important",
          fontSize: '14px'
        },
        '.cm-content': {
          fontFamily:
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important"
        },
        '.cm-gutters': {
          fontFamily:
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important",
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

  const applyRephraseResult = (newText) => {
    if (!rephraseTarget) return;
    if (rephraseTarget.whole) {
      update('markdown', newText);
      return;
    }
    const editorView = getEditorView();
    if (!editorView) return;
    editorView.dispatch({
      changes: { from: rephraseTarget.from, to: rephraseTarget.to, insert: newText },
      selection: { anchor: rephraseTarget.from, head: rephraseTarget.from + newText.length }
    });
    editorView.focus();
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
    if (!editorView || (!event.ctrlKey && !event.metaKey)) return;
    const key = event.key.toLowerCase();

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      redo(editorView);
      return;
    }
    if (key === 'z') {
      event.preventDefault();
      undo(editorView);
      return;
    }
    if (key === 'y') {
      event.preventDefault();
      redo(editorView);
      return;
    }

    if (!['b', 'i'].includes(key)) return;
    event.preventDefault();
    const marker = key === 'b' ? '**' : '*';
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

  return (
    <main className='mx-auto w-full max-w-[1720px] px-3 py-6 sm:px-6 lg:px-8'>
      <div
        className={`grid gap-6 items-start transition-all duration-300 ${
          zenMode
            ? 'mx-auto max-w-4xl grid-cols-1'
            : 'xl:grid-cols-[280px_minmax(0,1fr)_340px] 2xl:grid-cols-[310px_minmax(0,1fr)_380px]'
        }`}
      >
        {/* Left Column: Concept 4 Interactive Drafts Deck */}
        {!zenMode && (
          <aside className='min-w-0 xl:sticky xl:top-6'>
            <ArticleLibrary
              articles={taxonomy.articles}
              loading={taxonomyLoading}
              message={taxonomyMessage}
              activeArticleId={editingArticleId}
            />
          </aside>
        )}

        {/* Center Column: Pure Editor Canvas */}
        <div className='min-w-0'>
          {/* Header pill with title & viewMode switcher */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200'>
                <FiFileText className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span className='max-w-[180px] sm:max-w-[320px] truncate'>
                  {form.title ? `${form.title}.md` : 'Untitled Article.md'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    editingPublished
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      editingPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {editingPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {/* Zen Mode Button */}
              <button
                type='button'
                onClick={() => setZenMode((prev) => !prev)}
                aria-pressed={zenMode}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-Monda text-xs font-semibold transition ${
                  zenMode
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-2xs dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300'
                }`}
                title={zenMode ? 'Exit Zen Mode (Esc)' : 'Enter Zen distraction-free writing mode'}
              >
                {zenMode ? <LuMinimize2 className='size-3.5' /> : <LuMaximize2 className='size-3.5' />}
                <span className='hidden sm:inline'>{zenMode ? 'Exit Zen' : 'Zen'}</span>
              </button>

              {/* AI Rephrase Whole Article Button -- selection has its own trigger via FrostedSelectionBubble */}
              <button
                type='button'
                onClick={() => setRephraseTarget({ text: form.markdown, whole: true })}
                disabled={!form.markdown.trim()}
                className='flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 font-Monda text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/20 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300'
                title='AI Rephrase the whole article (select text instead to rephrase just that part)'
              >
                <LuSparkles className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span className='hidden sm:inline'>AI Rephrase</span>
              </button>

              {/* AI Configure Button */}
              <button
                type='button'
                onClick={() => setAiModalOpen(true)}
                className='flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 font-Monda text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-purple-500/50 dark:hover:text-purple-300'
                title='Configure AI Assistant Engine & Writing Tone'
              >
                <LuSparkles className='size-3.5 text-purple-600 dark:text-purple-400' />
                <span className='hidden sm:inline'>AI Config</span>
              </button>

              {/* View Mode Switcher */}
              <div
                className='flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900'
                role='group'
                aria-label='Editor view mode'
              >
                {[
                  { id: 'edit', label: 'Edit', icon: FiCode },
                  { id: 'split', label: 'Split', icon: FiColumns },
                  { id: 'preview', label: 'Preview', icon: FiEye }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type='button'
                    onClick={() => setViewMode(id)}
                    aria-pressed={viewMode === id}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-Monda text-xs font-semibold capitalize transition ${
                      viewMode === id
                        ? 'bg-white text-emerald-700 shadow-2xs dark:bg-emerald-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className='size-3.5' />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor & Preview section */}
          <section
            className={`mt-3.5 grid min-w-0 gap-6 ${viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}
            data-color-mode={editorTheme}
          >
            {viewMode !== 'preview' && (
              <div className='min-w-0'>
                <div
                  onKeyDownCapture={handleEditorShortcut}
                  className='relative overflow-hidden rounded-xl border border-slate-300 shadow-sm dark:border-slate-700'
                >
                  {/* Permanent Top-Level Formatting Bar */}
                  <MarkdownToolbar
                    getEditorView={getEditorView}
                    markdown={form.markdown}
                    onHelp={() => setHelpOpen(true)}
                    showLineNumbers={showLineNumbers}
                    onToggleLineNumbers={() => setShowLineNumbers((current) => !current)}
                    excludeFloatingTools={true}
                  />

                  {/* Frosted Floating Selection Bubble */}
                  <FrostedSelectionBubble
                    getEditorView={getEditorView}
                    onAIRephrase={({ text, from, to }) => setRephraseTarget({ text, from, to, whole: false })}
                  />

                  <CodeMirror
                    value={form.markdown}
                    minHeight={zenMode ? '720px' : '650px'}
                    maxHeight={zenMode ? '85vh' : '650px'}
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

                  {/* Ambient Circular Word & Reading Pace Meter */}
                  <AmbientWordMeter wordCount={wordCount} charCount={form.markdown.length} />
                </div>
                <FieldError>{errors.markdown}</FieldError>
              </div>
            )}

            {viewMode !== 'edit' && (
              <div className='min-w-0'>
                <div
                  className={`overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900 md:p-8 ${
                    zenMode ? 'h-[720px]' : 'h-[650px]'
                  }`}
                >
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
              className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100'
                  : 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100'
              }`}
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

          {/* Bottom Action Bar for mobile/tablet (< xl) */}
          <div className='sticky bottom-4 z-20 mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:flex-row sm:justify-end xl:hidden'>
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
        </div>

        {/* Right Column: Concept A Publishing & Media Inspector */}
        {!zenMode && (
          <aside className='min-w-0 xl:sticky xl:top-6'>
            <ArticleInspector
              form={form}
              update={update}
              errors={errors}
              slugEdited={slugEdited}
              setSlugEdited={setSlugEdited}
              slugify={slugify}
              taxonomy={taxonomy}
              taxonomyMessage={taxonomyMessage}
              articleLoading={articleLoading}
              submitting={submitting}
              editingArticleId={editingArticleId}
              editingPublished={editingPublished}
              save={save}
              tags={tags}
            />
          </aside>
        )}
      </div>
      <ArticleEditorHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AIConfigModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <AIRephraseModal
        isOpen={!!rephraseTarget}
        text={rephraseTarget?.text || ''}
        scopeLabel={rephraseTarget?.whole ? 'whole article' : 'selected text'}
        onApply={applyRephraseResult}
        onClose={() => setRephraseTarget(null)}
      />
    </main>
  );
};

export default ArticleEditor;
