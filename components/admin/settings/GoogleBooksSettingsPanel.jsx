import React, { useEffect, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { loadBookSettings, saveBookSettings, DEFAULT_BOOK_SETTINGS } from '@utils/books/bookSettingsStore';

// The Google Books lookup key form, shared by the standalone
// BookShelfSettingsModal and as a tab of the common SettingsModal.
export const GoogleBooksSettingsPanel = ({ onSaved }) => {
  const [settings, setSettings] = useState(DEFAULT_BOOK_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setSettings(loadBookSettings());
  }, []);

  const handleSave = () => {
    saveBookSettings(settings);
    onSaved?.(settings);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto p-4 space-y-3 text-xs'>
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
            AI Autofill and metadata import use Google Books&apos; free API to look up books by title, author, or ISBN.
            Anonymous requests share a low daily quota; adding a free key from the{' '}
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

      <div className='flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
        <button
          type='button'
          onClick={handleSave}
          className='inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-500'
        >
          {savedFlash ? (
            <>
              <FiCheck className='size-3.5' /> Saved
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
};

export default GoogleBooksSettingsPanel;
