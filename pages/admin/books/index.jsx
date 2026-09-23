import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@components/admin/AdminLayout';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiStar,
  FiCheck,
  FiBookmark,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLayers,
  FiCpu,
  FiCompass,
  FiFeather,
  FiBriefcase,
  FiClock,
  FiPieChart,
  FiHardDrive,
  FiUsers,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiExternalLink,
  FiGlobe,
  FiMapPin,
  FiUserCheck,
  FiUploadCloud,
  FiBook,
  FiSave,
  FiCheckCircle,
  FiAward,
  FiTrendingUp,
  FiImage
} from 'react-icons/fi';
import { getBookCoverSrc, BOOK_SHELVES } from '@utils/books/bookService';
import { deletePersistedBook, fetchBooks, updatePersistedBook } from '@utils/books/bookApi';
import QuickAddModal from '@components/admin/QuickAddModal';

const SHELF_DEFINITIONS = [
  {
    id: 'technical',
    title: 'Tech & Architecture',
    subtitle: 'Distributed systems, system design, reliability engineering & code craft',
    icon: FiCpu,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
    bgBadge:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-500/40'
  },
  {
    id: 'philosophy',
    title: 'Philosophy & Mind',
    subtitle: 'Cognitive models, history, deep focus, and decision heuristics',
    icon: FiCompass,
    accentColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/30 dark:border-rose-500/40',
    bgBadge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-500/40'
  },
  {
    id: 'fiction',
    title: 'Fiction & Sci-Fi',
    subtitle: 'World-building, prescience, hard science fiction & deep ecology',
    icon: FiFeather,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30 dark:border-amber-500/40',
    bgBadge:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-500/40'
  },
  {
    id: 'business',
    title: 'Product & Leadership',
    subtitle: 'Managerial leverage, organization scaling, and engineering strategy',
    icon: FiBriefcase,
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-500/30 dark:border-cyan-500/40',
    bgBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-500/40'
  },
  {
    id: 'wishlist',
    title: 'Wishlist & Up Next',
    subtitle: 'Queued books for reading challenges and upcoming deep dives',
    icon: FiClock,
    accentColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30 dark:border-purple-500/40',
    bgBadge:
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-500/40'
  }
];

// ─── Inline editable text component ────────────────────────────────────────
const InlineText = ({ value, onSave, className = '', placeholder = 'Click to edit...', multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  useEffect(() => {
    if (editing && ref.current && ref.current.textContent !== draft) {
      ref.current.textContent = draft;
    }
    // Only sync on entering edit mode, not on every keystroke (would fight the caret).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

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

  const handleInput = (e) => {
    setDraft(e.target.textContent || e.target.value || '');
  };

  if (editing) {
    const Tag = multiline ? 'div' : 'span';
    return (
      <Tag
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className={`${className} ${multiline ? 'block min-h-[4rem]' : 'inline-block min-w-[2ch]'} outline-none`}
        style={{
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
          wordBreak: 'break-word',
          minWidth: multiline ? '100%' : undefined
        }}
      />
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
      className={`relative inline-flex items-start gap-1 rounded transition-colors ${className}`}
      style={{
        cursor: 'text',
        borderBottom: hovered ? '1.5px dashed #f59e0b' : '1.5px dashed transparent',
        borderRadius: '2px',
        paddingBottom: '1px',
        transition: 'border-color 0.15s'
      }}
    >
      <span className={!value ? 'italic text-neutral-500 dark:text-neutral-400' : ''}>{value || placeholder}</span>
    </span>
  );
};

// ─── Inline editable tag list ────────────────────────────────────────────────
const InlineTagList = ({
  tags = [],
  onSave,
  placeholder = 'Add item...',
  icon: Icon,
  accentColor = 'amber',
  display = 'tags'
}) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftTag, setDraftTag] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const colorMap = {
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-900',
      darkBg: 'dark:bg-amber-500/10',
      darkBorder: 'dark:border-amber-500/20',
      darkText: 'dark:text-amber-100',
      dot: 'bg-amber-400',
      inputBg: 'bg-amber-500/20',
      inputBorder: 'border-amber-500',
      inputText: 'text-amber-900',
      inputDarkBg: 'dark:bg-amber-500/30',
      inputDarkBorder: 'dark:border-amber-500',
      inputDarkText: 'dark:text-amber-100',
      addBorder: 'border-amber-500/60',
      addHoverBorder: 'hover:border-amber-500/50',
      addHoverText: 'hover:text-amber-400',
      addDarkHoverBorder: 'dark:hover:border-amber-500/50',
      addDarkHoverText: 'dark:hover:text-amber-400'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-900',
      darkBg: 'dark:bg-cyan-500/10',
      darkBorder: 'dark:border-cyan-500/20',
      darkText: 'dark:text-cyan-100',
      dot: 'bg-cyan-400',
      inputBg: 'bg-cyan-500/20',
      inputBorder: 'border-cyan-500',
      inputText: 'text-cyan-900',
      inputDarkBg: 'dark:bg-cyan-500/30',
      inputDarkBorder: 'dark:border-cyan-500',
      inputDarkText: 'dark:text-cyan-100',
      addBorder: 'border-cyan-500/60',
      addHoverBorder: 'hover:border-cyan-500/50',
      addHoverText: 'hover:text-cyan-400',
      addDarkHoverBorder: 'dark:hover:border-cyan-500/50',
      addDarkHoverText: 'dark:hover:text-cyan-400'
    },
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-900',
      darkBg: 'dark:bg-teal-500/10',
      darkBorder: 'dark:border-teal-500/20',
      darkText: 'dark:text-teal-100',
      dot: 'bg-teal-400',
      inputBg: 'bg-teal-500/20',
      inputBorder: 'border-teal-500',
      inputText: 'text-teal-900',
      inputDarkBg: 'dark:bg-teal-500/30',
      inputDarkBorder: 'dark:border-teal-500',
      inputDarkText: 'dark:text-teal-100',
      addBorder: 'border-teal-500/60',
      addHoverBorder: 'hover:border-teal-500/50',
      addHoverText: 'hover:text-teal-400',
      addDarkHoverBorder: 'dark:hover:border-teal-500/50',
      addDarkHoverText: 'dark:hover:text-teal-400'
    }
  };
  const c = colorMap[accentColor] || colorMap.amber;

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

  if (display === 'list') {
    return (
      <div className='space-y-1'>
        {tags.map((tag, i) =>
          editingIdx === i ? (
            <div key={i} className='flex items-start gap-2'>
              <span className={`size-1.5 rounded-full ${c.dot} flex-shrink-0 mt-1`} />
              <textarea
                autoFocus
                value={draftTag}
                onChange={(e) => setDraftTag(e.target.value)}
                onBlur={() => commitEdit(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitEdit(i);
                  }
                  if (e.key === 'Escape') {
                    setEditingIdx(null);
                  }
                }}
                className={`flex-1 min-w-0 bg-transparent border-none text-sm font-medium ${c.text} ${c.darkText} focus:outline-none resize-none`}
                style={{
                  minHeight: '2.5rem',
                  lineHeight: '1.5',
                  padding: 0
                }}
                rows={2}
              />
            </div>
          ) : (
            <div
              key={i}
              className='flex items-start gap-2 cursor-pointer w-full min-w-0'
              onClick={() => {
                setDraftTag(tag);
                setEditingIdx(i);
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                borderBottom: hoveredIdx === i ? '1.5px dashed #f59e0b' : '1.5px dashed transparent',
                borderRadius: '2px',
                paddingBottom: '1px',
                transition: 'border-color 0.15s'
              }}
            >
              <span className={`size-1.5 rounded-full ${c.dot} flex-shrink-0 mt-1`} />
              <span className={`flex-1 min-w-0 text-sm ${c.text} ${c.darkText} whitespace-normal break-words`}>
                {tag}
              </span>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(i);
                }}
                className='flex items-center justify-center size-5 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shrink-0'
                title='Remove'
              >
                <FiX className='size-2.5' />
              </button>
            </div>
          )
        )}
        {addingNew ? (
          <div className='flex items-center gap-2'>
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
              className={`flex-1 rounded-xl bg-slate-100 ${c.addBorder} px-3 py-1.5 text-xs text-slate-900 dark:bg-neutral-900 ${c.darkBorder} dark:text-white focus:outline-none focus:border-amber-500`}
            />
          </div>
        ) : (
          <button
            type='button'
            onClick={() => setAddingNew(true)}
            className={`inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 ${c.addHoverBorder} ${c.addHoverText} dark:border-slate-600 dark:text-slate-400 ${c.addDarkHoverBorder} ${c.addDarkHoverText} transition-colors`}
          >
            <FiPlus className='size-3' /> Add
          </button>
        )}
      </div>
    );
  }

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
            className={`rounded-xl ${c.inputBorder} px-3 py-1.5 text-xs font-medium ${c.inputText} ${c.inputDarkBg} ${c.inputDarkBorder} ${c.inputDarkText} focus:outline-none w-32`}
          />
        ) : (
          <span
            key={i}
            className='inline-flex items-center gap-1 cursor-pointer'
            onClick={() => {
              setDraftTag(tag);
              setEditingIdx(i);
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              borderBottom: hoveredIdx === i ? '1.5px dashed #f59e0b' : '1.5px dashed transparent',
              borderRadius: '2px',
              paddingBottom: '1px',
              transition: 'border-color 0.15s'
            }}
          >
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs ${c.text} ${c.darkText} ${c.border} ${c.darkBorder}`}
            >
              <span className={`size-1.5 rounded-full ${c.dot}`} />
              {tag}
            </span>
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
          className='rounded-xl bg-slate-100 border border-amber-500/60 px-3 py-1.5 text-xs text-slate-900 dark:bg-neutral-900 dark:border-amber-500/60 dark:text-white focus:outline-none focus:border-amber-500 w-40'
        />
      ) : (
        <button
          type='button'
          onClick={() => setAddingNew(true)}
          className='inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 hover:border-amber-500/50 hover:text-amber-400 dark:border-slate-600 dark:text-slate-400 dark:hover:border-amber-500/50 dark:hover:text-amber-400 transition-colors'
        >
          <FiPlus className='size-3' /> Add
        </button>
      )}
    </div>
  );
};

// ─── Inline editable quote list ──────────────────────────────────────────────
const InlineQuoteList = ({ quotes = [], onSave, author, copiedQuote, onCopy }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQuote, setDraftQuote] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newQuoteDraft, setNewQuoteDraft] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(null);

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
          <div key={idx} className='rounded-xl border border-amber-500/50 bg-white dark:bg-neutral-900 p-3'>
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
              className='w-full bg-transparent font-serif text-sm italic text-slate-700 dark:text-neutral-200 leading-relaxed focus:outline-none resize-none'
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
            className='group relative cursor-pointer rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/80 p-4 transition-all hover:border-amber-500/40 hover:bg-slate-50 dark:hover:border-amber-500/40 dark:hover:bg-neutral-950'
            onClick={() => {
              setDraftQuote(quote);
              setEditingIdx(idx);
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              borderBottom: hoveredIdx === idx ? '1.5px dashed #f59e0b' : '1.5px dashed transparent',
              borderRadius: '2px',
              paddingBottom: '1px',
              transition: 'border-color 0.15s'
            }}
          >
            <p className='font-serif text-sm sm:text-base italic text-slate-700 dark:text-neutral-200 leading-relaxed'>
              &ldquo;{quote}&rdquo;
            </p>
            <div className='mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-500'>
              <span className='text-[11px] font-medium text-amber-600 dark:text-amber-400/80'>&mdash; {author}</span>
              <div className='flex items-center gap-3'>
                <span className='inline-flex items-center gap-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 text-slate-400 dark:text-neutral-400'>
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
        <div className='rounded-xl border border-amber-500/50 bg-white dark:bg-neutral-900 p-3'>
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
            className='w-full bg-transparent font-serif text-sm italic text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 leading-relaxed focus:outline-none resize-none'
          />
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setAddingNew(true)}
          className='inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-amber-500/50 hover:text-amber-400 dark:border-slate-600 dark:text-slate-400 dark:hover:border-amber-500/50 dark:hover:text-amber-400 transition-colors'
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
      className='flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-neutral-950/60 dark:border-neutral-800/70 p-3 text-xs text-slate-700 dark:text-neutral-300 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-colors'
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
      className='flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-neutral-950/70 dark:border-neutral-800/80 p-3 text-xs text-slate-900 dark:text-neutral-200 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors'
    >
      <div className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-amber-400 font-bold border border-slate-200 dark:bg-neutral-900 dark:text-amber-400 dark:border-neutral-800'>
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

// ─── Inline image editor ────────────────────────────────────────────────────
const InlineImageEditor = ({ value, onSave }) => {
  const [urlDraft, setUrlDraft] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    await onSave(urlDraft.trim());
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/books/covers/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUrlDraft(data.url);
      await onSave(data.url);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          handleFileSelect(item.getAsFile());
          break;
        }
      }
    }
  };

  return (
    <div className='space-y-2 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50'>
      <div className='flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-neutral-300'>
        <FiImage className='size-4 text-cyan-400' />
        Cover Image
      </div>

      {/* Preview */}
      <div className='relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-900'>
        {urlDraft ? (
          <img
            src={urlDraft}
            alt='Cover preview'
            className='w-full h-full object-cover'
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-slate-400 dark:text-neutral-500'>
            <span className='text-xs'>No image</span>
          </div>
        )}
        {uploading && (
          <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent' />
          </div>
        )}
      </div>

      {/* URL Input */}
      <div className='space-y-1'>
        <label className='text-xs text-slate-500 dark:text-neutral-400'>Image URL</label>
        <input
          type='url'
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder='https://example.com/cover.jpg'
          className='w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
        />
      </div>

      {/* Upload / Drag-drop Zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed ${
          dragActive ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-300 dark:border-neutral-700'
        } p-4 transition-colors cursor-pointer`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='absolute inset-0 opacity-0 cursor-pointer'
          onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
        />
        <div className='flex flex-col items-center gap-2 text-center'>
          <FiUploadCloud className='size-6 text-slate-400 dark:text-neutral-500' />
          <span className='text-sm text-slate-600 dark:text-neutral-400'>Drag & drop, paste, or click to upload</span>
          <span className='text-xs text-slate-400 dark:text-neutral-500'>PNG, JPG, WebP · Max 5MB</span>
        </div>
      </div>

      {/* Current URL display */}
      {value && <p className='text-xs text-slate-500 dark:text-neutral-400 truncate'>Current: {value}</p>}
    </div>
  );
};

