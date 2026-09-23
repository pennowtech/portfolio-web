import React, { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiKey, FiSettings, FiX } from 'react-icons/fi';
import { loadBookSettings, saveBookSettings, DEFAULT_BOOK_SETTINGS } from '@utils/books/bookSettingsStore';

export const BookShelfSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(DEFAULT_BOOK_SETTINGS);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSettings(loadBookSettings());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveBookSettings(settings);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='book-settings-title'
      >
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <div className='flex items-center gap-2.5'>
            <div className='grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'>
              <FiSettings className='size-4' />
            </div>
            <div>
              <h3 id='book-settings-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
                Book Shelf Settings
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>Google Books lookup configuration</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close book shelf settings'
          >
            <FiX className='size-4' />
          </button>
        </div>

        <div className='p-4 space-y-3 text-xs'>
          <div>
            <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>Google Books API Key</label>
            <div className='relative'>
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.googleBooksApiKey}
                onChange={(e) => setSettings((p) => ({ ...p, googleBooksApiKey: e.target.value }))}
                placeholder='Optional -- raises the free lookup quota'
                className='w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-900 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              />
              <FiKey className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
              <button
                type='button'
                onClick={() => setShowKey((v) => !v)}
                className='absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              >
                {showKey ? <FiEyeOff className='size-3.5' /> : <FiEye className='size-3.5' />}
              </button>
            </div>
            <p className='mt-1.5 text-[11px] text-slate-400'>
              AI Autofill and metadata import use Google Books&apos; free API to look up books by title, author, or
              ISBN. Anonymous requests share a low daily quota; adding a free key from the{' '}
              <a
                href='https://console.cloud.google.com/apis/library/books.googleapis.com'
                target='_blank'
                rel='noreferrer'
                className='underline hover:text-amber-600 dark:hover:text-amber-400'
              >
                Google Cloud Console
              </a>{' '}
              raises that quota substantially. Stored only in this browser, sent with each lookup request.
            </p>
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-500'
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookShelfSettingsModal;
