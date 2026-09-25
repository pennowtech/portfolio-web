import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  FiX,
  FiBookOpen,
  FiTrello,
  FiEdit3,
  FiCheck,
  FiCamera,
  FiHash,
  FiSearch,
  FiArrowRight,
  FiRotateCw,
  FiGlobe,
  FiUploadCloud,
  FiExternalLink,
  FiBookmark,
  FiCheckCircle,
  FiCode,
  FiCopy,
  FiLayers
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { getBookCoverSrc, BOOK_SHELVES } from '@utils/books/bookService';
import { createPersistedBook, updatePersistedBook } from '@utils/books/bookApi';
import { loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';
import { loadBookSettings } from '@utils/books/bookSettingsStore';
import BatchImportStudio from './books/BatchImportStudio';
import WhyReadContent from './books/WhyReadContent';
import AIModelBadge from './AIModelBadge';

const renderHighlightedJson = (obj) => {
  if (!obj) return '';
  const str = JSON.stringify(obj, null, 2);
  const escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-700 dark:text-amber-400 font-medium';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-indigo-700 dark:text-indigo-300 font-bold';
        } else {
          cls = 'text-emerald-800 dark:text-emerald-300';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-700 dark:text-purple-300 font-semibold';
      } else if (/null/.test(match)) {
        cls = 'text-rose-600 dark:text-rose-400 italic font-semibold';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

const cleanForMatching = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanIsbn = (str) =>
  String(str || '')
    .replace(/[^0-9X]/gi, '')
    .toUpperCase();

const findBookInList = (books, { title, author, isbn }) => {
  if (!Array.isArray(books) || !books.length) return null;
  const targetIsbn = cleanIsbn(isbn);
  if (targetIsbn && targetIsbn.length >= 9) {
    const match = books.find((b) => {
      const bIsbn = cleanIsbn(b.isbn || b.isbn13);
      return bIsbn && bIsbn === targetIsbn;
    });
    if (match) return match;
  }

  const targetTitle = cleanForMatching(title);
  const targetAuthor = cleanForMatching(author);

  if (targetTitle) {
    const exactMatch = books.find((b) => cleanForMatching(b.title) === targetTitle);
    if (exactMatch) return exactMatch;

    if (targetTitle.length >= 5) {
      const closeMatch = books.find((b) => {
        const bTitle = cleanForMatching(b.title);
        const titleMatches = bTitle.includes(targetTitle) || targetTitle.includes(bTitle);
        if (!titleMatches) return false;
        if (!targetAuthor) return true;
        const bAuthor = cleanForMatching(b.author);
        return bAuthor.includes(targetAuthor) || targetAuthor.includes(bAuthor);
      });
      if (closeMatch) return closeMatch;
    }
  }

  return null;
};

const EMPTY_AUTOFILL_EXTRA = {
  isbn: '',
  publisher: '',
  publishedYear: null,
  coverUrl: '',
  whyRead: '',
  targetAudience: [],
  similarBooks: [],
  notableQuotes: [],
  legacy: ''
};

const READING_STATUS_OPTIONS = [
  { id: 'wishlist', label: 'Wishlist & Up Next' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'completed', label: 'Completed' },
  { id: 'queued', label: 'Queued' },
  { id: 'reference', label: 'Reference' }
];

const MAX_COVER_PHOTO_BYTES = 4 * 1024 * 1024;

export const QuickAddModal = ({
  isOpen,
  initialMode = 'issue',
  onClose,
  onBookCreated,
  onOpenDetail,
  existingBooks = []
}) => {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode || 'issue');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [bookError, setBookError] = useState('');

  // Evidence Studio Source Tab ('title' | 'isbn' | 'cover')
  const [studioSource, setStudioSource] = useState('title');
  const [studioQuery, setStudioQuery] = useState('');
  const [studioShelf, setStudioShelf] = useState('technical');
  const [studioStatus, setStudioStatus] = useState('queued');

  // Book Form State (values being reviewed & enriched)
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookTotalPages, setBookTotalPages] = useState('320');
  const [bookCurrentPage, setBookCurrentPage] = useState('0');
  const [bookRating, setBookRating] = useState('5');
  const [bookGenre, setBookGenre] = useState('');
  const [bookLanguage, setBookLanguage] = useState('English');
  const [bookCoverLocalPath, setBookCoverLocalPath] = useState('');
  const [bookKeyThemes, setBookKeyThemes] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookWhyRead, setBookWhyRead] = useState('');
  const [bookNotes, setBookNotes] = useState('');

  // AI Autofill Pipeline & Extra Metadata
  const [coverImageDataUrl, setCoverImageDataUrl] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [autofillMode, setAutofillMode] = useState(''); // '' | 'title-author' | 'isbn' | 'image'
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: AI running, 2: Google Books cover, 3: ready
  const [autofillMessage, setAutofillMessage] = useState('');
  const [autofillError, setAutofillError] = useState('');
  const [autofillExtra, setAutofillExtra] = useState(EMPTY_AUTOFILL_EXTRA);
  const [rawAiResponse, setRawAiResponse] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Existing book in DB detection
  const [existingBookFound, setExistingBookFound] = useState(null);
  const [overwritingBookId, setOverwritingBookId] = useState(null);

  // Review & Edit controls
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [isEditingFields, setIsEditingFields] = useState(false);

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
      setStudioSource('title');
      setStudioQuery('');
      setStudioShelf('technical');
      setStudioStatus('queued');
      setBookTitle('');
      setBookAuthor('');
      setBookTotalPages('320');
      setBookCurrentPage('0');
      setBookRating('5');
      setBookGenre('');
      setBookLanguage('English');
      setBookCoverLocalPath('');
      setBookKeyThemes('');
      setBookDescription('');
      setBookWhyRead('');
      setBookNotes('');
      setCoverImageDataUrl('');
      setCoverImageName('');
      setAutofillMode('');
      setPipelineStep(0);
      setAutofillMessage('');
      setAutofillError('');
      setAutofillExtra(EMPTY_AUTOFILL_EXTRA);
      setRawAiResponse(null);
      setShowJsonModal(false);
      setCopiedJson(false);
      setExistingBookFound(null);
      setOverwritingBookId(null);
      setShowResultScreen(false);
      setIsEditingFields(false);
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

  const runEvidenceStudioEnrichment = async (options = {}) => {
    setAutofillError('');
    setAutofillMessage('');
    // A normal lookup is a new book; only an explicit refetch may target an existing record.
    if (!options.forceRefetch) setOverwritingBookId(null);

    if (!options.forceRefetch && studioSource === 'title' && !studioQuery.trim() && !bookTitle.trim()) {
      setAutofillError('Enter a title (and optionally author) first.');
      return;
    }
    if (!options.forceRefetch && studioSource === 'isbn' && !studioQuery.trim()) {
      setAutofillError('Enter an ISBN first.');
      return;
    }
    if (!options.forceRefetch && studioSource === 'cover' && !coverImageDataUrl) {
      setAutofillError('Select or drop a cover photo first.');
      return;
    }

    const requestMode =
      options.mode || (studioSource === 'cover' ? 'image' : studioSource === 'isbn' ? 'isbn' : 'title-author');
    setAutofillMode(requestMode);
    setPipelineStep(1);

    // Fast client-side duplicate check if existingBooks is provided (unless forceRefetching)
    if (!options.forceRefetch && Array.isArray(existingBooks) && existingBooks.length > 0) {
      const queryText = options.title ? options.title : studioQuery.trim() || bookTitle.trim();
      const clientMatch = findBookInList(existingBooks, {
        title: requestMode === 'title-author' ? queryText : '',
        isbn: requestMode === 'isbn' ? options.isbn || queryText : ''
      });
      if (clientMatch) {
        setExistingBookFound(clientMatch);
        setPipelineStep(3);
        setAutofillMode('');
        return;
      }
    }

    try {
      const creds = getActiveProviderCreds(loadAiConfig());
      const bookSettings = loadBookSettings();
      const payload = {
        mode: requestMode,
        provider: creds.provider,
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: creds.model,
        googleBooksApiKey: bookSettings.googleBooksApiKey,
        forceRefetch: Boolean(options.forceRefetch)
      };

      if (requestMode === 'isbn') {
        payload.isbn = options.isbn || studioQuery.trim();
      } else if (requestMode === 'title-author') {
        const queryText = options.title
          ? (options.title + (options.author ? ` by ${options.author}` : '')).trim()
          : studioQuery.trim() || bookTitle.trim();
        if (/\s+by\s+/i.test(queryText)) {
          const parts = queryText.split(/\s+by\s+/i);
          payload.title = parts[0].trim();
          payload.author = parts.slice(1).join(' by ').trim();
        } else {
          payload.title = options.title || queryText;
          if (options.author || bookAuthor.trim()) payload.author = options.author || bookAuthor.trim();
        }
      } else if (requestMode === 'image') {
        payload.imageDataUrl = coverImageDataUrl;
      }

      setPipelineStep(2);

      const response = await fetch('/api/admin/books/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.ok) {
        setAutofillError(data.message || 'Evidence Studio autofill failed.');
        setPipelineStep(0);
        return;
      }

      // Check if book was identified as already existing in DB (unless forceRefetching)
      if (!options.forceRefetch && data.alreadyExists && data.existingBook) {
        setExistingBookFound(data.existingBook);
        setRawAiResponse(data.existingBook);
        setPipelineStep(3);
        setAutofillMode('');
        return;
      }

      const b = data.book || data;
      setRawAiResponse(data.book || data);
      if (b.shelf) setStudioShelf(b.shelf);
      if (b.title) setBookTitle(b.title);
      if (b.author) setBookAuthor(b.author);
      if (b.genre) setBookGenre(b.genre);
      if (b.language) setBookLanguage(b.language);
      if (b.totalPages || b.pages) setBookTotalPages(String(b.totalPages || b.pages));
      if (b.description) setBookDescription(b.description);
      if (b.whyRead) setBookWhyRead(b.whyRead);
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
        whyRead: b.whyRead || '',
        targetAudience,
        similarBooks,
        notableQuotes,
        legacy: b.legacy || ''
      });

      setPipelineStep(3);
      setShowResultScreen(true);
      setAutofillMessage(
        options.forceRefetch
          ? 'Fresh metadata refetched with AI. Review details below before saving to overwrite your database record.'
          : 'Complete record generated by AI and Google Books. Review details below before saving.'
      );
    } catch {
      setAutofillError('Could not reach the server to autofill this book.');
      setPipelineStep(0);
    } finally {
      setAutofillMode('');
    }
  };

  const handleRefetchAndOverwrite = async () => {
    if (!existingBookFound) return;
    const targetId = existingBookFound.id;
    const refetchTitle = existingBookFound.title;
    const refetchAuthor = existingBookFound.author;
    const refetchIsbn = existingBookFound.isbn || existingBookFound.isbn13;
    setOverwritingBookId(targetId);
    setExistingBookFound(null);

    if (refetchIsbn) {
      await runEvidenceStudioEnrichment({ mode: 'isbn', forceRefetch: true, isbn: refetchIsbn });
    } else {
      await runEvidenceStudioEnrichment({
        mode: 'title-author',
        forceRefetch: true,
        title: refetchTitle,
        author: refetchAuthor
      });
    }
  };

  const handleSaveReviewedBook = async (e) => {
    if (e) e.preventDefault();
    const finalTitle = bookTitle.trim() || studioQuery.trim();
    const finalAuthor = bookAuthor.trim() || 'Unknown Author';

    if (!finalTitle) {
      setBookError('Please provide a book title.');
      return;
    }

    setLoading(true);
    setBookError('');
    try {
      const themes = bookKeyThemes
        ? bookKeyThemes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : Array.isArray(autofillExtra.keyThemes)
          ? autofillExtra.keyThemes
          : [];

      const totalPages = Math.max(1, Number(bookTotalPages) || 300);
      const bookPayload = {
        title: finalTitle,
        author: finalAuthor,
        shelf: studioShelf,
        status: studioStatus,
        totalPages,
        pages: totalPages,
        currentPage: Math.min(totalPages, Math.max(0, Number(bookCurrentPage) || 0)),
        rating: Number(bookRating) || 5,
        genre: bookGenre || 'General',
        language: bookLanguage || 'English',
        coverLocalPath: bookCoverLocalPath || null,
        coverUrl: autofillExtra.coverUrl || null,
        keyThemes: themes,
        targetAudience: autofillExtra.targetAudience,
        similarBooks: autofillExtra.similarBooks,
        notableQuotes: autofillExtra.notableQuotes,
        description: bookDescription || '',
        whyRead: bookWhyRead || autofillExtra.whyRead || '',
        notes: bookNotes,
        isbn: autofillExtra.isbn || undefined,
        publisher: autofillExtra.publisher || undefined,
        publishedYear: autofillExtra.publishedYear || undefined,
        legacy: autofillExtra.legacy || undefined
      };

      let created;
      if (overwritingBookId) {
        created = await updatePersistedBook(overwritingBookId, bookPayload);
        setSuccessMessage(`"${created.title}" successfully updated & overwritten in your ${studioShelf} shelf!`);
      } else {
        created = await createPersistedBook(bookPayload);
        setSuccessMessage(`"${created.title}" successfully added to your ${studioShelf} shelf!`);
      }

      onBookCreated?.(created);
      setTimeout(() => {
        setOverwritingBookId(null);
        onClose();
        router.push(`/admin/books?shelf=${studioShelf}`);
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

  const activeShelfLabel = BOOK_SHELVES.find((s) => s.id === studioShelf)?.label || 'Tech & Architecture';
  const activeStatusLabel = READING_STATUS_OPTIONS.find((s) => s.id === studioStatus)?.label || 'Currently Reading';
  const previewTitle = bookTitle || studioQuery || 'Designing Data-Intensive Applications';
  const previewAuthor = bookAuthor || 'Martin Kleppmann';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-md overflow-y-auto'>
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-sans transition-all duration-300 my-auto ${
          mode === 'batch' ? 'max-w-5xl xl:max-w-6xl' : mode === 'book' ? 'max-w-4xl xl:max-w-5xl' : 'max-w-xl'
        }`}
      >
        {/* Top Header Row with Tabs and Close */}
        <div className='flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3'>
          <div className='flex items-center gap-1.5 flex-wrap'>
            <button
              type='button'
              onClick={() => setMode('book')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition font-sans ${
                mode === 'book'
                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FiBookOpen className='size-3.5' /> Evidence Studio (Book)
            </button>
            <button
              type='button'
              onClick={() => setMode('batch')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition font-sans ${
                mode === 'batch'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FiLayers className='size-3.5' /> Batch Import (CSV / ISBN)
            </button>
            <button
              type='button'
              onClick={() => setMode('issue')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition font-sans ${
                mode === 'issue'
                  ? 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FiTrello className='size-3.5' /> Issue Ticket
            </button>
            <button
              type='button'
              onClick={() => {
                onClose();
                router.push('/admin/articles/new');
              }}
              className='hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition font-sans'
            >
              <FiEdit3 className='size-3.5' /> Article Editor →
            </button>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
            aria-label='Close modal'
          >
            <FiX className='size-5' />
          </button>
        </div>

        {/* Global Success Alert */}
        {successMessage && (
          <div className='mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300 font-sans'>
            <FiCheck className='size-4 shrink-0' /> {successMessage}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: CREATE ISSUE TICKET                                     */}
        {/* ============================================================== */}
        {mode === 'issue' && (
          <form onSubmit={handleCreateIssue} className='mt-4 space-y-4 font-sans'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>Project</label>
                <select
                  value={issueProject}
                  onChange={(e) => setIssueProject(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-sans'
                >
                  <option value='PORT'>Portfolio (PORT)</option>
                  <option value='LEM'>Lemony Lingora (LEM)</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                  Issue Type
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-sans'
                >
                  <option value='task'>Task</option>
                  <option value='bug'>Bug</option>
                  <option value='story'>Story</option>
                  <option value='epic'>Epic</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                Issue Title *
              </label>
              <input
                required
                type='text'
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder='e.g. Add offline audio cache'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 font-sans'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>Priority</label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-sans'
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
              <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>Description</label>
              <textarea
                rows={3}
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder='Optional context or acceptance criteria…'
                className='w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 font-sans'
              />
            </div>

            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-sans'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-500 transition disabled:opacity-50 font-sans'
              >
                {loading ? 'Creating…' : 'Create Issue'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 2: BATCH IMPORT STUDIO (CSV / ISBN LIST)                  */}
        {/* ============================================================== */}
        {mode === 'batch' && (
          <div className='mt-3 space-y-4 font-sans max-h-[82vh] overflow-y-auto pr-1'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3'>
              <div>
                <h3 className='text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans'>
                  Batch Import Studio
                  <span className='h-[20px] inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-sans leading-none'>
                    Sequential AI Worker
                  </span>
                </h3>
                <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans'>
                  Load titles & authors or ISBNs from CSV/text, fetch live metadata sequentially, inspect & edit freely,
                  and approve into your bookshelf.
                </p>
              </div>
            </div>

            <BatchImportStudio onBookCreated={onBookCreated} onClose={onClose} existingBooks={existingBooks} />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: EVIDENCE STUDIO (AI BOOK CAPTURE & REVIEW)             */}
        {/* ============================================================== */}
        {mode === 'book' && (
          <div className='mt-3 space-y-4 font-sans max-h-[80vh] overflow-y-auto pr-1'>
            {/* Studio Subheader */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3'>
              <div>
                <h3 className='text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans'>
                  Evidence Studio
                  <span className='h-[20px] inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-sans leading-none'>
                    AI Verified Workflow
                  </span>
                </h3>
                <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans'>
                  One unified input surface, explicit source boundaries, and complete editorial review before saving.
                </p>
                <AIModelBadge className='mt-1.5' />
              </div>

              {showResultScreen && (
                <button
                  type='button'
                  onClick={() => setIsEditingFields(!isEditingFields)}
                  className='self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition font-sans'
                >
                  <FiEdit3 className='size-3.5' /> {isEditingFields ? 'View Summary Card' : 'Edit All Fields'}
                </button>
              )}
            </div>

            {bookError && (
              <div
                role='alert'
                className='rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 font-sans'
              >
                {bookError}
              </div>
            )}

            {/* Split Input + Live Preview Stage */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
              {/* Left Column: Source Selection & Input Fields (7 cols) */}
              <div className='lg:col-span-7 space-y-3.5'>
                {/* 3 Source Buttons */}
                <div className='grid grid-cols-3 gap-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setStudioSource('title');
                      setAutofillError('');
                    }}
                    className={`min-h-[58px] p-2.5 rounded-xl border text-left transition font-sans flex flex-col justify-center ${
                      studioSource === 'title'
                        ? 'border-emerald-600/70 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className='text-xs font-bold font-sans flex items-center gap-1.5'>
                      <FiSearch className='size-3.5' /> Title + author
                    </span>
                    <span className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-sans'>
                      AI generates all details
                    </span>
                  </button>

                  <button
                    type='button'
                    onClick={() => {
                      setStudioSource('isbn');
                      setAutofillError('');
                    }}
                    className={`min-h-[58px] p-2.5 rounded-xl border text-left transition font-sans flex flex-col justify-center ${
                      studioSource === 'isbn'
                        ? 'border-emerald-600/70 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className='text-xs font-bold font-sans flex items-center gap-1.5'>
                      <FiHash className='size-3.5' /> ISBN code
                    </span>
                    <span className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-sans'>
                      Resolves official edition
                    </span>
                  </button>

                  <button
                    type='button'
                    onClick={() => {
                      setStudioSource('cover');
                      setAutofillError('');
                    }}
                    className={`min-h-[58px] p-2.5 rounded-xl border text-left transition font-sans flex flex-col justify-center ${
                      studioSource === 'cover'
                        ? 'border-emerald-600/70 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className='text-xs font-bold font-sans flex items-center gap-1.5'>
                      <FiCamera className='size-3.5' /> Cover photo
                    </span>
                    <span className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-sans'>
                      Vision reads front cover
                    </span>
                  </button>
                </div>

                {/* Input Fields based on selected source */}
                {studioSource !== 'cover' ? (
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                        {studioSource === 'title' ? 'What are you adding?' : 'Book ISBN-10 or ISBN-13'}
                      </label>
                      <input
                        type='text'
                        value={studioQuery}
                        onChange={(e) => setStudioQuery(e.target.value)}
                        placeholder={
                          studioSource === 'title'
                            ? 'e.g. Designing Data-Intensive Applications by Martin Kleppmann'
                            : 'e.g. 9781449373320 or 1449373321'
                        }
                        className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans shadow-sm'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-sans'>
                          Shelf Destination
                        </label>
                        <select
                          value={studioShelf}
                          onChange={(e) => setStudioShelf(e.target.value)}
                          className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-sans shadow-sm'
                        >
                          {BOOK_SHELVES.filter((s) => s.id !== 'all').map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-sans'>
                          Reading State
                        </label>
                        <select
                          value={studioStatus}
                          onChange={(e) => setStudioStatus(e.target.value)}
                          className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-sans shadow-sm'
                        >
                          {READING_STATUS_OPTIONS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Cover Photo Dropzone */
                  <div className='space-y-3'>
                    <div className='rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 p-5 text-center flex flex-col items-center justify-center space-y-2'>
                      <div className='size-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400'>
                        <FiUploadCloud className='size-5' />
                      </div>
                      <div className='text-xs font-bold text-slate-800 dark:text-slate-200 font-sans'>
                        Photograph front cover or book spine
                      </div>
                      <p className='text-[11px] text-slate-500 dark:text-slate-400 max-w-sm font-sans'>
                        AI vision reads visible title and author text. The uploaded photo is used for identification
                        only and is not saved as the final cover.
                      </p>

                      <div className='pt-1'>
                        <label className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-sm transition font-sans'>
                          <FiCamera className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                          {coverImageName ? 'Change Cover Photo' : 'Choose Cover Photo'}
                          <input type='file' accept='image/*' onChange={handleCoverFileChange} className='hidden' />
                        </label>
                      </div>

                      {coverImageName && (
                        <div className='flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 font-sans'>
                          <FiCheck className='size-3.5' /> Selected: {coverImageName}
                        </div>
                      )}
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-sans'>
                          Shelf Destination
                        </label>
                        <select
                          value={studioShelf}
                          onChange={(e) => setStudioShelf(e.target.value)}
                          className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-sans shadow-sm'
                        >
                          {BOOK_SHELVES.filter((s) => s.id !== 'all').map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-sans'>
                          Reading State
                        </label>
                        <select
                          value={studioStatus}
                          onChange={(e) => setStudioStatus(e.target.value)}
                          className='w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-sans shadow-sm'
                        >
                          {READING_STATUS_OPTIONS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Find & Enrich Button */}
                <div className='pt-1'>
                  <button
                    type='button'
                    onClick={runEvidenceStudioEnrichment}
                    disabled={Boolean(autofillMode)}
                    className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition active:scale-[0.99] disabled:opacity-50 font-sans'
                  >
                    {autofillMode ? (
                      <>
                        <FiRotateCw className='size-4 animate-spin' />
                        {autofillMode === 'image'
                          ? 'AI Vision is reading cover…'
                          : 'AI is generating 18 fields & retrieving cover…'}
                      </>
                    ) : (
                      <>
                        <LuSparkles className='size-4' /> Find & Enrich Record
                      </>
                    )}
                  </button>
                </div>

                {/* Execution Pipeline Tracker */}
                {(pipelineStep > 0 || autofillMessage) && (
                  <div className='rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 p-3 space-y-2 font-sans'>
                    <div className='flex items-center gap-2 flex-wrap text-[11px] font-bold font-sans'>
                      <span
                        className={`px-2 py-0.5 rounded-md transition ${
                          pipelineStep >= 1
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        1. AI identifies + generates
                      </span>
                      <FiArrowRight className='size-3 text-purple-400' />
                      <span
                        className={`px-2 py-0.5 rounded-md transition ${
                          pipelineStep >= 2
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        2. Google Books finds cover
                      </span>
                      <FiArrowRight className='size-3 text-purple-400' />
                      <span
                        className={`px-2 py-0.5 rounded-md transition ${
                          pipelineStep >= 3
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        3. Review ready
                      </span>
                    </div>
                    {autofillMessage && (
                      <p className='text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-sans'>
                        <FiCheck className='size-3.5 shrink-0' /> {autofillMessage}
                      </p>
                    )}
                  </div>
                )}

                {autofillError && (
                  <div className='rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 font-sans'>
                    {autofillError}
                  </div>
                )}
              </div>

              {/* Right Column: Live Evidence Review Aside (5 cols) */}
              <div className='lg:col-span-5 rounded-2xl bg-emerald-50/70 dark:bg-[#141e17] text-slate-900 dark:text-white p-4 sm:p-5 shadow-sm dark:shadow-xl border border-emerald-200/80 dark:border-emerald-950/60 space-y-3.5 font-sans'>
                <div className='flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-400 border-b border-emerald-200/80 dark:border-emerald-900/60 pb-2 font-sans'>
                  <span>LIVE EVIDENCE PREVIEW</span>
                  <div className='flex items-center gap-2'>
                    {rawAiResponse && (
                      <button
                        type='button'
                        onClick={() => setShowJsonModal(true)}
                        className='h-[20px] inline-flex items-center gap-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-300 border border-indigo-500/30 px-2 text-[10px] font-bold font-sans leading-none hover:bg-indigo-500/25 transition'
                        title='View AI JSON response'
                      >
                        <FiCode className='size-2.5' /> AI JSON
                      </button>
                    )}
                    <span className='h-[18px] inline-flex items-center rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2 text-[9px] uppercase font-bold tracking-wider font-sans leading-none'>
                      Draft Record
                    </span>
                  </div>
                </div>

                <div className='flex gap-4 items-start'>
                  {/* Miniature 3D Book Cover */}
                  <div className='w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-800 via-neutral-900 to-black border border-emerald-600/30 flex flex-col justify-between p-2 text-left relative'>
                    {autofillExtra.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={autofillExtra.coverUrl}
                        alt='Cover'
                        className='absolute inset-0 size-full object-cover rounded-lg'
                      />
                    ) : (
                      <>
                        <div className='text-[8px] font-black uppercase tracking-wider text-emerald-300 font-sans'>
                          {autofillExtra.publisher || "O'REILLY"}
                        </div>
                        <div className='text-[9.5px] font-bold leading-tight text-white line-clamp-3 font-sans'>
                          {previewTitle}
                        </div>
                        <div className='text-[8px] font-medium text-emerald-200/80 line-clamp-1 font-sans'>
                          {previewAuthor}
                        </div>
                      </>
                    )}
                  </div>

                  <div className='flex-1 min-w-0 space-y-1 text-left font-sans'>
                    <h4 className='text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug font-sans'>
                      {previewTitle}
                    </h4>
                    <p className='text-xs text-slate-600 dark:text-emerald-200/70 font-sans'>
                      by {previewAuthor} · {bookTotalPages || 300} pages
                    </p>
                    <div className='pt-1 flex flex-wrap gap-1.5 font-sans'>
                      <span className='h-[20px] inline-flex items-center rounded-full bg-emerald-100/90 dark:bg-emerald-950/90 border border-emerald-300/80 dark:border-emerald-800/80 px-2.5 text-[10.5px] font-semibold text-emerald-800 dark:text-emerald-300 font-sans leading-none'>
                        {activeShelfLabel}
                      </span>
                      <span className='h-[20px] inline-flex items-center rounded-full bg-emerald-100/90 dark:bg-emerald-950/90 border border-emerald-300/80 dark:border-emerald-800/80 px-2.5 text-[10.5px] font-semibold text-emerald-800 dark:text-emerald-300 font-sans leading-none'>
                        {activeStatusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence Facts Rows */}
                <div className='border-t border-emerald-200/80 dark:border-emerald-900/60 pt-2.5 space-y-2 text-xs font-sans'>
                  <div className='flex items-center justify-between text-slate-600 dark:text-slate-300 font-sans'>
                    <span className='text-slate-500 dark:text-slate-400 font-sans'>Publisher</span>
                    <span className='font-bold text-slate-800 dark:text-white flex items-center gap-1 font-sans'>
                      {autofillExtra.publisher || 'To be determined'}
                      {autofillExtra.publisher && (
                        <span className='h-[16px] inline-flex items-center rounded-full bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300 px-1.5 text-[9px] font-bold leading-none'>
                          AI
                        </span>
                      )}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-slate-600 dark:text-slate-300 font-sans'>
                    <span className='text-slate-500 dark:text-slate-400 font-sans'>Genre</span>
                    <span className='font-bold text-slate-800 dark:text-white flex items-center gap-1 font-sans'>
                      {bookGenre || 'General'}
                      {bookGenre && (
                        <span className='h-[16px] inline-flex items-center rounded-full bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300 px-1.5 text-[9px] font-bold leading-none'>
                          AI
                        </span>
                      )}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-slate-600 dark:text-slate-300 font-sans'>
                    <span className='text-slate-500 dark:text-slate-400 font-sans'>Pages</span>
                    <span className='font-bold text-slate-800 dark:text-white flex items-center gap-1 font-sans'>
                      {bookTotalPages || '300'}p
                      {autofillExtra.publishedYear && (
                        <span className='h-[16px] inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300 px-1.5 text-[9px] font-bold leading-none'>
                          GB
                        </span>
                      )}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-slate-600 dark:text-slate-300 font-sans'>
                    <span className='text-slate-500 dark:text-slate-400 font-sans'>Confidence</span>
                    <span className='font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-sans'>
                      {pipelineStep >= 3 ? '100% High Trust' : 'Ready to Enrich'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* BOOK ALREADY IN DATABASE SCREEN                                */}
            {/* ============================================================== */}
            {existingBookFound && (
              <div className='mt-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-emerald-50/40 dark:from-emerald-500/10 dark:via-slate-900/80 dark:to-slate-950 p-5 sm:p-6 space-y-5 font-sans animate-in fade-in zoom-in-95 duration-300 shadow-md dark:shadow-2xl'>
                {/* User-friendly Alert Header */}
                <div className='flex items-start gap-3.5'>
                  <div className='size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-400 flex items-center justify-center shrink-0'>
                    <FiCheckCircle className='size-6' />
                  </div>
                  <div className='space-y-1 flex-1 min-w-0 text-left'>
                    <div className='flex items-center gap-2'>
                      <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 px-2.5 text-[10.5px] font-bold uppercase tracking-wider font-sans leading-none shadow-xs'>
                        <FiBookmark className='size-3' /> Already in Library
                      </span>
                      <span className='text-xs text-slate-500 dark:text-slate-400 font-sans'>
                        Record exists in database
                      </span>
                    </div>
                    <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans'>
                      &ldquo;{existingBookFound.title}&rdquo; is already in your database!
                    </h3>
                  </div>
                </div>

                {/* Existing Book Summary Box */}
                <div className='rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left shadow-sm'>
                  <div className='flex items-center gap-4 min-w-0'>
                    <div className='w-16 h-24 rounded-lg overflow-hidden shrink-0 shadow-md bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center'>
                      {getBookCoverSrc(existingBookFound) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getBookCoverSrc(existingBookFound)}
                          alt={existingBookFound.title}
                          className='size-full object-cover object-center'
                        />
                      ) : (
                        <FiBookOpen className='size-7 text-slate-400 dark:text-slate-500' />
                      )}
                    </div>
                    <div className='space-y-1 min-w-0'>
                      <h4 className='text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-sans'>
                        {existingBookFound.title}
                      </h4>
                      <p className='text-xs text-slate-500 dark:text-slate-400 font-sans'>
                        by{' '}
                        <span className='text-slate-800 dark:text-slate-200 font-medium'>
                          {existingBookFound.author}
                        </span>
                        {existingBookFound.publishedYear ? ` · ${existingBookFound.publishedYear}` : ''}
                      </p>
                      <div className='flex flex-wrap items-center gap-2 pt-1 font-sans'>
                        <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700 font-sans leading-none shadow-2xs'>
                          Shelf: {existingBookFound.shelf || 'Technical'}
                        </span>
                        <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-700/60 px-2.5 text-[10.5px] font-semibold text-emerald-800 dark:text-emerald-300 capitalize font-sans leading-none shadow-2xs'>
                          Status: {existingBookFound.status || 'Reading'}
                        </span>
                        {existingBookFound.rating && (
                          <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-700/50 px-2 text-[10.5px] font-bold text-amber-800 dark:text-amber-300 font-sans leading-none shadow-2xs'>
                            ★ {existingBookFound.rating}
                          </span>
                        )}
                        {(existingBookFound.pages || existingBookFound.totalPages) && (
                          <span className='h-[20px] inline-flex items-center rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-2 text-[10.5px] font-medium text-slate-600 dark:text-slate-400 font-sans leading-none'>
                            {existingBookFound.pages || existingBookFound.totalPages} pages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Read / Value Preview if available */}
                {(existingBookFound.whyRead || existingBookFound.description) && (
                  <div className='p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/30 text-xs space-y-1.5 font-sans text-left'>
                    <div>
                      <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-sans leading-none'>
                        <LuSparkles className='size-2.5' />
                        {existingBookFound.whyRead ? 'Core Value Proposition & ROI' : 'Synopsis'}
                      </span>
                    </div>
                    <p className='line-clamp-2 leading-relaxed text-slate-700 dark:text-slate-300 font-sans'>
                      {existingBookFound.whyRead || existingBookFound.description}
                    </p>
                  </div>
                )}

                {/* Actions: OK (closes search) and Open Details (opens saved book) */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 font-sans'>
                  <button
                    type='button'
                    onClick={() => {
                      setExistingBookFound(null);
                    }}
                    className='text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition font-sans'
                  >
                    ← Search for a different book
                  </button>

                  <div className='flex items-center gap-2.5 font-sans w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap'>
                    <button
                      type='button'
                      onClick={handleRefetchAndOverwrite}
                      disabled={loading || pipelineStep === 1 || pipelineStep === 2}
                      className='inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition active:scale-95 font-sans disabled:opacity-50'
                      title='Refetch fresh metadata with AI and overwrite this existing record'
                    >
                      <LuSparkles className='size-3.5 text-amber-200 animate-pulse' />
                      Refetch with AI &amp; Overwrite
                    </button>
                    {rawAiResponse && (
                      <button
                        type='button'
                        onClick={() => setShowJsonModal(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-sans shadow-xs'
                        title='View raw JSON data'
                      >
                        <FiCode className='size-3.5 text-indigo-500' /> View JSON
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={() => {
                        setExistingBookFound(null);
                        onClose();
                      }}
                      className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-white transition font-sans'
                    >
                      <FiCheck className='size-3.5' /> OK
                    </button>

                    <button
                      type='button'
                      onClick={() => {
                        const targetBook = existingBookFound;
                        setExistingBookFound(null);
                        onClose();
                        if (onOpenDetail) {
                          onOpenDetail(targetBook);
                        } else {
                          router.push(`/admin/books/${encodeURIComponent(targetBook.id)}`);
                        }
                      }}
                      className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition active:scale-95 font-sans'
                    >
                      <FiExternalLink className='size-3.5' /> Open Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* EVIDENCE STUDIO COMPLETE REVIEW SCREEN                          */}
            {/* ============================================================== */}
            {!existingBookFound && showResultScreen && (
              <div className='mt-5 border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4 font-sans animate-in fade-in duration-300'>
                {overwritingBookId && (
                  <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-center justify-between text-amber-900 dark:text-amber-200 font-sans text-xs shadow-xs'>
                    <div className='flex items-center gap-2.5'>
                      <FiRotateCw
                        className='size-4 text-amber-500 shrink-0 animate-spin'
                        style={{ animationDuration: '4s' }}
                      />
                      <div>
                        <strong className='font-bold block text-slate-900 dark:text-white'>
                          Overwrite Mode Active
                        </strong>
                        <span className='text-slate-600 dark:text-slate-300'>
                          Saving this reviewed metadata will update and overwrite the existing record in your database.
                        </span>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => setOverwritingBookId(null)}
                      className='text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 ml-2 font-sans'
                    >
                      Cancel Overwrite
                    </button>
                  </div>
                )}
                {/* Result Screen Header */}
                <div className='flex flex-col sm:flex-row items-start justify-between gap-4 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800'>
                  <div className='flex items-start gap-4'>
                    <div className='size-16 shrink-0 rounded-xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 bg-neutral-900'>
                      {autofillExtra.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={autofillExtra.coverUrl}
                          alt='Book cover'
                          className='size-full object-cover object-center'
                        />
                      ) : (
                        <div className='size-full flex items-center justify-center text-xs font-bold text-slate-400'>
                          Cover
                        </div>
                      )}
                    </div>

                    <div className='space-y-1 text-left font-sans'>
                      <div className='flex items-center gap-2'>
                        <span className='h-[20px] inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 font-sans leading-none'>
                          Metadata by AI
                        </span>
                        {autofillExtra.coverUrl && (
                          <span className='h-[20px] inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-sans leading-none'>
                            Cover from Google Books
                          </span>
                        )}
                      </div>
                      <h3 className='text-lg font-black text-slate-900 dark:text-white leading-tight font-sans'>
                        {previewTitle}
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-400 font-sans'>
                        {previewAuthor} · {bookGenre || 'General'} · {autofillExtra.publishedYear || 'Recent Edition'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 self-end sm:self-auto'>
                    {rawAiResponse && (
                      <button
                        type='button'
                        onClick={() => setShowJsonModal(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 shadow-xs transition font-sans'
                        title='View raw AI response in syntax-formatted JSON'
                      >
                        <FiCode className='size-3.5 text-purple-500' /> View AI JSON
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={() => setIsEditingFields(!isEditingFields)}
                      className='rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm transition font-sans'
                    >
                      {isEditingFields ? 'Done Editing' : 'Edit All Fields'}
                    </button>
                  </div>
                </div>

                {/* READ-ONLY REVIEW GRID */}
                {!isEditingFields && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left font-sans'>
                    {/* Description (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Description / Synopsis
                      </small>
                      <p className='text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans'>
                        {bookDescription ||
                          'A comprehensive exploration of the principles, trade-offs, and design decisions behind reliable, scalable, and maintainable systems.'}
                      </p>
                    </div>

                    {/* Why Read & Core Value Proposition (Wide, Featured Gradient Card) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent space-y-1.5'>
                      <div className='flex items-center gap-1.5'>
                        <span className='h-[20px] inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-sans leading-none'>
                          <LuSparkles className='size-2.5 mr-1 text-indigo-500' /> Core Value & ROI
                        </span>
                        <small className='text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans'>
                          Why Read — Is It Really Worth It?
                        </small>
                      </div>
                      <WhyReadContent
                        text={
                          bookWhyRead ||
                          autofillExtra.whyRead ||
                          'Essential reading for mastering resilient distributed systems, offering immense mental model returns that justify every hour invested.'
                        }
                      />
                    </div>

                    {/* Key Themes Chips (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Key Themes
                      </small>
                      <div className='flex flex-wrap gap-1.5 font-sans'>
                        {bookKeyThemes ? (
                          bookKeyThemes
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((theme, i) => (
                              <span
                                key={i}
                                className='h-[20px] inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 leading-none font-sans'
                              >
                                {theme}
                              </span>
                            ))
                        ) : (
                          <span className='text-xs text-slate-400 font-sans'>General Architecture & Engineering</span>
                        )}
                      </div>
                    </div>

                    {/* Target Audience */}
                    {/* Target Audience (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Target Audience
                      </small>
                      <p className='text-xs text-slate-800 dark:text-slate-200 font-sans font-medium'>
                        {Array.isArray(autofillExtra.targetAudience) && autofillExtra.targetAudience.length
                          ? autofillExtra.targetAudience.join(', ')
                          : 'General readers and enthusiasts'}
                      </p>
                    </div>

                    {/* Notable Quote (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Notable Quote
                      </small>
                      <p className='text-xs italic text-slate-800 dark:text-slate-200 leading-relaxed font-sans'>
                        &quot;
                        {(Array.isArray(autofillExtra.notableQuotes) && autofillExtra.notableQuotes[0]) ||
                          'Reliability is continuing to work correctly even when things go wrong.'}
                        &quot;
                      </p>
                    </div>

                    {/* Similar Books (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Similar Recommended Books
                      </small>
                      <p className='text-xs text-slate-700 dark:text-slate-300 font-sans'>
                        {Array.isArray(autofillExtra.similarBooks) && autofillExtra.similarBooks.length
                          ? autofillExtra.similarBooks.join(' · ')
                          : 'Database Internals · Fundamentals of Software Architecture'}
                      </p>
                    </div>

                    {/* Cultural Legacy (Wide) */}
                    <div className='sm:col-span-2 md:col-span-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1'>
                      <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-sans'>
                        Cultural Legacy & Impact
                      </small>
                      <p className='text-xs text-slate-700 dark:text-slate-300 font-sans'>
                        {autofillExtra.legacy ||
                          'A seminal modern text shaping how teams architect resilient distributed storage systems.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* INLINE EDITING MODE */}
                {isEditingFields && (
                  <div className='p-4 rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10 space-y-3 text-left font-sans'>
                    <div className='flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 font-sans'>
                      <FiEdit3 className='size-3.5' /> Editing Book Record Details
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Title *
                        </label>
                        <input
                          type='text'
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Author *
                        </label>
                        <input
                          type='text'
                          value={bookAuthor}
                          onChange={(e) => setBookAuthor(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Pages
                        </label>
                        <input
                          type='number'
                          value={bookTotalPages}
                          onChange={(e) => setBookTotalPages(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Genre
                        </label>
                        <input
                          type='text'
                          value={bookGenre}
                          onChange={(e) => setBookGenre(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Language
                        </label>
                        <input
                          type='text'
                          value={bookLanguage}
                          onChange={(e) => setBookLanguage(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                      <div>
                        <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                          Rating (1-5)
                        </label>
                        <input
                          type='number'
                          min='1'
                          max='5'
                          value={bookRating}
                          onChange={(e) => setBookRating(e.target.value)}
                          className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={bookDescription}
                        onChange={(e) => setBookDescription(e.target.value)}
                        className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                        Why Read, Tangible Value &amp; ROI (Is it really worth it?)
                      </label>
                      <textarea
                        rows={2}
                        value={bookWhyRead}
                        onChange={(e) => setBookWhyRead(e.target.value)}
                        placeholder='Why should one read this book, what value does it provide, and is it really worth it?'
                        className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                        Key Themes (comma-separated)
                      </label>
                      <input
                        type='text'
                        value={bookKeyThemes}
                        onChange={(e) => setBookKeyThemes(e.target.value)}
                        className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sans'>
                        Personal Notes / Shelf Thesis
                      </label>
                      <textarea
                        rows={2}
                        value={bookNotes}
                        onChange={(e) => setBookNotes(e.target.value)}
                        placeholder='Takeaways, reading goals, mental models…'
                        className='w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans'
                      />
                    </div>
                  </div>
                )}

                {/* Evidence Studio Review Action Footer */}
                <div className='flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 font-sans'>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowResultScreen(false);
                        setPipelineStep(0);
                        setOverwritingBookId(null);
                      }}
                      className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition font-sans'
                    >
                      <FiRotateCw className='size-3.5' /> Regenerate Metadata
                    </button>
                    {rawAiResponse && (
                      <button
                        type='button'
                        onClick={() => setShowJsonModal(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition font-sans shadow-xs'
                      >
                        <FiCode className='size-3.5 text-indigo-500' /> View AI JSON
                      </button>
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-sans'
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      onClick={handleSaveReviewedBook}
                      disabled={loading}
                      className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition active:scale-95 disabled:opacity-50 font-sans'
                    >
                      {loading ? (
                        <>
                          <FiRotateCw className='size-3.5 animate-spin' /> Saving Record…
                        </>
                      ) : (
                        <>
                          <FiCheck className='size-3.5' /> Add Reviewed Book
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Response Plain JSON Viewer Modal */}
        {showJsonModal && rawAiResponse && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200'>
            <div className='relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans'>
              {/* Modal Header */}
              <div className='flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-sans'>
                <div className='flex items-center gap-2.5 font-sans'>
                  <div className='size-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-sans'>
                    <FiCode className='size-4' />
                  </div>
                  <div>
                    <h3 className='text-sm font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2'>
                      AI Response JSON
                      <span className='h-[18px] inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/30 px-2 text-[9.5px] font-bold text-purple-700 dark:text-purple-300 font-sans leading-none'>
                        Syntax Formatted
                      </span>
                    </h3>
                    <p className='text-[11px] text-slate-500 dark:text-slate-400 font-sans'>
                      Structured payload received from AI Autofill
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2 font-sans'>
                  <button
                    type='button'
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(rawAiResponse, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-sans shadow-xs'
                  >
                    {copiedJson ? (
                      <>
                        <FiCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                        <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy className='size-3.5 text-slate-500' />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowJsonModal(false)}
                    className='size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-sans'
                  >
                    <FiX className='size-4' />
                  </button>
                </div>
              </div>

              {/* Modal Body - JSON syntax viewer */}
              <div className='p-4 overflow-y-auto max-h-[calc(85vh-115px)] bg-slate-50 dark:bg-slate-950 font-sans border-y border-slate-200 dark:border-slate-800/80'>
                <pre
                  className='text-xs leading-relaxed font-sans whitespace-pre text-slate-800 dark:text-slate-200 selection:bg-indigo-500/20 font-normal'
                  dangerouslySetInnerHTML={{
                    __html: renderHighlightedJson(rawAiResponse)
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div className='px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans'>
                <span className='font-sans'>{Object.keys(rawAiResponse || {}).length} properties returned</span>
                <button
                  type='button'
                  onClick={() => setShowJsonModal(false)}
                  className='px-3 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition font-sans'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAddModal;
