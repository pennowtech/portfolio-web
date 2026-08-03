import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { MdLanguage } from 'react-icons/md';

const LanguageSwitcher = ({ className = '' }) => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`flex items-center gap-1 font-Rajdhani font-semibold text-sm ${className}`}>
      <MdLanguage aria-hidden='true' className='text-xl text-slate-600 dark:text-slate-300' />
      <button
        type='button'
        onClick={() => setLocale('en')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === 'en'
            ? 'bg-orange-500 text-white dark:bg-orange-600'
            : 'text-slate-600 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400'
        }`}
        aria-label='Switch to English'
      >
        EN
      </button>
      <span className='text-slate-400 dark:text-slate-600'>|</span>
      <button
        type='button'
        onClick={() => setLocale('de')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === 'de'
            ? 'bg-orange-500 text-white dark:bg-orange-600'
            : 'text-slate-600 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400'
        }`}
        aria-label='Switch to German'
      >
        DE
      </button>
    </div>
  );
};

export default LanguageSwitcher;
