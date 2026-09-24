import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyArticle, draftKey, formFingerprint, readArticleDraft, writeArticleDraft } from '@utils/articleDraft';

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
  const key = draftKey(adminEmail, articleId);
  const fingerprint = formFingerprint(form);
  const dirty = ready && fingerprint !== baseline;

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
            if (articleId) setRecovery(saved);
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
      } catch (error) {
        if (active && error.name !== 'AbortError') setLoadError(error.message);
      }
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [articleId, defaultPublicationDate, key, reload]);

  const persist = useCallback(() => {
    if (!ready || recovery || skipFlush.current || !dirty) return true;
    try {
      writeArticleDraft(window.localStorage, key, form, slugEdited);
      setLocalSaved(formFingerprint(form));
      setStorageError('');
      return true;
    } catch {
      setStorageError(
        'Local save failed. Your browser may be out of space. Save to Notion or download a backup before leaving.'
      );
      return false;
    }
  }, [ready, recovery, dirty, key, form, slugEdited]);

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
    const timer = window.setTimeout(persist, 800);
    return () => window.clearTimeout(timer);
  }, [ready, dirty, recovery, persist, key]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!persist()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const onRoute = () => {
      if (
        !persist() &&
        !window.confirm('This draft could not be saved on this device. Leave and lose the unsaved changes?')
      ) {
        router.events.emit('routeChangeError');
        // Pages Router cancels navigation when a routeChangeStart listener throws.
        throw new Error('Article navigation cancelled: draft could not be saved.');
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
        else window.localStorage.removeItem(key);
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
