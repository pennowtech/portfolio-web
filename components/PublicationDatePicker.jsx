import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PublicationDatePicker = ({ value, onChange, error }) => {
  const selected = useMemo(() => {
    const [year, month, day] = value.split('-').map(Number);
    return year && month && day ? new Date(year, month - 1, day) : new Date();
  }, [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const formatted = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(selected);

  return (
    <div ref={containerRef} className='relative w-full text-xs font-medium text-slate-700 dark:text-slate-200'>
      <button
        type='button'
        onClick={() => {
          setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        className='flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
      >
        <span className='truncate'>{formatted}</span>
        <FiCalendar className='size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2' aria-hidden='true' />
      </button>
      {open && (
        <div className='absolute right-0 z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
          <div className='mb-2.5 flex items-center justify-between'>
            <button
              type='button'
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className='flex size-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              aria-label='Previous month'
            >
              <FiChevronLeft className='size-3.5' />
            </button>
            <strong className='font-Monda text-xs font-bold text-slate-900 dark:text-white'>
              {new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(visibleMonth)}
            </strong>
            <button
              type='button'
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className='flex size-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              aria-label='Next month'
            >
              <FiChevronRight className='size-3.5' />
            </button>
          </div>
          <div className='grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 uppercase'>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className='py-1'>
                {day}
              </span>
            ))}
          </div>
          <div className='grid grid-cols-7 gap-1'>
            {cells.map((day, index) => {
              const active =
                day &&
                selected.getFullYear() === visibleMonth.getFullYear() &&
                selected.getMonth() === visibleMonth.getMonth() &&
                selected.getDate() === day;
              return day ? (
                <button
                  key={index}
                  type='button'
                  onClick={() => {
                    onChange(toIsoDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)));
                    setOpen(false);
                  }}
                  className={`aspect-square rounded-md text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              ) : (
                <span key={index} />
              );
            })}
          </div>
          <button
            type='button'
            onClick={() => {
              const today = new Date();
              onChange(toIsoDate(today));
              setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setOpen(false);
            }}
            className='mt-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300'
          >
            Today
          </button>
        </div>
      )}
      {error && <span className='mt-1 block text-xs text-red-700 dark:text-red-300'>{error}</span>}
    </div>
  );
};

export default PublicationDatePicker;
