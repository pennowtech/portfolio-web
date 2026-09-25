import React, { useRef, useState } from 'react';
import { FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { articleTags } from '@utils/articleDraft';
import { loadAiConfig, getActiveProviderCreds } from '@utils/admin/aiConfigStore';
import styles from './ArticleStudio.module.css';

// The Description label row with an AI button, plus a suggestion panel. A suggestion never overwrites the
// field until the writer chooses "Use this"; "Regenerate" asks for a different one as often as needed.
export default function AIDescriptionAssist({ form, onUse }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const shown = useRef([]); // everything suggested this session, so regenerating doesn't repeat itself

  const generate = async () => {
    if (loading) return;
    setOpen(true);
    setError('');
    setLoading(true);
    try {
      const creds = getActiveProviderCreds(loadAiConfig());
      const response = await fetch('/api/admin/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          tags: articleTags(form.tags),
          markdown: form.markdown,
          previous: shown.current,
          provider: creds.provider,
          model: creds.model,
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl
        })
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'The description request failed.');
      shown.current = [...shown.current, data.result].slice(-8);
      setSuggestion(data.result);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError ? 'Could not reach the server to write a description.' : requestError.message
      );
    } finally {
      setLoading(false);
    }
  };

  const length = suggestion.length;
  const lengthOk = length >= 120 && length <= 160;

  return (
    <>
      <div className={styles.labelRow}>
        <label htmlFor='article-description'>Description</label>
        <button
          type='button'
          className={styles.aiIconButton}
          onClick={generate}
          disabled={loading}
          aria-busy={loading}
          aria-label='Write a description with AI'
          title='Write an SEO-friendly description with AI'
        >
          <LuSparkles className={loading ? styles.spin : ''} />
        </button>
      </div>
      {open && (
        <div className={styles.aiSuggestion} role='region' aria-live='polite' aria-label='AI description suggestion'>
          {loading && !suggestion && <p className={styles.hint}>Writing a description from your article…</p>}
          {suggestion && (
            <>
              <p className={styles.aiSuggestionText} style={{ opacity: loading ? 0.5 : 1 }}>
                {suggestion}
              </p>
              <p className={`${styles.hint} ${lengthOk ? '' : styles.aiWarn}`}>
                {length} characters ·{' '}
                {lengthOk ? 'a good length for search results' : 'search results usually show about 120-160'}
              </p>
            </>
          )}
          {error && (
            <p className={styles.error} role='alert'>
              {error}
            </p>
          )}
          <div className={styles.aiActions}>
            <button
              type='button'
              className={styles.primary}
              disabled={!suggestion || loading}
              onClick={() => {
                onUse(suggestion);
                setOpen(false);
              }}
            >
              <FiCheck /> Use this
            </button>
            <button type='button' className={styles.button} disabled={loading} onClick={generate}>
              <FiRefreshCw className={loading ? styles.spin : ''} /> {suggestion || error ? 'Regenerate' : 'Generate'}
            </button>
            <button type='button' className={styles.button} onClick={() => setOpen(false)}>
              <FiX /> Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
