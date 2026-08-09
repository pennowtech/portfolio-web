import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../utils/LanguageContext';
import { FaSearch, FaHome, FaUser, FaEnvelope, FaLanguage, FaFileAlt } from 'react-icons/fa';

const sampleArticles = [
  {
    title: 'Designing for Partial Failure: What Resilient Systems Do Differently',
    slug: 'designing-for-partial-failure-what-resilient-systems-do-differently'
  },
  {
    title: 'Architecture Decision Records That Engineers Will Actually Read',
    slug: 'architecture-decision-records-that-engineers-will-actually-read'
  },
  {
    title: 'Discover the Wonders of Qt: Unleash Your Potential',
    slug: 'discover-the-wonders-of-qt-unleash-your-potential-in-crossplatform-development-2'
  },
  {
    title: 'Mastering QML with Qt: A Step-by-Step Guide',
    slug: 'mastering-qml-with-qt-a-charming-stepbystep-guide-for-beginners-1'
  },
  {
    title: 'Introduction to Dart Programming for Flutter Beginners',
    slug: 'introduction-to-dart-programming-for-flutter-beginners-1'
  },
  {
    title: 'The Power of Builder Design Pattern',
    slug: 'the-power-of-builder-design-pattern-how-to-create-complex-objects-with-ease'
  }
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { setLocale } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const pageActions = [
    { title: 'Go to Home', type: 'Navigation', icon: FaHome, run: () => router.push('/') },
    { title: 'About Me', type: 'Navigation', icon: FaUser, run: () => router.push('/about-me') },
    { title: 'Contact Form', type: 'Navigation', icon: FaEnvelope, run: () => router.push('/contact') },
    { title: 'Switch to English', type: 'Setting', icon: FaLanguage, run: () => setLocale('en') },
    { title: 'Switch to German (Deutsch)', type: 'Setting', icon: FaLanguage, run: () => setLocale('de') }
  ];

  const articleActions = sampleArticles.map((art) => ({
    title: art.title,
    type: 'Article',
    icon: FaFileAlt,
    run: () => router.push(`/blog/${art.slug}`)
  }));

  const allActions = [...pageActions, ...articleActions];
  const filtered = allActions.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm'>
      <div className='w-full max-w-lg overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
        <div className='flex items-center border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <FaSearch className='mr-3 text-slate-500 dark:text-slate-400' />
          <input
            type='text'
            autoFocus
            placeholder='Search articles, pages, or commands (ESC to close)...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full bg-transparent font-Monda text-sm outline-none dark:text-white'
          />
        </div>
        <ul className='m-0 max-h-80 list-none overflow-y-auto p-2'>
          {filtered.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.title}>
                <button
                  type='button'
                  onClick={() => {
                    action.run();
                    setIsOpen(false);
                  }}
                  className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-Monda text-sm font-semibold text-slate-700 hover:bg-orange-500/10 hover:text-orange-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-orange-400'
                >
                  <div className='flex items-center min-w-0 pr-2'>
                    <Icon className='mr-3 shrink-0 text-base' />
                    <span className='truncate text-left'>{action.title}</span>
                  </div>
                  <span className='shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
                    {action.type}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <p className='p-4 text-center text-xs text-slate-500 dark:text-slate-400'>
              No matching articles or commands found.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
