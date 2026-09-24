/* eslint-disable @next/next/no-img-element -- article previews accept user-provided cover URLs */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap } from '@codemirror/view';
import { FiArrowRight, FiDownload, FiFileText, FiMaximize2, FiMinimize2, FiSettings, FiX } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import MarkdownToolbar from './MarkdownToolbar';
import ArticleInspector from './admin/ArticleInspector';
import StudioDialog from './admin/StudioDialog';
import useArticleDraft from './admin/useArticleDraft';
import { articleSlug, articleTags } from '@utils/articleDraft';
import { validateArticle } from '@utils/articleValidation';
import styles from './admin/ArticleStudio.module.css';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => <p className={styles.loading}>Preparing your writing surface…</p>
});
const ArticlePreview = dynamic(() => import('./Article'), { ssr: false });
const ArticleLibrary = dynamic(() => import('./ArticleLibrary'));
const ArticleEditorHelp = dynamic(() => import('./ArticleEditorHelp'));
const AIConfigModal = dynamic(() => import('./admin/AIConfigModal'));
const AIRephraseModal = dynamic(() => import('./admin/AIRephraseModal'));
const FrostedSelectionBubble = dynamic(() => import('./admin/FrostedSelectionBubble'));

const formatShortcut = (marker) => (view) => {
  const selection = view.state.selection.main;
  const selected = view.state.sliceDoc(selection.from, selection.to);
  const wrapped =
    selection.from >= marker.length &&
    view.state.sliceDoc(selection.from - marker.length, selection.from) === marker &&
    view.state.sliceDoc(selection.to, selection.to + marker.length) === marker;
  if (wrapped) {
    view.dispatch({
      changes: [
        { from: selection.from - marker.length, to: selection.from, insert: '' },
        { from: selection.to, to: selection.to + marker.length, insert: '' }
      ],
      selection: { anchor: selection.from - marker.length, head: selection.to - marker.length }
    });
  } else {
    const text = selected || 'text';
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: `${marker}${text}${marker}` },
      selection: { anchor: selection.from + marker.length, head: selection.from + marker.length + text.length }
    });
  }
  return true;
};

