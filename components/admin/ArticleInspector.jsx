import React, { useState } from 'react';
import { FiCheck, FiChevronDown, FiTag, FiX } from 'react-icons/fi';
import CoverImagePicker from '../CoverImagePicker';
import PublicationDatePicker from '../PublicationDatePicker';
import StudioDialog from './StudioDialog';
import AIDescriptionAssist from './AIDescriptionAssist';
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
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const tags = articleTags(form.tags);
  const knownTags = [...new Map([...taxonomy.tags, ...tags].map((tag) => [tag.toLowerCase(), tag])).values()];
  const filteredTags = knownTags.filter((tag) => tag.toLowerCase().includes(tagInput.trim().toLowerCase()));
  const isSelected = (tag) => tags.some((selected) => selected.toLowerCase() === tag.toLowerCase());
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
        <AIDescriptionAssist form={form} onUse={(value) => update('description', value)} />
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
        <div className={styles.selectWrap}>
          <select {...inputProps('category')}>
            {!form.category && <option value=''>Choose a category</option>}
            {[...new Set([form.category, ...taxonomy.categories])].filter(Boolean).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FiChevronDown aria-hidden='true' />
        </div>
        <FieldError name='category' errors={errors} />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Tags</span>
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
        <button
          type='button'
          className={styles.button}
          onClick={() => {
            setTagInput('');
            setTagError('');
            setTagsOpen(true);
          }}
          aria-haspopup='dialog'
        >
          <FiTag /> {tags.length ? 'Choose tags' : 'Select tags'}
          <FiChevronDown />
        </button>
        <p className={styles.hint}>{tags.length}/12 tags selected</p>
        <StudioDialog
          open={tagsOpen}
          onClose={() => setTagsOpen(false)}
          title='Select article tags'
          actions={
            <>
              <button
                type='button'
                className={styles.button}
                disabled={disabled || !tags.length}
                onClick={() => update('tags', '')}
              >
                Clear all
              </button>
              <button type='button' className={styles.primary} onClick={() => setTagsOpen(false)}>
                Done
              </button>
            </>
          }
        >
          <label className={styles.fieldLabel} htmlFor='article-tag-input'>
            Search or add a tag
          </label>
          <input
            id='article-tag-input'
            className={styles.input}
            value={tagInput}
            onChange={(event) => {
              setTagInput(event.target.value);
              setTagError('');
            }}
            placeholder='Search all tags...'
            maxLength={80}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <p className={styles.hint}>
            {tags.length}/12 selected &middot; {filteredTags.length} matching tags
          </p>
          <div className={styles.tagChoices} aria-label='Available tags'>
            {filteredTags.map((tag) => (
              <button
                key={tag}
                type='button'
                className={`${styles.button} ${isSelected(tag) ? styles.active : ''}`}
                aria-pressed={isSelected(tag)}
                disabled={disabled || (!isSelected(tag) && tags.length >= 12)}
                onClick={() => {
                  update(
                    'tags',
                    isSelected(tag)
                      ? tags.filter((item) => item.toLowerCase() !== tag.toLowerCase()).join(', ')
                      : [...tags, tag].join(', ')
                  );
                  setTagError('');
                }}
              >
                {isSelected(tag) ? <FiCheck /> : <FiTag />}
                {tag}
              </button>
            ))}
          </div>
          {!filteredTags.length && <p className={styles.hint}>No matching tags. You can add your own.</p>}
          {tagInput.trim() && !knownTags.some((tag) => tag.toLowerCase() === tagInput.trim().toLowerCase()) && (
            <button type='button' className={styles.button} onClick={addTag} disabled={disabled || tags.length >= 12}>
              Add &ldquo;{tagInput.trim()}&rdquo;
            </button>
          )}
          {tags.length >= 12 && <p className={styles.hint}>Remove a selected tag to choose another.</p>}
          {tagError && (
            <p className={styles.error} role='status'>
              {tagError}
            </p>
          )}
        </StudioDialog>
        <FieldError name='tags' errors={errors} />
      </div>
      <div className={styles.field}>
        <label htmlFor='article-publicationDate'>Article date</label>
        <PublicationDatePicker
          id='article-publicationDate'
          value={form.publicationDate}
          onChange={(value) => update('publicationDate', value)}
          disabled={disabled}
          invalid={Boolean(errors.publicationDate)}
        />
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
