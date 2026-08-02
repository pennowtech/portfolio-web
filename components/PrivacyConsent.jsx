import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OPEN_PRIVACY_SETTINGS_EVENT, readPrivacyConsent, savePrivacyConsent } from '@utils/privacyConsent';

const PrivacyConsent = () => {
  const analyticsAvailable = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (analyticsAvailable && !readPrivacyConsent()) setIsOpen(true);
    const openSettings = () => setIsOpen(true);
    window.addEventListener(OPEN_PRIVACY_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_PRIVACY_SETTINGS_EVENT, openSettings);
  }, [analyticsAvailable]);

  if (!analyticsAvailable || !isOpen) return null;

  const choose = (analytics) => {
    savePrivacyConsent(analytics);
    setIsOpen(false);
  };

  return (
    <aside
      aria-label='Privacy preferences'
      className='fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-xl border border-slate-300 bg-white p-5 shadow-2xl dark:border-slate-600 dark:bg-slate-800 sm:inset-x-6 sm:p-6'
    >
      <h2 className='mb-2 font-Neuton text-2xl font-semibold'>Your privacy choice</h2>
      <p className='mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-200'>
        Essential storage keeps your theme and privacy choice. Optional Google Analytics is disabled unless you accept
        it. Read the{' '}
        <Link href='/privacy' className='text-green-700 underline dark:text-green-400'>
          privacy policy
        </Link>
        .
      </p>
      <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
        <button
          type='button'
          onClick={() => choose(false)}
          className='min-h-11 rounded-lg border border-slate-400 px-5 py-2 font-Monda text-sm font-bold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:hover:bg-slate-700'
        >
          Essential only
        </button>
        <button
          type='button'
          onClick={() => choose(true)}
          className='min-h-11 rounded-lg bg-green-700 px-5 py-2 font-Monda text-sm font-bold text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:bg-green-600'
        >
          Accept analytics
        </button>
      </div>
    </aside>
  );
};

export default PrivacyConsent;
