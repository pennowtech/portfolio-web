import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyArticle, draftKey, formFingerprint, readArticleDraft, writeArticleDraft } from '@utils/articleDraft';
import { addLocalSnapshot, historyKey } from '@utils/articleHistory';

const LOCAL_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

export default function useArticleDraft({ articleId, adminEmail, defaultPublicationDate, router }) {
  const [form, setForm] = useState(() => emptyArticle(defaultPublicationDate));
  const [slugEdited, setSlugEdited] = useState(false);
  const [baseline, setBaseline] = useState('');
  const [localSaved, setLocalSaved] = useState('');
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [recovery, setRecovery] = useState(null);
  const [published, setPublished] = useState(false);
  const [liveSlug, setLiveSlug] = useState('');
  const [reload, setReload] = useState(0);
  const skipFlush = useRef(false);
  const cancelledNavigations = useRef(new WeakSet());
  const key = draftKey(adminEmail, articleId);
  const versionsKey = historyKey(adminEmail, articleId);
  // Set by the Recovery page ("?recover=local|server") so the editor doesn't ask the same question again.
  const recoverChoice = useRef(router.query.recover);
  const fingerprint = formFingerprint(form);
  const dirty = ready && fingerprint !== baseline;

  useEffect(() => {
    const onRejectedNavigation = (event) => {
      // routeChangeStart runs outside the router's cancellation catch. Handle
      // only the exact errors created by our intentional navigation veto.
      if (event.reason && cancelledNavigations.current.has(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('unhandledrejection', onRejectedNavigation, true);
    return () => window.removeEventListener('unhandledrejection', onRejectedNavigation, true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setReady(false);
    setLoadError('');
    const load = async () => {
      try {
        let initial = emptyArticle(defaultPublicationDate);
        if (articleId) {
          const response = await fetch(`/api/admin/articles?id=${encodeURIComponent(articleId)}`, {
            signal: controller.signal
          });
          const article = await response.json();
          if (!response.ok) throw new Error(article.message || 'This article could not be loaded.');
          if (!active) return;
          initial = {
            ...initial,
            ...Object.fromEntries(
              Object.keys(initial).map((field) => [
                field,
                field === 'tags' ? (article.tags || []).join(', ') : (article[field] ?? initial[field])
              ])
            )
          };
          setPublished(Boolean(article.published));
          setLiveSlug(article.slug || '');
        }
        if (!active) return;
        setForm(initial);
        setSlugEdited(Boolean(articleId));
        setBaseline(formFingerprint(initial));
        try {
          const saved = readArticleDraft(window.localStorage, key);
          if (saved && formFingerprint(saved.form) !== formFingerprint(initial)) {
            if (articleId && recoverChoice.current === 'local') {
              setForm(saved.form);
              setSlugEdited(saved.slugEdited);
              setLocalSaved(formFingerprint(saved.form));
            } else if (articleId && recoverChoice.current === 'server') {
              addLocalSnapshot(window.localStorage, versionsKey, saved.form);
              window.localStorage.removeItem(key);
            } else if (articleId) setRecovery(saved);
            else {
              setForm(saved.form);
              setSlugEdited(saved.slugEdited);
              setLocalSaved(formFingerprint(saved.form));
            }
          }
        } catch {
          setStorageError('Local recovery is unavailable. Save to Notion or download a backup before leaving.');
        }
        setReady(true);
        if (recoverChoice.current) {
          recoverChoice.current = undefined;
          router.replace({ pathname: router.pathname, query: articleId ? { id: articleId } : {} }, undefined, {
            shallow: true,
            scroll: false
          });
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setLoadError(error.message);
      }
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
    // `router` is intentionally omitted: its identity changes on navigation and must not reload the article.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, defaultPublicationDate, key, versionsKey, reload]);

  const persist = useCallback(() => {
    if (!ready || recovery || skipFlush.current || !dirty) return true;
    try {
      let existing;
      try {
        existing = readArticleDraft(window.localStorage, key);
      } catch {
        // A valid in-memory draft can replace a corrupt local backup.
      }
      if (!existing || formFingerprint(existing.form) !== formFingerprint(form) || existing.slugEdited !== slugEdited) {
        writeArticleDraft(window.localStorage, key, form, slugEdited);
        addLocalSnapshot(window.localStorage, versionsKey, form, { minIntervalMs: LOCAL_SNAPSHOT_INTERVAL_MS });
      }
      setLocalSaved(formFingerprint(form));
      setStorageError('');
      return true;
    } catch {
      setStorageError(
        'Local save failed. Your browser may be out of space. Save to Notion or download a backup before leaving.'
      );
      return false;
    }
  }, [ready, recovery, dirty, key, versionsKey, form, slugEdited]);

  useEffect(() => {
    if (!ready || recovery || skipFlush.current) return;
    if (!dirty) {
      // Undoing back to the server version must not leave an older edited backup to recover.
      try {
        window.localStorage.removeItem(key);
      } catch {
        setStorageError('The local backup could not be cleared. Save or download a copy before leaving.');
      }
      return;
    }
    // Restoring an already-saved copy must not overwrite another tab's newer edits.
    if (localSaved === fingerprint) return;
    const timer = window.setTimeout(persist, 800);
    return () => window.clearTimeout(timer);
  }, [ready, dirty, recovery, persist, key, localSaved, fingerprint]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!persist()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const onRoute = (url, options) => {
      if (
        !persist() &&
        !window.confirm('This draft could not be saved on this device. Leave and lose the unsaved changes?')
      ) {
        // This is an intentional router cancellation, not an application error.
        const cancellation = { cancelled: true, message: 'Article navigation cancelled: draft could not be saved.' };
        cancelledNavigations.current.add(cancellation);
        router.events.emit('routeChangeError', cancellation, url, options);
        throw cancellation;
      }
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onHidden);
    router.events.on('routeChangeStart', onRoute);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', onHidden);
      router.events.off('routeChangeStart', onRoute);
    };
  }, [persist, router.events]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== key || !event.newValue || !ready) return;
      try {
        const other = readArticleDraft(window.localStorage, key);
        if (other && formFingerprint(other.form) !== fingerprint) setRecovery({ ...other, fromOtherTab: true });
      } catch {
        /* A malformed draft in another tab must not replace this document. */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, ready, fingerprint]);

  const resolveRecovery = (restore) => {
    if (restore) {
      setForm(recovery.form);
      setSlugEdited(recovery.slugEdited);
      setLocalSaved(formFingerprint(recovery.form));
    } else {
      try {
        if (recovery.fromOtherTab) writeArticleDraft(window.localStorage, key, form, slugEdited);
        else {
          // The discarded local copy stays reachable from the Recovery page's history.
          addLocalSnapshot(window.localStorage, versionsKey, recovery.form);
          window.localStorage.removeItem(key);
        }
      } catch {
        setStorageError('Could not update the local backup. Download a copy before leaving.');
      }
    }
    setRecovery(null);
  };

  const markSaved = (savedForm, isPublished, slug, navigating = false) => {
    skipFlush.current = navigating;
    setForm(savedForm);
    setBaseline(formFingerprint(savedForm));
    setPublished(isPublished);
    setLiveSlug(slug);
    setLocalSaved('');
    try {
      window.localStorage.removeItem(key);
      setStorageError('');
    } catch {
      setStorageError('Saved to Notion, but the old local backup could not be removed.');
    }
  };

  const status = !ready
    ? 'Loading article…'
    : recovery
      ? 'Local draft found'
      : storageError
        ? 'Local save unavailable'
        : !dirty
          ? articleId
            ? 'Saved to Notion'
            : 'New draft'
          : localSaved === fingerprint
            ? 'Saved on this device'
            : 'Saving on this device…';

  return {
    form,
    setForm,
    slugEdited,
    setSlugEdited,
    ready,
    loadError,
    storageError,
    recovery,
    resolveRecovery,
    published,
    liveSlug,
    dirty,
    status,
    persist,
    markSaved,
    retryLoad: () => setReload((value) => value + 1)
  };
}
