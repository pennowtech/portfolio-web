import AIModelBadge from './AIModelBadge';
import React from 'react';
import { FiX } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import AiProviderSettingsPanel from './settings/AiProviderSettingsPanel';

// Standalone single-purpose modal around AiProviderSettingsPanel, kept for
// call sites (e.g. the Article Studio toolbar) that want to jump straight to
// AI settings without going through the tabbed SettingsModal.
export const AIConfigModal = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='flex h-[min(46rem,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='ai-config-title'
      >
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <div className='flex items-center gap-2.5'>
            <div className='grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'>
              <LuSparkles className='size-4' />
            </div>
            <div>
              <h3 id='ai-config-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
                AI Assistant & Engine Settings
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                Configure provider, tone persona, and writing assistants
              </p>
              <AIModelBadge className='mt-1' />
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close AI configuration'
          >
            <FiX className='size-4' />
          </button>
        </div>

        <AiProviderSettingsPanel onSaved={onSave} />
      </div>
    </div>
  );
};

export default AIConfigModal;
