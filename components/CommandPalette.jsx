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
    {
      title: 'Go to Home',
      type: 'Navigation',
      icon: FaHome,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      run: () => router.push('/')
    },
    {
      title: 'About Me',
      type: 'Navigation',
      icon: FaUser,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      run: () => router.push('/about-me')
    },
    {
      title: 'Contact Form',
      type: 'Navigation',
      icon: FaEnvelope,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      run: () => router.push('/contact')
    },
    {
      title: 'Switch to English',
      type: 'Setting',
      icon: FaLanguage,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      run: () => setLocale('en')
    },
    {
      title: 'Switch to German (Deutsch)',
      type: 'Setting',
      icon: FaLanguage,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      run: () => setLocale('de')
    }
  ];

  const articleActions = sampleArticles.map((art) => ({
    title: art.title,
    type: 'Article',
    icon: FaFileAlt,
    color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    run: () => router.push(`/blog/${art.slug}`)
  }));

  const allActions = [...pageActions, ...articleActions];
  const filtered = allActions.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 p-4 pt-20 backdrop-blur-[2px] animate-in fade-in duration-150'>
      <div className='w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-900/98 shadow-[0_0_40px_rgba(16,185,129,0.2)]'>
        {/* Glowing Search Bar */}
        <div className='border-b border-slate-800 bg-slate-950/70 p-3'>
          <div className='relative flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-slate-950/90 px-3.5 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.22)] transition-all duration-200 focus-within:border-emerald-400 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.4)]'>
            <span className='grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'>
              <FaSearch className='size-3 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' />
            </span>
            <input
              type='text'
              autoFocus
              placeholder='Search articles, pages, or commands (ESC to close)...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full !border-0 !border-none bg-transparent font-Monda text-sm font-medium text-slate-100 placeholder-slate-400 !outline-none !ring-0 !shadow-none focus:!border-0 focus:!border-none focus:!outline-none focus:!ring-0'
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                className='rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-700'
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <ul className='m-0 max-h-80 list-none overflow-y-auto p-2.5 space-y-1'>
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
                  className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-800/70'
                >
                  <div className='flex items-center min-w-0 pr-2 gap-3'>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${action.color}`}>
                      <Icon className='size-3.5 drop-shadow-[0_0_4px_currentColor]' />
                    </span>
                    <span className='truncate text-xs font-semibold text-slate-100'>{action.title}</span>
                  </div>
                  <span className='shrink-0 rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400 border border-slate-700'>
                    {action.type}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <p className='p-6 text-center text-xs text-slate-400'>No matching articles or commands found.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
