import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FiX,
  FiSend,
  FiCopy,
  FiCheck,
  FiBookmark,
  FiTrash2,
  FiBookOpen,
  FiHelpCircle,
  FiCornerDownLeft
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { getBookCoverSrc } from '@utils/books/bookService';
import { loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';

export const BookAskAiModal = ({ isOpen, onClose, book, onSaveNote }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [activeModel, setActiveModel] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageSequenceRef = useRef(0);

  const nextMessageId = (prefix) => {
    messageSequenceRef.current += 1;
    return `${prefix}-${messageSequenceRef.current}`;
  };

  // Auto-focus input when opened & load configured provider info
  useEffect(() => {
    if (isOpen) {
      setError('');
      try {
        const creds = getActiveProviderCreds(loadAiConfig());
        if (creds?.model) {
          setActiveModel(`${creds.provider}: ${creds.model}`);
        } else if (creds?.provider) {
          setActiveModel(creds.provider);
        }
      } catch {
        setActiveModel('AI Assistant');
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, book?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen || !book) return null;

  // Build smart context-sensitive question chips tailored to the current book
  const firstTheme = Array.isArray(book.keyThemes) && book.keyThemes.length ? book.keyThemes[0] : null;
  const firstAudience =
    Array.isArray(book.targetAudience) && book.targetAudience.length ? book.targetAudience[0] : null;

  const quickPrompts = [
    'What are the top 3 actionable insights from this book?',
    'Summarize the core mental model or framework.',
    firstTheme ? `How does the author explain ${firstTheme}?` : 'What critical trade-offs are explored in this book?',
    firstAudience
      ? `Why is this book indispensable for ${firstAudience}?`
      : 'Why is this book worth reading over other alternatives?'
  ];

  const handleSend = async (questionText) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    setInput('');
    setError('');

    const userMessage = {
      id: nextMessageId('user'),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoading(true);

    try {
      const creds = getActiveProviderCreds(loadAiConfig());
      const response = await fetch('/api/admin/books/ai-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description,
            whyRead: book.whyRead,
            keyThemes: book.keyThemes,
            targetAudience: book.targetAudience,
            notableQuotes: book.notableQuotes || book.quotes,
            publisher: book.publisher,
            publishedYear: book.publishedYear,
            shelf: book.shelf,
            status: book.status,
            notes: book.notes,
            legacy: book.legacy
          },
          question: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          provider: creds?.provider,
          apiKey: creds?.apiKey,
          baseUrl: creds?.baseUrl,
          model: creds?.model
        })
      });

      const data = await response.json();
      if (!data.ok) {
        setError(data.message || 'Failed to get an answer from the AI provider.');
        return;
      }

      if (data.model) {
        setActiveModel(data.model);
      }

      const assistantMessage = {
        id: nextMessageId('ai'),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      };

      setMessages([...newHistory, assistantMessage]);
    } catch {
      setError('Could not reach the server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id, text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSaveToNotes = (id, text) => {
    if (onSaveNote) {
      onSaveNote(`\n\n### AI Synthesis on "${book.title}":\n${text}`);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2500);
    }
  };

  const handleClearHistory = () => {
    if (messages.length === 0) return;
    if (window.confirm('Clear conversation history for this session?')) {
      setMessages([]);
      setError('');
    }
  };

  const coverSrc = getBookCoverSrc(book);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-md font-sans animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='relative flex flex-col w-full max-w-3xl h-[88vh] max-h-[850px] rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-100'
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 shrink-0 font-sans'>
          <div className='flex items-center gap-3.5 min-w-0'>
            <div className='w-9 h-12 rounded-md overflow-hidden shrink-0 shadow border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center'>
              {coverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverSrc} alt={book.title} className='size-full object-cover object-center' />
              ) : (
                <FiBookOpen className='size-4 text-slate-400' />
              )}
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='h-[20px] inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-sans leading-none'>
                  <LuSparkles className='size-3 text-amber-500 dark:text-amber-300 animate-pulse' /> Ask AI Companion
                </span>
                {activeModel && (
                  <span className='text-[10.5px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline-block font-sans'>
                    {activeModel}
                  </span>
                )}
              </div>
              <h2 className='text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-sans'>
                {book.title}
              </h2>
              <p className='text-xs text-slate-500 dark:text-slate-400 truncate font-sans'>
                by <span className='text-slate-800 dark:text-slate-200 font-medium'>{book.author}</span>
                {book.publishedYear ? ` (${book.publishedYear})` : ''} · Context Grounded
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0 font-sans'>
            {messages.length > 0 && (
              <button
                type='button'
                onClick={handleClearHistory}
                title='Clear history'
                className='p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition font-sans'
              >
                <FiTrash2 className='size-4' />
              </button>
            )}
            <button
              type='button'
              onClick={onClose}
              className='p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition font-sans'
            >
              <FiX className='size-5' />
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className='px-5 py-2.5 bg-rose-50 border-b border-rose-200 dark:bg-rose-950/50 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between font-sans shrink-0'>
            <span>{error}</span>
            <button
              type='button'
              onClick={() => setError('')}
              className='text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-100 font-bold ml-3'
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CONVERSATION FEED */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 font-sans'>
          {/* Welcoming state when no messages */}
          {messages.length === 0 && (
            <div className='max-w-xl mx-auto py-6 text-center space-y-4 font-sans'>
              <div className='size-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'>
                <LuSparkles className='size-6 text-amber-500 dark:text-amber-300' />
              </div>
              <div>
                <h3 className='text-base font-bold text-slate-900 dark:text-white font-sans'>
                  Explore &ldquo;{book.title}&rdquo; with AI
                </h3>
                <p className='text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans'>
                  Ask questions specifically grounded in this book&apos;s arguments, architecture paradigms, mental
                  models, chapter theses, and key takeaways.
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className='pt-2 space-y-2 text-left'>
                <small className='block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans text-center'>
                  Suggested Exploration Questions
                </small>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type='button'
                      onClick={() => handleSend(prompt)}
                      className='text-left p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-indigo-400 text-xs text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:hover:border-indigo-500/50 dark:text-slate-200 transition-all font-sans leading-relaxed group shadow-xs'
                    >
                      <span className='flex items-start gap-2'>
                        <FiHelpCircle className='size-3.5 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0 group-hover:text-amber-500 transition-colors' />
                        <span>{prompt}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render dialogue bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 font-sans ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className='size-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-indigo-600/20 mt-1'>
                  <LuSparkles className='size-4 text-amber-300' />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 font-sans text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className='leading-relaxed font-sans whitespace-pre-wrap'>{msg.content}</p>
                ) : (
                  <div className='space-y-2 font-sans'>
                    <ReactMarkdown
                      components={{
                        code: ({ node, inline, className, children, ...props }) => (
                          <code
                            className='bg-slate-200 dark:bg-slate-900/90 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs font-sans font-medium'
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ node, children, ...props }) => (
                          <pre
                            className='bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl overflow-x-auto text-xs text-slate-800 dark:text-slate-200 font-sans my-2.5'
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        p: ({ children }) => <p className='mb-2 last:mb-0 leading-relaxed font-sans'>{children}</p>,
                        ul: ({ children }) => <ul className='list-disc pl-5 mb-2 space-y-1 font-sans'>{children}</ul>,
                        ol: ({ children }) => (
                          <ol className='list-decimal pl-5 mb-2 space-y-1 font-sans'>{children}</ol>
                        ),
                        li: ({ children }) => <li className='leading-relaxed font-sans'>{children}</li>,
                        h1: ({ children }) => (
                          <h3 className='text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 font-sans'>
                            {children}
                          </h3>
                        ),
                        h2: ({ children }) => (
                          <h3 className='text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 font-sans'>
                            {children}
                          </h3>
                        ),
                        h3: ({ children }) => (
                          <h4 className='text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1 font-sans'>
                            {children}
                          </h4>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className='border-l-2 border-indigo-500 pl-3 py-1 my-2 text-slate-600 dark:text-slate-300 italic font-sans'>
                            {children}
                          </blockquote>
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* AI Response Footer Micro-actions */}
                    <div className='flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-3 font-sans'>
                      <button
                        type='button'
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className='inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition font-sans'
                      >
                        {copiedId === msg.id ? (
                          <>
                            <FiCheck className='size-3 text-emerald-500 dark:text-emerald-400' />
                            <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>Copied</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className='size-3' />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>

                      {onSaveNote && (
                        <button
                          type='button'
                          onClick={() => handleSaveToNotes(msg.id, msg.content)}
                          className='inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition font-sans ml-2'
                        >
                          {savedId === msg.id ? (
                            <>
                              <FiCheck className='size-3 text-emerald-500 dark:text-emerald-400' />
                              <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>
                                Saved to Notes!
                              </span>
                            </>
                          ) : (
                            <>
                              <FiBookmark className='size-3' />
                              <span>Save to Book Notes</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Loading Shimmer */}
          {loading && (
            <div className='flex gap-3 justify-start font-sans'>
              <div className='size-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-indigo-600/20'>
                <LuSparkles className='size-4 text-amber-300 animate-spin' />
              </div>
              <div className='rounded-2xl p-4 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 font-sans text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5'>
                <div className='flex gap-1'>
                  <span
                    className='size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce'
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className='size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce'
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className='size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce'
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span>Analyzing &ldquo;{book.title}&rdquo; context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT COMPOSER BAR */}
        <div className='p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 shrink-0 font-sans'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className='flex items-center gap-2'
          >
            <div className='relative flex-1'>
              <input
                ref={inputRef}
                type='text'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask any question about "${book.title}"...`}
                disabled={loading}
                className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans transition disabled:opacity-50'
              />
            </div>

            <button
              type='submit'
              disabled={!input.trim() || loading}
              className='inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-sans'
            >
              <span>Ask</span>
              <FiSend className='size-3.5' />
            </button>
          </form>
          <div className='flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 px-1 font-sans'>
            <span>
              Grounding: {book.title} by {book.author}
            </span>
            <span className='hidden sm:inline'>Press Enter ↵ to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAskAiModal;
