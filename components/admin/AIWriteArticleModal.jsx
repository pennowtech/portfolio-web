import React, { useEffect, useState } from 'react';
import { FiCheck, FiRotateCcw, FiX } from 'react-icons/fi';
import { LuSparkles, LuWand } from 'react-icons/lu';
import { AI_ARTICLE_LENGTHS, AI_PERSONAS } from './aiPersonas';
import AIModelBadge from './AIModelBadge';
import { DEFAULT_AI_CONFIG, loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:text-white';

const wordCount = (text) => (text.match(/\S+/g) || []).length;

// Drafts a whole article from a brief, in the same tones the Rephrase tool offers.
// hasContent: the editor already has text. onApply(markdown, 'replace' | 'below') decides how to splice it in.
export const AIWriteArticleModal = ({ isOpen, hasContent, title, category, tags, onApply, onClose }) => {
  const [creds, setCreds] = useState(() => getActiveProviderCreds(DEFAULT_AI_CONFIG));
  const [brief, setBrief] = useState('');
  const [notes, setNotes] = useState('');
  const [lengthId, setLengthId] = useState('standard');
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const saved = getActiveProviderCreds(loadAiConfig());
    setCreds(saved);
    setSelectedPersonas(saved.personas.length > 0 ? saved.personas : ['clarity']);
    setBrief(title || '');
    setNotes('');
    setLengthId('standard');
    setError('');
    setResult('');
  }, [isOpen, title]);

  if (!isOpen) return null;

  const togglePersona = (id) =>
    setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));

  const handleWrite = async () => {
    if (!brief.trim()) {
      setError('Describe what the article should cover.');
      return;
    }
    if (selectedPersonas.length === 0) {
      setError('Select at least one tone.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const response = await fetch('/api/admin/ai-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          notes,
          lengthId,
          personaIds: selectedPersonas,
          title,
          category,
          tags,
          provider: creds.provider,
          model: creds.model,
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          systemPrompt: creds.systemPrompt,
          temperature: creds.temperature
        })
      });
      const data = await response.json();
      if (data.ok) setResult(data.result);
      else setError(data.message || 'The article request failed.');
    } catch {
      setError('Could not reach the server to write the article.');
    } finally {
      setLoading(false);
    }
  };

  const apply = (placement) => {
    onApply?.(result, placement);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='ai-write-title'
      >
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <div className='flex items-center gap-2.5'>
            <div className='grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
              <LuSparkles className='size-4' />
            </div>
            <div>
              <h3 id='ai-write-title' className='text-sm font-bold leading-tight'>
                Write article with AI
              </h3>
              <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
                Drafts a full article. You review it before anything changes.
              </p>
              <AIModelBadge className='mt-1' />
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close write article with AI'
          >
            <FiX className='size-4' />
          </button>
        </div>

        <div className='custom-scrollbar flex-1 space-y-3.5 overflow-y-auto p-4 text-xs'>
          <div>
            <label htmlFor='ai-write-brief' className='mb-1 block font-semibold text-slate-700 dark:text-slate-200'>
              What should the article cover?
            </label>
            <textarea
              id='ai-write-brief'
              rows={3}
              value={brief}
              maxLength={4000}
              onChange={(event) => setBrief(event.target.value)}
              placeholder='e.g. How idempotency keys make retries safe in payment APIs, for backend engineers'
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor='ai-write-notes' className='mb-1 block font-semibold text-slate-700 dark:text-slate-200'>
              Outline or key points (optional)
            </label>
            <textarea
              id='ai-write-notes'
              rows={3}
              value={notes}
              maxLength={8000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder='One per line: sections you want, points to make, examples to include…'
              className={fieldClass}
            />
          </div>

          <div>
            <span className='mb-1.5 block font-semibold text-slate-700 dark:text-slate-200'>Length</span>
            <div className='grid grid-cols-3 gap-1.5'>
              {AI_ARTICLE_LENGTHS.map((length) => {
                const active = lengthId === length.id;
                return (
                  <button
                    key={length.id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setLengthId(length.id)}
                    className={`rounded-lg border p-1.5 text-left transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200'
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

          <div>
            <div className='mb-1.5 flex items-center justify-between'>
              <span className='block font-semibold text-slate-700 dark:text-slate-200'>Tone</span>
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
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200'
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
                    <span>
                      <span className='block font-semibold leading-tight'>{persona.label}</span>
                      <span className='block text-[10px] text-slate-500 dark:text-slate-400'>{persona.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type='button'
            onClick={handleWrite}
            disabled={loading}
            className='flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50'
          >
            <LuWand className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Writing… this can take a minute' : result ? 'Write again' : 'Write article'}
          </button>

          {error && (
            <p
              role='alert'
              className='rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            >
              {error}
            </p>
          )}

          {result && (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30'>
              <div className='flex items-center justify-between border-b border-emerald-500/20 px-3 py-2'>
                <span className='font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400'>
                  Draft
                </span>
                <span className='text-[10px] text-slate-500 dark:text-slate-400'>
                  {wordCount(result).toLocaleString()} words
                </span>
              </div>
              <div className='custom-scrollbar max-h-72 overflow-y-auto p-3'>
                <p className='whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-slate-800 dark:text-slate-100'>
                  {result}
                </p>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className='flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
            <button
              type='button'
              onClick={() => setResult('')}
              className='inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
            >
              <FiRotateCcw className='size-3' /> Discard
            </button>
            {hasContent ? (
              <>
                <button
                  type='button'
                  onClick={() => apply('below')}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
                >
                  Add below current text
                </button>
                <button
                  type='button'
                  onClick={() => apply('replace')}
                  className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500'
                >
                  <FiCheck className='size-3.5' /> Replace article
                </button>
              </>
            ) : (
              <button
                type='button'
                onClick={() => apply('replace')}
                className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500'
              >
                <FiCheck className='size-3.5' /> Use this draft
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWriteArticleModal;