function ArticleWorkspace({ articleId, adminEmail, defaultPublicationDate, focusMode, onFocusModeChange }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const draft = useArticleDraft({ articleId, adminEmail, defaultPublicationDate, router });
  const { form, setForm, slugEdited, setSlugEdited } = draft;
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const savingRef = useRef(false);
  const activeRef = useRef(true);
  const createdIdRef = useRef('');
  const [viewMode, setViewMode] = useState('edit');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiConfigOpen, setAIConfigOpen] = useState(false);
  const [rephraseTarget, setRephraseTarget] = useState(null);
  const [publishAction, setPublishAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [taxonomy, setTaxonomy] = useState({ categories: [], tags: [], articles: [] });
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyMessage, setTaxonomyMessage] = useState('');
  const [taxonomyRevision, setTaxonomyRevision] = useState(0);
  const disabled = !draft.ready || Boolean(draft.recovery) || submitting;
  const getEditorView = useCallback(() => editorRef.current, []);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 850px)');
    const change = () => {
      setMobile(query.matches);
      setSettingsOpen(!query.matches);
    };
    change();
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setTaxonomyLoading(true);
    fetch('/api/admin/articles', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load your articles.');
        setTaxonomy({ categories: result.categories || [], tags: result.tags || [], articles: result.articles || [] });
        setTaxonomyMessage('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setTaxonomyMessage(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTaxonomyLoading(false);
      });
    return () => controller.abort();
  }, [taxonomyRevision]);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const resize = () => {
      title.style.height = '0px';
      title.style.height = `${title.scrollHeight}px`;
    };
    resize();
    let width = title.parentElement.clientWidth;
    const observer = new ResizeObserver(() => {
      const nextWidth = title.parentElement.clientWidth;
      if (nextWidth !== width) {
        width = nextWidth;
        resize();
      }
    });
    observer.observe(title.parentElement);
    return () => observer.disconnect();
  }, [form.title, draft.ready, viewMode]);

  useEffect(() => {
    const escape = (event) => {
      if (
        event.key !== 'Escape' ||
        document.querySelector('dialog[open]') ||
        helpOpen ||
        aiConfigOpen ||
        rephraseTarget
      )
        return;
      document
        .querySelectorAll('[data-article-studio] details[open]')
        .forEach((details) => details.removeAttribute('open'));
      onFocusModeChange(false);
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onFocusModeChange, helpOpen, aiConfigOpen, rephraseTarget]);

  const extensions = useMemo(
    () => [
      markdownLanguage({ codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Article body', 'aria-describedby': 'article-body-help' }),
      keymap.of([
        { key: 'Mod-b', run: formatShortcut('**') },
        { key: 'Mod-i', run: formatShortcut('*') }
      ])
    ],
    []
  );

  const update = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'title' && !slugEdited ? { slug: articleSlug(value) } : {})
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const wordCount = useMemo(() => {
    const text = form.markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!?(?:\[([^\]]*)\])\([^)]+\)/g, '$1')
      .replace(/[#>*_`~|\-[\]]/g, ' ');
    return text.trim() ? text.trim().split(/\s+/u).length : 0;
  }, [form.markdown]);
  const previewMarkdown = `${form.markdown}${form.coverCredit ? `\n\n---\n\n<small>Cover photo by [${form.coverCredit.photographer}](${form.coverCredit.profileUrl}) on [${form.coverCredit.provider}](${form.coverCredit.providerUrl}).</small>` : ''}`;

  const showErrors = (validationErrors) => {
    setErrors(validationErrors);
    setViewMode('edit');
    onFocusModeChange(false);
    if (Object.keys(validationErrors).some((name) => !['title', 'markdown'].includes(name))) setSettingsOpen(true);
    else
      requestAnimationFrame(() => {
        if (validationErrors.title) titleRef.current?.focus();
        else editorRef.current?.focus();
      });
  };

  const validate = (published) => {
    const result = validateArticle({ ...form, tags: articleTags(form.tags), published });
    if (Object.keys(result.errors).length) {
      showErrors(result.errors);
      setMessage({ type: 'error', text: 'Check the highlighted fields before continuing.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const save = async (published) => {
    if (savingRef.current || disabled || !validate(published)) return;
    savingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    draft.persist();
    const id = articleId || createdIdRef.current;
    try {
      const response = await fetch(id ? `/api/admin/articles?id=${encodeURIComponent(id)}` : '/api/admin/articles', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: articleTags(form.tags), published })
      });
      const result = await response.json();
      if (!activeRef.current) return;
      if (!response.ok) {
        if (result.errors) {
          setPublishAction(null);
          showErrors(result.errors);
        }
        throw new Error(
          response.status === 401
            ? 'Your session expired. Download a backup, then sign in again to save to Notion.'
            : result.message || 'Could not save to Notion. Your edits are still here.'
        );
      }
      if (!result.article?.id)
        throw new Error('Notion did not return an article ID. Please check the article library before trying again.');
      const savedForm = { ...form, slug: result.article.slug || form.slug };
      createdIdRef.current = result.article.id;
      draft.markSaved(savedForm, published, savedForm.slug, !id);
      setSlugEdited(true);
      setPublishAction(null);
      setMessage({ type: 'success', text: published ? 'Published to your portfolio.' : 'Draft saved to Notion.' });
      setTaxonomyRevision((value) => value + 1);
      if (!id) {
        try {
          await router.replace({ pathname: '/admin/articles/new', query: { id: result.article.id } }, undefined, {
            shallow: true,
            scroll: false
          });
        } catch {
          draft.markSaved(savedForm, published, savedForm.slug);
        }
      }
    } catch (error) {
      if (activeRef.current) setMessage({ type: 'error', text: error.message });
    } finally {
      savingRef.current = false;
      if (activeRef.current) setSubmitting(false);
    }
  };

  const requestPublish = (published) => {
    if (disabled || !validate(published)) return;
    setMessage(null);
    setPublishAction(published);
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ title: form.title, version: 1, form, slugEdited }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.slug || 'article-draft'}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const applyRephrase = (text) => {
    if (rephraseTarget.whole) update('markdown', text);
    else {
      const view = editorRef.current;
      if (!view || view.state.sliceDoc(rephraseTarget.from, rephraseTarget.to) !== rephraseTarget.text) {
        setMessage({ type: 'error', text: 'That selection changed. Select the text again before applying a rewrite.' });
        return;
      }
      view.dispatch({
        changes: { from: rephraseTarget.from, to: rephraseTarget.to, insert: text },
        selection: { anchor: rephraseTarget.from, head: rephraseTarget.from + text.length }
      });
      view.focus();
    }
  };

  const inspector = (
    <ArticleInspector
      form={form}
      update={update}
      errors={errors}
      setSlugEdited={setSlugEdited}
      taxonomy={taxonomy}
      disabled={disabled}
      published={draft.published}
      onUnpublish={() => {
        setSettingsOpen(false);
        requestPublish(false);
      }}
    />
  );
  const preview = (
    <div className={styles.preview} aria-label='Article preview'>
      {form.coverUpload?.dataUrl || form.coverUrl ? (
        <img className={styles.previewCover} src={form.coverUpload?.dataUrl || form.coverUrl} alt='Article cover' />
      ) : null}
      {form.description && <p className={styles.previewDescription}>{form.description}</p>}
      <ArticlePreview mdxSource={previewMarkdown} />
    </div>
  );

  return (
    <section
      className={`${styles.studio} ${focusMode ? styles.focus : ''}`}
      data-article-studio
      aria-label='Article Studio'
    >
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>s</span>
          <span>Article Studio</span>
          {!focusMode && (
            <button className={styles.button} type='button' disabled={submitting} onClick={() => setLibraryOpen(true)}>
              <FiFileText />
              Articles
            </button>
          )}
        </div>
        <div className={styles.headerActions}>
          <span className={styles.saveStatus} role='status'>
            {submitting ? 'Saving to Notion…' : draft.status}
          </span>
          <button
            className={`${styles.button} ${focusMode ? styles.active : ''}`}
            type='button'
            aria-pressed={focusMode}
            title='Focus mode (Escape to exit)'
            onClick={() => onFocusModeChange(!focusMode)}
          >
            {focusMode ? <FiMinimize2 /> : <FiMaximize2 />}
            {focusMode ? 'Exit focus' : 'Focus'}
          </button>
          <div className={styles.segmented} role='group' aria-label='Editor view'>
            {[
              ['edit', 'Write'],
              ['split', 'Split'],
              ['preview', 'Preview']
            ].map(([mode, label]) => (
              <button
                type='button'
                key={mode}
                className={viewMode === mode ? styles.selected : ''}
                aria-pressed={viewMode === mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === 'split') setSettingsOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {!focusMode && (
            <button
              className={`${styles.button} ${settingsOpen ? styles.active : ''}`}
              type='button'
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <FiSettings />
              Settings
            </button>
          )}
          {!draft.published && (
            <button className={styles.button} type='button' disabled={disabled} onClick={() => save(false)}>
              Save draft
            </button>
          )}
          <button className={styles.primary} type='button' disabled={disabled} onClick={() => requestPublish(true)}>
            {draft.published ? 'Publish changes' : 'Publish'}
            <FiArrowRight />
          </button>
        </div>
      </header>

      {draft.recovery && (
        <div className={styles.notice} role='status'>
          <div>
            <strong>
              {draft.recovery.fromOtherTab ? 'Another tab saved a different draft.' : 'A local draft is available.'}
            </strong>
            <p>Your Notion version has not been changed. Choose which copy to work on.</p>
          </div>
          <div className={styles.row}>
            <button className={styles.button} type='button' onClick={() => draft.resolveRecovery(false)}>
              {draft.recovery.fromOtherTab ? 'Keep this tab' : 'Use Notion version'}
            </button>
            <button className={styles.primary} type='button' onClick={() => draft.resolveRecovery(true)}>
              Recover local draft
            </button>
          </div>
        </div>
      )}
      {draft.storageError && (
        <div className={`${styles.notice} ${styles.errorNotice}`} role='alert'>
          <p>{draft.storageError}</p>
          <div className={styles.row}>
            <button className={styles.button} type='button' onClick={draft.persist}>
              Retry local save
            </button>
            <button className={styles.button} type='button' onClick={downloadBackup}>
              <FiDownload />
              Download backup
            </button>
          </div>
        </div>
      )}
      {message && (
        <div
          className={`${styles.notice} ${message.type === 'error' ? styles.errorNotice : ''}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          <p>{message.text}</p>
          <button
            className={styles.iconButton}
            type='button'
            onClick={() => setMessage(null)}
            aria-label='Dismiss message'
          >
            <FiX />
          </button>
        </div>
      )}

      {!draft.ready ? (
        <div className={styles.loading}>
          {draft.loadError ? (
            <>
              <p role='alert'>{draft.loadError}</p>
              <button type='button' className={styles.button} onClick={draft.retryLoad}>
                Retry loading article
              </button>
            </>
          ) : (
            'Loading your article…'
          )}
        </div>
      ) : (
        <div className={`${styles.body} ${settingsOpen && !focusMode && !mobile ? styles.withSettings : ''}`}>
          <div className={styles.canvas}>
            <div className={`${styles.paper} ${viewMode === 'split' ? styles.splitPaper : ''}`}>
              <fieldset
                className={styles.settingsFields}
                disabled={disabled}
                hidden={viewMode === 'preview' || focusMode}
              >
                <legend className='sr-only'>Writing tools</legend>
                <MarkdownToolbar
                  studio
                  getEditorView={getEditorView}
                  markdown={form.markdown}
                  onHelp={() => setHelpOpen(true)}
                  showLineNumbers={showLineNumbers}
                  onToggleLineNumbers={() => setShowLineNumbers((value) => !value)}
                  extraActions={
                    <>
                      <button
                        type='button'
                        disabled={!form.markdown.trim()}
                        onClick={() => setRephraseTarget({ text: form.markdown, whole: true })}
                      >
                        <LuSparkles />
                        Rephrase article
                      </button>
                      <button type='button' onClick={() => setAIConfigOpen(true)}>
                        <FiSettings />
                        AI settings
                      </button>
                      <button type='button' onClick={downloadBackup}>
                        <FiDownload />
                        Download draft backup
                      </button>
                    </>
                  }
                />
              </fieldset>
              <div className={styles.document} id='article-form'>
                <span className={styles.eyebrow}>
                  {viewMode === 'preview'
                    ? 'Reader preview'
                    : draft.published
                      ? draft.dirty
                        ? 'Published · Unpublished edits'
                        : 'Published article'
                      : 'Working draft'}
                </span>
                <label htmlFor='article-title' className='sr-only'>
                  Article title
                </label>
                <textarea
                  ref={titleRef}
                  id='article-title'
                  className={styles.title}
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder='Give your idea a title…'
                  rows={1}
                  maxLength={180}
                  disabled={disabled}
                  readOnly={viewMode === 'preview'}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'error-title' : undefined}
                />
                {errors.title && (
                  <p className={styles.error} id='error-title'>
                    {errors.title}
                  </p>
                )}
                <div className={viewMode === 'split' ? styles.split : ''}>
                  <div className={styles.editor} hidden={viewMode === 'preview'}>
                    <CodeMirror
                      value={form.markdown}
                      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                      extensions={extensions}
                      editable={!disabled}
                      placeholder='Start with the reader’s problem. What do you want them to understand?'
                      basicSetup={{
                        lineNumbers: showLineNumbers,
                        foldGutter: false,
                        highlightActiveLine: false,
                        highlightActiveLineGutter: false,
                        highlightSelectionMatches: false,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true
                      }}
                      onCreateEditor={(view) => {
                        editorRef.current = view;
                      }}
                      onChange={(value) => update('markdown', value)}
                    />
                    {!disabled && (
                      <FrostedSelectionBubble
                        getEditorView={getEditorView}
                        onAIRephrase={({ text, from, to }) => setRephraseTarget({ text, from, to, whole: false })}
                      />
                    )}
                    {errors.markdown && (
                      <p id='error-markdown' className={styles.error}>
                        {errors.markdown}
                      </p>
                    )}
                  </div>
                  {viewMode !== 'edit' && preview}
                </div>
              </div>
              <footer className={styles.footer}>
                <span>
                  {wordCount.toLocaleString()} words · {Math.max(1, Math.ceil(wordCount / 220))} min read
                </span>
                <span>
                  {draft.published
                    ? 'Edits stay on this device until you publish changes'
                    : 'Private until you publish'}
                </span>
              </footer>
            </div>
            <div className={styles.underCanvas}>
              <p id='article-body-help' className={styles.hint}>
                Markdown supported · Ctrl/⌘ B for bold · Ctrl/⌘ I for italic
              </p>
              {draft.published && draft.liveSlug && (
                <Link className={styles.link} href={`/blog/${draft.liveSlug}`} target='_blank' rel='noreferrer'>
                  View live article ↗
                </Link>
              )}
            </div>
          </div>
          {settingsOpen && !focusMode && !mobile && (
            <aside className={styles.inspector} aria-label='Article settings'>
              <div className={styles.settingsHeading}>
                <h2>Article settings</h2>
                <button
                  className={styles.iconButton}
                  type='button'
                  onClick={() => setSettingsOpen(false)}
                  aria-label='Close article settings'
                >
                  <FiX />
                </button>
              </div>
              {inspector}
            </aside>
          )}
        </div>
      )}

      <StudioDialog
        open={mobile && settingsOpen && !focusMode}
        title='Article settings'
        drawer
        onClose={() => setSettingsOpen(false)}
      >
        {mobile && inspector}
      </StudioDialog>
      <StudioDialog open={libraryOpen} title='Your articles' drawer onClose={() => setLibraryOpen(false)}>
        {libraryOpen && (
          <>
            <ArticleLibrary
              articles={taxonomy.articles}
              loading={taxonomyLoading}
              message={taxonomyMessage}
              activeArticleId={articleId}
            />
            {taxonomyMessage && (
              <button type='button' className={styles.button} onClick={() => setTaxonomyRevision((value) => value + 1)}>
                Retry loading articles
              </button>
            )}
            <p className={styles.hint}>Your edits are backed up on this device when you switch articles.</p>
          </>
        )}
      </StudioDialog>
      <StudioDialog
        open={publishAction !== null}
        title={
          publishAction === false
            ? 'Move this article to draft?'
            : draft.published
              ? 'Publish these changes?'
              : 'Ready for your readers?'
        }
        onClose={() => setPublishAction(null)}
        busy={submitting}
        actions={
          <>
            <button
              className={styles.button}
              type='button'
              disabled={submitting}
              onClick={() => setPublishAction(null)}
            >
              Keep writing
            </button>
            <button className={styles.primary} type='button' disabled={submitting} onClick={() => save(publishAction)}>
              {submitting
                ? 'Saving to Notion…'
                : publishAction === false
                  ? 'Move to draft'
                  : draft.published
                    ? 'Publish changes'
                    : 'Publish article'}
            </button>
          </>
        }
      >
        <p className={styles.reviewTitle}>{form.title}</p>
        <div className={styles.url}>/blog/{form.slug}</div>
        <p>
          {publishAction === false
            ? 'This removes the article from the public portfolio and saves the current content as a Notion draft.'
            : draft.published
              ? 'This replaces the public article with the version you just reviewed.'
              : 'This will make your article available on your public portfolio.'}
        </p>
        <p className={styles.hint}>
          {wordCount.toLocaleString()} words · {form.category} · {form.publicationDate}
        </p>
        {message?.type === 'error' && (
          <p className={styles.error} role='alert'>
            {message.text}
          </p>
        )}
      </StudioDialog>
      {helpOpen && <ArticleEditorHelp open={helpOpen} onClose={() => setHelpOpen(false)} />}
      {aiConfigOpen && <AIConfigModal isOpen={aiConfigOpen} onClose={() => setAIConfigOpen(false)} />}
      {rephraseTarget && (
        <AIRephraseModal
          isOpen
          text={rephraseTarget.text}
          scopeLabel={rephraseTarget.whole ? 'whole article' : 'selected text'}
          onApply={applyRephrase}
          onClose={() => setRephraseTarget(null)}
        />
      )}
    </section>
  );
}

export default function ArticleEditor(props) {
  const router = useRouter();
  if (!router.isReady) return <p className={styles.loading}>Opening Article Studio…</p>;
  const articleId = typeof router.query.id === 'string' ? router.query.id : '';
  // A new document gets its own editor history, backup key, and pending network requests.
  return <ArticleWorkspace key={`${props.adminEmail}:${articleId || 'new'}`} articleId={articleId} {...props} />;
}
