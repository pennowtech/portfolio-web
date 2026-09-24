import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import CoverImagePicker from '../CoverImagePicker';
import { articleSlug, articleTags } from '@utils/articleDraft';
import styles from './ArticleStudio.module.css';

const FieldError = ({ name, errors }) =>
  errors[name] ? (
    <p id={`error-${name}`} className={styles.error}>
      {errors[name]}
    </p>
  ) : null;

export default function ArticleInspector({
  form,
  update,
  errors,
  setSlugEdited,
  taxonomy,
  disabled,
  published,
  onUnpublish
}) {
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const tags = articleTags(form.tags);
  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (value.includes(',')) {
      setTagError('Add one tag at a time.');
      return;
    }
    if (tags.length >= 12 || value.length > 80) {
      setTagError('Use up to 12 tags, each under 80 characters.');
      return;
    }
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) update('tags', [...tags, value].join(', '));
    setTagInput('');
    setTagError('');
  };
  const inputProps = (name) => ({
    id: `article-${name}`,
    value: form[name],
    className: styles.input,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `error-${name}` : undefined,
    onChange: (event) => update(name, event.target.value)
  });

  return (
    <fieldset className={styles.settingsFields} disabled={disabled}>
      <legend className='sr-only'>Article details</legend>
      <span className={styles.fieldLabel}>Cover artwork</span>
      <CoverImagePicker
        compact
        coverUrl={form.coverUrl}
        coverUpload={form.coverUpload}
        coverCredit={form.coverCredit}
        onUrlChange={(value) => update('coverUrl', value)}
        onUploadChange={(value) => update('coverUpload', value)}
        onCreditChange={(value) => update('coverCredit', value)}
        error={errors.coverUrl}
      />
      <div className={styles.field}>
        <label htmlFor='article-description'>Description</label>
        <textarea
          {...inputProps('description')}
          rows={4}
          maxLength={500}
          placeholder='A short introduction for search and article cards…'
        />
        <p className={styles.hint}>{form.description.length}/500 · You can finish this before publishing.</p>
        <FieldError name='description' errors={errors} />
      </div>
      <div className={styles.field}>
        <label htmlFor='article-category'>Category</label>
        <input {...inputProps('category')} list='article-categories' maxLength={80} />
        <datalist id='article-categories'>
          {taxonomy.categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <FieldError name='category' errors={errors} />
      </div>
      <div className={styles.field}>
        <label htmlFor='article-tag-input'>Tags</label>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
              <button
                type='button'
                aria-label={`Remove tag ${tag}`}
                onClick={() => update('tags', tags.filter((item) => item !== tag).join(', '))}
              >
                <FiX />
              </button>
            </span>
          ))}
        </div>
        <div className={styles.row}>
          <input
            id='article-tag-input'
            className={styles.input}
            style={{ flex: 1, minWidth: 100 }}
            value={tagInput}
            list='article-tag-suggestions'
            onChange={(event) => setTagInput(event.target.value)}
            placeholder='Add a tag…'
            maxLength={80}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <button type='button' className={styles.button} onClick={addTag}>
            Add
          </button>
        </div>
        <datalist id='article-tag-suggestions'>
          {taxonomy.tags
            .filter((tag) => !tags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag} />
            ))}
        </datalist>
        <p className={styles.hint}>{tags.length}/12 tags · Press Enter to add.</p>
        {tagError && (
          <p className={styles.error} role='status'>
            {tagError}
          </p>
        )}
        <FieldError name='tags' errors={errors} />
      </div>
      <div className={styles.field}>
        <label htmlFor='article-publicationDate'>Article date</label>
        <input {...inputProps('publicationDate')} type='date' />
        <p className={styles.hint}>The date shown on your article. This does not schedule publication.</p>
        <FieldError name='publicationDate' errors={errors} />
      </div>
      <details className={styles.details} open={errors.slug ? true : undefined}>
        <summary>Search & article URL</summary>
        <div className={styles.field}>
          <div className={styles.row} style={{ justifyContent: 'space-between' }}>
            <label htmlFor='article-slug'>Article slug</label>
            <button
              className={styles.link}
              type='button'
              onClick={() => {
                setSlugEdited(false);
                update('slug', articleSlug(form.title));
              }}
            >
              Use title
            </button>
          </div>
          <input
            {...inputProps('slug')}
            maxLength={180}
            onChange={(event) => {
              setSlugEdited(true);
              update('slug', event.target.value);
            }}
          />
          <FieldError name='slug' errors={errors} />
          <p className={styles.hint}>
            {published
              ? 'Changing a published URL can break existing links.'
              : 'Generated from the title until you edit it.'}
          </p>
        </div>
        <div className={styles.serp} aria-label='Search result preview'>
          <span className={styles.hint}>/blog/{form.slug || 'your-article'}</span>
          <h3>{form.title || 'Your article title'}</h3>
          <p>{form.description || 'Your description will appear here.'}</p>
        </div>
      </details>
      {published && (
        <details className={styles.details}>
          <summary>Publishing controls</summary>
          <p className={styles.hint}>
            Remove the article from your public portfolio while keeping its content in Notion.
          </p>
          <button type='button' className={styles.button} onClick={onUnpublish}>
            Move to draft…
          </button>
        </details>
      )}
    </fieldset>
  );
}
