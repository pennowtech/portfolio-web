import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@components/admin/AdminLayout';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';
import {
  FiArrowLeft,
  FiBookOpen,
  FiStar,
  FiCheck,
  FiClock,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiGlobe,
  FiUsers,
  FiTag,
  FiAward,
  FiLayers,
  FiTrendingUp,
  FiCheckCircle,
  FiSave,
  FiX,
  FiPlus
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { getBookCoverSrc, BOOK_SHELVES } from '@utils/books/bookService';
import { deletePersistedBook, fetchBook, updatePersistedBook } from '@utils/books/bookApi';
import BookAskAiModal from '@components/admin/BookAskAiModal';
import WhyReadContent from '@components/admin/books/WhyReadContent';

// ─── Inline editable text component ────────────────────────────────────────
const InlineText = ({
  value,
  onSave,
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
  inputClassName = '',
  renderValue = null
}) => {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const commit = useCallback(async () => {
    setEditing(false);
    if (draft.trim() !== (value || '').trim()) {
      await onSave(draft.trim());
    }
  }, [draft, value, onSave]);

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(value || '');
      setEditing(false);
    }
  };

  if (editing) {
    const shared = {
      ref,
      autoFocus: true,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      className: `bg-neutral-950 border border-amber-500 rounded-lg px-2 py-1 text-inherit font-inherit leading-inherit focus:outline-none w-full resize-none ring-1 ring-amber-500/30 ${inputClassName}`
    };
    return multiline ? (
      <textarea {...shared} rows={Math.max(3, (draft.match(/\n/g) || []).length + 2)} />
    ) : (
      <input type='text' {...shared} />
    );
  }

  return (
    <span
      role='button'
      tabIndex={0}
      title='Click to edit'
      onClick={() => {
        setDraft(value || '');
        setEditing(true);
      }}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        cursor: 'text',
        borderBottom: hovered ? '1.5px dashed #f59e0b' : '1.5px dashed transparent',
        borderRadius: '2px',
        paddingBottom: '1px',
        transition: 'border-color 0.15s'
      }}
      className={`relative inline-flex items-start gap-1 rounded transition-colors ${hovered ? 'bg-amber-500/8' : ''} ${className}`}
    >
      <span className={!value ? 'italic text-neutral-500' : 'w-full block'}>
        {value ? (renderValue ? renderValue(value) : value) : placeholder}
      </span>
      {hovered && (
        <FiEdit2 style={{ marginLeft: 4, marginTop: 2, flexShrink: 0, color: '#f59e0b', width: 11, height: 11 }} />
      )}
    </span>
  );
};