const BooksPage = ({ adminEmail }) => {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState('');
  const [activeShelf, setActiveShelf] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('shelves'); // 'shelves' default on opening
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [updatePageInput, setUpdatePageInput] = useState('');
  const [activeDetailBook, setActiveDetailBook] = useState(null); // Studio Editorial Modal
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [importingMetadata, setImportingMetadata] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const metadataFileInputRef = useRef(null);

  // Sync with router query param if set (e.g. ?shelf=technical)
  useEffect(() => {
    if (router.query.shelf) {
      setActiveShelf(String(router.query.shelf));
    }
  }, [router.query.shelf]);

  const refreshBooks = async () => {
    try {
      setBooksError('');
      setBooks(await fetchBooks());
    } catch (error) {
      setBooksError(error.message || 'Could not load the library.');
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    refreshBooks();
  }, []);

  // Filter books
  const filteredBooks = books.filter((b) => {
    if (activeShelf === 'reading') {
      if (b.status !== 'reading') return false;
    } else if (activeShelf !== 'all' && b.shelf !== activeShelf) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const authorMatch = (b.author || '').toLowerCase().includes(q);
    const genreMatch = (b.genre || '').toLowerCase().includes(q);
    const themeMatch = Array.isArray(b.keyThemes) && b.keyThemes.some((t) => t.toLowerCase().includes(q));
    return titleMatch || authorMatch || genreMatch || themeMatch;
  });

  // Telemetry Metrics
  const totalBooksCount = books.length;
  const completedCount = books.filter((b) => b.status === 'completed').length;
  const yearlyGoal = 25;
  const challengeYear = new Date().getFullYear();
  const goalPercentage = Math.min(100, Math.round((completedCount / yearlyGoal) * 100));
  const nextBook = books.find((book) => ['reading', 'wishlist', 'queued'].includes(book.status));

  const physicalCount = books.filter((b) => b.format === 'physical' || !b.format).length;
  const ebookCount = books.filter((b) => b.format === 'ebook').length;
  const physicalPercent = totalBooksCount > 0 ? Math.round((physicalCount / totalBooksCount) * 100) : 0;
  const ebookPercent = totalBooksCount > 0 ? Math.round((ebookCount / totalBooksCount) * 100) : 0;

  // Genre distribution counts
  const genreCounts = {};
  books.forEach((b) => {
    const g = b.genre ? b.genre.split(',')[0].split('&')[0].trim() : 'General';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genreColors = ['bg-cyan-400', 'bg-rose-400', 'bg-emerald-400', 'bg-purple-400'];
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const handleUpdateProgress = async (bookId) => {
    const page = Number(updatePageInput);
    if (isNaN(page) || page < 0) return;
    const target = books.find((book) => book.id === bookId);
    const safePage = Math.min(page, target?.totalPages || target?.pages || page);
    try {
      const updated = await updatePersistedBook(bookId, { currentPage: safePage });
      setBooks((current) => current.map((book) => (book.id === bookId ? updated : book)));
      setEditingBook(null);
      setUpdatePageInput('');
      if (activeDetailBook?.id === bookId) setActiveDetailBook(updated);
    } catch (error) {
      setBooksError(error.message);
    }
  };

  const handleUpdateBookStatus = async (bookId, newStatus) => {
    try {
      const updated = await updatePersistedBook(bookId, { status: newStatus });
      setBooks((current) => current.map((book) => (book.id === bookId ? updated : book)));
      if (activeDetailBook?.id === bookId) setActiveDetailBook(updated);
    } catch (error) {
      setBooksError(error.message);
    }
  };

  const handleDelete = async (bookId, title) => {
    if (confirm(`Remove "${title}" from library records?`)) {
      try {
        await deletePersistedBook(bookId);
        setBooks((current) => current.filter((book) => book.id !== bookId));
        if (activeDetailBook?.id === bookId) setActiveDetailBook(null);
      } catch (error) {
        setBooksError(error.message);
      }
    }
  };

  const handleCopyQuote = (quoteText) => {
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(quoteText)
        .then(() => {
          setCopiedQuote(true);
          setTimeout(() => setCopiedQuote(false), 2200);
        })
        .catch(() => setBooksError('Could not copy the quote.'));
    }
  };

  const handleDetailSave = async () => {
    if (!activeDetailBook) return;
    try {
      const updated = await updatePersistedBook(activeDetailBook.id, activeDetailBook);
      setBooks((current) => current.map((book) => (book.id === activeDetailBook.id ? updated : book)));
      setActiveDetailBook(updated);
    } catch (error) {
      setBooksError(error.message);
    }
  };

  const handleImportMetadata = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportingMetadata(true);
    setBooksError('');
    setImportMessage('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a JSON file smaller than 2 MB.');
      const parsedFile = JSON.parse(await file.text());
      const booksToImport = Array.isArray(parsedFile) ? parsedFile : parsedFile?.books;
      if (!Array.isArray(booksToImport) || booksToImport.length === 0) {
        throw new Error('The selected file must contain a non-empty books array.');
      }
      const response = await fetch('/api/admin/books/sync-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: booksToImport })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Could not import book metadata.');
      setImportMessage(
        `${file.name}: imported ${payload.added} new and updated ${payload.updated} existing book${payload.updated === 1 ? '' : 's'}.`
      );
      await refreshBooks();
    } catch (error) {
      setBooksError(error instanceof SyntaxError ? 'The selected file is not valid JSON.' : error.message);
    } finally {
      setImportingMetadata(false);
    }
  };

  // 4-state status capsule helper (compact, tight padding)
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className='h-[18px] inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-400 px-2 text-[10px] font-bold leading-normal text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-500/50 dark:text-emerald-200'>
            <FiCheck className='size-3 shrink-0' /> Completed
          </span>
        );
      case 'reading':
        return (
          <span className='h-[18px] inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-400 px-2 text-[10px] font-bold leading-none text-amber-800 dark:bg-amber-900/40 dark:border-amber-500/50 dark:text-amber-200'>
            <FiBookOpen className='size-3 shrink-0 animate-pulse' /> Reading
          </span>
        );
      case 'queued':
      case 'wishlist':
        return (
          <span className='h-[18px] inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-400 px-2 text-[10px] font-bold leading-normal text-purple-800 dark:bg-purple-900/40 dark:border-purple-500/50 dark:text-purple-200'>
            <FiClock className='size-3 shrink-0' /> Queued
          </span>
        );
      case 'reference':
      default:
        return (
          <span className='h-[18px] inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-400 px-2 text-[10px] font-bold leading-normal text-slate-800 dark:bg-slate-800 dark:border-slate-500/50 dark:text-slate-200'>
            <FiBookmark className='size-3 shrink-0' /> Reference
          </span>
        );
    }
  };

  // Cover image resolver with realistic spine edge
  const renderCardCover = (book, heightClass = 'h-28') => {
    const src = getBookCoverSrc(book);
    if (src) {
      return (
        <div className={`relative overflow-hidden rounded-xl shadow-md ring-1 ring-white/10 shrink-0 ${heightClass}`}>
          <img
            src={src}
            alt={book.title}
            className={`w-full object-cover rounded-xl ${heightClass}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className='pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-xl bg-gradient-to-r from-white/20 via-black/30 to-black/70' />
        </div>
      );
    }
    return (
      <div
        className={`relative flex flex-col justify-between p-2.5 rounded-xl bg-gradient-to-br ${
          book.coverColor || 'from-amber-700 to-yellow-950'
        } ${heightClass} shadow-md ring-1 ring-white/10 shrink-0`}
      >
        <div className='pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-xl bg-gradient-to-r from-white/20 via-black/30 to-black/70' />
        <span className='text-[9px] font-sans uppercase tracking-wider text-amber-300 font-bold'>
          {book.genre ? book.genre.split(',')[0].trim() : 'Hardcover'}
        </span>
        <div className='font-serif text-[11px] font-bold text-white line-clamp-2 leading-tight'>{book.title}</div>
        <span className='text-[9px] font-sans font-medium text-white/60'>{book.pages || book.totalPages || 300}p</span>
      </div>
    );
  };

  const getBookGlowClass = (book) => {
    const color = book.coverColor || '';
    if (color.includes('emerald') || color.includes('teal')) return 'hover:shadow-[0_8px_28px_rgba(16,185,129,0.28)]';
    if (color.includes('rose') || color.includes('red')) return 'hover:shadow-[0_8px_28px_rgba(244,63,94,0.27)]';
    if (color.includes('cyan') || color.includes('blue')) return 'hover:shadow-[0_8px_28px_rgba(6,182,212,0.28)]';
    if (color.includes('purple') || color.includes('indigo')) return 'hover:shadow-[0_8px_28px_rgba(139,92,246,0.28)]';
    return 'hover:shadow-[0_8px_28px_rgba(245,158,11,0.28)]';
  };

  return (
    <AdminLayout
      adminEmail={adminEmail}
      title='Book Records & Library | SinghBuildsTech Admin'
      description='Personal book catalog, reading progress, and mental model notes.'
      activeNav='books'
    >
      <div className='mx-auto max-w-7xl p-6 sm:p-8 space-y-6'>
        {booksError && (
          <div
            role='alert'
            className='flex items-center justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
          >
            <span>{booksError}</span>
            <button
              type='button'
              onClick={refreshBooks}
              className='min-h-11 rounded-lg px-3 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40'
            >
              Retry
            </button>
          </div>
        )}
        {booksLoading && (
          <div
            role='status'
            className='rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          >
            Loading your library…
          </div>
        )}
        {importMessage && (
          <div
            role='status'
            className='rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
          >
            {importMessage}
          </div>
        )}
        {/* ============================================================== */}
        {/* TRI-TELEMETRY HORIZON HEADER BLOCK                             */}
        {/* ============================================================== */}
        <div className='relative overflow-hidden rounded-2xl border border-amber-500/30 bg-white p-6 shadow-lg dark:border-amber-500/40 dark:bg-[#14100c] dark:shadow-2xl space-y-6'>
          {/* Header Bar: Title, Subtitle, and Add Book Button */}
          <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20'>
                  <FiBookOpen className='size-3.5' /> Personal Library Records
                </span>
              </div>
              <h1 className='mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl'>
                Books, Shelves & Reading Log
              </h1>
              <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 max-w-xl'>
                Categorized personal repository of engineering architectures, cognitive models, philosophy, and
                leadership classics.
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => metadataFileInputRef.current?.click()}
                disabled={importingMetadata}
                className='inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                title='Import tools/book-metadata/output/books.json'
              >
                <FiUploadCloud className='size-4' /> {importingMetadata ? 'Importing…' : 'Import metadata'}
              </button>
              <input
                ref={metadataFileInputRef}
                type='file'
                accept='application/json,.json'
                onChange={handleImportMetadata}
                className='sr-only'
                aria-label='Select book metadata JSON file'
              />
              <button
                type='button'
                onClick={() => setAddModalOpen(true)}
                className='inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-black shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition active:scale-95'
              >
                <FiPlus className='size-4' /> Add Book
              </button>
            </div>
          </div>

          {/* 3 Telemetry Tiles in the Same Block */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            {/* Tile 1: 2026 Reading Challenge Gauge (Existing) */}
            <div className='rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-center gap-4 shadow-sm dark:border-amber-500/20 dark:bg-slate-950/70'>
              <div className='relative grid size-16 shrink-0 place-items-center rounded-full bg-white border-2 border-amber-500/50 shadow-sm dark:bg-slate-900 dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]'>
                <span className='font-sans text-base font-black text-amber-600 dark:text-amber-400'>
                  {goalPercentage}%
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-xs font-bold text-slate-800 dark:text-slate-200'>
                  {challengeYear} Reading Challenge
                </div>
                <div className='font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                  <strong className='text-slate-900 dark:text-white text-sm font-bold'>{completedCount}</strong> of{' '}
                  {yearlyGoal} books completed
                </div>
                <div className='mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
                <div className='text-[10px] text-amber-600/90 dark:text-amber-400/80 font-sans font-semibold mt-1 truncate'>
                  {nextBook ? `Next up: ${nextBook.title}` : 'Reading queue is clear'}
                </div>
              </div>
            </div>

            {/* Tile 2: Genre Distribution Chart & Counts (New) */}
            <div className='rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
              <div className='flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200'>
                <span className='flex items-center gap-1.5'>
                  <FiPieChart className='size-3.5 text-cyan-500 dark:text-cyan-400' /> Genre Distribution
                </span>
                <span className='text-[10px] font-sans font-semibold text-slate-400 dark:text-slate-500'>
                  {Object.keys(genreCounts).length} Genres
                </span>
              </div>

              {/* Segmented Spectrum Bar */}
              <div className='h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex'>
                {topGenres.map(([name, count], index) => (
                  <div
                    key={name}
                    className={`h-full ${genreColors[index]}`}
                    style={{ width: `${(count / totalBooksCount) * 100}%` }}
                    title={`${name}: ${count}`}
                  />
                ))}
              </div>

              {/* Genre Badges with Counts */}
              <div className='flex flex-wrap gap-1.5 pt-0.5'>
                {topGenres.map(([name, count], index) => (
                  <span
                    key={name}
                    className='h-[18px] inline-flex items-center gap-1 px-2 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-sans font-semibold leading-none text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'
                  >
                    <span className={`size-1.5 rounded-full ${genreColors[index]} shrink-0`} />
                    <span className='truncate max-w-[90px]'>{name}</span>
                    <strong className='text-amber-600 dark:text-amber-400 font-bold'>{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Tile 3: E-Books vs Physical Books vs Total Books (New) */}
            <div className='rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
              <div className='flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200'>
                <span className='flex items-center gap-1.5'>
                  <FiHardDrive className='size-3.5 text-amber-500 dark:text-amber-400' /> Format Breakdown
                </span>
                <span className='font-sans text-xs font-bold text-amber-600 dark:text-amber-400'>
                  {totalBooksCount} Total Books
                </span>
              </div>

              {/* Dual Format Meter */}
              <div className='space-y-1'>
                <div className='flex justify-between text-[11px] font-sans font-medium'>
                  <span className='text-amber-600 dark:text-amber-400 flex items-center gap-1'>
                    📖 Physical: <strong>{physicalCount}</strong> ({physicalPercent}%)
                  </span>
                  <span className='text-cyan-600 dark:text-cyan-400 flex items-center gap-1'>
                    📱 E-Books: <strong>{ebookCount}</strong> ({ebookPercent}%)
                  </span>
                </div>
                <div className='h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex'>
                  <div className='h-full bg-amber-500' style={{ width: `${physicalPercent}%` }} />
                  <div className='h-full bg-cyan-400' style={{ width: `${ebookPercent}%` }} />
                </div>
              </div>

              <div className='flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-sans font-medium pt-1 border-t border-slate-200 dark:border-slate-800/60'>
                <span>Active Library Inventory</span>
                <span className='text-emerald-600 dark:text-emerald-400'>● Database backed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Shelf Filters, Search, View Mode Toggle */}
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3'>
          {/* Shelf Filter Pills */}
          <div className='flex flex-wrap items-center gap-2 overflow-x-auto pb-1'>
            {BOOK_SHELVES.map((shelf) => {
              const isSelected = activeShelf === shelf.id;
              const count =
                shelf.id === 'all'
                  ? books.length
                  : shelf.id === 'reading'
                    ? books.filter((b) => b.status === 'reading').length
                    : books.filter((b) => b.shelf === shelf.id).length;

              return (
                <button
                  key={shelf.id}
                  type='button'
                  onClick={() => {
                    setActiveShelf(shelf.id);
                    router.push(`/admin/books?shelf=${shelf.id}`, undefined, { shallow: true });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{shelf.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-sans font-bold ${
                      isSelected
                        ? 'bg-black/20 text-black'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & View Mode Switcher */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1 sm:w-64'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400' />
              <input
                type='text'
                placeholder='Search title, author, themes…'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
              />
            </div>

            <div className='flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900'>
              <button
                type='button'
                onClick={() => setViewMode('shelves')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'shelves'
                    ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='Categorized Shelves View'
              >
                <FiLayers className='size-3.5' />
                <span className='hidden sm:inline'>Shelves</span>
              </button>
              <button
                type='button'
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='Cover Grid'
              >
                <FiGrid className='size-3.5' />
              </button>
              <button
                type='button'
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table'
                    ? 'bg-slate-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='List Table'
              >
                <FiList className='size-3.5' />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: CATEGORIZED BOOK SHELVES WITH HOVER DOSSIER & MODAL    */}
        {/* ============================================================== */}
        {viewMode === 'shelves' && (
          <div className='space-y-8'>
            {SHELF_DEFINITIONS.filter((def) => activeShelf === 'all' || activeShelf === def.id).map((shelfDef) => {
              const shelfBooks = filteredBooks.filter((b) => b.shelf === shelfDef.id);
              if (shelfBooks.length === 0 && searchQuery) return null;

              const ShelfIcon = shelfDef.icon;

              return (
                <section
                  key={shelfDef.id}
                  className={`rounded-2xl border ${shelfDef.borderColor} bg-white dark:bg-slate-900/60 px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm dark:shadow-xl space-y-3 relative overflow-visible hover:z-30 z-10`}
                >
                  {/* Category Shelf Header */}
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`p-1.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 ${shelfDef.accentColor}`}
                      >
                        <ShelfIcon className='size-4' />
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h2 className='text-base font-bold text-slate-900 dark:text-white tracking-tight'>
                            {shelfDef.title}
                          </h2>
                          <span
                            className={`h-[18px] inline-flex items-center rounded-full px-2 text-[10px] leading-none font-sans font-bold border ${shelfDef.bgBadge}`}
                          >
                            {shelfBooks.length} {shelfBooks.length === 1 ? 'Book' : 'Books'}
                          </span>
                        </div>
                        <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>{shelfDef.subtitle}</p>
                      </div>
                    </div>

                    {activeShelf === 'all' && (
                      <button
                        type='button'
                        onClick={() => {
                          setActiveShelf(shelfDef.id);
                          router.push(`/admin/books?shelf=${shelfDef.id}`, undefined, { shallow: true });
                        }}
                        className='text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition self-start sm:self-auto'
                      >
                        Filter to this shelf →
                      </button>
                    )}
                  </div>

                  {/* Books Row / Grid with Floating Glass Dossier Hover & Click Modal */}
                  {shelfBooks.length === 0 ? (
                    <div className='py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-sans'>
                      No books matching your search in this shelf.
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-1 relative'>
                      {shelfBooks.map((book, idx) => {
                        const totalPages = book.pages || book.totalPages || 300;
                        const progressPct = Math.round(((book.currentPage || 0) / totalPages) * 100);
                        const isFlyoutLeft = idx % 4 >= 2;
                        const firstQuote =
                          (book.notableQuotes && book.notableQuotes[0]) ||
                          (book.quotes && book.quotes[0]) ||
                          'Compounded knowledge and timeless architectural craftsmanship.';

                        return (
                          <div
                            key={book.id}
                            onClick={() => setActiveDetailBook(book)}
                            className={`group relative flex flex-col justify-between overflow-visible rounded-xl border ${shelfDef.borderColor} bg-slate-50/70 dark:bg-slate-950/80 shadow-sm transition-all duration-200 hover:-translate-y-1 ${getBookGlowClass(book)} cursor-pointer hover:z-50 z-10`}
                          >
                            {/* FLOATING GLASS DOSSIER HOVER POPUP (BESIDE CARD - ELEVATED Z-50) */}
                            <div
                              className={`pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 absolute top-0 z-50 w-80 rounded-2xl border border-cyan-300 bg-white/95 p-3.5 shadow-[0_18px_50px_rgba(8,145,178,0.22)] backdrop-blur-xl space-y-2.5 text-left hidden lg:block dark:border-cyan-500/40 dark:bg-[#0d1117]/95 dark:shadow-2xl ${
                                isFlyoutLeft
                                  ? 'right-full mr-3 before:absolute before:-right-3 before:top-0 before:w-3 before:h-full'
                                  : 'left-full ml-3 before:absolute before:-left-3 before:top-0 before:w-3 before:h-full'
                              }`}
                            >
                              {/* Key Themes */}
                              <div className='space-y-1'>
                                <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                                  <FiTag className='size-3 text-cyan-400' /> Key Themes
                                </span>
                                <div className='space-y-1'>
                                  {Array.isArray(book.keyThemes) && book.keyThemes.length > 0 ? (
                                    book.keyThemes.slice(0, 4).map((t, i) => (
                                      <p
                                        key={i}
                                        className='text-[11px] leading-relaxed text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 px-1.5 py-0.5 rounded'
                                      >
                                        <FiTag className='size-3 text-cyan-400 shrink-0' /> {t}
                                      </p>
                                    ))
                                  ) : (
                                    <p className='text-[10px] text-slate-600 dark:text-neutral-400 font-sans'>
                                      General Engineering
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Target Audience */}
                              <div className='space-y-1 border-t border-slate-200 pt-2 dark:border-neutral-800/80'>
                                <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                                  <FiUsers className='size-3 text-amber-400' /> Target Audience
                                </span>
                                <div className='space-y-1 '>
                                  {Array.isArray(book.targetAudience) && book.targetAudience.length > 0 ? (
                                    book.targetAudience.slice(0, 3).map((a, i) => (
                                      <p
                                        key={i}
                                        className='text-[11px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 px-1.5 py-0.5'
                                      >
                                        <FiUserCheck className='size-3 text-amber-400 shrink-0' /> {a}
                                      </p>
                                    ))
                                  ) : (
                                    <p className='text-[10px] text-slate-600 dark:text-neutral-400 font-sans'>
                                      Engineers & Leaders
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Notable Quote */}
                              <div className='border-t border-slate-200 pt-2 space-y-1 dark:border-neutral-800/80'>
                                <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                                  <span>“</span> Notable Quote
                                </span>
                                <div className='p-2 rounded-xl bg-cyan-50/70 border border-cyan-200 text-[11px] italic font-serif text-slate-700 leading-relaxed dark:bg-neutral-950/80 dark:border-neutral-800/90 dark:text-neutral-200'>
                                  &quot;{firstQuote}&quot;
                                </div>
                              </div>

                              <div className='pt-0.5 text-[9.5px] font-sans font-medium text-slate-500 text-right dark:text-neutral-400'>
                                Click card for full record ↗
                              </div>
                            </div>

                            {/* Spine accent top strip */}
                            <div
                              className={`h-1 w-full bg-gradient-to-r ${
                                book.coverColor || 'from-amber-600 to-yellow-800'
                              }`}
                            />

                            <div className='p-4 space-y-3 leading-relaxed'>
                              {/* Header: Shelf Tag & Rating */}
                              <div className='flex items-center justify-between'>
                                <span className='h-[18px] inline-flex items-center rounded-full bg-slate-100 px-2 text-[10px] leading-normal font-sans font-bold text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'>
                                  {shelfDef.title.split(' ')[0]}
                                </span>
                                <div className='flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs'>
                                  <FiStar className='size-3 fill-amber-400' />
                                  <span className='font-sans font-bold'>{book.rating}</span>
                                </div>
                              </div>

                              {/* Cover Art + Title + Author Row */}
                              <div className='flex gap-3'>
                                <div className='w-20 shrink-0'>{renderCardCover(book, 'h-28')}</div>
                                <div className='flex-1 min-w-0 space-y-0.5'>
                                  {/* 4-State Status Badge */}
                                  <div className='leading-none'>{renderStatusBadge(book.status)}</div>

                                  <h3 className='text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed group-hover:text-amber-600 dark:group-hover:text-amber-300 transition'>
                                    {book.title}
                                  </h3>
                                  <p className='text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 truncate'>
                                    by {book.author}
                                  </p>
                                  <div className='text-[10px] leading-relaxed font-sans font-medium text-slate-400 dark:text-slate-500'>
                                    {book.format === 'ebook' ? '📱 E-Book' : '📖 Hardcover'} · {totalPages}p
                                  </div>
                                </div>
                              </div>

                              {/* Book Description Snippet (New) */}
                              {book.description && (
                                <div className='min-h-[3.65rem] rounded-xl border border-slate-200 bg-slate-100/70 px-2.5 py-2 dark:border-neutral-800/80 dark:bg-neutral-950/70'>
                                  <p className='line-clamp-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300'>
                                    {book.description}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions Footer */}
                            <div className='flex items-center justify-between border-t border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 px-3 py-2 text-xs'>
                              {editingBook === book.id ? (
                                <div onClick={(e) => e.stopPropagation()} className='flex items-center gap-1.5 w-full'>
                                  <input
                                    type='number'
                                    min='0'
                                    max={totalPages}
                                    value={updatePageInput}
                                    onChange={(e) => setUpdatePageInput(e.target.value)}
                                    placeholder='Page'
                                    className='w-16 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                                  />
                                  <button
                                    type='button'
                                    onClick={() => handleUpdateProgress(book.id)}
                                    className='rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white'
                                  >
                                    Save
                                  </button>
                                  <button
                                    type='button'
                                    onClick={() => setEditingBook(null)}
                                    className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                  >
                                    <FiX className='size-3' />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDetailBook(book);
                                    }}
                                    className='inline-flex min-h-11 items-center gap-1 px-1 text-[10px] font-semibold text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400'
                                  >
                                    <FiExternalLink className='size-3' /> Open
                                  </button>
                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingBook(book.id);
                                      setUpdatePageInput(String(book.currentPage || 0));
                                    }}
                                    className='inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
                                  >
                                    <FiEdit2 className='size-3' /> Progress
                                  </button>

                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(book.id, book.title);
                                    }}
                                    className='text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition'
                                    title='Delete book'
                                  >
                                    <FiTrash2 className='size-3' />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: FLAT COVER GRID VIEW                                   */}
        {/* ============================================================== */}
        {viewMode === 'grid' && (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
            {filteredBooks.map((book, idx) => {
              const totalPages = book.pages || book.totalPages || 300;
              const progressPct = Math.round(((book.currentPage || 0) / totalPages) * 100);
              const isFlyoutLeft = idx % 4 >= 2;
              const firstQuote =
                (book.notableQuotes && book.notableQuotes[0]) ||
                (book.quotes && book.quotes[0]) ||
                'Compounded knowledge and timeless architectural craftsmanship.';

              return (
                <div
                  key={book.id}
                  onClick={() => setActiveDetailBook(book)}
                  className={`group relative flex flex-col justify-between overflow-visible rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 ${getBookGlowClass(book)} cursor-pointer`}
                >
                  {/* FLOATING GLASS DOSSIER HOVER POPUP (BESIDE CARD) */}
                  <div
                    className={`pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 absolute top-0 z-40 w-80 rounded-2xl border border-cyan-300 bg-white/95 p-3.5 shadow-[0_18px_50px_rgba(8,145,178,0.22)] backdrop-blur-xl space-y-2.5 text-left hidden lg:block dark:border-cyan-500/40 dark:bg-[#0d1117]/95 dark:shadow-2xl ${
                      isFlyoutLeft ? 'right-full mr-3' : 'left-full ml-3'
                    }`}
                  >
                    {/* Key Themes */}
                    <div className='space-y-1'>
                      <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                        <FiTag className='size-3 text-cyan-400' /> Key Themes
                      </span>
                      <div className='space-y-1'>
                        {Array.isArray(book.keyThemes) && book.keyThemes.length > 0 ? (
                          book.keyThemes.slice(0, 4).map((t, i) => (
                            <p
                              key={i}
                              className='text-[10px] leading-relaxed text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/30'
                            >
                              <FiTag className='size-3 text-cyan-400 shrink-0' /> {t}
                            </p>
                          ))
                        ) : (
                          <p className='text-[10px] text-slate-600 font-sans dark:text-neutral-500'>
                            General Engineering
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className='space-y-1 border-t border-slate-200 pt-2 dark:border-neutral-800/80'>
                      <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                        <FiUsers className='size-3 text-amber-400' /> Target Audience
                      </span>
                      <div className='space-y-1'>
                        {Array.isArray(book.targetAudience) && book.targetAudience.length > 0 ? (
                          book.targetAudience.slice(0, 3).map((a, i) => (
                            <p
                              key={i}
                              className='text-[10px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 dark:bg-neutral-900 dark:border-neutral-800'
                            >
                              <FiUserCheck className='size-3 text-amber-400 shrink-0' /> {a}
                            </p>
                          ))
                        ) : (
                          <p className='text-[10px] text-slate-600 font-sans dark:text-neutral-500'>
                            Engineers & Leaders
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notable Quote */}
                    <div className='border-t border-slate-200 pt-2 space-y-1 dark:border-neutral-800/80'>
                      <span className='text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1'>
                        <span>“</span> Notable Quote
                      </span>
                      <div className='p-2 rounded-xl bg-cyan-50/70 border border-cyan-200 text-[11px] italic font-serif text-slate-700 leading-relaxed dark:bg-neutral-950/80 dark:border-neutral-800/90 dark:text-neutral-200'>
                        &quot;{firstQuote}&quot;
                      </div>
                    </div>

                    <div className='pt-0.5 text-[9.5px] font-sans text-slate-500 text-right dark:text-neutral-500'>
                      Click card for full record ↗
                    </div>
                  </div>

                  {/* Decorative Book Spine Accent */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${book.coverColor || 'from-amber-600 to-yellow-800'}`}
                  />

                  <div className='p-5 space-y-3.5'>
                    <div className='flex items-center justify-between'>
                      {renderStatusBadge(book.status)}
                      <div className='flex items-center gap-0.5 text-amber-500 dark:text-amber-400 text-xs'>
                        <FiStar className='size-3 fill-amber-400' />
                        <span className='font-mono font-bold'>{book.rating}</span>
                      </div>
                    </div>

                    <div className='flex gap-3'>
                      <div className='w-20 shrink-0'>{renderCardCover(book, 'h-28')}</div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed group-hover:text-amber-600 dark:group-hover:text-amber-300 transition'>
                          {book.title}
                        </h3>
                        <p className='mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400'>
                          by {book.author}
                        </p>
                      </div>
                    </div>

                    {book.description && (
                      <p className='text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-neutral-950 p-2 rounded-xl border border-slate-200 dark:border-neutral-800'>
                        {book.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className='flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-950/60'>
                    <span className='text-[11px] font-mono text-slate-400'>{book.publishedYear}</span>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDetailBook(book);
                      }}
                      className='min-h-11 px-2 font-semibold text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400'
                    >
                      Open details
                    </button>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(book.id, book.title);
                      }}
                      className='grid min-h-11 min-w-11 place-items-center text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition'
                      aria-label={`Delete ${book.title}`}
                    >
                      <FiTrash2 className='size-3.5' />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: DENSE TABLE VIEW                                       */}
        {/* ============================================================== */}
        {viewMode === 'table' && (
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm dark:shadow-xl'>
            <table className='w-full text-left text-xs'>
              <thead className='border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400'>
                <tr>
                  <th className='p-3.5'>Title & Author</th>
                  <th className='p-3.5'>Genre</th>
                  <th className='p-3.5'>Shelf</th>
                  <th className='p-3.5'>Pages</th>
                  <th className='p-3.5'>Status</th>
                  <th className='p-3.5'>Rating</th>
                  <th className='p-3.5 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800/80 font-sans'>
                {filteredBooks.map((book) => {
                  const totalPages = book.pages || book.totalPages || 300;
                  const progressPct = Math.round(((book.currentPage || 0) / totalPages) * 100);

                  return (
                    <tr
                      key={book.id}
                      onClick={() => setActiveDetailBook(book)}
                      className='hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition'
                    >
                      <td className='p-3.5 font-sans'>
                        <div className='flex items-center gap-2.5'>
                          <div className='size-8 shrink-0 rounded bg-neutral-900 overflow-hidden'>
                            {renderCardCover(book, 'h-8')}
                          </div>
                          <div>
                            <div className='font-bold text-slate-900 dark:text-white line-clamp-1 leading-relaxed'>
                              {book.title}
                            </div>
                            <div className='text-[11px] leading-relaxed text-slate-500 dark:text-slate-400'>
                              {book.author} ({book.publishedYear})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='p-3.5 leading-relaxed text-slate-700 dark:text-slate-300 font-sans'>
                        {book.genre ? book.genre.split(',')[0] : 'General'}
                      </td>
                      <td className='p-3.5 leading-relaxed capitalize text-slate-700 dark:text-slate-300'>
                        {book.shelf}
                      </td>
                      <td className='p-3.5 leading-relaxed'>
                        <span className='text-amber-600 dark:text-amber-400 font-bold'>{totalPages}p</span>
                      </td>
                      <td className='p-3.5'>{renderStatusBadge(book.status)}</td>
                      <td className='p-3.5 text-amber-500 dark:text-amber-400 font-bold'>★ {book.rating}</td>
                      <td className='p-3.5 text-right'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDetailBook(book);
                          }}
                          className='p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                        >
                          <FiExternalLink className='size-4' />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={addModalOpen}
          initialMode='book'
          onClose={() => setAddModalOpen(false)}
          onBookCreated={() => refreshBooks()}
        />

        {/* ============================================================== */}
        {/* STUDIO EDITORIAL MODAL (MATCHED TO REFERENCE IMAGE)            */}
        {/* ============================================================== */}
        {activeDetailBook && (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[15px] dark:bg-black/80'
            onClick={() => setActiveDetailBook(null)}
          >
            <div
              className='relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-300 bg-white shadow-[0_24px_80px_rgba(8,145,178,0.24)] text-left dark:border-neutral-800 dark:bg-[#0d0f12] dark:shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar with Title & Close */}
              <div className='flex items-center justify-between border-b border-cyan-200 px-6 py-4 bg-cyan-50/80 dark:border-neutral-800/80 dark:bg-neutral-950/80'>
                <div className='flex items-center gap-2 text-sm font-semibold text-slate-700 font-sans dark:text-neutral-300'>
                  <FiBookOpen className='size-4 text-cyan-400' />
                  <span>
                    Book Record:{' '}
                    <strong className='text-slate-950 font-sans font-bold dark:text-white'>
                      {activeDetailBook.title}
                    </strong>
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {!detailEditMode ? (
                    <>
                      <button
                        type='button'
                        onClick={() => setDetailEditMode(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shadow-sm shadow-amber-500/30'
                        title='Enable inline editing'
                      >
                        <FiEdit2 className='size-3.5' />
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => router.push(`/admin/books/${activeDetailBook.id}`)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-400 transition shadow-sm shadow-cyan-500/30'
                        title='Open full editor with inline editing'
                      >
                        <FiExternalLink className='size-3.5' />
                        Full Editor
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type='button'
                        onClick={() => {
                          handleDetailSave();
                          setDetailEditMode(false);
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/30'
                        title='Save changes'
                      >
                        <FiCheck className='size-3.5' />
                        Save
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setDetailEditMode(false);
                          refreshBooks();
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-slate-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-400 transition'
                        title='Cancel editing'
                      >
                        <FiX className='size-3.5' />
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    type='button'
                    onClick={() => setActiveDetailBook(null)}
                    className='size-8 rounded-xl bg-white border border-cyan-200 flex items-center justify-center text-slate-500 hover:text-cyan-800 hover:bg-cyan-100 transition dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                  >
                    <FiX className='size-4' />
                  </button>
                </div>
              </div>

              {/* 2-Column Workstation Layout */}
              <div className='p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8'>
                {/* LEFT COLUMN: 3D Hardcover Cover with Glow & Progress Card (4 Cols) */}
                <div className='lg:col-span-4 space-y-6 flex flex-col items-center'>
                  {/* 3D Hardcover with ambient teal glow */}
                  <div className='relative w-64 flex justify-center pt-2' style={{ perspective: '1000px' }}>
                    <div
                      className='w-56 rounded-xl relative overflow-hidden ring-1 ring-white/10 transition-transform duration-500 hover:scale-105'
                      style={{
                        transform: 'rotateY(-14deg) rotateX(4deg)',
                        boxShadow: '-15px 20px 30px rgba(0,0,0,0.7), 0 0 25px rgba(20, 184, 166, 0.25)'
                      }}
                    >
                      {getBookCoverSrc(activeDetailBook) ? (
                        <img
                          src={getBookCoverSrc(activeDetailBook)}
                          alt={activeDetailBook.title}
                          className='w-full h-80 object-cover rounded-xl'
                        />
                      ) : (
                        <div
                          className={`w-full h-80 bg-gradient-to-br ${
                            activeDetailBook.coverColor || 'from-red-900 via-neutral-900 to-black'
                          } p-5 flex flex-col justify-between text-white`}
                        >
                          <div>
                            <span className='text-[10px] font-sans font-bold uppercase tracking-widest text-red-400'>
                              {activeDetailBook.publisher || "O'REILLY"}
                            </span>
                            <h3 className='font-serif text-lg font-bold mt-3 leading-snug'>{activeDetailBook.title}</h3>
                          </div>
                          <div className='text-xs text-white/70 font-sans font-medium'>{activeDetailBook.author}</div>
                        </div>
                      )}
                      <div className='pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-xl bg-gradient-to-r from-white/20 via-black/30 to-black/70' />
                    </div>
                  </div>

                  {/* Cover Image Editor */}
                  {detailEditMode && (
                    <div className='w-full space-y-3'>
                      <InlineImageEditor
                        value={activeDetailBook.coverUrl || activeDetailBook.coverImage || ''}
                        onSave={async (val) => {
                          const updated = { ...activeDetailBook, coverUrl: val, coverImage: val };
                          setActiveDetailBook(updated);
                        }}
                      />
                    </div>
                  )}

                  {/* Reading Telemetry Gauge Card */}
                  <div className='w-full rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 space-y-3 dark:border-neutral-800 dark:bg-neutral-900/60'>
                    <div className='flex justify-between text-xs font-sans font-semibold leading-relaxed'>
                      <span className='text-slate-700 font-bold dark:text-neutral-300'>
                        {activeDetailBook.currentPage || 0}/
                        {activeDetailBook.pages || activeDetailBook.totalPages || 300} pages
                      </span>
                      <span className='text-cyan-400 font-bold'>
                        {Math.round(
                          ((activeDetailBook.currentPage || 0) /
                            (activeDetailBook.pages || activeDetailBook.totalPages || 300)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className='h-2 w-full rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:bg-neutral-950 dark:border-neutral-800'>
                      <div
                        className='h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]'
                        style={{
                          width: `${Math.round(
                            ((activeDetailBook.currentPage || 0) /
                              (activeDetailBook.pages || activeDetailBook.totalPages || 300)) *
                              100
                          )}%`
                        }}
                      />
                    </div>
                    <div className='flex items-center justify-between pt-1'>
                      <div className='flex items-center gap-1 text-amber-400 text-xs'>
                        <FiStar className='size-3.5 fill-amber-400' />
                        <FiStar className='size-3.5 fill-amber-400' />
                        <FiStar className='size-3.5 fill-amber-400' />
                        <FiStar className='size-3.5 fill-amber-400' />
                        <FiStar className='size-3.5 fill-amber-400' />
                      </div>
                      {renderStatusBadge(activeDetailBook.status)}
                    </div>

                    {/* Quick Status Toggles */}
                    <div className='pt-2 border-t border-cyan-200 flex items-center justify-between gap-1 dark:border-neutral-800/80'>
                      {[
                        { id: 'queued', label: 'Queued' },
                        { id: 'reading', label: 'Reading' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'reference', label: 'Reference' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type='button'
                          onClick={() => handleUpdateBookStatus(activeDetailBook.id, st.id)}
                          className={`h-[18px] inline-flex items-center px-2 rounded-md text-[10px] font-sans font-semibold leading-normal transition ${
                            activeDetailBook.status === st.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                              : 'text-slate-500 hover:text-cyan-800 hover:bg-cyan-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-800/50'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Metadata, 2x2 Grid, Quote & Similar Books (8 Cols) */}
                <div className='lg:col-span-8 space-y-6'>
                  {/* Title & Author Byline */}
                  <div>
                    {detailEditMode ? (
                      <div className='space-y-3'>
                        <InlineText
                          value={activeDetailBook.title || ''}
                          onChange={(val) => {
                            const updated = { ...activeDetailBook, title: val };
                            setActiveDetailBook(updated);
                          }}
                          placeholder='Book title'
                          className='font-serif text-3xl font-extrabold text-slate-950 tracking-tight leading-snug dark:text-white'
                        />
                        <div className='flex items-center gap-3'>
                          <InlineText
                            value={activeDetailBook.author || ''}
                            onChange={(val) => {
                              const updated = { ...activeDetailBook, author: val };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Author name'
                            className='text-sm leading-relaxed text-slate-600 font-medium dark:text-neutral-400 flex-1'
                          />
                          <InlineText
                            value={String(activeDetailBook.publishedYear || '')}
                            onChange={(val) => {
                              const year = val ? parseInt(val, 10) : null;
                              const updated = { ...activeDetailBook, publishedYear: year };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Year'
                            type='number'
                            className='text-sm leading-relaxed text-slate-600 font-medium dark:text-neutral-400 w-24'
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className='font-serif text-3xl font-extrabold text-slate-950 tracking-tight leading-snug dark:text-white'>
                          {activeDetailBook.title}
                        </h2>
                        <p className='text-sm leading-relaxed text-slate-600 mt-1 font-medium dark:text-neutral-400'>
                          by <strong className='text-slate-950 dark:text-white'>{activeDetailBook.author}</strong>{' '}
                          {activeDetailBook.publishedYear ? `(${activeDetailBook.publishedYear})` : ''}
                        </p>
                      </>
                    )}

                    {/* Meta Tags Ribbon */}
                    <div className='flex flex-wrap items-center gap-2 pt-2.5 text-xs font-sans'>
                      {detailEditMode ? (
                        <div className='flex flex-wrap items-center gap-2 w-full'>
                          <InlineText
                            value={activeDetailBook.language || 'English'}
                            onChange={(val) => {
                              const updated = { ...activeDetailBook, language: val };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Language'
                            className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'
                          />
                          <InlineText
                            value={activeDetailBook.publisher || "O'Reilly"}
                            onChange={(val) => {
                              const updated = { ...activeDetailBook, publisher: val };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Publisher'
                            className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'
                          />
                          <InlineText
                            value={activeDetailBook.format || ''}
                            onChange={(val) => {
                              const updated = { ...activeDetailBook, format: val };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Format'
                            className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'
                          />
                          <InlineText
                            value={activeDetailBook.location || ''}
                            onChange={(val) => {
                              const updated = { ...activeDetailBook, location: val };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Location'
                            className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'
                          />
                          <InlineTagList
                            tags={(activeDetailBook.genre || 'Distributed Systems, Database Internals')
                              .split(',')
                              .map((g) => g.trim())}
                            onSave={(val) => {
                              const updated = { ...activeDetailBook, genre: val.join(', ') };
                              setActiveDetailBook(updated);
                            }}
                            placeholder='Add genre...'
                            icon={FiBookOpen}
                            accentColor='cyan'
                          />
                        </div>
                      ) : (
                        <>
                          <span className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'>
                            <FiGlobe className='size-3.5 text-neutral-500' /> {activeDetailBook.language || 'English'}
                          </span>
                          <span className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'>
                            <FiMapPin className='size-3.5 text-neutral-500' />{' '}
                            {activeDetailBook.publisher || "O'Reilly"}
                          </span>
                          {activeDetailBook.format && (
                            <span className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'>
                              <FiBookOpen className='size-3.5 text-neutral-500' /> {activeDetailBook.format}
                            </span>
                          )}
                          {activeDetailBook.location && (
                            <span className='inline-flex items-center gap-1 text-slate-700 dark:text-neutral-300'>
                              <FiMapPin className='size-3.5 text-neutral-500' /> {activeDetailBook.location}
                            </span>
                          )}
                          <span className='text-slate-500 dark:text-neutral-500'>Genre:</span>
                          {(activeDetailBook.genre || 'Distributed Systems, Database Internals')
                            .split(',')
                            .map((g, idx) => (
                              <span
                                key={idx}
                                className='h-[18px] inline-flex items-center px-2 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-800 text-[10px] font-sans font-semibold leading-none dark:bg-neutral-900 dark:border-cyan-500/30 dark:text-cyan-300'
                              >
                                {g.trim()}
                              </span>
                            ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description Card - Full Width */}
                  <div className='rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-2 dark:border-neutral-800 dark:bg-neutral-900/50'>
                    <h4 className='text-xs font-bold font-sans text-slate-700 uppercase tracking-wider dark:text-neutral-300'>
                      Description
                    </h4>
                    {detailEditMode ? (
                      <InlineText
                        value={activeDetailBook.description || ''}
                        onChange={(val) => {
                          const updated = { ...activeDetailBook, description: val };
                          setActiveDetailBook(updated);
                        }}
                        placeholder='Book description...'
                        multiline
                        rows={4}
                        className='text-sm leading-relaxed text-slate-700 dark:text-neutral-300'
                      />
                    ) : (
                      <p className='text-sm leading-relaxed text-slate-700 dark:text-neutral-300'>
                        {activeDetailBook.description ||
                          'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems. Understand the trade-offs of using distributed systems, databases, and message brokers.'}
                      </p>
                    )}
                  </div>

                  {/* Target Audience & Key Themes Side by Side */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Target Audience Card */}
                    <div className='rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 dark:border-neutral-800 dark:bg-neutral-900/50'>
                      <h4 className='text-xs font-bold font-sans text-slate-700 uppercase tracking-wider dark:text-neutral-300'>
                        Target Audience
                      </h4>
                      {detailEditMode ? (
                        <InlineTagList
                          tags={
                            activeDetailBook.targetAudience || [
                              'Software Engineers',
                              'Architects',
                              'DevOps Engineers',
                              'Technical Leaders'
                            ]
                          }
                          onSave={(val) => {
                            const updated = { ...activeDetailBook, targetAudience: val };
                            setActiveDetailBook(updated);
                          }}
                          placeholder='Add audience...'
                          icon={FiUserCheck}
                          accentColor='amber'
                          display='list'
                        />
                      ) : (
                        <div className='space-y-1.5'>
                          {Array.isArray(activeDetailBook.targetAudience) && activeDetailBook.targetAudience.length > 0
                            ? activeDetailBook.targetAudience.map((aud, i) => (
                                <p
                                  key={i}
                                  className='text-[12px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-2'
                                >
                                  <FiUserCheck className='size-4 text-amber-400 shrink-0' /> {aud}
                                </p>
                              ))
                            : ['Software Engineers', 'Architects', 'DevOps Engineers', 'Technical Leaders'].map(
                                (aud, i) => (
                                  <p
                                    key={i}
                                    className='text-[12px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-2'
                                  >
                                    <FiUserCheck className='size-4 text-amber-400 shrink-0' /> {aud}
                                  </p>
                                )
                              )}
                        </div>
                      )}
                    </div>

                    {/* Key Themes Card */}
                    <div className='rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-2 dark:border-neutral-800 dark:bg-neutral-900/50'>
                      <h4 className='text-xs font-bold font-sans text-slate-700 uppercase tracking-wider dark:text-neutral-300'>
                        Key Themes
                      </h4>
                      {detailEditMode ? (
                        <InlineTagList
                          tags={
                            activeDetailBook.keyThemes || [
                              'Replication',
                              'Partitioning',
                              'Consensus',
                              'Consistency Models',
                              'Scalability',
                              'Fault Tolerance',
                              'Stream Processing'
                            ]
                          }
                          onSave={(val) => {
                            const updated = { ...activeDetailBook, keyThemes: val };
                            setActiveDetailBook(updated);
                          }}
                          placeholder='Add theme...'
                          icon={FiTag}
                          accentColor='cyan'
                          display='list'
                        />
                      ) : (
                        <div className='space-y-1.5'>
                          {Array.isArray(activeDetailBook.keyThemes) && activeDetailBook.keyThemes.length > 0
                            ? activeDetailBook.keyThemes.map((th, i) => (
                                <p
                                  key={i}
                                  className='text-[12px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-2'
                                >
                                  <FiTag className='size-4 text-cyan-400 shrink-0' /> {th}
                                </p>
                              ))
                            : [
                                'Replication',
                                'Partitioning',
                                'Consensus',
                                'Consistency Models',
                                'Scalability',
                                'Fault Tolerance',
                                'Stream Processing'
                              ].map((th, i) => (
                                <p
                                  key={i}
                                  className='text-[12px] leading-relaxed text-slate-700 dark:text-neutral-300 flex items-center gap-2'
                                >
                                  <FiTag className='size-4 text-cyan-400 shrink-0' /> {th}
                                </p>
                              ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notable Quote Banner with Speech Bubble */}
                  <div className='space-y-2'>
                    {detailEditMode ? (
                      <InlineQuoteList
                        quotes={activeDetailBook.notableQuotes || activeDetailBook.quotes || []}
                        onSave={(val) => {
                          const updated = { ...activeDetailBook, notableQuotes: val, quotes: val };
                          setActiveDetailBook(updated);
                        }}
                        placeholder='Add a notable quote...'
                      />
                    ) : (
                      (() => {
                        const quoteText =
                          (activeDetailBook.notableQuotes && activeDetailBook.notableQuotes[0]) ||
                          (activeDetailBook.quotes && activeDetailBook.quotes[0]) ||
                          'A fundamental principle is that the quality of an architecture must be evaluated on its own merits, not on the buzzwords associated with it.';

                        return (
                          <>
                            <button
                              type='button'
                              onClick={() => handleCopyQuote(quoteText)}
                              className='w-full flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 border border-teal-300 text-xs font-bold text-teal-800 hover:border-teal-500 transition group dark:bg-gradient-to-r dark:from-teal-950/60 dark:via-neutral-900 dark:to-neutral-900 dark:border-teal-500/30 dark:text-teal-300'
                            >
                              <span className='flex items-center gap-2'>
                                <span className='text-amber-400 font-serif font-black text-sm'>❝</span> Notable Quote
                              </span>
                              <span className='text-teal-700 group-hover:text-teal-950 transition flex items-center gap-1 text-[11px] dark:text-neutral-500 dark:group-hover:text-white'>
                                {copiedQuote ? 'Copied!' : 'Copy Quote'} <FiChevronRight className='size-3.5' />
                              </span>
                            </button>

                            {/* Speech Bubble Display */}
                            <div className='p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs italic font-serif text-slate-700 leading-relaxed dark:bg-teal-950/30 dark:border-teal-500/20 dark:text-neutral-200'>
                              {quoteText} —{' '}
                              <span className='font-sans font-semibold text-[11px] text-teal-400 not-italic'>
                                {activeDetailBook.author}
                              </span>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>

                  {/* Similar Books Carousel Row */}
                  <div className='border-t border-slate-200 pt-4 space-y-3 dark:border-neutral-800'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold font-sans text-neutral-400 uppercase tracking-wider'>
                        Similar Books
                      </span>
                      <div className='flex items-center gap-1 text-neutral-400'>
                        {!detailEditMode && (
                          <>
                            <button
                              type='button'
                              className='size-6 rounded-lg bg-neutral-900 flex items-center justify-center hover:text-white border border-neutral-800'
                            >
                              <FiChevronLeft className='size-3.5' />
                            </button>
                            <button
                              type='button'
                              className='size-6 rounded-lg bg-neutral-900 flex items-center justify-center hover:text-white border border-neutral-800'
                            >
                              <FiChevronRight className='size-3.5' />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {detailEditMode ? (
                      <div className='space-y-2'>
                        {(activeDetailBook.similarBooks || []).map((simTitle, idx) => (
                          <SimilarBookCard
                            key={idx}
                            title={simTitle}
                            idx={idx}
                            onSave={async (v) => {
                              const next = (activeDetailBook.similarBooks || [])
                                .map((s, j) => (j === idx ? v : s))
                                .filter(Boolean);
                              const updated = { ...activeDetailBook, similarBooks: next };
                              setActiveDetailBook(updated);
                            }}
                            onRemove={async () => {
                              const next = (activeDetailBook.similarBooks || []).filter((_, j) => j !== idx);
                              const updated = { ...activeDetailBook, similarBooks: next };
                              setActiveDetailBook(updated);
                            }}
                          />
                        ))}
                        <button
                          type='button'
                          onClick={() => {
                            const next = [...(activeDetailBook.similarBooks || []), ''];
                            const updated = { ...activeDetailBook, similarBooks: next };
                            setActiveDetailBook(updated);
                          }}
                          className='inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 hover:border-amber-500/50 hover:text-amber-400 dark:border-slate-600 dark:text-slate-400 dark:hover:border-amber-500/50 dark:hover:text-amber-400 transition-colors'
                        >
                          <FiPlus className='size-3.5' /> Add Similar Book
                        </button>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        {Array.isArray(activeDetailBook.similarBooks) && activeDetailBook.similarBooks.length > 0 ? (
                          activeDetailBook.similarBooks.slice(0, 2).map((sim, i) => (
                            <div
                              key={i}
                              className='flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 transition dark:bg-neutral-900/60 dark:border-neutral-800 dark:hover:border-neutral-700'
                            >
                              <div className='size-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center font-bold text-amber-600 text-xs shrink-0 dark:bg-neutral-950 dark:border-neutral-800 dark:text-amber-400'>
                                📖
                              </div>
                              <div className='min-w-0 flex-1 leading-relaxed'>
                                <h5 className='text-xs font-bold text-slate-900 truncate dark:text-white'>{sim}</h5>
                                <p className='text-[10px] leading-relaxed text-slate-500 truncate dark:text-neutral-400'>
                                  Recommended Architecture
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className='flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 transition dark:bg-neutral-900/60 dark:border-neutral-800 dark:hover:border-neutral-700'>
                              <div className='size-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center font-bold text-amber-600 text-xs shrink-0 dark:bg-neutral-950 dark:border-neutral-800 dark:text-amber-400'>
                                📖
                              </div>
                              <div className='min-w-0 flex-1 leading-relaxed'>
                                <h5 className='text-xs font-bold text-slate-900 truncate dark:text-white'>
                                  The Pragmatic Programmer
                                </h5>
                                <p className='text-[10px] leading-relaxed text-slate-500 truncate dark:text-neutral-400'>
                                  by David Thomas & Andrew Hunt
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 transition dark:bg-neutral-900/60 dark:border-neutral-800 dark:hover:border-neutral-700'>
                              <div className='size-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center font-bold text-amber-600 text-xs shrink-0 dark:bg-neutral-950 dark:border-neutral-800 dark:text-amber-400'>
                                📖
                              </div>
                              <div className='min-w-0 flex-1 leading-relaxed'>
                                <h5 className='text-xs font-bold text-slate-900 truncate dark:text-white'>
                                  Database Internals
                                </h5>
                                <p className='text-[10px] leading-relaxed text-slate-500 truncate dark:text-neutral-400'>
                                  by Alex Petrov
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
    console.error('Failed to get session on /admin/books:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default BooksPage;
