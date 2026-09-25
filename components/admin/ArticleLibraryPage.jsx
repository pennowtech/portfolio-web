import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPlus, FiSearch } from 'react-icons/fi';
import StudioDialog from './StudioDialog';
import { clearAllLocalHistory, clearLocalHistory, historyKey } from '@utils/articleHistory';
import styles from './ArticleStudio.module.css';

const STATUS_FILTERS = [
  ['all', 'All articles'],
  ['draft', 'Drafts'],
  ['published', 'Published']
];
const STATUSES = STATUS_FILTERS.map(([value]) => value);
const CHUNK = 25;

const formatUpdated = (value) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';

const sortValue = (article, sort) => {
  if (sort === 'status') return article.published ? 'published' : 'draft';
  if (sort === 'updated') return article.updatedDate || '';
  return String(article[sort] || '').toLowerCase();
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function ArticleLibraryPage({ adminEmail }) {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [sort, setSort] = useState('updated');
  const [direction, setDirection] = useState(-1);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [dialog, setDialog] = useState(null); // 'draft' | 'history' | 'historyAll'
  const [historyCounts, setHistoryCounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const searchRef = useRef(null);
  const toastTimer = useRef(null);

  // Filters live in the URL so a filtered view can be reloaded or shared.
  const status = STATUSES.includes(router.query.status) ? router.query.status : 'all';
  const query = typeof router.query.q === 'string' ? router.query.q : '';
  const category = typeof router.query.category === 'string' ? router.query.category : 'all';

  const setFilters = useCallback(
    (next) => {
      const merged = { status, q: query, category, ...next };
      const params = {};
      if (merged.status !== 'all') params.status = merged.status;
      if (merged.q) params.q = merged.q;
      if (merged.category !== 'all') params.category = merged.category;
      router.replace({ pathname: router.pathname, query: params }, undefined, { shallow: true, scroll: false });
      setSelected(new Set());
    },
    [router, status, query, category]
  );

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3500);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/articles', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load your articles.');
        setArticles(result.articles || []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(
    () => [...new Set(articles.map((article) => article.category).filter(Boolean))].sort(),
    [articles]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles
      .filter(
        (article) =>
          (status === 'all' || (status === 'published') === Boolean(article.published)) &&
          (category === 'all' || article.category === category) &&
          `${article.title || ''} ${article.category || ''}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => sortValue(a, sort).localeCompare(sortValue(b, sort)) * direction);
  }, [articles, status, category, query, sort, direction]);

  const publishedCount = articles.filter((article) => article.published).length;
  const selectedArticles = articles.filter((article) => selected.has(article.id));
  const selectedPublished = selectedArticles.filter((article) => article.published);
  const allVisibleSelected = visible.length > 0 && visible.every((article) => selected.has(article.id));
  const someVisibleSelected = visible.some((article) => selected.has(article.id));
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleSort = (column) => {
    setDirection(sort === column ? -direction : 1);
    setSort(column);
  };
  const toggleSelected = (id, checked) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const openRename = (article) => {
    setRenaming(article);
    setRenameValue(article.title || '');
  };

  const submitRename = async (event) => {
    event.preventDefault();
    const title = renameValue.trim();
    if (!title || !renaming || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/article-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', id: renaming.id, title })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not rename the article.');
      setArticles((current) => current.map((entry) => (entry.id === renaming.id ? { ...entry, title } : entry)));
      setRenaming(null);
      showToast('Title updated in Notion');
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmMoveToDraft = async () => {
    const ids = selectedPublished.map((article) => article.id);
    if (!ids.length) return;
    setBusy(true);
    const moved = new Set();
    let failed = 0;
    try {
      for (let index = 0; index < ids.length; index += CHUNK) {
        const response = await fetch('/api/admin/article-library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unpublish', ids: ids.slice(index, index + CHUNK) })
        });
        const result = await response.json().catch(() => ({}));
        (result.moved || []).forEach((id) => moved.add(id));
        failed += (result.failed || []).length || (response.ok ? 0 : ids.slice(index, index + CHUNK).length);
      }
    } finally {
      setBusy(false);
    }
    setArticles((current) => current.map((entry) => (moved.has(entry.id) ? { ...entry, published: false } : entry)));
    setSelected(new Set());
    setDialog(null);
    showToast(
      failed
        ? `${plural(moved.size, 'article')} moved to draft; ${failed} could not be changed`
        : `${plural(moved.size, 'article')} moved to draft`
    );
  };

  const openHistoryDialog = async (kind) => {
    setHistoryCounts(null);
    setDialog(kind);
    try {
      const response = await fetch('/api/admin/article-snapshots');
      const result = await response.json();
      setHistoryCounts(response.ok ? result.counts : {});
    } catch {
      setHistoryCounts({});
    }
  };

  const historyTargetCount = (() => {
    if (!historyCounts) return null;
    if (dialog === 'historyAll') return Object.values(historyCounts).reduce((sum, value) => sum + value, 0);
    return selectedArticles.reduce((sum, article) => sum + (historyCounts[article.id] || 0), 0);
  })();

  const confirmClearHistory = async () => {
    setBusy(true);
    try {
      let deleted = 0;
      if (dialog === 'historyAll') {
        const response = await fetch('/api/admin/article-snapshots', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not clear version history.');
        deleted = result.deleted;
        deleted += clearAllLocalHistory(window.localStorage, adminEmail);
      } else {
        const keys = selectedArticles.map((article) => article.id);
        for (let index = 0; index < keys.length; index += 200) {
          const response = await fetch('/api/admin/article-snapshots', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleKeys: keys.slice(index, index + 200) })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Could not clear version history.');
          deleted += result.deleted;
        }
        keys.forEach((id) => clearLocalHistory(window.localStorage, historyKey(adminEmail, id)));
      }
      setSelected(new Set());
      setDialog(null);
      showToast(`Version history cleared (${plural(deleted, 'saved version')} removed). Your articles are untouched.`);
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  };

  const ariaSort = (column) => (sort === column ? (direction === 1 ? 'ascending' : 'descending') : 'none');

  return (
    <main className={styles.studio} aria-label='Article library'>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href='/admin/articles' className={styles.brand}>
            <span className={styles.brandMark}>s</span>
            <span>Article Studio</span>
          </Link>
          <span className={styles.mutedText}>Your publishing workspace</span>
        </div>
        <Link className={styles.primary} href='/admin/articles/new'>
          <FiPlus />
          New article
        </Link>
      </header>

      <div className={styles.pageShell}>
        <div className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>THE LIBRARY</span>
            <h1>Ideas in good company.</h1>
            <p>Pick up where you left off, or make room for something new.</p>
          </div>
          <div className={styles.stats}>
            <div>
              <strong>{articles.length}</strong>
              <span>Articles</span>
            </div>
            <div>
              <strong>{publishedCount}</strong>
              <span>Published</span>
            </div>
            <div>
              <strong>{articles.length - publishedCount}</strong>
              <span>In progress</span>
            </div>
          </div>
        </div>

        <section className={styles.panel} aria-label='Article library'>
          <div className={styles.libraryToolbar}>
            <div className={styles.segmented} role='group' aria-label='Article status'>
              {STATUS_FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  type='button'
                  className={status === value ? styles.selected : ''}
                  aria-pressed={status === value}
                  onClick={() => setFilters({ status: value })}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={styles.row}>
              <div className={styles.search}>
                <FiSearch aria-hidden='true' />
                <input
                  ref={searchRef}
                  aria-label='Search articles'
                  placeholder='Find an article…'
                  value={query}
                  onChange={(event) => setFilters({ q: event.target.value })}
                />
                <kbd className={styles.kbd}>/</kbd>
              </div>
              <select
                className={styles.select}
                aria-label='Filter category'
                value={category}
                onChange={(event) => setFilters({ category: event.target.value })}
              >
                <option value='all'>All categories</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selected.size > 0 && (
            <div className={styles.bulkBar}>
              <strong>{selected.size}</strong>
              <span className={styles.mutedText}>selected</span>
              <span className={styles.bulkSpacer} />
              <button type='button' className={styles.button} onClick={() => setDialog('draft')}>
                Move to draft
              </button>
              <button type='button' className={styles.button} onClick={() => openHistoryDialog('history')}>
                Clear version history
              </button>
              <button type='button' className={styles.button} onClick={() => setSelected(new Set())}>
                Clear selection
              </button>
            </div>
          )}

          <div className={styles.tableWrap}>
            <table className={styles.articleTable}>
              <thead>
                <tr>
                  <th>
                    <input
                      ref={selectAllRef}
                      type='checkbox'
                      aria-label='Select all visible articles'
                      checked={allVisibleSelected}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          visible.forEach((article) =>
                            event.target.checked ? next.add(article.id) : next.delete(article.id)
                          );
                          return next;
                        })
                      }
                    />
                  </th>
                  <th aria-sort={ariaSort('title')}>
                    <button type='button' onClick={() => toggleSort('title')}>
                      Article ↕
                    </button>
                  </th>
                  <th aria-sort={ariaSort('status')}>
                    <button type='button' onClick={() => toggleSort('status')}>
                      Status ↕
                    </button>
                  </th>
                  <th aria-sort={ariaSort('category')}>
                    <button type='button' onClick={() => toggleSort('category')}>
                      Category ↕
                    </button>
                  </th>
                  <th aria-sort={ariaSort('updated')}>
                    <button type='button' onClick={() => toggleSort('updated')}>
                      Updated {sort === 'updated' ? (direction === 1 ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((article) => (
                  <tr key={article.id} className={selected.has(article.id) ? styles.rowSelected : ''}>
                    <td>
                      <input
                        type='checkbox'
                        aria-label={`Select ${article.title}`}
                        checked={selected.has(article.id)}
                        onChange={(event) => toggleSelected(article.id, event.target.checked)}
                      />
                    </td>
                    <td>
                      <button
                        type='button'
                        className={styles.articleName}
                        title='Rename article'
                        onClick={() => openRename(article)}
                      >
                        {article.title || 'Untitled'}
                      </button>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${article.published ? '' : styles.badgeDraft}`}>
                        <span className={styles.dot} />
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className={styles.mutedText}>{article.category || '—'}</td>
                    <td className={styles.mutedText}>{formatUpdated(article.updatedDate)}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <Link
                          className={`${styles.button} ${styles.ghost}`}
                          href={{ pathname: '/admin/articles/new', query: { id: article.id } }}
                        >
                          Edit
                        </Link>
                        <button
                          type='button'
                          className={`${styles.button} ${styles.ghost}`}
                          aria-label={`Rename ${article.title}`}
                          onClick={() => openRename(article)}
                        >
                          Rename
                        </button>
                        <Link
                          className={`${styles.button} ${styles.ghost}`}
                          href={{ pathname: '/admin/articles/recovery', query: { id: article.id } }}
                        >
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && <div className={styles.emptyState}>Loading your articles…</div>}
          {!loading && loadError && (
            <div className={styles.emptyState} role='alert'>
              {loadError}
            </div>
          )}
          {!loading && !loadError && visible.length === 0 && (
            <div className={styles.emptyState}>
              No articles match your filters.
              <br />
              <button
                type='button'
                className={styles.linkButton}
                onClick={() => setFilters({ status: 'all', q: '', category: 'all' })}
              >
                Clear filters
              </button>
            </div>
          )}

          <footer className={styles.libraryBottom}>
            <span>
              {visible.length} of {articles.length} articles
            </span>
            <span>
              Synced from Notion ·{' '}
              <button type='button' className={styles.linkButton} onClick={() => openHistoryDialog('historyAll')}>
                Clear all version history
              </button>
            </span>
          </footer>
        </section>

        <div className={styles.overviewRow}>
          <div className={styles.overviewCard}>
            <span>FOCUS ON THE NEXT STEP</span>
            <strong>Write → Review → Publish</strong>
          </div>
          <div className={styles.overviewCard}>
            <span>FIND YOUR WAY BACK</span>
            <strong>Filters stay in the URL</strong>
          </div>
        </div>
      </div>

      <StudioDialog
        open={renaming !== null}
        title='A better title'
        busy={busy}
        onClose={() => setRenaming(null)}
        actions={
          <>
            <button type='button' className={styles.button} disabled={busy} onClick={() => setRenaming(null)}>
              Cancel
            </button>
            <button
              type='submit'
              form='rename-article-form'
              className={styles.primary}
              disabled={busy || !renameValue.trim()}
            >
              {busy ? 'Saving…' : 'Save title'}
            </button>
          </>
        }
      >
        <form id='rename-article-form' className={styles.dialogField} onSubmit={submitRename}>
          <label htmlFor='rename-article-title'>Article title</label>
          <input
            id='rename-article-title'
            required
            maxLength={180}
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
          />
          <p className={styles.hint} style={{ marginTop: 12 }}>
            Renaming an article leaves its existing URL unchanged.
          </p>
        </form>
      </StudioDialog>

      <StudioDialog
        open={dialog === 'draft'}
        title='Move articles to draft?'
        busy={busy}
        onClose={() => setDialog(null)}
        actions={
          <>
            <button type='button' className={styles.button} disabled={busy} onClick={() => setDialog(null)}>
              Keep published
            </button>
            <button
              type='button'
              className={styles.primary}
              disabled={busy || selectedPublished.length === 0}
              onClick={confirmMoveToDraft}
            >
              {busy ? 'Moving…' : 'Move to draft'}
            </button>
          </>
        }
      >
        <p>
          {selectedPublished.length
            ? `${plural(selectedPublished.length, 'published article')} will be removed from the public site. Your writing is preserved in Notion.`
            : 'All selected articles are already drafts. Their content will stay unchanged.'}
        </p>
      </StudioDialog>

      <StudioDialog
        open={dialog === 'history' || dialog === 'historyAll'}
        title={dialog === 'historyAll' ? 'Clear all version history?' : 'Clear version history?'}
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
              disabled={busy || historyCounts === null}
              onClick={confirmClearHistory}
            >
              {busy ? 'Clearing…' : 'Clear history'}
            </button>
          </>
        }
      >
        <p>
          {historyCounts === null
            ? 'Checking how much history is stored…'
            : dialog === 'historyAll'
              ? `This permanently deletes ${plural(historyTargetCount, 'saved version')} of every article from the database, and the copies kept on this device.`
              : `This permanently deletes ${plural(historyTargetCount, 'saved version')} for ${plural(selectedArticles.length, 'selected article')} from the database, and the copies kept on this device.`}
        </p>
        <div className={styles.dialogNote}>
          Your articles, your Notion pages, and any current working drafts are not affected. Only the saved-version
          history used for recovery is removed. Copies on other devices are not touched.
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
