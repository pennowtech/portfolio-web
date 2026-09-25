import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiArrowRight, FiClock, FiDownloadCloud } from 'react-icons/fi';
import StudioDialog from './StudioDialog';
import { diffWords } from './wordDiff';
import {
  articleTags,
  draftKey,
  emptyArticle,
  formFingerprint,
  readArticleDraft,
  writeArticleDraft
} from '@utils/articleDraft';
import { addLocalSnapshot, clearLocalHistory, historyKey, readLocalHistory, stripCover } from '@utils/articleHistory';
import styles from './ArticleStudio.module.css';

const COMPARABLE = ['title', 'slug', 'description', 'coverUrl', 'publicationDate', 'category', 'tags', 'markdown'];
const comparable = (form) =>
  formFingerprint(
    Object.fromEntries(
      COMPARABLE.map((field) => [
        field,
        field === 'tags' ? articleTags(form[field] || '').join(',') : form[field] || ''
      ])
    )
  );

// Notion returns tags as an array; the editor's form keeps them as a comma-separated string.
const notionToForm = (article) => ({
  ...emptyArticle(),
  ...Object.fromEntries(
    Object.keys(emptyArticle()).map((field) => [
      field,
      field === 'tags' ? (article.tags || []).join(', ') : (article[field] ?? emptyArticle()[field])
    ])
  ),
  coverUpload: null,
  coverCredit: null
});

const formatWhen = (iso) => {
  if (!iso) return 'Time unknown';
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
};
const shortTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

const SERVER_NAMES = {
  notion_saved: ['Saved to Notion', 'Saved draft · synced'],
  published: ['Published version', 'Published · synced'],
  restored: ['Restored version', 'Restored · synced']
};

const snippet = (text, length = 110) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
};

