import React, { useState } from 'react';
import { FiMinimize2, FiMaximize2 } from 'react-icons/fi';

export const AmbientWordMeter = ({ wordCount = 0, charCount = 0, targetGoal = 1500 }) => {
  const [minimized, setMinimized] = useState(false);

  // Reading time based on standard 200 WPM
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Progress percentage capped at 100% for circular stroke
  const pct = Math.min(100, Math.round((wordCount / targetGoal) * 100));

  // Circular gauge circumference
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  if (minimized) {
    return (
      <button
        type='button'
        onClick={() => setMinimized(false)}
        className='absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-white/95 px-3 py-1.5 shadow-xl backdrop-blur-xl transition hover:border-emerald-400 hover:scale-105 dark:border-emerald-500/50 dark:bg-slate-900/95 dark:shadow-[0_8px_25px_rgba(0,0,0,0.6)]'
        title='Expand Word & Reading Time Gauge'
      >
        <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
        <span className='font-mono text-xs font-bold text-slate-800 dark:text-emerald-300'>
          {wordCount.toLocaleString()} w
        </span>
        <span className='text-[10px] text-slate-500 dark:text-slate-400'>· {readingTime}m</span>
        <FiMaximize2 className='size-3 text-slate-400' />
      </button>
    );
  }

  return (
    <div
      className='absolute bottom-4 right-4 z-10 w-44 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-200 dark:border-emerald-500/30 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] select-none'
      role='region'
      aria-label='Article live reading and word stats'
    >
      {/* Top Header with Minimize Toggle */}
      <div className='flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80'>
        <span className='font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400'>
          Writing Pace
        </span>
        <button
          type='button'
          onClick={() => setMinimized(true)}
          className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition'
          title='Minimize gauge'
        >
          <FiMinimize2 className='size-3' />
        </button>
      </div>

      {/* Main Radial Word Count Gauge matching Concept A */}
      <div className='relative my-2 flex items-center justify-center'>
        <svg className='size-20 -rotate-90' viewBox='0 0 64 64'>
          {/* Background circle track */}
          <circle
            cx='32'
            cy='32'
            r={radius}
            className='stroke-slate-200 dark:stroke-slate-800'
            strokeWidth='4'
            fill='none'
          />
          {/* Glowing emerald progress circle */}
          <circle
            cx='32'
            cy='32'
            r={radius}
            className='stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]'
            strokeWidth='4'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            fill='none'
          />
        </svg>

        {/* Center Numbers */}
        <div className='absolute flex flex-col items-center justify-center text-center'>
          <span className='font-mono text-base font-black text-slate-900 dark:text-white leading-none tracking-tight'>
            {wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : wordCount}
          </span>
          <span className='font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight'>
            {readingTime}m read
          </span>
        </div>
      </div>

      {/* Subtext info */}
      <div className='text-center'>
        <div className='font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300'>
          {wordCount.toLocaleString()} <span className='text-slate-400 font-normal'>words</span>
        </div>
      </div>

      {/* Mini Velocity Sparkline Wave Chart (Concept A) */}
      <div className='mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80'>
        <div className='flex items-center justify-between text-[8px] font-mono text-slate-400 mb-0.5'>
          <span>Velocity</span>
          <span className='text-emerald-600 dark:text-emerald-400 font-bold'>{pct}% target</span>
        </div>
        <div className='h-5 w-full'>
          <svg className='size-full' viewBox='0 0 100 20' preserveAspectRatio='none'>
            <defs>
              <linearGradient id='velocityFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#10b981' stopOpacity='0.4' />
                <stop offset='100%' stopColor='#10b981' stopOpacity='0.0' />
              </linearGradient>
            </defs>
            {/* Sparkline area */}
            <path d='M 0,16 Q 15,10 30,13 T 55,7 T 80,11 T 100,5 L 100,20 L 0,20 Z' fill='url(#velocityFill)' />
            {/* Sparkline curve */}
            <path
              d='M 0,16 Q 15,10 30,13 T 55,7 T 80,11 T 100,5'
              fill='none'
              stroke='#10b981'
              strokeWidth='1.8'
              strokeLinecap='round'
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AmbientWordMeter;
