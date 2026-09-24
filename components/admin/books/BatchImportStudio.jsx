import React, { useState, useRef, useEffect } from 'react';
import {
  FiUploadCloud,
  FiFileText,
  FiHash,
  FiPlay,
  FiPause,
  FiRotateCw,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit3,
  FiX,
  FiExternalLink,
  FiSearch,
  FiBookOpen,
  FiLayers,
  FiImage
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { BOOK_SHELVES } from '@utils/books/bookService';
import { createPersistedBook } from '@utils/books/bookApi';
import { loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';
import { loadBookSettings } from '@utils/books/bookSettingsStore';

const READING_STATUSES = [
  { id: 'queued', label: 'Queued' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'completed', label: 'Completed' },
  { id: 'abandoned', label: 'Abandoned' }
];

export const BatchImportStudio = ({ onBookCreated, onClose, existingBooks = [] }) => {
  const [sourceType, setSourceType] = useState('csv'); // 'csv' | 'isbn'
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyFetchingId, setCurrentlyFetchingId] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveSuccessCount, setSaveSuccessCount] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const fileInputRef = useRef(null);
  const isCancelledRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      isProcessingRef.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // PARSING LOGIC
  // -------------------------------------------------------------------------
  const parseCsvLines = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed = [];
    for (const line of lines) {
      // Check if it's a header line
      const lower = line.toLowerCase();
      if (
        (lower.startsWith('title') && (lower.includes('author') || lower.includes('writer'))) ||
        lower.startsWith('book title')
      ) {
        continue;
      }

      let title = '';
      let author = '';

      if (line.includes(';')) {
        const parts = line.split(';').map((s) => s.trim());
        title = parts[0] || '';
        author = parts.slice(1).join('; ') || '';
      } else if (line.includes(',')) {
        // Handle basic quoted or unquoted CSV
        const match = line.match(/^"([^"]+)",?\s*(.*)$/) || line.match(/^([^,]+),?\s*(.*)$/);
        if (match) {
          title = match[1].trim();
          author = (match[2] || '').replace(/^"|"$/g, '').trim();
        } else {
          const parts = line.split(',').map((s) => s.trim());
          title = parts[0] || '';
          author = parts.slice(1).join(', ') || '';
        }
      } else if (/\s+by\s+/i.test(line)) {
        const parts = line.split(/\s+by\s+/i);
        title = parts[0].trim();
        author = parts.slice(1).join(' by ').trim();
      } else {
        title = line.trim();
        author = '';
      }

      if (title) {
        parsed.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'csv',
          rawQuery: line,
          title,
          author,
          isbn: '',
          status: 'pending', // 'pending' | 'fetching' | 'ready' | 'error' | 'approved' | 'saved'
          error: null,
          book: null
        });
      }
    }
    return parsed;
  };

  const parseIsbnLines = (text) => {
    const tokens = text
      .split(/[\r\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const parsed = [];
    for (const token of tokens) {
      // Clean dashes and spaces
      const clean = token.replace(/[-\s]/g, '');
      // Validate ISBN roughly: 10 or 13 digits/chars
      if (/^[0-9Xx]{10}$|^[0-9]{13}$/.test(clean) || clean.length >= 8) {
        parsed.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'isbn',
          rawQuery: token,
          title: `ISBN ${clean}`,
          author: '',
          isbn: clean,
          status: 'pending',
          error: null,
          book: null
        });
      }
    }
    return parsed;
  };

  const handleStageInput = () => {
    if (!rawText.trim()) return;
    const newItems = sourceType === 'csv' ? parseCsvLines(rawText) : parseIsbnLines(rawText);
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setRawText('');
      setSaveSuccessCount(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      if (typeof content === 'string') {
        const newItems = sourceType === 'csv' ? parseCsvLines(content) : parseIsbnLines(content);
        if (newItems.length > 0) {
          setItems((prev) => [...prev, ...newItems]);
          setSaveSuccessCount(null);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------------------
  // SEQUENTIAL FETCHING WORKER (ONE AT A TIME)
  // -------------------------------------------------------------------------
  const fetchSingleItem = async (item) => {
    const creds = getActiveProviderCreds(loadAiConfig());
    const bookSettings = loadBookSettings();

    const payload = {
      mode: item.type === 'isbn' ? 'isbn' : 'title-author',
      provider: creds.provider,
      apiKey: creds.apiKey,
      baseUrl: creds.baseUrl,
      model: creds.model,
      googleBooksApiKey: bookSettings.googleBooksApiKey
    };

    if (item.type === 'isbn') {
      payload.isbn = item.isbn;
    } else {
      payload.title = item.title;
      if (item.author) payload.author = item.author;
    }

    const response = await fetch('/api/admin/books/ai-autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.ok && data.alreadyExists && data.existingBook) {
      return { ...data.existingBook, alreadyExists: true };
    }
    if (!data.ok || !data.book) {
      throw new Error(data.message || 'Book lookup failed');
    }

    const b = data.book;
    const totalPages = Math.max(1, Number(b.totalPages || b.pages) || 300);

    return {
      title: b.title || item.title,
      author: b.author || item.author || 'Unknown Author',
      shelf: b.shelf || 'technical',
      status: 'queued', // default status queued
      rating: 5,
      totalPages,
      pages: totalPages,
      currentPage: 0,
      genre: b.genre || 'General',
      language: b.language || 'English',
      coverUrl: b.coverUrl || '',
      description: b.description || '', // guaranteed in English
      whyRead: b.whyRead || '',
      keyThemes: Array.isArray(b.keyThemes) ? b.keyThemes : [],
      targetAudience: Array.isArray(b.targetAudience) ? b.targetAudience : [],
      similarBooks: Array.isArray(b.similarBooks) ? b.similarBooks : [],
      notableQuotes: Array.isArray(b.notableQuotes) ? b.notableQuotes : [],
      isbn: b.isbn13 || b.isbn || item.isbn || '',
      publisher: b.publisher || '',
      publishedYear: b.publishedYear || null,
      legacy: b.legacy || ''
    };
  };

  const startBatchFetch = async () => {
    if (isProcessing) return;

    // Capture a stable queue from the current render. React state updaters are
    // scheduled work, not synchronous getters, so reading an item by assigning
    // from inside setItems() can make the worker exit before it starts.
    const fetchQueue = items.filter((item) => item.status === 'pending' || item.status === 'error');
    if (fetchQueue.length === 0) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    isCancelledRef.current = false;

    // Process items sequentially one at a time
    for (const targetItem of fetchQueue) {
      if (!isProcessingRef.current || isCancelledRef.current) break;
      const itemId = targetItem.id;
      setCurrentlyFetchingId(itemId);

      // Mark as fetching
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: 'fetching', error: null } : it)));

      try {
        const fetchedBook = await fetchSingleItem(targetItem);
        const nextStatus = fetchedBook.alreadyExists ? 'duplicate' : 'ready';

        if (!isProcessingRef.current || isCancelledRef.current) {
          // Worker was stopped while fetching
          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    status: nextStatus,
                    book: fetchedBook,
                    title: fetchedBook.title,
                    author: fetchedBook.author
                  }
                : it
            )
          );
          break;
        }

        // Successfully fetched, update item
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  status: nextStatus,
                  book: fetchedBook,
                  title: fetchedBook.title,
                  author: fetchedBook.author
                }
              : it
          )
        );
      } catch (err) {
        if (!isProcessingRef.current || isCancelledRef.current) break;
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, status: 'error', error: err.message || 'Lookup failed' } : it))
        );
      }

      // Gentle throttle between calls to protect free rate limits
      await new Promise((r) => setTimeout(r, 400));
    }

    setCurrentlyFetchingId(null);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  const stopBatchFetch = () => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    setCurrentlyFetchingId(null);
  };

  const cancelBatch = () => {
    stopBatchFetch();
    setItems([]);
    setRawText('');
    setSaveSuccessCount(null);
  };

  // -------------------------------------------------------------------------
  // REGENERATE SINGLE ITEM
  // -------------------------------------------------------------------------
  const handleRegenerateItem = async (itemId) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    setRegeneratingId(itemId);
    try {
      const fetchedBook = await fetchSingleItem(item);
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                status: fetchedBook.alreadyExists ? 'duplicate' : 'ready',
                book: fetchedBook,
                title: fetchedBook.title,
                author: fetchedBook.author,
                error: null
              }
            : it
        )
      );

      // If this item is currently being viewed in edit modal, update form too
      if (editingItem?.id === itemId) {
        setEditForm({ ...fetchedBook });
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, status: 'error', error: err.message || 'Regeneration failed' } : it
        )
      );
    } finally {
      setRegeneratingId(null);
    }
  };

  // -------------------------------------------------------------------------
  // ROW ACTIONS (EDIT, DELETE, APPROVE)
  // -------------------------------------------------------------------------
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      title: item.book?.title || item.title || '',
      author: item.book?.author || item.author || '',
      shelf: item.book?.shelf || 'technical',
      status: item.book?.status || 'queued',
      genre: item.book?.genre || 'General',
      coverUrl: item.book?.coverUrl || '',
      description: item.book?.description || '',
      whyRead: item.book?.whyRead || '',
      keyThemes: (item.book?.keyThemes || []).join(', '),
      totalPages: item.book?.totalPages || 300,
      language: item.book?.language || 'English',
      isbn: item.book?.isbn || item.isbn || ''
    });
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editingItem || !editForm) return;

    const updatedBook = {
      ...(editingItem.book || {}),
      title: editForm.title.trim() || editingItem.title,
      author: editForm.author.trim() || editingItem.author,
      shelf: editForm.shelf,
      status: editForm.status,
      genre: editForm.genre.trim() || 'General',
      coverUrl: editForm.coverUrl.trim(),
      description: editForm.description.trim(),
      whyRead: editForm.whyRead.trim(),
      keyThemes: editForm.keyThemes
        ? editForm.keyThemes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      totalPages: Number(editForm.totalPages) || 300,
      pages: Number(editForm.totalPages) || 300,
      language: editForm.language.trim() || 'English',
      isbn: editForm.isbn.trim()
    };

    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: updatedBook.title,
              author: updatedBook.author,
              status: 'ready',
              book: updatedBook
            }
          : it
      )
    );
    setEditingItem(null);
    setEditForm(null);
  };

  const handleDeleteItem = (itemId) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    if (editingItem?.id === itemId) {
      setEditingItem(null);
      setEditForm(null);
    }
  };

  // -------------------------------------------------------------------------
  // BATCH APPROVAL & DATABASE PERSISTENCE
  // -------------------------------------------------------------------------
  const readyItems = items.filter((it) => (it.status === 'ready' || it.status === 'approved') && it.book);

  const handleApproveAndSaveAll = async () => {
    if (readyItems.length === 0 || isSavingAll) return;
    setIsSavingAll(true);
    let savedCount = 0;

    for (const item of readyItems) {
      try {
        const b = item.book;
        const totalPages = Math.max(1, Number(b.totalPages || b.pages) || 300);

        await createPersistedBook({
          title: b.title,
          author: b.author,
          shelf: b.shelf || 'technical',
          status: b.status || 'queued',
          totalPages,
          pages: totalPages,
          currentPage: 0,
          rating: Number(b.rating) || 5,
          genre: b.genre || 'General',
          language: b.language || 'English',
          coverLocalPath: null,
          coverUrl: b.coverUrl || null,
          keyThemes: b.keyThemes || [],
          targetAudience: b.targetAudience || [],
          similarBooks: b.similarBooks || [],
          notableQuotes: b.notableQuotes || [],
          description: b.description || '',
          whyRead: b.whyRead || '',
          isbn: b.isbn || undefined,
          publisher: b.publisher || undefined,
          publishedYear: b.publishedYear || undefined,
          legacy: b.legacy || undefined
        });

        savedCount++;
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'saved' } : it)));
      } catch (err) {
        console.error(`Failed to save book "${item.title}":`, err);
      }
    }

    setIsSavingAll(false);
    setSaveSuccessCount(savedCount);
    if (savedCount > 0) {
      onBookCreated?.();
    }
  };

  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const fetchingCount = items.filter((it) => it.status === 'fetching').length;
  const readyCount = readyItems.length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const duplicateCount = items.filter((it) => it.status === 'duplicate').length;
  const savedCount = items.filter((it) => it.status === 'saved').length;

  return (
    <div className='space-y-4 font-sans'>
      {/* ------------------------------------------------------------- */}
      {/* INPUT / STAGING STAGE                                          */}
      {/* ------------------------------------------------------------- */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3 font-sans'>
        {/* Source Toggle & Upload */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-xs font-bold font-sans'>
            <button
              type='button'
              onClick={() => setSourceType('csv')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-sans ${
                sourceType === 'csv'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiFileText className='size-3.5' /> CSV (Title, Author)
            </button>
            <button
              type='button'
              onClick={() => setSourceType('isbn')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-sans ${
                sourceType === 'isbn'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiHash className='size-3.5' /> ISBN List
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <input
              ref={fileInputRef}
              type='file'
              accept={sourceType === 'csv' ? '.csv,.txt' : '.txt,.csv'}
              onChange={handleFileUpload}
              className='sr-only'
            />
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-sans shadow-xs'
            >
              <FiUploadCloud className='size-3.5 text-indigo-500' /> Open File ({sourceType === 'csv' ? '.csv' : '.txt'}
              )
            </button>
          </div>
        </div>

        {/* Text Area Input */}
        <div>
          <label className='block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
            {sourceType === 'csv'
              ? 'Paste List of Books (Title, Author or Title by Author — one per line)'
              : 'Paste ISBN Codes (ISBN-10 or ISBN-13 — one per line or comma separated)'}
          </label>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              sourceType === 'csv'
                ? 'Designing Data-Intensive Applications, Martin Kleppmann\nAtomic Habits, James Clear\nClean Code by Robert C. Martin'
                : '9781449373320\n9780735211292\n0132350882'
            }
            className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-sans shadow-xs'
          />
        </div>

        {/* Stage Button & Format hint */}
        <div className='flex items-center justify-between gap-3 text-xs'>
          <span className='text-[11px] text-slate-400 font-sans'>
            {sourceType === 'csv'
              ? 'Accepts comma separated, semicolon, or "Title by Author".'
              : 'Accepts ISBN-10 or ISBN-13 with or without dashes.'}
          </span>
          <button
            type='button'
            onClick={handleStageInput}
            disabled={!rawText.trim()}
            className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 text-xs transition shadow-xs font-sans'
          >
            <FiLayers className='size-3.5' /> Load Into Queue
          </button>
        </div>
      </div>

      {/* Success Banner when saving completes */}
      {saveSuccessCount !== null && (
        <div className='flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800/80 dark:bg-emerald-950/40 p-3.5 text-xs font-sans animate-in fade-in'>
          <div className='flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold'>
            <FiCheckCircle className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
            <span>
              Successfully saved {saveSuccessCount} {saveSuccessCount === 1 ? 'book' : 'books'} to your library!
            </span>
          </div>
          <button
            type='button'
            onClick={() => setSaveSuccessCount(null)}
            className='text-slate-400 hover:text-slate-600 dark:hover:text-white'
          >
            <FiX className='size-3.5' />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUEUE CONTROLS & TABLE                                         */}
      {/* ------------------------------------------------------------- */}
      {items.length > 0 && (
        <div className='space-y-3 font-sans'>
          {/* Status Ribbon & Action Bar */}
          <div className='flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800'>
            {/* Counts Capsules */}
            <div className='flex items-center gap-2 flex-wrap text-xs font-sans'>
              <span className='h-[20px] inline-flex items-center rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-none font-sans'>
                Total: {items.length}
              </span>
              {readyCount > 0 && (
                <span className='h-[20px] inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-none font-sans'>
                  Ready: {readyCount}
                </span>
              )}
              {pendingCount > 0 && (
                <span className='h-[20px] inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-none font-sans'>
                  Pending: {pendingCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className='h-[20px] inline-flex items-center rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-none font-sans'>
                  Failed: {errorCount}
                </span>
              )}
              {duplicateCount > 0 && (
                <span className='h-[20px] inline-flex items-center rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 text-[10px] font-bold text-violet-700 dark:text-violet-300 leading-none font-sans'>
                  Already in library: {duplicateCount}
                </span>
              )}
              {savedCount > 0 && (
                <span className='h-[20px] inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-none font-sans'>
                  Saved: {savedCount}
                </span>
              )}
            </div>

            {/* Run / Stop / Clear / Approve Controls */}
            <div className='flex items-center gap-2 flex-wrap'>
              {/* Start / Stop Sequential Worker */}
              {isProcessing ? (
                <button
                  type='button'
                  onClick={stopBatchFetch}
                  className='inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition font-sans shadow-xs'
                >
                  <FiPause className='size-3.5' /> Stop Fetching
                </button>
              ) : (
                pendingCount + errorCount > 0 && (
                  <button
                    type='button'
                    onClick={startBatchFetch}
                    className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white transition font-sans shadow-xs'
                  >
                    <FiPlay className='size-3.5' /> Start Fetching ({pendingCount + errorCount})
                  </button>
                )
              )}

              {/* Clear / Cancel Button */}
              <button
                type='button'
                onClick={cancelBatch}
                disabled={isProcessing || isSavingAll}
                className='inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition font-sans disabled:opacity-50'
                title='Cancel and clear table'
              >
                <FiTrash2 className='size-3.5' /> Clear
              </button>

              {/* Approve & Save All to Database */}
              <button
                type='button'
                onClick={handleApproveAndSaveAll}
                disabled={readyCount === 0 || isSavingAll}
                className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition font-sans active:scale-95'
              >
                {isSavingAll ? (
                  <>
                    <FiRotateCw className='size-3.5 animate-spin' /> Saving Books…
                  </>
                ) : (
                  <>
                    <FiCheck className='size-3.5' /> Approve & Save All ({readyCount})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Batch Table */}
          <div className='overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs max-h-[460px] overflow-y-auto'>
            <table className='w-full text-left text-xs font-sans border-collapse'>
              <thead className='sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700'>
                <tr>
                  <th className='py-2.5 px-3 w-12'>#</th>
                  <th className='py-2.5 px-2 w-14'>Cover</th>
                  <th className='py-2.5 px-3 min-w-[180px]'>Title & Author</th>
                  <th className='py-2.5 px-3 w-28'>Shelf</th>
                  <th className='py-2.5 px-3 w-28'>Genre</th>
                  <th className='py-2.5 px-3 min-w-[200px]'>Description</th>
                  <th className='py-2.5 px-3 w-28'>Status</th>
                  <th className='py-2.5 px-3 w-28 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                {items.map((item, index) => {
                  const b = item.book || {};
                  const isCurrent = currentlyFetchingId === item.id;
                  const isRegenerating = regeneratingId === item.id;
                  const truncatedDesc = b.description
                    ? b.description.slice(0, 25) + (b.description.length > 25 ? '…' : '')
                    : '—';

                  const shelfOption = BOOK_SHELVES.find((s) => s.id === (b.shelf || 'technical'));

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className={`group cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : item.status === 'ready'
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-850/60'
                            : item.status === 'error'
                              ? 'bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/80'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* # Number */}
                      <td className='py-2.5 px-3 font-semibold text-slate-400 text-[11px]'>{index + 1}</td>

                      {/* Small Cover Image */}
                      <td className='py-2.5 px-2'>
                        <div className='w-8 h-11 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-xs'>
                          {b.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.coverUrl}
                              alt={b.title || item.title}
                              className='size-full object-cover object-center'
                            />
                          ) : (
                            <FiBookOpen className='size-3 text-slate-400' />
                          )}
                        </div>
                      </td>

                      {/* Title & Author */}
                      <td className='py-2.5 px-3 min-w-[180px]'>
                        <div className='font-bold text-slate-900 dark:text-white truncate max-w-[220px] text-xs font-sans'>
                          {b.title || item.title}
                        </div>
                        <div className='text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] font-sans'>
                          {b.author || item.author || (item.isbn ? `ISBN: ${item.isbn}` : 'Unknown Author')}
                        </div>
                        {item.status === 'error' && item.error && (
                          <div className='mt-1 max-w-[260px] text-[10px] leading-snug text-rose-700 dark:text-rose-300'>
                            {item.error}
                          </div>
                        )}
                      </td>

                      {/* Shelf */}
                      <td className='py-2.5 px-3'>
                        {b.shelf ? (
                          <span className='h-[20px] inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300 leading-none capitalize font-sans'>
                            {shelfOption?.label?.replace(' Shelf', '') || b.shelf}
                          </span>
                        ) : (
                          <span className='text-[11px] text-slate-400'>—</span>
                        )}
                      </td>

                      {/* Genre */}
                      <td className='py-2.5 px-3'>
                        <span className='text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[110px] block font-sans'>
                          {b.genre || '—'}
                        </span>
                      </td>

                      {/* Description (max 25 chars) */}
                      <td className='py-2.5 px-3 min-w-[200px]' title={b.description || ''}>
                        <span className='text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[240px] block font-sans'>
                          {truncatedDesc}
                        </span>
                      </td>

                      {/* Status */}
                      <td className='py-2.5 px-3'>
                        {item.status === 'fetching' || isCurrent || isRegenerating ? (
                          <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-none animate-pulse font-sans'>
                            <FiRotateCw className='size-2.5 animate-spin' /> Fetching…
                          </span>
                        ) : item.status === 'ready' ? (
                          <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-none font-sans'>
                            <FiCheck className='size-2.5' /> Ready
                          </span>
                        ) : item.status === 'saved' ? (
                          <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-none font-sans'>
                            <FiCheckCircle className='size-2.5' /> Saved
                          </span>
                        ) : item.status === 'duplicate' ? (
                          <span
                            className='h-[20px] inline-flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-500/30 px-2 text-[10px] font-bold text-violet-700 dark:text-violet-300 leading-none font-sans'
                            title='This book is already in your library'
                          >
                            <FiLayers className='size-2.5' /> Already added
                          </span>
                        ) : item.status === 'error' ? (
                          <span
                            className='h-[20px] inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-none font-sans'
                            title={item.error || 'Lookup failed'}
                          >
                            <FiAlertCircle className='size-2.5' /> Error
                          </span>
                        ) : (
                          <span className='h-[20px] inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 text-[10px] font-semibold text-slate-500 leading-none font-sans'>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className='py-2.5 px-3 text-right' onClick={(e) => e.stopPropagation()}>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            type='button'
                            onClick={() => openEditModal(item)}
                            className='size-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center transition'
                            title='Edit / Inspect Book'
                          >
                            <FiEdit3 className='size-3.5' />
                          </button>
                          <button
                            type='button'
                            onClick={() => handleRegenerateItem(item.id)}
                            disabled={isRegenerating || isCurrent}
                            className='size-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 flex items-center justify-center transition disabled:opacity-50'
                            title='Regenerate Metadata with AI'
                          >
                            <FiRotateCw className={`size-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDeleteItem(item.id)}
                            className='size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 flex items-center justify-center transition'
                            title='Delete from Queue'
                          >
                            <FiTrash2 className='size-3.5' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROW DETAIL & EDIT MODAL (PARALLEL NON-BLOCKING)              */}
      {/* ------------------------------------------------------------- */}
      {editingItem && editForm && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-sans animate-in fade-in duration-200'>
          <div className='relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans'>
            {/* Modal Header */}
            <div className='flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-sans'>
              <div className='flex items-center gap-2 font-sans'>
                <div className='size-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-sans'>
                  <FiEdit3 className='size-4' />
                </div>
                <div>
                  <h3 className='text-sm font-bold text-slate-900 dark:text-white font-sans'>
                    Review & Edit Book Details
                  </h3>
                  <p className='text-[11px] text-slate-500 dark:text-slate-400 font-sans'>
                    Make changes, re-fetch via AI, or confirm before batch approval
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={() => {
                  setEditingItem(null);
                  setEditForm(null);
                }}
                className='size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-sans'
              >
                <FiX className='size-4' />
              </button>
            </div>

            {/* Modal Body - Scrollable Form */}
            <form onSubmit={handleSaveEdit} className='flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs'>
              {/* Cover preview + Title & Author */}
              <div className='flex items-start gap-4'>
                <div className='w-16 h-22 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-md'>
                  {editForm.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editForm.coverUrl}
                      alt={editForm.title}
                      className='size-full object-cover object-center'
                    />
                  ) : (
                    <FiBookOpen className='size-6 text-slate-400' />
                  )}
                </div>

                <div className='flex-1 space-y-2.5'>
                  <div>
                    <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                      Book Title
                    </label>
                    <input
                      type='text'
                      value={editForm.title}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                      required
                    />
                  </div>

                  <div>
                    <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>Author</label>
                    <input
                      type='text'
                      value={editForm.author}
                      onChange={(e) => setEditForm((p) => ({ ...p, author: e.target.value }))}
                      className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shelf & Status & Genre */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div>
                  <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                    Shelf Destination
                  </label>
                  <select
                    value={editForm.shelf}
                    onChange={(e) => setEditForm((p) => ({ ...p, shelf: e.target.value }))}
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                  >
                    {BOOK_SHELVES.map((shelf) => (
                      <option key={shelf.id} value={shelf.id}>
                        {shelf.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                    Reading State
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                  >
                    {READING_STATUSES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>Genre</label>
                  <input
                    type='text'
                    value={editForm.genre}
                    onChange={(e) => setEditForm((p) => ({ ...p, genre: e.target.value }))}
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div>
                <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                  Cover Image URL
                </label>
                <input
                  type='text'
                  value={editForm.coverUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, coverUrl: e.target.value }))}
                  placeholder='https://...'
                  className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                />
              </div>

              {/* Description (English) */}
              <div>
                <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                  Description / Synopsis (English)
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                />
              </div>

              {/* Why Read */}
              <div>
                <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                  Why Read & Core ROI
                </label>
                <textarea
                  rows={2}
                  value={editForm.whyRead}
                  onChange={(e) => setEditForm((p) => ({ ...p, whyRead: e.target.value }))}
                  className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                />
              </div>

              {/* Key Themes & Pages & ISBN */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='sm:col-span-2'>
                  <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                    Key Themes (comma-separated)
                  </label>
                  <input
                    type='text'
                    value={editForm.keyThemes}
                    onChange={(e) => setEditForm((p) => ({ ...p, keyThemes: e.target.value }))}
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                  />
                </div>

                <div>
                  <label className='block font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                    Total Pages
                  </label>
                  <input
                    type='number'
                    value={editForm.totalPages}
                    onChange={(e) => setEditForm((p) => ({ ...p, totalPages: e.target.value }))}
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-sans'
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer Controls */}
            <div className='flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-sans'>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => handleRegenerateItem(editingItem.id)}
                  disabled={regeneratingId === editingItem.id}
                  className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition font-sans'
                >
                  <FiRotateCw
                    className={`size-3.5 ${regeneratingId === editingItem.id ? 'animate-spin text-indigo-500' : ''}`}
                  />
                  Regenerate with AI
                </button>
                <button
                  type='button'
                  onClick={() => handleDeleteItem(editingItem.id)}
                  className='inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-sans'
                >
                  <FiTrash2 className='size-3.5' /> Delete
                </button>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setEditingItem(null);
                    setEditForm(null);
                  }}
                  className='rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-sans'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleSaveEdit}
                  className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition font-sans'
                >
                  <FiCheck className='size-3.5' /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchImportStudio;
