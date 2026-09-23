import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FiX, FiBookOpen, FiTrello, FiEdit3, FiCheck, FiCamera, FiHash, FiSearch } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { BOOK_SHELVES } from '@utils/books/bookService';
import { createPersistedBook } from '@utils/books/bookApi';
import { loadAiConfig } from '@utils/admin/aiConfigStore';
import { loadBookSettings } from '@utils/books/bookSettingsStore';

const EMPTY_AUTOFILL_EXTRA = {
  isbn: '',
  publisher: '',
  publishedYear: null,
  coverUrl: '',
  targetAudience: [],
  similarBooks: [],
  notableQuotes: []
};

const MAX_COVER_PHOTO_BYTES = 4 * 1024 * 1024;

export const QuickAddModal = ({ isOpen, initialMode = 'issue', onClose, onBookCreated }) => {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode || 'issue');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [bookError, setBookError] = useState('');

  // Book Form State
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookShelf, setBookShelf] = useState('technical');
  const [bookTotalPages, setBookTotalPages] = useState('320');
  const [bookCurrentPage, setBookCurrentPage] = useState('0');
  const [bookRating, setBookRating] = useState('5');
  const [bookGenre, setBookGenre] = useState('');
  const [bookLanguage, setBookLanguage] = useState('English');
  const [bookCoverLocalPath, setBookCoverLocalPath] = useState('');
  const [bookKeyThemes, setBookKeyThemes] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookNotes, setBookNotes] = useState('');

  // AI Autofill state -- fills the form above from Google Books + the
  // configured AI provider, keyed off title+author, ISBN, or a cover photo.
  const [bookIsbnInput, setBookIsbnInput] = useState('');
  const [coverImageDataUrl, setCoverImageDataUrl] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [autofillMode, setAutofillMode] = useState(''); // '' | 'isbn' | 'title-author' | 'image'
  const [autofillMessage, setAutofillMessage] = useState('');
  const [autofillError, setAutofillError] = useState('');
  const [autofillExtra, setAutofillExtra] = useState(EMPTY_AUTOFILL_EXTRA);

  // Issue Form State
  const [issueProject, setIssueProject] = useState('PORT');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueType, setIssueType] = useState('task');
  const [issuePriority, setIssuePriority] = useState('medium');
  const [issueDesc, setIssueDesc] = useState('');

  // Reset when opening
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'issue');
      setSuccessMessage('');
      setBookError('');
      setBookIsbnInput('');
      setCoverImageDataUrl('');
      setCoverImageName('');
      setAutofillMode('');
      setAutofillMessage('');
      setAutofillError('');
      setAutofillExtra(EMPTY_AUTOFILL_EXTRA);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAutofillError('');
    if (file.size > MAX_COVER_PHOTO_BYTES) {
      setAutofillError('That cover photo is too large (max 4MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCoverImageDataUrl(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setAutofillError('Could not read that image file.');
    reader.readAsDataURL(file);
    setCoverImageName(file.name);
  };

  const runAutofill = async (requestMode) => {
    setAutofillError('');
    setAutofillMessage('');

    if (requestMode === 'isbn' && !bookIsbnInput.trim()) {
      setAutofillError('Enter an ISBN first.');
      return;
    }
    if (requestMode === 'title-author' && !bookTitle.trim()) {
      setAutofillError('Enter a title below first, then come back to this button.');
      return;
    }
    if (requestMode === 'image' && !coverImageDataUrl) {
      setAutofillError('Upload a cover photo first.');
      return;
    }

    setAutofillMode(requestMode);
    try {
      const config = loadAiConfig();
      const bookSettings = loadBookSettings();
      const payload = {
        mode: requestMode,
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        googleBooksApiKey: bookSettings.googleBooksApiKey
      };
      if (requestMode === 'isbn') payload.isbn = bookIsbnInput.trim();
      if (requestMode === 'title-author') {
        payload.title = bookTitle.trim();
        payload.author = bookAuthor.trim();
      }
      if (requestMode === 'image') payload.imageDataUrl = coverImageDataUrl;

      const response = await fetch('/api/admin/books/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.ok) {
        setAutofillError(data.message || 'Autofill failed.');
        return;
      }

      const b = data.book;
      if (b.title) setBookTitle(b.title);
      if (b.author) setBookAuthor(b.author);
      if (b.genre) setBookGenre(b.genre);
      if (b.language) setBookLanguage(b.language);
      if (b.totalPages) setBookTotalPages(String(b.totalPages));
      if (b.description) setBookDescription(b.description.slice(0, 600));
      if (Array.isArray(b.keyThemes) && b.keyThemes.length) setBookKeyThemes(b.keyThemes.join(', '));
      if (typeof b.rating === 'number' && b.rating > 0) setBookRating(String(Math.round(b.rating)));
      const targetAudience = Array.isArray(b.targetAudience) ? b.targetAudience : [];
      const similarBooks = Array.isArray(b.similarBooks) ? b.similarBooks : [];
      const notableQuotes = Array.isArray(b.notableQuotes) ? b.notableQuotes : [];
      setAutofillExtra({
        isbn: b.isbn13 || b.isbn || '',
        publisher: b.publisher || '',
        publishedYear: b.publishedYear || null,
        coverUrl: b.coverUrl || '',
        targetAudience,
        similarBooks,
        notableQuotes
      });
      const enrichedBits = [
        targetAudience.length && `${targetAudience.length} audience`,
        notableQuotes.length && `${notableQuotes.length} quote${notableQuotes.length > 1 ? 's' : ''}`,
        similarBooks.length && `${similarBooks.length} similar title${similarBooks.length > 1 ? 's' : ''}`
      ].filter(Boolean);
      setAutofillMessage(
        `Filled from Google Books${b.isbn13 ? ` (ISBN ${b.isbn13})` : ''}.` +
          (enrichedBits.length ? ` Also added ${enrichedBits.join(', ')}.` : '')
      );
    } catch {
      setAutofillError('Could not reach the server to autofill this book.');
    } finally {
      setAutofillMode('');
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    setLoading(true);
    try {
      const themes = bookKeyThemes
        ? bookKeyThemes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const totalPages = Math.max(1, Number(bookTotalPages) || 1);
      const created = await createPersistedBook({
        title: bookTitle,
        author: bookAuthor,
        shelf: bookShelf,
        totalPages,
        pages: totalPages,
        currentPage: Math.min(totalPages, Math.max(0, Number(bookCurrentPage) || 0)),
        rating: Number(bookRating),
        genre: bookGenre || 'General',
        language: bookLanguage || 'English',
        coverLocalPath: bookCoverLocalPath || null,
        coverUrl: autofillExtra.coverUrl || null,
        keyThemes: themes,
        targetAudience: autofillExtra.targetAudience,
        similarBooks: autofillExtra.similarBooks,
        notableQuotes: autofillExtra.notableQuotes,
        description: bookDescription || '',
        notes: bookNotes,
        isbn: autofillExtra.isbn || undefined,
        publisher: autofillExtra.publisher || undefined,
        publishedYear: autofillExtra.publishedYear || undefined
      });

      setSuccessMessage(`"${created.title}" added to your ${bookShelf} shelf!`);
      onBookCreated?.(created);
      setTimeout(() => {
        onClose();
        router.push(`/admin/books?shelf=${bookShelf}`);
      }, 700);
    } catch (err) {
      console.error(err);
      setBookError(err.message || 'Could not save this book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/issueboard/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectKey: issueProject,
          title: issueTitle.trim(),
          issueType,
          priority: issuePriority,
          description: issueDesc.trim()
        })
      });
      const data = await res.json();
      if (data.ok && data.issue) {
        setSuccessMessage(`Ticket ${data.issue.key} created!`);
        setTimeout(() => {
          onClose();
          router.push(`/admin/issues?project=${issueProject}`);
        }, 700);
      } else {
        alert(data.error?.message || 'Failed to create issue');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Switcher */}
        <div className='flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setMode('issue')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === 'issue'
                  ? 'bg-cyan-500/15 text-cyan-700 border border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <FiTrello className='size-3.5' /> Issue
            </button>
            <button
              type='button'
              onClick={() => setMode('book')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === 'book'
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <FiBookOpen className='size-3.5' /> Book Record
            </button>
            <button
              type='button'
              onClick={() => {
                onClose();
                router.push('/admin/articles/new');
              }}
              className='flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition'
            >
              <FiEdit3 className='size-3.5' /> Article Editor →
            </button>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close modal'
          >
            <FiX className='size-5' />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className='mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300'>
            <FiCheck className='size-4' /> {successMessage}
          </div>
        )}

        {/* FORM 1: CREATE ISSUE */}
        {mode === 'issue' && (
          <form onSubmit={handleCreateIssue} className='mt-4 space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Project</label>
                <select
                  value={issueProject}
                  onChange={(e) => setIssueProject(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                >
                  <option value='PORT'>Portfolio (PORT)</option>
                  <option value='LEM'>Lemony Lingora (LEM)</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                >
                  <option value='task'>Task</option>
                  <option value='bug'>Bug</option>
                  <option value='story'>Story</option>
                  <option value='epic'>Epic</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Issue Title *</label>
              <input
                required
                type='text'
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder='e.g. Add offline audio cache'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Priority</label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                >
                  <option value='highest'>Highest</option>
                  <option value='high'>High</option>
                  <option value='medium'>Medium</option>
                  <option value='low'>Low</option>
                  <option value='lowest'>Lowest</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Description</label>
              <textarea
                rows={3}
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder='Optional context or acceptance criteria…'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-500 transition disabled:opacity-50'
              >
                {loading ? 'Creating…' : 'Create Issue'}
              </button>
            </div>
          </form>
        )}

        {/* FORM 2: ADD BOOK RECORD */}
        {mode === 'book' && (
          <form onSubmit={handleCreateBook} className='mt-4 space-y-4'>
            {bookError && (
              <div
                role='alert'
                className='rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
              >
                {bookError}
              </div>
            )}

            {/* AI Autofill -- populate the fields below from title+author, ISBN, or a cover photo */}
            <div className='rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-2.5 dark:border-purple-500/30 dark:bg-purple-950/20'>
              <div className='flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300'>
                <LuSparkles className='size-3.5' /> AI Autofill
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <div className='relative flex-1 min-w-[9rem]'>
                  <FiHash className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
                  <input
                    type='text'
                    value={bookIsbnInput}
                    onChange={(e) => setBookIsbnInput(e.target.value)}
                    placeholder='ISBN-10 or ISBN-13'
                    className='w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  />
                </div>
                <button
                  type='button'
                  onClick={() => runAutofill('isbn')}
                  disabled={Boolean(autofillMode)}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-40 dark:border-purple-500/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-950/40'
                >
                  {autofillMode === 'isbn' ? 'Looking up…' : 'From ISBN'}
                </button>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  onClick={() => runAutofill('title-author')}
                  disabled={Boolean(autofillMode)}
                  title='Enter a title (and optionally author) below, then click this'
                  className='inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-40 dark:border-purple-500/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-950/40'
                >
                  <FiSearch className='size-3.5' />
                  {autofillMode === 'title-author' ? 'Looking up…' : 'From Title + Author'}
                </button>

                <label className='inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 cursor-pointer dark:border-purple-500/40 dark:bg-slate-900 dark:text-purple-300 dark:hover:bg-purple-950/40'>
                  <FiCamera className='size-3.5' />
                  {coverImageName ? 'Change photo' : 'Upload cover photo'}
                  <input type='file' accept='image/*' onChange={handleCoverFileChange} className='hidden' />
                </label>
                {coverImageDataUrl && (
                  <button
                    type='button'
                    onClick={() => runAutofill('image')}
                    disabled={Boolean(autofillMode)}
                    className='inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40'
                  >
                    {autofillMode === 'image' ? 'Identifying…' : `Identify "${coverImageName}"`}
                  </button>
                )}
              </div>

              {(autofillMessage || autofillExtra.coverUrl) && (
                <div className='flex items-start gap-3'>
                  {autofillExtra.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external Google Books thumbnail URL
                    <img
                      src={autofillExtra.coverUrl}
                      alt={`Cover of ${bookTitle || 'the book'}`}
                      className='h-20 w-14 shrink-0 rounded-md border border-purple-200 object-cover shadow-sm dark:border-purple-500/30'
                    />
                  )}
                  {autofillMessage && (
                    <p className='flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400'>
                      <FiCheck className='size-3 shrink-0' /> {autofillMessage}
                    </p>
                  )}
                </div>
              )}
              {autofillError && (
                <p className='text-[11px] font-semibold text-rose-600 dark:text-rose-400'>{autofillError}</p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                  Book Title *
                </label>
                <input
                  required
                  type='text'
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder='e.g. Clean Architecture'
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
                />
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Author *</label>
                <input
                  required
                  type='text'
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder='e.g. Robert C. Martin'
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Shelf</label>
                <select
                  value={bookShelf}
                  onChange={(e) => setBookShelf(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                >
                  {BOOK_SHELVES.filter((s) => s.id !== 'all').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                  Current Page
                </label>
                <input
                  type='number'
                  min='0'
                  value={bookCurrentPage}
                  onChange={(e) => setBookCurrentPage(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                />
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Total Pages</label>
                <input
                  type='number'
                  min='1'
                  value={bookTotalPages}
                  onChange={(e) => setBookTotalPages(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Genre</label>
                <input
                  type='text'
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                  placeholder='e.g. Distributed Systems'
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Language</label>
                <input
                  type='text'
                  value={bookLanguage}
                  onChange={(e) => setBookLanguage(e.target.value)}
                  placeholder='e.g. English'
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>Description</label>
              <textarea
                rows={2}
                value={bookDescription}
                onChange={(e) => setBookDescription(e.target.value)}
                placeholder='A short synopsis or reason this book matters…'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                Cover Local Filename (from covers folder)
              </label>
              <input
                type='text'
                value={bookCoverLocalPath}
                onChange={(e) => setBookCoverLocalPath(e.target.value)}
                placeholder='e.g. Think_and_Grow_Rich.jpg'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                Key Themes (comma-separated)
              </label>
              <input
                type='text'
                value={bookKeyThemes}
                onChange={(e) => setBookKeyThemes(e.target.value)}
                placeholder='e.g. Replication, Partitioning, Consensus'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                Personal Notes / Takeaways
              </label>
              <textarea
                rows={2}
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                placeholder='Core thesis, mental models, or why you want to read it…'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-500 transition disabled:opacity-50'
              >
                {loading ? 'Saving…' : 'Add to Library'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickAddModal;