export default function DraftRecoveryPage({ adminEmail }) {
  const router = useRouter();
  const articleId = typeof router.query.id === 'string' ? router.query.id : '';
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notion, setNotion] = useState(null); // { form, published }
  const [localDraft, setLocalDraft] = useState(null);
  const [serverSnapshots, setServerSnapshots] = useState([]);
  const [serverHistoryError, setServerHistoryError] = useState('');
  const [localSnapshots, setLocalSnapshots] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [view, setView] = useState('read');
  const [online, setOnline] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [dialog, setDialog] = useState(null); // 'restore' | 'recovery' | 'clear'
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [reload, setReload] = useState(0);
  const key = draftKey(adminEmail, articleId);
  const versionsKey = historyKey(adminEmail, articleId);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return undefined;
    const controller = new AbortController();
    const load = async () => {
      setError('');
      setServerHistoryError('');
      try {
        try {
          setLocalDraft(readArticleDraft(window.localStorage, key));
        } catch {
          setLocalDraft(null);
        }
        setLocalSnapshots(readLocalHistory(window.localStorage, versionsKey));
        if (articleId) {
          const [articleResponse, historyResponse] = await Promise.all([
            fetch(`/api/admin/articles?id=${encodeURIComponent(articleId)}`, { signal: controller.signal }),
            fetch(`/api/admin/article-snapshots?articleKey=${encodeURIComponent(articleId)}`, {
              signal: controller.signal
            }).catch(() => null)
          ]);
          const article = await articleResponse.json();
          if (!articleResponse.ok) throw new Error(article.message || 'This article could not be loaded.');
          setNotion({ form: notionToForm(article), published: Boolean(article.published) });
          if (historyResponse?.ok) setServerSnapshots((await historyResponse.json()).snapshots || []);
          else {
            setServerSnapshots([]);
            setServerHistoryError(
              'Cross-device history could not be reached, so only versions on this device are shown.'
            );
          }
        } else {
          setNotion(null);
          setServerSnapshots([]);
        }
        setLoaded(true);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') setError(loadError.message);
      }
    };
    load();
    return () => controller.abort();
  }, [router.isReady, articleId, key, versionsKey, reload]);

  const versions = useMemo(() => {
    if (!loaded) return [];
    const list = [];
    const liveFingerprint = notion ? comparable(notion.form) : null;
    const localFingerprint = localDraft ? comparable(localDraft.form) : null;
    const differsFromNotion = localDraft && (!notion || localFingerprint !== liveFingerprint);

    if (differsFromNotion)
      list.push({
        id: 'local-current',
        name: 'Current working draft',
        time: localDraft.savedAt,
        note: 'Saved on this device',
        form: localDraft.form,
        badge: 'Private'
      });

    const matchingServer = serverSnapshots.find((snap) => comparable(snap.form) === liveFingerprint);
    if (notion)
      list.push({
        id: 'notion-live',
        name: differsFromNotion ? 'Notion version' : 'Current working draft',
        time: matchingServer?.createdAt || null,
        note: 'Saved in Notion',
        form: notion.form,
        badge: notion.published ? 'Published' : 'Private'
      });

    const rest = [
      ...serverSnapshots
        .filter((snap) => snap !== matchingServer)
        .map((snap) => ({
          id: `server-${snap.id}`,
          name: SERVER_NAMES[snap.kind][0],
          time: snap.createdAt,
          note: SERVER_NAMES[snap.kind][1],
          form: { ...emptyArticle(), ...snap.form },
          badge: snap.kind === 'published' ? 'Published' : 'Private'
        })),
      ...localSnapshots
        .filter((snap) => !localFingerprint || comparable(snap.form) !== localFingerprint)
        .map((snap) => ({
          id: `local-${snap.id}`,
          name: 'Earlier local draft',
          time: snap.savedAt,
          note: 'Saved on this device',
          form: { ...emptyArticle(), ...snap.form },
          badge: 'Private'
        }))
    ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    return [...list, ...rest];
  }, [loaded, notion, localDraft, serverSnapshots, localSnapshots]);

  useEffect(() => {
    if (versions.length && !versions.some((version) => version.id === selectedId)) setSelectedId(versions[0].id);
  }, [versions, selectedId]);

  const selected = versions.find((version) => version.id === selectedId);
  const workingId = versions[0]?.id;
  const notionVersion = versions.find((version) => version.id === 'notion-live');
  const showBanner = !bannerDismissed && articleId && localDraft && notion && versions[0]?.id === 'local-current';

  const compareParts = useMemo(
    () =>
      selected && notionVersion && selected.id !== notionVersion.id
        ? diffWords(notionVersion.form.markdown || '', selected.form.markdown || '')
        : null,
    [selected, notionVersion]
  );
  const localVsNotion = useMemo(() => {
    const local = versions.find((version) => version.id === 'local-current');
    if (!local || !notionVersion) return null;
    const parts = diffWords(notionVersion.form.markdown || '', local.form.markdown || '');
    const words = (type) =>
      parts
        .filter((part) => part.type === type)
        .reduce((sum, part) => sum + (part.value.match(/\S+/g) || []).length, 0);
    return {
      added: words('added'),
      removed: words('removed'),
      firstAdded: parts.find((part) => part.type === 'added' && part.value.trim())?.value
    };
  }, [versions, notionVersion]);

  const openEditor = (recover) => ({
    pathname: '/admin/articles/new',
    query: { ...(articleId ? { id: articleId } : {}), ...(recover ? { recover } : {}) }
  });

  const restoreSelected = () => {
    if (!selected) return;
    setBusy(true);
    try {
      if (localDraft) addLocalSnapshot(window.localStorage, versionsKey, localDraft.form);
      writeArticleDraft(window.localStorage, key, { ...emptyArticle(), ...stripCover(selected.form) }, true);
      if (articleId)
        fetch('/api/admin/article-snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleKey: articleId, kind: 'restored', form: stripCover(selected.form) })
        }).catch(() => {});
      setDialog(null);
      setView('read');
      setSelectedId('');
      setReload((value) => value + 1);
      showToast('Working draft restored. Previous versions are still available.');
    } catch {
      showToast('Could not restore: this browser is out of storage space.');
    } finally {
      setBusy(false);
    }
  };

  const keepNotionVersion = () => {
    if (localDraft) addLocalSnapshot(window.localStorage, versionsKey, localDraft.form);
    window.localStorage.removeItem(key);
    setDialog(null);
    setBannerDismissed(true);
    setSelectedId('');
    setReload((value) => value + 1);
    showToast('Notion version kept. Your local copy is still in history.');
  };

  const clearHistory = async () => {
    setBusy(true);
    try {
      if (articleId) {
        const response = await fetch('/api/admin/article-snapshots', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleKeys: [articleId] })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not clear version history.');
      }
      clearLocalHistory(window.localStorage, versionsKey);
      setDialog(null);
      setSelectedId('');
      setReload((value) => value + 1);
      showToast('Version history cleared for this article. The article itself is untouched.');
    } catch (clearError) {
      showToast(clearError.message);
    } finally {
      setBusy(false);
    }
  };

  const historyCount = serverSnapshots.length + localSnapshots.length;
  const isWorking = selected && selected.id === workingId;

  return (
    <main className={styles.studio} aria-label='Draft history'>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href='/admin/articles' className={styles.brand}>
            <span className={styles.brandMark}>s</span>
            <span>Article Studio</span>
          </Link>
          <span className={styles.mutedText}>Draft history</span>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.connection} ${online ? '' : styles.connectionOffline}`} role='status'>
            <FiDownloadCloud aria-hidden='true' />
            {online ? 'Connected' : 'Offline · Draft kept on this device'}
          </span>
          <Link className={styles.button} href='/admin/articles'>
            Library
          </Link>
        </div>
      </header>

      <div className={styles.recoveryShell}>
        <div className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>WRITE WITHOUT SECOND-GUESSING</span>
            <h1>Good ideas deserve a safety net.</h1>
            <p>See what changed. Recover a thought. Keep the live article safe.</p>
          </div>
          <Link className={styles.button} href={openEditor(localDraft && articleId ? 'local' : '')}>
            Open in editor <FiArrowRight />
          </Link>
        </div>

        {error && (
          <div className={styles.pageNotice} role='alert'>
            {error}{' '}
            <button type='button' className={styles.linkButton} onClick={() => setReload((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}
        {!articleId && loaded && (
          <div className={styles.pageNotice}>
            This is your unsaved new article, so only versions kept on this device are shown. Save a draft to Notion to
            start a synced history.
          </div>
        )}

        {showBanner && (
          <div className={styles.recoveryBanner}>
            <div className={styles.row}>
              <FiClock aria-hidden='true' />
              <div>
                <strong>A newer draft was found on this device.</strong>
                <p>
                  Local copy: {shortTime(localDraft.savedAt)} · Last Notion save: {shortTime(notionVersion?.time)}
                </p>
              </div>
            </div>
            <button
              type='button'
              className={styles.button}
              onClick={() => {
                setSelectedId('local-current');
                setView('compare');
                setDialog('recovery');
              }}
            >
              Compare drafts <FiArrowRight />
            </button>
          </div>
        )}

        <div className={styles.recoveryGrid}>
          <aside className={`${styles.panel} ${styles.history}`} aria-label='Revision history'>
            <h2>Saved versions</h2>
            <div>
              {!loaded && !error && (
                <p className={styles.hint} style={{ padding: 12 }}>
                  Loading versions…
                </p>
              )}
              {versions.map((version) => (
                <button
                  key={version.id}
                  type='button'
                  className={`${styles.snapshot} ${version.id === selectedId ? styles.snapshotActive : ''}`}
                  aria-pressed={version.id === selectedId}
                  onClick={() => setSelectedId(version.id)}
                >
                  <span className={styles.timelineDot} />
                  <span>
                    <strong>{version.name}</strong>
                    <small>{formatWhen(version.time)}</small>
                    <span className={styles.snapshotNote}>{version.note}</span>
                  </span>
                </button>
              ))}
              {loaded && versions.length === 0 && (
                <p className={styles.hint} style={{ padding: 12 }}>
                  No saved versions yet.
                </p>
              )}
            </div>
            <div className={styles.localNote}>
              Restoring a version creates a new working copy. Your previous draft stays in history.
              <br />
              <br />
              Versions are kept on this device and, once saved to Notion, in your synced history.
              {serverHistoryError && (
                <>
                  <br />
                  <br />
                  {serverHistoryError}
                </>
              )}
              <div className={styles.historyClear}>
                <button
                  type='button'
                  className={styles.linkButton}
                  disabled={historyCount === 0}
                  onClick={() => setDialog('clear')}
                >
                  Clear this article&apos;s history
                </button>
              </div>
            </div>
          </aside>

          <section className={styles.panel}>
            <div className={styles.revisionPanelHeading}>
              <div className={styles.row}>
                <span className={styles.hint}>{selected?.name || 'Select a version'}</span>
                {selected && (
                  <span className={`${styles.badge} ${selected.badge === 'Published' ? '' : styles.badgeDraft}`}>
                    {selected.badge}
                  </span>
                )}
              </div>
              <div className={styles.segmented} role='group' aria-label='Revision view'>
                {[
                  ['read', 'Read'],
                  ['compare', 'Compare']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type='button'
                    className={view === value ? styles.selected : ''}
                    aria-pressed={view === value}
                    onClick={() => setView(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {selected && (
              <div className={styles.revisionContent}>
                <div className={styles.revisionTop}>
                  <span className={styles.eyebrow}>{(selected.form.category || 'Article').toUpperCase()}</span>
                  <span className={styles.mutedText} style={{ fontSize: 11 }}>
                    {formatWhen(selected.time)}
                  </span>
                </div>
                <h1>{selected.form.title || 'Untitled'}</h1>
                <div className={styles.revisionBody}>
                  {view === 'read' || !notionVersion ? (
                    selected.form.markdown || 'This version has no body text.'
                  ) : compareParts ? (
                    compareParts.map((part, index) => {
                      if (part.type === 'added') return <ins key={index}>{part.value}</ins>;
                      if (part.type === 'removed') return <del key={index}>{part.value}</del>;
                      return <span key={index}>{part.value}</span>;
                    })
                  ) : (
                    <p className={styles.hint}>No differences: this is the Notion version.</p>
                  )}
                </div>
                {view === 'compare' && notionVersion && (
                  <div className={styles.diffLegend}>
                    <span className={styles.legendAdded}>Added</span>
                    <span className={styles.legendRemoved}>Removed</span>
                    <span>Compared with the Notion version</span>
                  </div>
                )}
              </div>
            )}
            <footer className={styles.revisionFooter}>
              <span className={styles.hint}>
                {isWorking ? 'Your current working copy' : 'Restore without changing the published article'}
              </span>
              <button
                type='button'
                className={styles.primary}
                disabled={!selected || isWorking}
                onClick={() => setDialog('restore')}
              >
                {isWorking ? 'Current working draft' : 'Restore this version'}
              </button>
            </footer>
          </section>
        </div>

        {!online && (
          <div className={styles.pageNotice} role='status'>
            You&apos;re offline: syncing with Notion is paused. Your draft stays available on this device, and nothing
            has been sent to Notion.
          </div>
        )}
      </div>

      <StudioDialog
        open={dialog === 'restore'}
        title='Bring this version back?'
        busy={busy}
        onClose={() => setDialog(null)}
        actions={
          <>
            <button type='button' className={styles.button} disabled={busy} onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type='button' className={styles.primary} disabled={busy} onClick={restoreSelected}>
              Restore as working draft
            </button>
          </>
        }
      >
        <p>
          Restore “{selected?.name}” from {selected ? formatWhen(selected.time).toLowerCase() : ''} as your working
          draft?
        </p>
        <div className={styles.dialogNote}>
          Your current draft will remain in history. The published article will not change until you publish again.
        </div>
      </StudioDialog>

      <StudioDialog
        open={dialog === 'recovery'}
        title='Which draft should you keep?'
        busy={busy}
        onClose={() => setDialog(null)}
        actions={
          <>
            <button type='button' className={styles.button} onClick={keepNotionVersion}>
              Use Notion version
            </button>
            <Link className={styles.primary} href={openEditor('local')}>
              Recover local copy
            </Link>
          </>
        }
      >
        <p className={styles.hint}>Both versions remain in history, whichever you choose.</p>
        <div className={styles.recoverChoice}>
          <span className={styles.badge}>Newer local copy · {shortTime(localDraft?.savedAt)}</span>
          <h3>
            {localVsNotion
              ? `${localVsNotion.added} words added, ${localVsNotion.removed} removed`
              : 'Your latest edits on this device'}
          </h3>
          {localVsNotion?.firstAdded && <p>“{snippet(localVsNotion.firstAdded)}”</p>}
        </div>
        <div className={styles.recoverChoice}>
          <span className={`${styles.badge} ${styles.badgeGray}`}>Notion copy · {shortTime(notionVersion?.time)}</span>
          <h3>The version currently saved in Notion</h3>
          <p>“{snippet(notionVersion?.form.markdown)}”</p>
        </div>
      </StudioDialog>

      <StudioDialog
        open={dialog === 'clear'}
        title='Clear this article’s history?'
        busy={busy}
        onClose={() => setDialog(null)}
        actions={
          <>
            <button type='button' className={styles.button} disabled={busy} onClick={() => setDialog(null)}>
              Keep history
            </button>
            <button
              type='button'
              className={`${styles.primary} ${styles.dangerButton}`}
              disabled={busy}
              onClick={clearHistory}
            >
              {busy ? 'Clearing…' : 'Clear history'}
            </button>
          </>
        }
      >
        <p>
          This permanently deletes {historyCount} saved version{historyCount === 1 ? '' : 's'} of this article from the
          database and from this device.
        </p>
        <div className={styles.dialogNote}>
          The article, its Notion page, and your current working draft are not affected. Copies on other devices are not
          touched.
        </div>
      </StudioDialog>

      {toast && (
        <div className={styles.toast} role='status'>
          {toast}
        </div>
      )}
    </main>
  );
}
