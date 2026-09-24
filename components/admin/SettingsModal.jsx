import React, { useState } from 'react';
import { FiBookOpen, FiX } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import AiProviderSettingsPanel from './settings/AiProviderSettingsPanel';
import GoogleBooksSettingsPanel from './settings/GoogleBooksSettingsPanel';

const TABS = [
  { id: 'ai', label: 'AI Provider', icon: LuSparkles, accent: 'purple' },
  { id: 'books', label: 'Google Books', icon: FiBookOpen, accent: 'amber' }
];

const ACCENT_CLASSES = {
  purple: {
    active: 'border-purple-500 bg-purple-50/60 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  amber: {
    active: 'border-amber-500 bg-amber-50/60 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400'
  }
};

// The one place every admin surface (Article Studio, Issueboard, Book
// Library) points to for provider/API-key settings -- opened from the
// persistent left navbar rather than being scattered per-feature.
export const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('ai');

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='flex h-[min(46rem,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='settings-modal-title'
      >
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <h3 id='settings-modal-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
            Settings
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close settings'
          >
            <FiX className='size-4' />
          </button>
        </div>

        <div className='flex items-center gap-1.5 border-b border-slate-100 px-4 pt-3 dark:border-slate-800'>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const accent = ACCENT_CLASSES[tab.accent];
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? accent.active
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? accent.icon : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className='flex min-h-0 flex-1 flex-col'>
          {activeTab === 'ai' && <AiProviderSettingsPanel />}
          {activeTab === 'books' && <GoogleBooksSettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
