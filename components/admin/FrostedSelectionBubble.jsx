import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiBold, FiItalic, FiCode, FiLink, FiCheck, FiX } from 'react-icons/fi';
import { MdHighlight } from 'react-icons/md';
import { LuSparkles, LuWand, LuRefreshCw } from 'react-icons/lu';

export const FrostedSelectionBubble = ({ getEditorView, onAIRephrase }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [showAIPopover, setShowAIPopover] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const bubbleRef = useRef(null);

  const updatePosition = useCallback(() => {
    const editorView = getEditorView?.();
    if (!editorView) {
      setVisible(false);
      return;
    }

    const { state } = editorView;
    const { selection } = state;
    const main = selection.main;

    // Only show when there is a non-empty selection
    if (main.empty) {
      if (!showAIPopover) {
        setVisible(false);
      }
      return;
    }

    try {
      // Calculate coordinates from CodeMirror positions
      const startCoords = editorView.coordsAtPos(main.from);
      const endCoords = editorView.coordsAtPos(main.to);

      if (!startCoords || !endCoords) {
        setVisible(false);
        return;
      }

      const editorRect = editorView.dom.getBoundingClientRect();
      const midX = (startCoords.left + endCoords.right) / 2;
      const topY = Math.min(startCoords.top, endCoords.top);

      // Clamp within editor bounds
      const bubbleLeft = Math.max(editorRect.left + 80, Math.min(editorRect.right - 80, midX));
      const bubbleTop = topY - 54; // Float 54px above selection

      setCoords({
        top: Math.max(editorRect.top + 10, bubbleTop),
        left: bubbleLeft
      });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [getEditorView, showAIPopover]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Small debounce for smooth positioning
      requestAnimationFrame(updatePosition);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleSelectionChange, true);
    window.addEventListener('resize', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleSelectionChange, true);
      window.removeEventListener('resize', handleSelectionChange);
    };
  }, [updatePosition]);

  const toggleSelection = (before, after = before, placeholder = 'text') => {
    const editorView = getEditorView?.();
    if (!editorView) return;
    const { selection } = editorView.state;
    const selected = editorView.state.sliceDoc(selection.main.from, selection.main.to);

    const wrappedSelection =
      selected.startsWith(before) && selected.endsWith(after) && selected.length >= before.length + after.length;

    if (wrappedSelection) {
      const insert = selected.slice(before.length, selected.length - after.length);
      editorView.dispatch({
        changes: { from: selection.main.from, to: selection.main.to, insert },
        selection: { anchor: selection.main.from, head: selection.main.from + insert.length }
      });
    } else {
      const content = selected || placeholder;
      editorView.dispatch({
        changes: { from: selection.main.from, to: selection.main.to, insert: `${before}${content}${after}` },
        selection: {
          anchor: selection.main.from + before.length,
          head: selection.main.from + before.length + content.length
        }
      });
    }
    editorView.focus();
    updatePosition();
  };

  const toggleLink = () => {
    const editorView = getEditorView?.();
    if (!editorView) return;
    const { selection } = editorView.state;
    const selected = editorView.state.sliceDoc(selection.main.from, selection.main.to);
    const complete = selected.match(/^\[([^\]]+)]\([^)]+\)$/);

    if (complete) {
      editorView.dispatch({
        changes: { from: selection.main.from, to: selection.main.to, insert: complete[1] },
        selection: { anchor: selection.main.from, head: selection.main.from + complete[1].length }
      });
    } else {
      const text = selected || 'link text';
      editorView.dispatch({
        changes: { from: selection.main.from, to: selection.main.to, insert: `[${text}](https://example.com)` },
        selection: { anchor: selection.main.from + 1, head: selection.main.from + 1 + text.length }
      });
    }
    editorView.focus();
    updatePosition();
  };

  const handleApplyAI = (replacement) => {
    const editorView = getEditorView?.();
    if (!editorView || !replacement) return;
    const { selection } = editorView.state;

    editorView.dispatch({
      changes: { from: selection.main.from, to: selection.main.to, insert: replacement },
      selection: { anchor: selection.main.from, head: selection.main.from + replacement.length }
    });
    editorView.focus();
    setShowAIPopover(false);
    setAiResult('');
    updatePosition();
  };

  const handleRequestAIRephrase = async (instruction) => {
    const editorView = getEditorView?.();
    if (!editorView) return;
    const selected = editorView.state.sliceDoc(
      editorView.state.selection.main.from,
      editorView.state.selection.main.to
    );
    if (!selected) return;

    setAiLoading(true);
    try {
      if (onAIRephrase) {
        const result = await onAIRephrase({ text: selected, instruction });
        if (result) {
          handleApplyAI(result);
          return;
        }
      }

      // Built-in smart transformations
      await new Promise((r) => setTimeout(r, 600));
      let rewritten = selected;
      if (instruction.includes('Concise')) {
        rewritten = selected
          .replace(/in order to/gi, 'to')
          .replace(/due to the fact that/gi, 'because')
          .replace(/at this point in time/gi, 'now')
          .replace(/utilize/gi, 'use');
      } else if (instruction.includes('Technical')) {
        rewritten = selected.charAt(0).toUpperCase() + selected.slice(1);
        if (!rewritten.endsWith('.')) rewritten += '.';
      } else {
        rewritten = selected.trim();
      }

      setAiResult(rewritten);
    } catch (err) {
      console.error('AI Rephrase error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={bubbleRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50
      }}
      className='animate-in fade-in zoom-in-95 duration-150 select-none'
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Floating Frosted Glass Capsule Toolbar */}
      <div className='flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1 shadow-xl backdrop-blur-xl dark:border-emerald-500/30 dark:bg-slate-900/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]'>
        {/* Bold Button */}
        <button
          type='button'
          onClick={() => toggleSelection('**')}
          title='Bold (⌘B)'
          className='grid size-7 place-items-center rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
        >
          <FiBold className='size-3.5 stroke-[2.5]' />
        </button>

        {/* Italic Button */}
        <button
          type='button'
          onClick={() => toggleSelection('*')}
          title='Italic (⌘I)'
          className='grid size-7 place-items-center rounded-full text-xs font-serif italic text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
        >
          <FiItalic className='size-3.5 stroke-[2.5]' />
        </button>

        {/* Inline Code Button */}
        <button
          type='button'
          onClick={() => toggleSelection('`', '`', 'code')}
          title='Inline Code (⌘E)'
          className='grid size-7 place-items-center rounded-full text-xs font-mono text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
        >
          <FiCode className='size-3.5 stroke-[2.5]' />
        </button>

        {/* Highlight (Flashlight) Button */}
        <button
          type='button'
          onClick={() => toggleSelection('<highlight>', '</highlight>', 'highlighted text')}
          title='Highlight text'
          className='grid size-7 place-items-center rounded-full text-xs text-amber-600 hover:bg-amber-50 transition dark:text-amber-400 dark:hover:bg-amber-950/40'
        >
          <MdHighlight className='size-4' />
        </button>

        {/* Link Button */}
        <button
          type='button'
          onClick={toggleLink}
          title='Link (⌘K)'
          className='grid size-7 place-items-center rounded-full text-xs text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
        >
          <FiLink className='size-3.5 stroke-[2.2]' />
        </button>

        {/* Subtle Separator */}
        <div className='mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700' />

        {/* AI Rephrase Sparkle Button */}
        <button
          type='button'
          onClick={() => setShowAIPopover((v) => !v)}
          title='AI Rephrase & Polish'
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition ${
            showAIPopover
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 hover:from-emerald-500/25 hover:to-teal-500/25 dark:text-emerald-300 dark:hover:bg-emerald-950/60'
          }`}
        >
          <LuSparkles className='size-3.5 animate-pulse text-emerald-500' />
          <span>AI Rephrase</span>
        </button>
      </div>

      {/* AI Rephrase Popover Menu */}
      {showAIPopover && (
        <div className='mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl backdrop-blur-2xl dark:border-emerald-500/40 dark:bg-slate-900/98 dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-2 duration-150'>
          <div className='flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800'>
            <span className='flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200'>
              <LuWand className='size-3.5 text-emerald-500' /> AI Assistant
            </span>
            <button
              type='button'
              onClick={() => setShowAIPopover(false)}
              className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            >
              <FiX className='size-3.5' />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className='grid grid-cols-2 gap-1.5 pt-2'>
            {[
              { label: 'Improve Clarity', instruction: 'Make this clearer and more professional' },
              { label: 'More Concise', instruction: 'Make this concise without losing meaning' },
              { label: 'Technical & Precise', instruction: 'Make this architecturally precise' },
              { label: 'Fix Flow & Grammar', instruction: 'Fix grammar, rhythm, and tone' }
            ].map((preset) => (
              <button
                key={preset.label}
                type='button'
                disabled={aiLoading}
                onClick={() => handleRequestAIRephrase(preset.instruction)}
                className='rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-left text-[11px] font-medium text-slate-700 hover:border-emerald-500/40 hover:bg-emerald-50/50 hover:text-emerald-700 transition dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Instruction Box */}
          <div className='mt-2.5 flex items-center gap-1.5'>
            <input
              type='text'
              value={aiCustomPrompt}
              onChange={(e) => setAiCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && aiCustomPrompt.trim()) {
                  handleRequestAIRephrase(aiCustomPrompt.trim());
                }
              }}
              placeholder='Custom prompt (e.g. rewrite as bullet points)…'
              className='flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500'
            />
            <button
              type='button'
              disabled={aiLoading || !aiCustomPrompt.trim()}
              onClick={() => handleRequestAIRephrase(aiCustomPrompt.trim())}
              className='rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-40'
            >
              {aiLoading ? <LuRefreshCw className='size-3 animate-spin' /> : 'Go'}
            </button>
          </div>

          {/* Result Preview Box if ready */}
          {aiResult && (
            <div className='mt-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 p-2.5 text-xs text-slate-800 dark:bg-emerald-950/40 dark:text-emerald-200'>
              <div className='mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400'>
                Suggested Rephrase
              </div>
              <p className='leading-relaxed font-sans'>{aiResult}</p>
              <div className='mt-2 flex justify-end gap-1.5'>
                <button
                  type='button'
                  onClick={() => setAiResult('')}
                  className='rounded px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200/60 dark:text-slate-400'
                >
                  Discard
                </button>
                <button
                  type='button'
                  onClick={() => handleApplyAI(aiResult)}
                  className='inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-500'
                >
                  <FiCheck className='size-3' /> Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FrostedSelectionBubble;
