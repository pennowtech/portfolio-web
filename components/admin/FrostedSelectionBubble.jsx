import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiBold, FiItalic, FiCode, FiLink } from 'react-icons/fi';
import { MdHighlight } from 'react-icons/md';
import { LuSparkles } from 'react-icons/lu';

// onAIRephrase({ text, from, to }): opens the AIRephraseModal (owned by the
// parent, since it needs to apply the result back via the same editor view)
// scoped to this selection.
export const FrostedSelectionBubble = ({ getEditorView, onAIRephrase }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
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
      setVisible(false);
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
  }, [getEditorView]);

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

  const openRephrase = () => {
    const editorView = getEditorView?.();
    if (!editorView) return;
    const { selection } = editorView.state;
    const selected = editorView.state.sliceDoc(selection.main.from, selection.main.to);
    if (!selected) return;
    onAIRephrase?.({ text: selected, from: selection.main.from, to: selection.main.to });
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

        {/* AI Rephrase Sparkle Button -- opens the shared AIRephraseModal */}
        <button
          type='button'
          onClick={openRephrase}
          title='AI Rephrase & Polish'
          className='flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:from-emerald-500/25 hover:to-teal-500/25 dark:text-emerald-300 dark:hover:bg-emerald-950/60'
        >
          <LuSparkles className='size-3.5 animate-pulse text-emerald-500' />
          <span>AI Rephrase</span>
        </button>
      </div>
    </div>
  );
};

export default FrostedSelectionBubble;
