import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@components/admin/AdminLayout';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';
import {
  FiEdit3,
  FiTrello,
  FiBookOpen,
  FiArrowRight,
  FiChevronRight,
  FiMoreHorizontal,
  FiZap,
  FiActivity,
  FiPlus,
  FiFolder
} from 'react-icons/fi';
import { getStoredBooks } from '@utils/books/bookService';

// Seed showcase books matching Artefact 2
const SHOWCASE_BOOKS = [
  {
    id: 'b-pragmatic',
    title: 'The Pragmatic Programmer',
    shelf: 'Tech',
    shelfKey: 'technical',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-emerald-800 to-slate-950',
    spineBg: 'bg-emerald-950',
    titleColor: 'text-emerald-300',
    progress: 100,
    progressColor: 'bg-emerald-400'
  },
  {
    id: 'b-sapiens',
    title: 'Sapiens',
    shelf: 'Philosophy',
    shelfKey: 'philosophy',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-slate-100 to-stone-300',
    spineBg: 'bg-stone-400',
    titleColor: 'text-rose-600',
    isLight: true,
    progress: 100,
    progressColor: 'bg-emerald-400'
  },
  {
    id: 'b-dune',
    title: 'Dune',
    shelf: 'Fiction',
    shelfKey: 'fiction',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-amber-700 to-orange-950',
    spineBg: 'bg-amber-950',
    titleColor: 'text-amber-300',
    progress: 65,
    progressColor: 'bg-amber-400'
  },
  {
    id: 'b-ddia',
    title: 'Designing Data-Intensive',
    shelf: 'Tech',
    shelfKey: 'technical',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-amber-800 to-stone-950',
    spineBg: 'bg-amber-950',
    titleColor: 'text-amber-200',
    progress: 72,
    progressColor: 'bg-amber-400'
  },
  {
    id: 'b-hailmary',
    title: 'Project Hail Mary',
    shelf: 'Fiction',
    shelfKey: 'fiction',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-slate-900 to-black',
    spineBg: 'bg-zinc-950',
    titleColor: 'text-amber-400',
    progress: 100,
    progressColor: 'bg-emerald-400'
  },
  {
    id: 'b-flow',
    title: 'Flow',
    shelf: 'Philosophy',
    shelfKey: 'philosophy',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&auto=format&fit=crop&q=80',
    coverBg: 'from-cyan-700 to-teal-900',
    spineBg: 'bg-teal-950',
    titleColor: 'text-yellow-300',
    progress: 85,
    progressColor: 'bg-amber-400'
  }
];

const TOP_ARTICLE_CATEGORIES = [
  { name: 'Tech Talks', count: 6, pct: 75 },
  { name: 'System Design', count: 1, pct: 20 },
  { name: 'Programming', count: 1, pct: 20 },
  { name: 'Software Architecture', count: 2, pct: 25, isDraft: true },
  { name: 'Distributed Platforms', count: 1, pct: 15, isDraft: true }
];

const TICKER_ISSUES = [
  {
    key: 'PORT-1',
    type: 'task',
    title: 'Wire issue service to real Supabase data',
    project: 'PORT',
    projectColor: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300',
    status: 'In progress',
    statusColor: 'border-amber-500/40 bg-amber-950/80 text-amber-300'
  },
  {
    key: 'LEM-1',
    type: 'bug',
    title: 'Voice dictation cuts off mid-sentence',
    project: 'LEM',
    projectColor: 'border-purple-500/40 bg-purple-950/80 text-purple-300',
    status: 'In progress',
    statusColor: 'border-amber-500/40 bg-amber-950/80 text-amber-300'
  },
  {
    key: 'PORT-26',
    type: 'bug',
    title: 'Interactive ticket triage and label clipping',
    project: 'PORT',
    projectColor: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300',
    status: 'To do',
    statusColor: 'border-sky-500/40 bg-sky-950/80 text-sky-300'
  },
  {
    key: 'PORT-39',
    type: 'story',
    title: 'Full Feature API Issue with Image and Checklist',
    project: 'PORT',
    projectColor: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300',
    status: 'To do',
    statusColor: 'border-sky-500/40 bg-sky-950/80 text-sky-300'
  },
  {
    key: 'LEM-2',
    type: 'bug',
    title: 'Crash when playing lesson audio',
    project: 'LEM',
    projectColor: 'border-purple-500/40 bg-purple-950/80 text-purple-300',
    status: 'To do',
    statusColor: 'border-sky-500/40 bg-sky-950/80 text-sky-300'
  },
  {
    key: 'PORT-40',
    type: 'bug',
    title: 'Multipart File Upload Issue',
    project: 'PORT',
    projectColor: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300',
    status: 'To do',
    statusColor: 'border-sky-500/40 bg-sky-950/80 text-sky-300'
  },
  {
    key: 'PORT-42',
    type: 'task',
    title: 'Issue created with X-API-Key',
    project: 'PORT',
    projectColor: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300',
    status: 'To do',
    statusColor: 'border-sky-500/40 bg-sky-950/80 text-sky-300'
  }
];

