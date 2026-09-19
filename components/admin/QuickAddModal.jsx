import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FiX, FiBookOpen, FiTrello, FiEdit3, FiCheck } from 'react-icons/fi';
import { createBook, BOOK_SHELVES } from '@utils/books/bookService';

export const QuickAddModal = ({ isOpen, initialMode = 'issue', onClose, onBookCreated }) => {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode || 'issue');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Book Form State
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookShelf, setBookShelf] = useState('technical');
  const [bookTotalPages, setBookTotalPages] = useState('320');
  const [bookCurrentPage, setBookCurrentPage] = useState('0');
  const [bookRating, setBookRating] = useState('5');
  const [bookNotes, setBookNotes] = useState('');

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
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleCreateBook = (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    setLoading(true);
    try {
      const created = createBook({
        title: bookTitle,
        author: bookAuthor,
        shelf: bookShelf,
        totalPages: Number(bookTotalPages),
        currentPage: Number(bookCurrentPage),
        rating: Number(bookRating),
        notes: bookNotes
      });

      setSuccessMessage(`"${created.title}" added to your ${bookShelf} shelf!`);
      onBookCreated?.(created);
      setTimeout(() => {
        onClose();
        router.push(`/admin/books?shelf=${bookShelf}`);
      }, 700);
    } catch (err) {
      console.error(err);
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

            <div>
              <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'>
                Personal Notes / Takeaways
              </label>
              <textarea
                rows={3}
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
