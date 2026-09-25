import React, { useEffect, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiRotateCcw, FiX } from 'react-icons/fi';
import { LuSparkles, LuWand } from 'react-icons/lu';
import { AI_PERSONAS, AI_SUMMARY_LENGTHS } from './aiPersonas';
import DiffView from './DiffView';
import AIModelBadge from './AIModelBadge';
import { DEFAULT_AI_CONFIG, loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';

// text: the text to rephrase. scopeLabel: "selected text" or "whole article", for copy only.
// onApply(newText): caller decides how to splice it back in (CodeMirror range replace, or whole-doc form update).
export const AIRephraseModal = ({ isOpen, text, scopeLabel = 'selected text', onApply, onClose }) => {
  const [creds, setCreds] = useState(() => getActiveProviderCreds(DEFAULT_AI_CONFIG));
  const [mode, setMode] = useState('rewrite'); // 'rewrite' | 'summarize'
  const [summaryLength, setSummaryLength] = useState('paragraph');
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const saved = getActiveProviderCreds(loadAiConfig());
    setCreds(saved);
    setSelectedPersonas(saved.personas.length > 0 ? saved.personas : ['clarity']);
    setMode('rewrite');
    setSummaryLength('paragraph');
    setCustomPrompt('');
    setError('');
    setResult('');
    setShowDiff(false);
  }, [isOpen]);

  const summarizing = mode === 'summarize';
  const switchMode = (next) => {
    setMode(next);
    setError('');
    setResult('');
    setShowDiff(false);
  };

  if (!isOpen) return null;

  const togglePersona = (id) => {
    setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleRephrase = async () => {
    if (!summarizing && selectedPersonas.length === 0 && !customPrompt.trim()) {
      setError('Select at least one persona or write a custom instruction.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const response = await fetch('/api/admin/ai-rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          summaryLength,
          personaIds: selectedPersonas,
          customPrompt,
          provider: creds.provider,
          model: creds.model,
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          systemPrompt: creds.systemPrompt,
          temperature: creds.temperature
        })
      });
      const data = await response.json();
      if (data.ok) {
        setResult(data.result);
      } else {
        setError(data.message || `The ${summarizing ? 'summary' : 'rephrase'} request failed.`);
      }
    } catch {
      setError(`Could not reach the server to run the ${summarizing ? 'summary' : 'rephrase'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (placement = 'replace') => {
    onApply?.(result, placement);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='ai-rephrase-title'
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <div className='flex items-center gap-2.5'>
            <div className='grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
              <LuSparkles className='size-4' />
            </div>
            <div>
              <h3 id='ai-rephrase-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
                AI Rephrase
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                {summarizing ? 'Summarizing' : 'Rewriting'} the {scopeLabel} ({text.length.toLocaleString()} characters)
              </p>
              <AIModelBadge className='mt-1' />
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close AI rephrase'
          >
            <FiX className='size-4' />
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs'>
          <div
            className='flex gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5 dark:border-slate-800 dark:bg-slate-950/60'
            role='group'
            aria-label='AI action'
          >
            {[
              ['rewrite', 'Rewrite'],
              ['summarize', 'Summarize']
            ].map(([value, label]) => (
              <button
                key={value}
                type='button'
                aria-pressed={mode === value}
                onClick={() => switchMode(value)}
                className={`flex-1 rounded-md py-1 text-xs font-semibold transition ${
                  mode === value
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {summarizing && (
            <div>
              <label className='mb-1.5 block font-semibold text-slate-700 dark:text-slate-200'>Summary length</label>
              <div className='grid grid-cols-3 gap-1.5'>
                {AI_SUMMARY_LENGTHS.map((length) => {
                  const active = summaryLength === length.id;
                  return (
                    <button
                      key={length.id}
                      type='button'
                      aria-pressed={active}
                      onClick={() => setSummaryLength(length.id)}
                      className={`rounded-lg border p-1.5 text-left transition ${
                        active
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500/60'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                      }`}
                    >
                      <span className='block font-semibold leading-tight'>{length.label}</span>
                      <span className='block text-[10px] text-slate-500 dark:text-slate-400'>{length.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Persona multi-select -- shared list with AI Config */}
          {!summarizing && (
            <div>
              <div className='flex items-center justify-between mb-1.5'>
                <label className='block font-semibold text-slate-700 dark:text-slate-200'>Writing Directives</label>
                <span className='text-[10px] text-slate-400'>{selectedPersonas.length} selected</span>
              </div>
              <div className='grid grid-cols-2 gap-1.5'>
                {AI_PERSONAS.map((persona) => {
                  const selected = selectedPersonas.includes(persona.id);
                  return (
                    <button
                      key={persona.id}
                      type='button'
                      onClick={() => togglePersona(persona.id)}
                      aria-pressed={selected}
                      className={`flex items-start gap-1.5 rounded-lg border p-1.5 text-left transition ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500/60'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid size-3 shrink-0 place-items-center rounded border ${
                          selected
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {selected && <FiCheck className='size-2' />}
                      </span>
                      <span className='font-semibold leading-tight'>{persona.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom instruction */}
          <div>
            <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>
              Extra instruction (optional)
            </label>
            <input
              type='text'
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                summarizing
                  ? 'e.g. focus on the trade-offs, write for beginners…'
                  : 'e.g. rewrite as bullet points, add a code example…'
              }
              className='w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
            />
          </div>

          {/* Go button */}
          <button
            type='button'
            onClick={handleRephrase}
            disabled={loading}
            className='flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50'
          >
            <LuWand className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            {summarizing
              ? loading
                ? 'Summarizing…'
                : result
                  ? 'Summarize again'
                  : 'Summarize'
              : loading
                ? 'Rephrasing…'
                : result
                  ? 'Rephrase again'
                  : 'Rephrase'}
          </button>

          {error && (
            <p className='rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'>
              {error}
            </p>
          )}

          {/* Result */}
          {result && (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30'>
              <div className='flex items-center justify-between border-b border-emerald-500/20 px-3 py-2'>
                <span className='font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400'>
                  Result
                </span>
                <button
                  type='button'
                  onClick={() => setShowDiff((v) => !v)}
                  className='inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400'
                >
                  {showDiff ? <FiEyeOff className='size-3' /> : <FiEye className='size-3' />}
                  {showDiff ? 'Hide diff' : 'View diff'}
                </button>
              </div>
              <div className='max-h-64 overflow-y-auto p-3 custom-scrollbar'>
                {showDiff ? (
                  <DiffView before={text} after={result} />
                ) : (
                  <p className='whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-slate-800 dark:text-slate-100'>
                    {result}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className='flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
            <button
              type='button'
              onClick={() => setResult('')}
              className='inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
            >
              <FiRotateCcw className='size-3' /> Discard
            </button>
            {summarizing && (
              <button
                type='button'
                onClick={() => handleApply('below')}
                className='inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
              >
                Insert below {scopeLabel}
              </button>
            )}
            <button
              type='button'
              onClick={() => handleApply('replace')}
              className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500'
            >
              <FiCheck className='size-3.5' /> Replace {scopeLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRephraseModal;