const AdminDashboardPage = ({ adminEmail }) => {
  const router = useRouter();
  const [activeDraftTab, setActiveDraftTab] = useState('ai');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setCurrentDateStr(formatted);
  }, []);

  return (
    <AdminLayout
      adminEmail={adminEmail}
      title='Bento Grid Dashboard | SinghBuildsTech Admin'
      description='Modular executive dashboard for Articles, Issueboard, and Book Records.'
    >
      <div className='mx-auto max-w-[1560px] p-4 sm:p-6 lg:p-8 space-y-4 font-sans text-slate-200'>
        {/* Sub-Header: Bento Grid & Live Timestamp matching Artefact 2 */}
        <div className='flex items-center justify-between px-1'>
          <h1 className='text-2xl font-bold tracking-tight text-white'>Bento Grid</h1>
          <div className='text-xs font-mono text-slate-400'>{currentDateStr || 'Wed, Oct 26, 10:45 AM'}</div>
        </div>

        {/* 3-COLUMN BENTO GRID (EXACT ARTEFACT 2 ARCHITECTURE) */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch'>
          {/* ============================================================== */}
          {/* COLUMN 1: ARTICLES STUDIO (Emerald Theme)                      */}
          {/* ============================================================== */}
          <div className='flex flex-col gap-5 h-full'>
            {/* Upper Box: Articles Studio & Drafts Preview */}
            <div className='rounded-2xl border border-emerald-500/50 bg-[#0f1722] p-4 sm:p-5 shadow-2xl transition hover:border-emerald-500/80 flex flex-col justify-between flex-[1.2] overflow-hidden'>
              <div>
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xs font-black uppercase tracking-wider text-[#10b981] font-mono'>
                    ARTICLES STUDIO
                  </h2>
                  <Link
                    href='/admin/articles/new'
                    className='rounded-md bg-[#10b981] px-3.5 py-1 text-xs font-black text-black shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95'
                  >
                    WRITE ARTICLE +
                  </Link>
                </div>

                {/* Drafts Section Header */}
                <div className='flex items-center justify-between text-xs font-mono text-slate-400 mb-3'>
                  <span>Drafts (1)</span>
                  <div className='flex items-center gap-1.5 text-slate-500'>
                    <FiFolder className='size-3.5 hover:text-slate-300 cursor-pointer' />
                    <FiMoreHorizontal className='size-3.5 hover:text-slate-300 cursor-pointer' />
                  </div>
                </div>

                {/* Split Layout: Left Draft Selector, Right Preview */}
                <div className='grid grid-cols-1 sm:grid-cols-12 gap-3'>
                  {/* Left Draft Pills */}
                  <div className='sm:col-span-5 space-y-2.5'>
                    <button
                      type='button'
                      onClick={() => setActiveDraftTab('ai')}
                      className={`w-full rounded-xl p-3 text-left transition border ${
                        activeDraftTab === 'ai'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className='font-bold text-xs text-white truncate'>The Future of AI</div>
                      <div className='text-[11px] font-mono text-slate-400 mt-0.5'>1.2k words</div>
                    </button>

                    <button
                      type='button'
                      onClick={() => setActiveDraftTab('react')}
                      className={`w-full rounded-xl p-3 text-left transition border ${
                        activeDraftTab === 'react'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className='font-bold text-xs text-white truncate'>React State Management</div>
                      <div className='text-[11px] font-mono text-slate-400 mt-0.5'>850 words</div>
                    </button>
                  </div>

                  {/* Right Draft Preview Card */}
                  <div className='sm:col-span-7 rounded-xl border border-slate-800 bg-[#0b121b] p-3.5 flex flex-col justify-between text-left'>
                    <div>
                      <span className='text-[10px] font-mono text-slate-400 block mb-1'>Draft article</span>
                      <h3 className='text-xs font-bold text-white leading-tight'>
                        {activeDraftTab === 'ai' ? 'The Future of AI' : 'React State Management'}
                      </h3>
                      <p className='mt-2 text-[11px] text-slate-300 leading-relaxed'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tnper euismod incididunt
                        ut labore et dolore magna aliqua. Ut volutpat e:nit mint veniam, aliquip ex ea commodo
                        consequat.
                      </p>
                    </div>

                    <div className='mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400'>
                      <span>Metadata · July 26, 2023</span>
                      <span className='text-slate-400'>Liarphnn · Paneamn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Box: Top 5 Categories & Article Breakdown */}
            <div className='rounded-2xl border border-slate-800/80 bg-[#0f1722] p-5 shadow-xl flex flex-col justify-between flex-1'>
              <div className='flex items-center justify-between mb-3.5'>
                <h3 className='text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-[#10b981]' />
                  Top 5 Categories
                </h3>
                <Link href='/page' className='text-[11px] font-mono text-emerald-400 hover:underline'>
                  8 Published Articles →
                </Link>
              </div>

              <div className='space-y-2.5'>
                {TOP_ARTICLE_CATEGORIES.map((cat, idx) => (
                  <div
                    key={cat.name}
                    className='group flex flex-col gap-1 rounded-xl border border-slate-800/60 bg-slate-950/60 p-2.5 transition hover:border-emerald-500/40 hover:bg-slate-900/60'
                  >
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='font-mono text-[10px] font-bold text-slate-500 w-3'>#{idx + 1}</span>
                        <span className='font-medium text-slate-200 truncate group-hover:text-emerald-300 transition'>
                          {cat.name}
                        </span>
                      </div>
                      <span className='font-mono text-[11px] font-bold text-emerald-400 shrink-0 ml-2'>
                        {cat.count} <span className='text-[10px] font-normal text-slate-400'>articles</span>
                      </span>
                    </div>
                    <div className='h-1 w-full bg-slate-800/80 rounded-full overflow-hidden mt-0.5'>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500'
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMN 2: ISSUEBOARD WORKSPACE (Cyan Theme)                    */}
          {/* ============================================================== */}
          <div className='flex flex-col gap-5 h-full'>
            {/* Upper Box: Active Sprint & Burndown Chart */}
            <div className='rounded-2xl border border-cyan-400/50 bg-[#0d1724] p-4 sm:p-5 shadow-2xl transition hover:border-cyan-400/80 flex flex-col justify-between flex-[1.2] overflow-hidden'>
              <div>
                {/* Header */}
                <div className='flex items-center justify-between mb-3'>
                  <h2 className='text-xs font-black uppercase tracking-wider text-cyan-400 font-mono'>
                    ISSUEBOARD WORKSPACE
                  </h2>
                  <button
                    type='button'
                    onClick={() => router.push('/admin/issues')}
                    className='text-slate-400 hover:text-slate-200'
                    aria-label='Options'
                  >
                    <FiMoreHorizontal className='size-4' />
                  </button>
                </div>

                {/* Active Sprint Glowing Banner */}
                <Link
                  href='/admin/issues?view=board'
                  className='group flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-400 to-[#22d3ee] p-2.5 sm:p-3 text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-105'
                >
                  <div className='flex items-center gap-3'>
                    <span className='grid size-8 place-items-center rounded-lg bg-slate-950/20 text-slate-950'>
                      <FiZap className='size-4 fill-slate-950 stroke-none' />
                    </span>
                    <div>
                      <div className='text-xs font-black tracking-tight'>Active Sprint 1</div>
                      <div className='text-[10px] font-medium text-slate-950/70 font-mono'>Oct 12 – Nov 3</div>
                    </div>
                  </div>
                  <FiChevronRight className='size-4 group-hover:translate-x-1 transition' />
                </Link>

                {/* Sprint Burndown Chart */}
                <div className='mt-3.5 pt-2.5 border-t border-slate-800/80'>
                  <div className='flex items-baseline justify-between mb-1'>
                    <div>
                      <h3 className='text-xs font-bold text-slate-200'>Sprint Burndown Chart</h3>
                      <p className='text-[10px] text-slate-400 font-mono'>Remaining Effort vs. Time</p>
                    </div>
                    <div className='text-right'>
                      <span className='text-xs font-black text-white font-mono'>24 story</span>
                      <span className='text-[10px] text-slate-400 block font-mono'>points left</span>
                    </div>
                  </div>

                  {/* Burndown SVG Graph with Y and X Axes matching Artefact 2 */}
                  <div className='relative h-28 sm:h-32 w-full mt-1.5'>
                    {/* Y Axis Vertical Label */}
                    <div className='absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none'>
                      Remaining Effort
                    </div>

                    <div className='ml-6 h-full flex flex-col justify-between'>
                      <div className='relative h-20 sm:h-22 w-full'>
                        <svg
                          className='h-full w-full overflow-visible'
                          viewBox='0 0 300 100'
                          preserveAspectRatio='none'
                        >
                          <defs>
                            <linearGradient id='cyanBurndownFill' x1='0' y1='0' x2='0' y2='1'>
                              <stop offset='0%' stopColor='#06b6d4' stopOpacity='0.45' />
                              <stop offset='100%' stopColor='#06b6d4' stopOpacity='0.0' />
                            </linearGradient>
                          </defs>

                          {/* Dotted Ideal Guideline */}
                          <line
                            x1='5'
                            y1='10'
                            x2='295'
                            y2='95'
                            stroke='#94a3b8'
                            strokeWidth='1.5'
                            strokeDasharray='3 3'
                          />

                          {/* Actual Burndown Filled Area */}
                          <path
                            d='M 5,10 Q 50,22 100,42 T 180,60 T 255,80 L 255,100 L 5,100 Z'
                            fill='url(#cyanBurndownFill)'
                          />

                          {/* Actual Burndown Line */}
                          <path
                            d='M 5,10 Q 50,22 100,42 T 180,60 T 255,80'
                            fill='none'
                            stroke='#22d3ee'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                          />

                          {/* Data point dot */}
                          <circle cx='255' cy='80' r='3.5' fill='#fff' stroke='#06b6d4' strokeWidth='2' />
                        </svg>

                        {/* Y-axis Ticks on left */}
                        <div className='absolute -left-5 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-slate-500'>
                          <span>140</span>
                          <span>30</span>
                          <span>20</span>
                          <span>10</span>
                          <span>0</span>
                        </div>
                      </div>

                      {/* X-axis Ticks below */}
                      <div className='flex justify-between text-[8.5px] font-mono text-slate-500 pt-0.5 border-t border-slate-800/80 leading-tight'>
                        <span>0</span>
                        <span>6</span>
                        <span>16</span>
                        <span>24</span>
                        <span>38</span>
                      </div>
                      <div className='text-center text-[7.5px] font-mono text-slate-500 uppercase tracking-widest leading-none pt-0.5'>
                        Time
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Box: Issueboard Ticker */}
            <div className='rounded-2xl border border-slate-800/80 bg-[#0d1724] p-5 shadow-xl flex flex-col justify-between flex-1'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-cyan-400 animate-pulse' />
                  Issueboard Ticker
                </h3>
                <Link href='/admin/issues?view=board' className='text-slate-400 hover:text-cyan-400 text-xs font-mono'>
                  View Board (7) →
                </Link>
              </div>

              <div className='space-y-2'>
                {TICKER_ISSUES.map((issue) => (
                  <Link
                    key={issue.key}
                    href={`/admin/issues/${issue.key}`}
                    className='group flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/60 p-2 sm:p-2.5 transition hover:border-cyan-500/50 hover:bg-slate-900/60'
                  >
                    <div className='flex items-center gap-2 min-w-0 pr-2'>
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          issue.status === 'In progress' ? 'bg-amber-400' : 'bg-sky-400'
                        }`}
                      />
                      <span className='text-xs text-slate-200 font-medium truncate group-hover:text-cyan-300 transition'>
                        <span className='font-mono font-bold text-white mr-1.5'>{issue.key}:</span>
                        <span className='text-slate-300'>{issue.title}</span>
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5 shrink-0'>
                      {/* Project Code Capsule */}
                      <span
                        className={`inline-flex items-center h-[18px] rounded-full px-2 text-[10px] font-mono font-bold leading-none border shadow-sm ${issue.projectColor}`}
                      >
                        {issue.project}
                      </span>
                      {/* Status Capsule */}
                      <span
                        className={`inline-flex items-center h-[18px] rounded-full px-2 text-[10px] font-mono font-semibold leading-none border shadow-sm ${issue.statusColor}`}
                      >
                        {issue.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMN 3: BOOKS & LIBRARY RECORDS (Full-Height Amber Theme)    */}
          {/* ============================================================== */}
          <div className='flex flex-col h-full'>
            {/* Full-Height Bento Card for Books matching Artefact 2 */}
            <div className='h-full rounded-2xl border border-amber-500/50 bg-[#14100c] p-5 shadow-2xl transition hover:border-amber-500/80 flex flex-col justify-between space-y-4'>
              <div>
                {/* Header */}
                <div className='flex items-center justify-between'>
                  <h2 className='text-xs font-black uppercase tracking-wider text-amber-400 font-mono'>
                    BOOKS & LIBRARY RECORDS
                  </h2>
                  <button
                    type='button'
                    onClick={() => router.push('/admin/books')}
                    className='text-slate-400 hover:text-slate-200'
                    aria-label='Options'
                  >
                    <FiMoreHorizontal className='size-4' />
                  </button>
                </div>

                {/* Reading Stats & Radial Gauge Section matching Artefact 2 */}
                <div className='flex items-center justify-between mt-3 py-1'>
                  <div>
                    <div className='text-3xl font-black text-white font-mono leading-none'>
                      18 <span className='text-slate-400 text-xl font-normal'>/ 25</span>
                    </div>
                    <div className='text-xs font-semibold text-slate-300 mt-1.5'>Books Read This Year</div>
                    <div className='text-[11px] text-slate-400 mt-0.5'>
                      Next Up: <span className='text-slate-200 font-medium'>Algorithms to Live By</span>
                    </div>
                  </div>

                  {/* SVG Semi-Circle Arc Gauge (72%) */}
                  <div className='relative size-20 grid place-items-center shrink-0'>
                    <svg className='size-full -rotate-90' viewBox='0 0 36 36'>
                      {/* Background Arc Track */}
                      <path
                        className='text-slate-800 stroke-current'
                        strokeWidth='3.5'
                        strokeDasharray='75, 100'
                        strokeLinecap='round'
                        fill='none'
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      />
                      {/* Glowing Amber Arc Progress 72% */}
                      <path
                        className='text-amber-400 stroke-current drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                        strokeDasharray='54, 100'
                        strokeWidth='3.5'
                        strokeLinecap='round'
                        fill='none'
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      />
                    </svg>
                    <span className='absolute font-mono text-sm font-black text-white'>72%</span>
                  </div>
                </div>

                {/* Shelf Tag Filter Pills matching Artefact 2 */}
                <div className='flex items-center gap-1.5 overflow-x-auto my-1'>
                  {[
                    { label: 'Tech (12)', shelf: 'technical' },
                    { label: 'Philosophy (4)', shelf: 'philosophy' },
                    { label: 'Fiction (2)', shelf: 'fiction' },
                    { label: 'Wishlist (1)', shelf: 'wishlist' }
                  ].map((tag) => (
                    <Link
                      key={tag.shelf}
                      href={`/admin/books?shelf=${tag.shelf}`}
                      className='inline-flex items-center h-[20px] rounded-full border border-slate-800 bg-slate-900/90 px-2.5 text-[10px] leading-none font-sans font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition whitespace-nowrap'
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>

                {/* 3D Book Cover Showcase Grid (3 Columns x 2 Rows = 6 Books) */}
                <div className='grid grid-cols-3 gap-3 pt-3'>
                  {SHOWCASE_BOOKS.map((book) => (
                    <Link
                      key={book.id}
                      href={`/admin/books?shelf=${book.shelfKey}`}
                      className='group flex flex-col items-center text-center'
                    >
                      {/* 3D Diagonal Standing Book with Isometric Perspective matching Artefact 2 */}
                      <div className='relative w-full aspect-[2/3] [perspective:800px] flex items-center justify-center pt-1 pb-2'>
                        {/* Elliptical Shelf Drop Shadow */}
                        <div className='absolute bottom-1 left-2 right-0 h-3 rounded-full bg-black/85 blur-[5px] -rotate-3 transition-all duration-300 group-hover:scale-90 group-hover:blur-[7px]' />

                        {/* 3D Angled Book Structure (Diagonal Isometric View) */}
                        <div
                          className='relative w-[88%] h-full rounded-r-sm rounded-l-[1px] overflow-hidden transition-all duration-300 transform-gpu [transform-style:preserve-3d] shadow-[-10px_14px_22px_rgba(0,0,0,0.85),-2px_4px_8px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:shadow-amber-500/20'
                          style={{
                            transform: 'rotateY(-24deg) rotateX(8deg) rotateZ(0.5deg)'
                          }}
                        >
                          {/* Left 3D Spine Thickness Edge with Crease Lighting */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-3 ${book.spineBg} z-20 shadow-[inset_-3px_0_5px_rgba(0,0,0,0.7)] border-r border-black/50`}
                          />
                          {/* Spine Crease / Hinge Highlight */}
                          <div className='absolute left-3 top-0 bottom-0 w-[1.5px] bg-white/20 z-20' />

                          {/* Top Paper Pages Rim */}
                          <div className='absolute right-0 top-0 left-3 h-[2.5px] bg-gradient-to-r from-stone-400 via-stone-200 to-stone-300 z-20 opacity-90' />
                          {/* Right Paper Pages Edge */}
                          <div className='absolute right-0 top-0 bottom-0 w-[2.5px] bg-gradient-to-b from-stone-300 via-stone-200 to-stone-400 z-20 opacity-90' />

                          {/* Front Cover Face with Lighting Sheen */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-tr ${book.coverBg} pl-4.5 pr-2.5 py-2.5 flex flex-col justify-between`}
                          >
                            {/* Dynamic 3D diagonal lighting sheen */}
                            <div className='absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-black/40 pointer-events-none' />

                            {/* Top Header on Cover */}
                            <div className='relative z-10'>
                              <div
                                className={`text-[7.5px] font-mono uppercase tracking-widest ${
                                  book.isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                {book.shelf}
                              </div>
                              <div
                                className={`mt-1 text-[11px] font-black leading-tight line-clamp-3 ${
                                  book.titleColor || (book.isLight ? 'text-slate-950' : 'text-white')
                                }`}
                              >
                                {book.title}
                              </div>
                            </div>

                            {/* Bottom Footer on Cover */}
                            <div className='relative z-10'>
                              <div
                                className={`text-[6.5px] font-mono tracking-wider ${
                                  book.isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                2026 EDITION
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Title & Progress Line & Shelf Tags Pill below matching Artefact 2 */}
                      <div className='mt-2 w-full'>
                        <div className='text-[10px] font-bold text-slate-200 truncate group-hover:text-amber-300 transition'>
                          {book.title}
                        </div>

                        {/* Thin Progress Line */}
                        <div className='mt-1 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden'>
                          <div className={`h-full ${book.progressColor}`} style={{ width: `${book.progress}%` }} />
                        </div>

                        {/* Shelf Tags Pill */}
                        <div className='mt-1'>
                          <span className='inline-flex items-center h-4 rounded-full bg-amber-950/40 border border-amber-900/60 px-1.5 text-[9px] leading-none font-sans text-amber-300'>
                            Shelf tags
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Jump Link */}
              <div className='pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400'>
                <span>All 18 Cataloged Books</span>
                <Link
                  href='/admin/books'
                  className='text-amber-400 hover:underline font-bold inline-flex items-center gap-1'
                >
                  Open Bookshelf →
                </Link>
              </div>
            </div>
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
