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
    <div ref={containerRef} className='relative text-sm font-medium text-slate-700 dark:text-slate-200'>
      <span>Publication date</span>
      <button
        type='button'
        onClick={() => {
          setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        className='mt-2 flex min-h-14 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 text-left text-base font-normal text-slate-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
      >
        <span>{formatted}</span>
        <FiCalendar className='text-xl text-green-700 dark:text-green-400' aria-hidden='true' />
      </button>
      {open && (
        <div className='absolute left-0 z-50 mt-2 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
          <div className='mb-4 flex items-center justify-between'>
            <button
              type='button'
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className='flex size-11 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'
              aria-label='Previous month'
            >
              <FiChevronLeft />
            </button>
            <strong className='font-Monda text-lg'>
              {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(visibleMonth)}
            </strong>
            <button
              type='button'
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className='flex size-11 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'
              aria-label='Next month'
            >
              <FiChevronRight />
            </button>
          </div>
          <div className='grid grid-cols-7 gap-1 text-center text-xs uppercase text-slate-500'>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} className='py-2'>
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
                  className={`aspect-square rounded-lg text-base font-normal ${active ? 'bg-green-700 text-white' : 'hover:bg-green-50 hover:text-green-800 dark:hover:bg-green-950/40 dark:hover:text-green-300'}`}
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
            className='mt-4 w-full rounded-lg border border-green-700 py-2.5 text-sm text-green-800 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-950/40'
          >
            Use today
          </button>
        </div>
      )}
      {error && <span className='mt-1 block text-sm text-red-700 dark:text-red-300'>{error}</span>}
    </div>
  );
};

export default PublicationDatePicker;