// ─── Inline editable tag list ────────────────────────────────────────────────
const InlineTagList = ({ tags, onSave, placeholder = 'Add item...' }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftTag, setDraftTag] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState('');
  const [hoveredTag, setHoveredTag] = useState(null);

  const commitEdit = async (idx) => {
    if (draftTag.trim() === '') {
      const next = tags.filter((_, i) => i !== idx);
      await onSave(next);
    } else if (draftTag.trim() !== tags[idx]) {
      const next = tags.map((t, i) => (i === idx ? draftTag.trim() : t));
      await onSave(next);
    }
    setEditingIdx(null);
  };

  const commitNew = async () => {
    if (newTagDraft.trim()) {
      await onSave([...tags, newTagDraft.trim()]);
    }
    setAddingNew(false);
    setNewTagDraft('');
  };

  const removeTag = async (idx) => {
    await onSave(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className='flex flex-wrap gap-2 items-center'>
      {tags.map((tag, i) =>
        editingIdx === i ? (
          <input
            key={i}
            autoFocus
            value={draftTag}
            onChange={(e) => setDraftTag(e.target.value)}
            onBlur={() => commitEdit(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitEdit(i);
              }
              if (e.key === 'Escape') {
                setEditingIdx(null);
              }
            }}
            className='rounded-xl bg-amber-500/20 border border-amber-500 px-3 py-1.5 text-xs font-medium text-amber-300 focus:outline-none w-32'
          />
        ) : (
          <span
            key={i}
            className='inline-flex items-center gap-1 cursor-pointer'
            onMouseEnter={() => setHoveredTag(i)}
            onMouseLeave={() => setHoveredTag(null)}
            onClick={() => {
              setDraftTag(tag);
              setEditingIdx(i);
            }}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-amber-300 transition-all ${hoveredTag === i ? 'bg-amber-500/20 border-amber-500/40' : 'bg-amber-500/10 border-amber-500/20'}`}
            >
              <span className='size-1.5 rounded-full bg-amber-400' />
              {tag}
            </span>
            {hoveredTag === i && (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(i);
                }}
                className='ml-0.5 flex items-center justify-center size-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/40'
                title='Remove'
              >
                <FiX className='size-2.5' />
              </button>
            )}
          </span>
        )
      )}
      {addingNew ? (
        <input
          autoFocus
          value={newTagDraft}
          onChange={(e) => setNewTagDraft(e.target.value)}
          onBlur={commitNew}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitNew();
            }
            if (e.key === 'Escape') {
              setAddingNew(false);
              setNewTagDraft('');
            }
          }}
          placeholder={placeholder}
          className='rounded-xl bg-neutral-900 border border-amber-500/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-40'
        />
      ) : (
        <button
          type='button'
          onClick={() => setAddingNew(true)}
          className='inline-flex items-center gap-1 rounded-xl border border-dashed border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors'
        >
          <FiPlus className='size-3' /> Add
        </button>
      )}
    </div>
  );
};

// ─── Inline editable quote list ──────────────────────────────────────────────
const InlineQuoteList = ({ quotes, onSave, author, copiedQuote, onCopy }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQuote, setDraftQuote] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newQuoteDraft, setNewQuoteDraft] = useState('');

  const commitEdit = async (idx) => {
    if (draftQuote.trim() === '') {
      await onSave(quotes.filter((_, i) => i !== idx));
    } else if (draftQuote.trim() !== quotes[idx]) {
      await onSave(quotes.map((q, i) => (i === idx ? draftQuote.trim() : q)));
    }
    setEditingIdx(null);
  };

  const commitNew = async () => {
    if (newQuoteDraft.trim()) {
      await onSave([...quotes, newQuoteDraft.trim()]);
    }
    setAddingNew(false);
    setNewQuoteDraft('');
  };

  const removeQuote = async (idx) => {
    await onSave(quotes.filter((_, i) => i !== idx));
  };

  return (
    <div className='space-y-3'>
      {quotes.map((quote, idx) =>
        editingIdx === idx ? (
          <div key={idx} className='rounded-xl border border-amber-500/50 bg-neutral-950 p-3'>
            <textarea
              autoFocus
              rows={3}
              value={draftQuote}
              onChange={(e) => setDraftQuote(e.target.value)}
              onBlur={() => commitEdit(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingIdx(null);
                }
              }}
              className='w-full bg-transparent font-serif text-sm italic text-neutral-200 leading-relaxed focus:outline-none resize-none'
            />
            <div className='mt-2 flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => removeQuote(idx)}
                className='text-xs text-rose-400 hover:text-rose-300'
              >
                Remove
              </button>
              <button
                type='button'
                onMouseDown={() => commitEdit(idx)}
                className='text-xs text-amber-400 hover:text-amber-300'
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            key={idx}
            className='group relative cursor-pointer rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 transition-all hover:border-amber-500/40 hover:bg-neutral-950'
            onClick={() => {
              setDraftQuote(quote);
              setEditingIdx(idx);
            }}
          >
            <p className='font-serif text-sm sm:text-base italic text-neutral-200 leading-relaxed'>
              &ldquo;{quote}&rdquo;
            </p>
            <div className='mt-2 flex items-center justify-between text-xs text-neutral-500'>
              <span className='text-[11px] font-medium text-amber-400/80'>&mdash; {author}</span>
              <div className='flex items-center gap-3'>
                <span className='inline-flex items-center gap-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 text-neutral-400'>
                  <FiEdit2 className='size-3' /> Edit
                </span>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(quote, idx);
                  }}
                  className='inline-flex items-center gap-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 hover:text-amber-400'
                >
                  <FiCopy className='size-3' />
                  {copiedQuote === idx ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )
      )}
      {addingNew ? (
        <div className='rounded-xl border border-amber-500/50 bg-neutral-950 p-3'>
          <textarea
            autoFocus
            rows={3}
            value={newQuoteDraft}
            onChange={(e) => setNewQuoteDraft(e.target.value)}
            onBlur={commitNew}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setAddingNew(false);
                setNewQuoteDraft('');
              }
            }}
            placeholder='Type a notable quote...'
            className='w-full bg-transparent font-serif text-sm italic text-neutral-200 placeholder:text-neutral-600 leading-relaxed focus:outline-none resize-none'
          />
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setAddingNew(true)}
          className='inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-700 px-3 py-2 text-xs text-neutral-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors'
        >
          <FiPlus className='size-3' /> Add Quote
        </button>
      )}
    </div>
  );
};

// ─── Audience card (needs own hover state) ──────────────────────────────────
const AudienceCard = ({ audience, idx, onSave, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className='flex items-start gap-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/70 p-3 text-xs text-neutral-300 hover:border-cyan-500/30 transition-colors'
    >
      <div className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 font-bold'>
        ✓
      </div>
      <InlineText
        value={audience}
        onSave={onSave}
        className='leading-tight flex-1'
        placeholder='Audience description...'
      />
      {hovered && (
        <button
          type='button'
          onClick={onRemove}
          className='flex items-center justify-center size-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shrink-0'
          title='Remove'
        >
          <FiX className='size-2.5' />
        </button>
      )}
    </div>
  );
};

// ─── Similar book card (needs own hover state) ───────────────────────────────
const SimilarBookCard = ({ title, idx, onSave, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className='flex items-center gap-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 p-3 text-xs text-neutral-200 hover:border-neutral-700 transition-colors'
    >
      <div className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-amber-400 font-bold border border-neutral-800'>
        {idx + 1}
      </div>
      <InlineText value={title} onSave={onSave} className='font-medium flex-1' placeholder='Book title...' />
      {hovered && (
        <button
          type='button'
          onClick={onRemove}
          className='flex items-center justify-center size-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shrink-0'
          title='Remove'
        >
          <FiX className='size-2.5' />
        </button>
      )}
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const BookDetailPage = ({ adminEmail }) => {
  const router = useRouter();
  const { bookId } = router.query;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPageInput, setCurrentPageInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveFlash, setSaveFlash] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    const loadBook = async () => {
      try {
        const found = await fetchBook(String(bookId));
        if (cancelled) return;
        setBook(found);
        setCurrentPageInput(String(found.currentPage || 0));
        setNotesInput(found.notes || '');
      } catch (error) {
        if (!cancelled) setSaveError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const flashSaved = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  };

  const handleFieldSave = useCallback(
    async (field, value) => {
      if (!book) return;
      const updated = await updatePersistedBook(book.id, { [field]: value }).catch((err) => {
        setSaveError(err.message);
        return null;
      });
      if (updated) {
        setBook(updated);
        flashSaved();
      }
    },
    [book]
  );

  const handleArrayFieldSave = useCallback(
    async (field, arr) => {
      if (!book) return;
      const updates = { [field]: arr };
      if (field === 'notableQuotes') updates.quotes = arr;
      if (field === 'quotes') updates.notableQuotes = arr;
      const updated = await updatePersistedBook(book.id, updates).catch((err) => {
        setSaveError(err.message);
        return null;
      });
      if (updated) {
        setBook(updated);
        flashSaved();
      }
    },
    [book]
  );

  const handleUpdateProgress = async (newPageVal) => {
    if (!book) return;
    const totalPgs = book.pages || book.totalPages || 300;
    const pages = Math.max(0, Math.min(totalPgs, Number(newPageVal) || 0));
    const updated = await updatePersistedBook(book.id, { currentPage: pages }).catch((error) => {
      setSaveError(error.message);
      return null;
    });
    if (updated) {
      setBook(updated);
      setCurrentPageInput(String(pages));
    }
  };

  const handleUpdateRating = async (newRating) => {
    if (!book) return;
    const updated = await updatePersistedBook(book.id, { rating: newRating }).catch((error) => {
      setSaveError(error.message);
      return null;
    });
    if (updated) setBook(updated);
  };

  const handleUpdateShelf = async (newShelf) => {
    if (!book) return;
    const updated = await updatePersistedBook(book.id, { shelf: newShelf }).catch((error) => {
      setSaveError(error.message);
      return null;
    });
    if (updated) setBook(updated);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!book) return;
    const totalPgs = book.pages || book.totalPages || 300;
    const updates = { status: newStatus };
    if (newStatus === 'completed' && (book.currentPage || 0) < totalPgs) {
      updates.currentPage = totalPgs;
      setCurrentPageInput(String(totalPgs));
    }
    const updated = await updatePersistedBook(book.id, updates).catch((error) => {
      setSaveError(error.message);
      return null;
    });
    if (updated) setBook(updated);
  };

  const handleSaveNotes = async () => {
    if (!book) return;
    const updated = await updatePersistedBook(book.id, { notes: notesInput }).catch((error) => {
      setSaveError(error.message);
      return null;
    });
    if (updated) {
      setBook(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    }
  };

  const handleCopyQuote = (quoteText, index) => {
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(quoteText)
        .then(() => {
          setCopiedQuote(index);
          setTimeout(() => setCopiedQuote(null), 2000);
        })
        .catch(() => setSaveError('Could not copy the quote.'));
    }
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    if (window.confirm(`Are you sure you want to remove "${book.title}" from your personal library?`)) {
      try {
        await deletePersistedBook(book.id);
        router.push('/admin/books');
      } catch (error) {
        setSaveError(error.message);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout adminEmail={adminEmail} activeNav='books'>
        <div className='flex min-h-[60vh] items-center justify-center'>
          <div className='flex flex-col items-center gap-3'>
            <div className='size-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            <p className='text-sm text-neutral-400'>Loading literary dossier...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!book) {
    return (
      <AdminLayout adminEmail={adminEmail} activeNav='books'>
        <div className='mx-auto max-w-xl py-24 text-center'>
          <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400'>
            <FiBookOpen className='size-7' />
          </div>
          <h1 className='text-xl font-bold text-neutral-100'>
            {saveError ? 'Could not load book record' : 'Book Record Not Found'}
          </h1>
          <p className='mt-2 text-sm text-neutral-400'>
            {saveError || (
              <>
                The book record with ID <code className='text-amber-400'>{bookId}</code> could not be located in your
                library.
              </>
            )}
          </p>
          <Link
            href='/admin/books'
            className='mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-700'
          >
            <FiArrowLeft className='size-4' /> Return to Library
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const coverSrc = getBookCoverSrc(book);
  const totalPages = book.pages || book.totalPages || 300;
  const progressPercent = Math.min(100, Math.round(((book.currentPage || 0) / totalPages) * 100));
  const currentShelfDef = BOOK_SHELVES.find((s) => s.id === book.shelf) || BOOK_SHELVES[1];
  const quotes = book.notableQuotes || book.quotes || [];

  return (
    <AdminLayout adminEmail={adminEmail} activeNav='books'>
      <Head>
        <title>{book.title} | Book Dossier &amp; Studio</title>
      </Head>

      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {saveError && (
          <div
            role='alert'
            className='mb-4 rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200'
          >
            {saveError}
          </div>
        )}

        {/* Navigation Breadcrumb Bar */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4'>
          <div className='flex items-center gap-3'>
            <Link
              href='/admin/books'
              className='group inline-flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white'
            >
              <FiArrowLeft className='size-3.5 transition-transform group-hover:-translate-x-0.5' />
              <span>Back to Library</span>
            </Link>
            <span className='text-xs text-neutral-600'>/</span>
            <span className='inline-flex items-center gap-1.5 rounded-lg bg-neutral-900/60 px-2.5 py-1 text-xs font-medium text-neutral-400'>
              <FiLayers className='size-3 text-amber-500' />
              {currentShelfDef.label}
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 ${saveFlash ? 'text-emerald-400 opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <FiCheck className='size-3.5' /> Saved
            </span>
            <button
              type='button'
              onClick={() => setAskAiOpen(true)}
              className='inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-3.5 py-1.5 text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 font-sans'
              title='Ask questions in context of this book'
            >
              <LuSparkles className='size-3.5 text-amber-300 animate-pulse' />
              <span>Ask AI</span>
            </button>
            <span className='text-xs text-neutral-500 italic hidden sm:block'>Click any text to edit inline</span>
            <button
              type='button'
              onClick={handleDeleteBook}
              className='inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10'
            >
              <FiTrash2 className='size-3.5' />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* 2-Column Workstation Layout */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
          {/* ================= LEFT COLUMN ================= */}
          <div className='lg:col-span-4 lg:sticky lg:top-24 space-y-6 self-start'>
            {/* 3D Book Cover Card */}
            <div className='relative flex flex-col items-center justify-center rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-950 p-8 shadow-2xl backdrop-blur-xl'>
              <div className='group relative perspective-1000'>
                {coverSrc ? (
                  <div className='relative overflow-hidden rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverSrc}
                      alt={book.title}
                      className='max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-black/40 via-transparent to-white/10' />
                  </div>
                ) : (
                  <div
                    className={`flex h-[340px] w-[230px] flex-col justify-between rounded-xl bg-gradient-to-br ${book.coverColor || 'from-amber-700 to-indigo-950'} p-6 shadow-2xl ring-1 ring-white/10`}
                  >
                    <div>
                      <span className='rounded bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300'>
                        {book.genre || 'Hardcover'}
                      </span>
                      <h3 className='mt-4 font-serif text-lg font-bold leading-snug text-white'>{book.title}</h3>
                      <p className='mt-1 text-xs text-white/70'>{book.author}</p>
                    </div>
                    <div className='flex items-center justify-between border-t border-white/20 pt-4 text-[10px] text-white/60'>
                      <span>{book.publishedYear}</span>
                      <span>{totalPages} Pages</span>
                    </div>
                  </div>
                )}
                <div className='pointer-events-none -bottom-4 mx-auto h-4 w-3/4 rounded-full bg-amber-500/10 blur-xl' />
              </div>

              {/* Cover path — inline editable */}
              <div className='mt-4 w-full'>
                <p className='mb-1 text-[10px] uppercase tracking-wider text-neutral-500'>Cover URL / Local Path</p>
                <InlineText
                  value={book.coverLocalPath || book.coverUrl || ''}
                  placeholder='Set cover path or URL...'
                  onSave={async (v) => {
                    const isUrl = v.startsWith('http');
                    await handleFieldSave(isUrl ? 'coverUrl' : 'coverLocalPath', v);
                  }}
                  className='w-full text-[11px] font-sans text-neutral-400 block'
                  inputClassName='font-sans text-[11px]'
                />
              </div>

              {/* Status capsule */}
              <div className='mt-4 flex items-center gap-2'>
                {book.status === 'completed' && (
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400'>
                    <FiCheckCircle className='size-3.5' /> Completed
                  </span>
                )}
                {book.status === 'reading' && (
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400'>
                    <FiBookOpen className='size-3.5 animate-pulse' /> Currently Reading ({progressPercent}%)
                  </span>
                )}
                {book.status === 'wishlist' && (
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300'>
                    <FiClock className='size-3.5' /> Queued on Wishlist
                  </span>
                )}
              </div>
            </div>

            {/* Reading Telemetry */}
            <div className='rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-lg backdrop-blur-md'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-400'>Reading Tracker</h2>

              {/* Status Switcher */}
              <div className='mt-3 grid grid-cols-3 gap-1 rounded-xl bg-neutral-950 p-1 border border-neutral-800/80'>
                {['reading', 'completed', 'wishlist'].map((s) => (
                  <button
                    key={s}
                    type='button'
                    onClick={() => handleUpdateStatus(s)}
                    className={`rounded-lg py-1.5 text-xs font-medium transition-colors capitalize ${
                      book.status === s
                        ? s === 'reading'
                          ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                          : s === 'completed'
                            ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                            : 'bg-purple-500 text-neutral-950 font-bold shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Progress */}
              <div className='mt-5 space-y-2'>
                <div className='flex items-center justify-between text-xs text-neutral-400'>
                  <span>Page Progress</span>
                  <div className='flex items-center gap-1.5 font-sans text-neutral-200'>
                    <input
                      type='number'
                      min='0'
                      max={totalPages}
                      value={currentPageInput}
                      onChange={(e) => setCurrentPageInput(e.target.value)}
                      onBlur={() => handleUpdateProgress(currentPageInput)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateProgress(currentPageInput)}
                      className='w-14 rounded bg-neutral-950 px-1.5 py-0.5 text-center text-xs font-bold text-amber-400 border border-neutral-700 focus:border-amber-500 focus:outline-none'
                    />
                    <span>
                      / {totalPages} ({progressPercent}%)
                    </span>
                  </div>
                </div>
                <div className='relative h-2 w-full overflow-hidden rounded-full bg-neutral-950 border border-neutral-800'>
                  <div
                    className='h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300'
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <input
                  type='range'
                  min='0'
                  max={totalPages}
                  value={book.currentPage || 0}
                  onChange={(e) => handleUpdateProgress(e.target.value)}
                  className='w-full accent-amber-500 cursor-pointer'
                />
              </div>

              {/* Star Rating */}
              <div className='mt-5 border-t border-neutral-800/80 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-neutral-400'>Personal Rating</span>
                  <div className='flex items-center gap-1'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type='button'
                        onClick={() => handleUpdateRating(star)}
                        className='p-0.5 transition-transform hover:scale-125'
                        title={`Rate ${star} star`}
                      >
                        <FiStar
                          className={`size-4 ${
                            star <= (book.rating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                        />
                      </button>
                    ))}
                    <span className='ml-1 font-sans text-xs font-bold text-amber-400'>
                      {(book.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shelf */}
              <div className='mt-4 border-t border-neutral-800/80 pt-4'>
                <label className='block text-xs text-neutral-400 mb-1.5'>Assigned Shelf</label>
                <select
                  value={book.shelf || 'technical'}
                  onChange={(e) => handleUpdateShelf(e.target.value)}
                  className='w-full rounded-xl bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-200 border border-neutral-800 focus:border-amber-500 focus:outline-none'
                >
                  {BOOK_SHELVES.filter((s) => s.id !== 'all').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className='lg:col-span-8 space-y-8'>
            {/* Header: Title, Author */}
            <div className='space-y-4'>
              <div>
                <h1 className='font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-100'>
                  <InlineText
                    value={book.title}
                    onSave={(v) => handleFieldSave('title', v)}
                    className='w-full'
                    inputClassName='font-serif text-3xl font-extrabold tracking-tight'
                    placeholder='Book title...'
                  />
                </h1>
                <p className='mt-2 text-base sm:text-lg text-neutral-400 font-medium flex flex-wrap items-center gap-1'>
                  <span>by</span>
                  <InlineText
                    value={book.author}
                    onSave={(v) => handleFieldSave('author', v)}
                    className='text-amber-400 font-semibold'
                    placeholder='Author name...'
                  />
                  <span className='text-neutral-500'>(</span>
                  <InlineText
                    value={String(book.publishedYear || '')}
                    onSave={(v) => handleFieldSave('publishedYear', Number(v) || book.publishedYear)}
                    className='text-neutral-500 font-sans text-sm'
                    inputClassName='w-16 text-center'
                    placeholder='Year'
                  />
                  <span className='text-neutral-500'>)</span>
                </p>
              </div>

              {/* Metadata Pills */}
              <div className='flex flex-wrap items-center gap-2 pt-2'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300'>
                  <FiGlobe className='size-3 text-cyan-400 shrink-0' />
                  <InlineText
                    value={book.language}
                    onSave={(v) => handleFieldSave('language', v)}
                    placeholder='Language'
                    className='text-neutral-300'
                    inputClassName='w-20'
                  />
                </span>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300'>
                  <FiTag className='size-3 text-amber-400 shrink-0' />
                  <InlineText
                    value={book.genre}
                    onSave={(v) => handleFieldSave('genre', v)}
                    placeholder='Genre'
                    className='text-neutral-300'
                    inputClassName='w-24'
                  />
                </span>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300'>
                  <FiLayers className='size-3 text-emerald-400 shrink-0' />
                  <InlineText
                    value={String(totalPages)}
                    onSave={(v) => {
                      const p = Number(v) || totalPages;
                      handleFieldSave('pages', p);
                      handleFieldSave('totalPages', p);
                    }}
                    placeholder='Pages'
                    className='text-neutral-300'
                    inputClassName='w-14 text-center'
                  />
                  <span className='text-neutral-400'>Pages</span>
                </span>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-medium'>
                  <span className='text-neutral-400'>Publisher:</span>
                  <InlineText
                    value={book.publisher || ''}
                    onSave={(v) => handleFieldSave('publisher', v)}
                    placeholder='Add publisher...'
                    className='text-neutral-200'
                    inputClassName='w-32'
                  />
                </span>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-sans'>
                  <span className='text-neutral-400'>ISBN:</span>
                  <InlineText
                    value={book.isbn13 || ''}
                    onSave={(v) => handleFieldSave('isbn13', v)}
                    placeholder='Add ISBN-13...'
                    className='text-neutral-300'
                    inputClassName='w-32 font-sans'
                  />
                </span>
              </div>
            </div>

            {/* Description */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm backdrop-blur-sm'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-amber-500 mb-3'>
                Synopsis &amp; Editorial Overview
              </h2>
              <InlineText
                value={book.description || ''}
                onSave={(v) => handleFieldSave('description', v)}
                multiline
                placeholder='Click to add a synopsis or editorial overview...'
                className='w-full text-sm leading-relaxed text-neutral-300 sm:text-base font-normal block'
                inputClassName='text-sm sm:text-base font-normal leading-relaxed'
              />
            </div>

            {/* Why Read & Core Value Proposition */}
            <div className='rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-transparent dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-neutral-900/50 p-6 shadow-sm backdrop-blur-sm'>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2'>
                  <FiAward className='size-3.5 text-indigo-500 dark:text-indigo-400' />
                  Why Read &amp; Core Value Proposition
                </h2>
              </div>
              <InlineText
                value={book.whyRead || book.notes || ''}
                onSave={(v) => handleFieldSave('whyRead', v)}
                multiline
                renderValue={(val) => <WhyReadContent text={val} />}
                placeholder='Why should one read this book, what value does it deliver, and is it really worth reading?...'
                className='w-full text-sm leading-relaxed text-slate-800 dark:text-neutral-200 sm:text-base font-normal block'
                inputClassName='text-sm sm:text-base font-normal leading-relaxed'
              />
            </div>

            {/* Interactive Ask AI Companion Card */}
            <div className='rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-neutral-900/60 p-5 shadow-sm dark:shadow-lg dark:shadow-indigo-950/20 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans'>
              <div className='flex items-center gap-3.5 min-w-0'>
                <div className='size-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 dark:bg-indigo-500/20 dark:border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-md dark:shadow-indigo-500/10'>
                  <LuSparkles className='size-5 text-amber-500 dark:text-amber-300 animate-pulse' />
                </div>
                <div className='space-y-0.5 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='h-[20px] inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 dark:bg-indigo-500/20 dark:border-indigo-500/40 px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-sans leading-none'>
                      Context-Aware Intelligence
                    </span>
                  </div>
                  <h3 className='text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-sans'>
                    Have questions about &ldquo;{book.title}&rdquo;?
                  </h3>
                  <p className='text-xs text-slate-600 dark:text-neutral-400 font-sans'>
                    Ask for chapter breakdowns, critical trade-offs, actionable insights, or practical examples.
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={() => setAskAiOpen(true)}
                className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 shrink-0 font-sans'
              >
                <LuSparkles className='size-3.5 text-amber-300' />
                <span>Ask AI Companion</span>
              </button>
            </div>

            {/* Key Themes */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-400'>
                  Key Themes &amp; Knowledge Pillars
                </h2>
                <span className='text-xs text-neutral-500'>{(book.keyThemes || []).length} Themes</span>
              </div>
              <InlineTagList
                tags={book.keyThemes || []}
                onSave={(arr) => handleArrayFieldSave('keyThemes', arr)}
                placeholder='New theme...'
              />
            </div>

            {/* Target Audience */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2'>
                <FiUsers className='size-3.5 text-cyan-400' />
                Target Audience &amp; Intended Readership
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                {(book.targetAudience || []).map((audience, i) => (
                  <AudienceCard
                    key={i}
                    audience={audience}
                    idx={i}
                    onSave={async (v) => {
                      const next = (book.targetAudience || []).map((a, j) => (j === i ? v : a)).filter(Boolean);
                      await handleArrayFieldSave('targetAudience', next);
                    }}
                    onRemove={async () => {
                      const next = (book.targetAudience || []).filter((_, j) => j !== i);
                      await handleArrayFieldSave('targetAudience', next);
                    }}
                  />
                ))}
                <button
                  type='button'
                  onClick={async () => {
                    const val = window.prompt('New audience entry:');
                    if (val?.trim()) {
                      await handleArrayFieldSave('targetAudience', [...(book.targetAudience || []), val.trim()]);
                    }
                  }}
                  className='flex items-center gap-2 rounded-xl border border-dashed border-neutral-700 p-3 text-xs text-neutral-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors'
                >
                  <FiPlus className='size-3.5' /> Add Audience Entry
                </button>
              </div>
            </div>

            {/* Notable Quotes */}
            <div className='rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-neutral-900/60 to-neutral-900/40 p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2'>
                  <span>&ldquo;</span> Notable Wisdom &amp; Quotes
                </h2>
                <span className='text-[10px] text-neutral-500 uppercase tracking-wider'>Click quote to edit</span>
              </div>
              <InlineQuoteList
                quotes={quotes}
                onSave={(arr) => handleArrayFieldSave('notableQuotes', arr)}
                author={book.author}
                copiedQuote={copiedQuote}
                onCopy={handleCopyQuote}
              />
            </div>

            {/* Cultural Legacy */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-2'>
                <FiAward className='size-3.5 text-amber-400' />
                Literary Legacy &amp; Historical Impact
              </h2>
              <InlineText
                value={book.legacy || ''}
                onSave={(v) => handleFieldSave('legacy', v)}
                multiline
                placeholder='Click to add cultural legacy and historical impact...'
                className='w-full text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal block'
                inputClassName='text-xs sm:text-sm leading-relaxed'
              />
              {book.sales && (
                <p className='mt-3 text-xs text-neutral-500'>
                  <span className='text-neutral-400 font-semibold'>Worldwide Circulation:</span>{' '}
                  <InlineText
                    value={book.sales}
                    onSave={(v) => handleFieldSave('sales', v)}
                    className='text-neutral-400'
                    inputClassName='w-32'
                  />
                </p>
              )}
            </div>

            {/* Similar Books */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2'>
                <FiTrendingUp className='size-3.5 text-emerald-400' />
                Similar &amp; Recommended Works
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                {(book.similarBooks || []).map((simTitle, idx) => (
                  <SimilarBookCard
                    key={idx}
                    title={simTitle}
                    idx={idx}
                    onSave={async (v) => {
                      const next = (book.similarBooks || []).map((s, j) => (j === idx ? v : s)).filter(Boolean);
                      await handleArrayFieldSave('similarBooks', next);
                    }}
                    onRemove={async () => {
                      const next = (book.similarBooks || []).filter((_, j) => j !== idx);
                      await handleArrayFieldSave('similarBooks', next);
                    }}
                  />
                ))}
                <button
                  type='button'
                  onClick={async () => {
                    const val = window.prompt('Add similar/recommended book:');
                    if (val?.trim()) {
                      await handleArrayFieldSave('similarBooks', [...(book.similarBooks || []), val.trim()]);
                    }
                  }}
                  className='flex items-center gap-2 rounded-xl border border-dashed border-neutral-700 p-3 text-xs text-neutral-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors'
                >
                  <FiPlus className='size-3.5' /> Add Similar Book
                </button>
              </div>
            </div>

            {/* Personal Notes */}
            <div className='rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2'>
                  <FiEdit2 className='size-3 text-amber-400' /> Personal Study Notes &amp; Key Takeaways
                </h2>
                {notesSaved && (
                  <span className='inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold'>
                    <FiCheck className='size-3.5' /> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder='Record your architectural reflections, mental models, and personal insights from this book...'
                className='w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none'
              />
              <div className='mt-2.5 flex justify-end'>
                <button
                  type='button'
                  onClick={handleSaveNotes}
                  className='inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500'
                >
                  <FiSave className='size-3.5' /> Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASK AI MODAL (CONTEXT-GROUNDED TO THIS BOOK) */}
      <BookAskAiModal
        isOpen={askAiOpen}
        onClose={() => setAskAiOpen(false)}
        book={book}
        onSaveNote={async (noteAppend) => {
          const nextNotes = (book.notes || '').trim()
            ? `${(book.notes || '').trim()}\n\n${noteAppend.trim()}`
            : noteAppend.trim();
          await handleFieldSave('notes', nextNotes);
          setNotesInput(nextNotes);
        }}
      />
    </AdminLayout>
  );
};

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (isIssueboardDevAuthBypassEnabled()) {
    return { props: { adminEmail: issueboardDevIdentity } };
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }
    return { props: { adminEmail: session?.user?.email || '' } };
  } catch (error) {
    console.error('Failed to get session on /admin/books/[bookId]:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default BookDetailPage;
