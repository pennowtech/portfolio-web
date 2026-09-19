import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@components/admin/AdminLayout';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';
import { FiEdit3, FiTrello, FiBookOpen, FiArrowRight, FiStar, FiBookmark, FiZap, FiActivity } from 'react-icons/fi';
import { getStoredBooks } from '@utils/books/bookService';

const AdminDashboardPage = ({ adminEmail }) => {
  const [books, setBooks] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBooks(getStoredBooks());
  }, []);

  const currentlyReading = books.filter((b) => b.status === 'reading');
  const completedBooks = books.filter((b) => b.status === 'completed');
  const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);

  return (
    <AdminLayout
      adminEmail={adminEmail}
      title='Command Center | SinghBuildsTech Admin'
      description='Central administration hub for Articles, Issueboard, and Book Records.'
    >
      <div className='mx-auto max-w-6xl p-6 sm:p-8 space-y-8'>
        {/* Welcome Banner */}
        <div className='relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-6 shadow-xl'>
          <div className='relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20'>
                  <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse' />
                  Admin Command Cockpit
                </span>
              </div>
              <h1 className='mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl'>
                Welcome Back, {adminEmail?.split('@')[0] || 'Sukhdeep'}!
              </h1>
              <p className='mt-1 text-xs text-slate-400 max-w-xl'>
                Unified workspace managing your writing studio, software project issueboards, and personal reading
                catalog.
              </p>
            </div>

            {/* Quick System Status Pill */}
            <div className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs font-mono'>
              <div className='text-right'>
                <div className='text-slate-400 text-[10px] uppercase'>Workspace</div>
                <div className='text-emerald-400 font-bold'>SinghBuildsTech v0.5.4</div>
              </div>
              <div className='size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-emerald-400'>
                <FiZap className='size-4' />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Domain Hero Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          {/* Card 1: Articles Studio */}
          <Link
            href='/admin/articles/new'
            className='group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-emerald-950/20'
          >
            <div>
              <div className='flex items-center justify-between'>
                <span className='grid size-10 place-items-center rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 shadow-inner'>
                  <FiEdit3 className='size-5' />
                </span>
                <span className='rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/40'>
                  Notion Sync Ready
                </span>
              </div>
              <h2 className='mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition'>
                Articles Studio
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Author, preview, and publish technical deep-dives and essays with custom markdown components.
              </p>
            </div>

            <div className='mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-semibold text-emerald-400'>
              <span>Write Article</span>
              <FiArrowRight className='size-3.5 group-hover:translate-x-1 transition' />
            </div>
          </Link>

          {/* Card 2: Issueboard Workspace */}
          <Link
            href='/admin/issues'
            className='group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-950/20'
          >
            <div>
              <div className='flex items-center justify-between'>
                <span className='grid size-10 place-items-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 shadow-inner'>
                  <FiTrello className='size-5' />
                </span>
                <span className='rounded-full bg-cyan-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800/40'>
                  PORT & LEM Projects
                </span>
              </div>
              <h2 className='mt-4 text-base font-bold text-white group-hover:text-cyan-300 transition'>
                Issueboard Workspace
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Full sprint board, backlog reservoir, parent-child triage, reports, and external API webhook bridge.
              </p>
            </div>

            <div className='mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-semibold text-cyan-400'>
              <span>Open Sprint Board</span>
              <FiArrowRight className='size-3.5 group-hover:translate-x-1 transition' />
            </div>
          </Link>

          {/* Card 3: Books & Library Records */}
          <Link
            href='/admin/books'
            className='group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-amber-950/20'
          >
            <div>
              <div className='flex items-center justify-between'>
                <span className='grid size-10 place-items-center rounded-xl bg-amber-950/80 text-amber-400 border border-amber-700/50 shadow-inner'>
                  <FiBookOpen className='size-5' />
                </span>
                <span className='rounded-full bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800/40'>
                  {completedBooks.length} Read • {currentlyReading.length} Active
                </span>
              </div>
              <h2 className='mt-4 text-base font-bold text-white group-hover:text-amber-300 transition'>
                Book Records & Library
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Personal library catalog, reading progress tracking, shelves, quotes, and mental models.
              </p>
            </div>

            <div className='mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-semibold text-amber-400'>
              <span>Browse Catalog</span>
              <FiArrowRight className='size-3.5 group-hover:translate-x-1 transition' />
            </div>
          </Link>
        </div>

        {/* Reading Spotlight & Quick Shelf View */}
        {mounted && currentlyReading.length > 0 && (
          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-5'>
              <div className='flex items-center gap-2'>
                <FiBookmark className='size-4 text-amber-400' />
                <h3 className='text-sm font-bold uppercase tracking-wider text-slate-200'>
                  Currently Reading Spotlight
                </h3>
              </div>
              <Link
                href='/admin/books?shelf=reading'
                className='text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1'
              >
                View all reading ({currentlyReading.length}) <FiArrowRight className='size-3' />
              </Link>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {currentlyReading.slice(0, 3).map((book) => {
                const pct = Math.round((book.currentPage / book.totalPages) * 100);
                return (
                  <div
                    key={book.id}
                    className='relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-slate-700'
                  >
                    <div>
                      <div className='flex items-start justify-between gap-2'>
                        <span className='rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-700'>
                          {book.shelf}
                        </span>
                        <div className='flex items-center text-amber-400 text-xs gap-0.5'>
                          <FiStar className='size-3 fill-amber-400' />
                          <span className='font-mono font-bold'>{book.rating}</span>
                        </div>
                      </div>
                      <h4 className='mt-2.5 text-xs font-bold text-slate-100 line-clamp-1'>{book.title}</h4>
                      <p className='text-[11px] text-slate-400'>by {book.author}</p>
                    </div>

                    <div className='mt-4'>
                      <div className='flex justify-between text-[10px] font-mono text-slate-400 mb-1'>
                        <span>Progress</span>
                        <span className='text-emerald-400 font-bold'>
                          {pct}% ({book.currentPage}/{book.totalPages}p)
                        </span>
                      </div>
                      <div className='h-1.5 w-full rounded-full bg-slate-800 overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400'
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Telemetry Summary Bar */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center'>
            <div className='text-xl font-black text-white font-mono'>{books.length}</div>
            <div className='text-[11px] text-slate-400 font-medium'>Books Cataloged</div>
          </div>
          <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center'>
            <div className='text-xl font-black text-emerald-400 font-mono'>{completedBooks.length}</div>
            <div className='text-[11px] text-slate-400 font-medium'>Books Finished</div>
          </div>
          <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center'>
            <div className='text-xl font-black text-cyan-400 font-mono'>{totalPagesRead.toLocaleString()}</div>
            <div className='text-[11px] text-slate-400 font-medium'>Pages Ingested</div>
          </div>
          <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center'>
            <div className='text-xl font-black text-amber-400 font-mono'>2</div>
            <div className='text-[11px] text-slate-400 font-medium'>Active Projects (PORT, LEM)</div>
          </div>
        </div>
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
    console.error('Failed to get session on /admin:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default AdminDashboardPage;
