import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FiCheck,
  FiExternalLink,
  FiGlobe,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSend,
  FiTag,
  FiX,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import CoverImagePicker from '../CoverImagePicker';
import PublicationDatePicker from '../PublicationDatePicker';

const FieldError = ({ children }) =>
  children ? <span className='mt-1 block text-xs text-red-700 dark:text-red-300'>{children}</span> : null;

export const ArticleInspector = ({
  form,
  update,
  errors = {},
  slugEdited,
  setSlugEdited,
  slugify,
  taxonomy = { categories: [], tags: [] },
  taxonomyMessage,
  articleLoading,
  submitting,
  editingArticleId,
  editingPublished,
  save,
  tags = []
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:focus:bg-slate-900';

  const filteredTags = useMemo(() => {
    const allKnown = [...new Set([...(taxonomy.tags || []), ...tags])].filter(Boolean);
    if (!tagSearchQuery.trim()) return allKnown;
    const query = tagSearchQuery.toLowerCase().trim();
    return allKnown.filter((t) => t.toLowerCase().includes(query));
  }, [taxonomy.tags, tags, tagSearchQuery]);

  return (
    <>
      <aside
        className='overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/95 select-none'
        aria-label='Article Publishing & Media Inspector'
        id='article-form'
        aria-busy={articleLoading}
      >
        {/* Header with Publishing Actions & Status */}
        <div className='border-b border-slate-100 p-3.5 dark:border-slate-800'>
          <div className='flex items-center justify-between gap-2 pb-2.5'>
            <div className='flex items-center gap-2'>
              <div className='grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
                <FiGlobe className='size-3.5' />
              </div>
              <div>
                <h2 className='font-Neuton text-base font-bold text-slate-900 dark:text-white leading-none'>
                  Publishing Deck
                </h2>
                <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none'>
                  Inspect metadata & assets
                </p>
              </div>
            </div>

            <div className='flex items-center gap-1.5'>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  editingPublished
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    editingPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {editingPublished ? 'Published' : 'Draft'}
              </span>

              <button
                type='button'
                onClick={() => setCollapsed((v) => !v)}
                title={collapsed ? 'Expand inspector' : 'Collapse inspector'}
                className='inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 xl:hidden'
              >
                {collapsed ? <FiChevronDown className='size-3.5' /> : <FiChevronUp className='size-3.5' />}
              </button>
            </div>
          </div>

          {/* Action Buttons: Save Draft & Publish to Notion */}
          <div className='grid grid-cols-2 gap-2 pt-1'>
            <button
              type='button'
              disabled={submitting}
              onClick={() => save(false)}
              className='flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-emerald-500 hover:bg-white hover:text-emerald-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300 active:scale-98'
            >
              <FiSave className='size-3.5' />
              <span className='truncate'>
                {submitting
                  ? 'Saving…'
                  : editingArticleId
                    ? editingPublished
                      ? 'Move to draft'
                      : 'Update draft'
                    : 'Save draft'}
              </span>
            </button>

            <button
              type='button'
              disabled={submitting}
              onClick={() => save(true)}
              className='flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-98'
            >
              <FiSend className='size-3.5' />
              <span className='truncate'>
                {submitting ? 'Publishing…' : editingArticleId && editingPublished ? 'Update live' : 'Publish'}
              </span>
            </button>
          </div>

          {editingPublished && form.slug && (
            <div className='mt-2 flex items-center justify-end'>
              <Link
                href={`/blog/${form.slug}`}
                target='_blank'
                className='inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400'
              >
                <span>View live article</span>
                <FiExternalLink className='size-3' />
              </Link>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className='max-h-[calc(100vh-230px)] space-y-4 overflow-y-auto p-3.5 custom-scrollbar'>
            {/* SECTION 1: Cover Artwork Studio */}
            <section className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300'>
                  <FiImage className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                  Cover Artwork
                </span>
                <span className='text-[10px] text-slate-400'>16:9 Landscape</span>
              </div>

              <CoverImagePicker
                coverUrl={form.coverUrl}
                coverUpload={form.coverUpload}
                coverCredit={form.coverCredit}
                onUrlChange={(value) => update('coverUrl', value)}
                onUploadChange={(value) => update('coverUpload', value)}
                onCreditChange={(value) => update('coverCredit', value)}
                error={errors.coverUrl}
              />
            </section>

            {/* SECTION 2: Article Identification & SEO (Title, Slug, Description) */}
            <section className='space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800'>
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>
                  Title
                  <input
                    value={form.title}
                    onChange={(event) => update('title', event.target.value)}
                    placeholder='Enter descriptive engineering title…'
                    className={inputClass}
                    maxLength={180}
                  />
                </label>
                <FieldError>{errors.title}</FieldError>
              </div>

              <div>
                <div className='flex items-center justify-between gap-2'>
                  <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>Slug</label>
                  <button
                    type='button'
                    onClick={() => {
                      setSlugEdited(false);
                      update('slug', slugify(form.title));
                    }}
                    className='inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:underline dark:text-emerald-400'
                    title='Regenerate slug based on article title'
                  >
                    <FiRefreshCw className='size-2.5' /> Regenerate
                  </button>
                </div>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    update('slug', slugify(event.target.value));
                  }}
                  placeholder='my-awesome-article-slug'
                  className={`${inputClass} font-mono text-[11px]`}
                  maxLength={180}
                />
                <FieldError>{errors.slug}</FieldError>
              </div>

              {/* Description right next to slug */}
              <div>
                <div className='flex items-center justify-between'>
                  <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>Description</label>
                  <span
                    className={`text-[10px] font-mono ${
                      form.description.length > 480 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {form.description.length}/500
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder='Brief summary for search engines, cards, and previews…'
                  className={`${inputClass} min-h-20 resize-y`}
                  maxLength={500}
                />
                <FieldError>{errors.description}</FieldError>
              </div>
            </section>

            {/* SECTION 3: Taxonomy & Publishing (Category, Date, Tags) */}
            <section className='space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800'>
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) => update('category', event.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {[...new Set([form.category, ...taxonomy.categories])].filter(Boolean).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <FieldError>{errors.category}</FieldError>
              </div>

              {/* Publication Date (Label rendered once only, compact height) */}
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200 pb-0.5'>
                  Publication Date
                </label>
                <PublicationDatePicker
                  value={form.publicationDate}
                  onChange={(value) => update('publicationDate', value)}
                  error={errors.publicationDate}
                />
              </div>

              {/* Tags with Popup Multi-select (Max 3) */}
              <div>
                <div className='flex items-center justify-between'>
                  <label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>Tags</label>
                  <span className='text-[10px] text-slate-400 font-medium'>{tags.length}/3 selected</span>
                </div>

                <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className='inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30'
                    >
                      <span className='truncate max-w-[120px]'>{tag}</span>
                      <button
                        type='button'
                        onClick={() => {
                          const next = tags.filter((t) => t !== tag);
                          update('tags', next.join(', '));
                        }}
                        title={`Remove tag "${tag}"`}
                        className='text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200'
                      >
                        <FiX className='size-3' />
                      </button>
                    </span>
                  ))}

                  <button
                    type='button'
                    onClick={() => {
                      setTagSearchQuery('');
                      setTagsModalOpen(true);
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      tags.length === 0
                        ? 'h-9 w-full justify-center border-dashed border-slate-300 bg-slate-50/60 text-slate-600 hover:border-emerald-500 hover:bg-emerald-50/30 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300'
                    }`}
                  >
                    <FiTag className='size-3 text-emerald-600 dark:text-emerald-400' />
                    <span>
                      {tags.length === 0 ? 'Select tags (max 3)…' : tags.length < 3 ? '+ Add tag' : 'Change tags'}
                    </span>
                  </button>
                </div>
                <FieldError>{errors.tags}</FieldError>
                {taxonomyMessage && (
                  <p className='mt-1 text-[10px] text-amber-600 dark:text-amber-400'>{taxonomyMessage}</p>
                )}
              </div>
            </section>
          </div>
        )}
      </aside>

      {/* Tags Multi-select Modal Popup (Max 3) */}
      {tagsModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
          <div
            className='w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'
            role='dialog'
            aria-modal='true'
            aria-labelledby='tags-modal-title'
          >
            {/* Modal Header */}
            <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
              <div className='flex items-center gap-2.5'>
                <div className='grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
                  <FiTag className='size-4' />
                </div>
                <div>
                  <h3 id='tags-modal-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
                    Select Article Tags
                  </h3>
                  <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                    Choose up to 3 tags for categorization
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={() => setTagsModalOpen(false)}
                className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                aria-label='Close tags modal'
              >
                <FiX className='size-4' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-4 space-y-3.5'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-2.5 size-4 text-slate-400' />
                <input
                  type='text'
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder='Search or add custom tag…'
                  className='w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
                />
              </div>

              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-500 dark:text-slate-400'>
                  <strong className='text-emerald-600 dark:text-emerald-400'>{tags.length}</strong> of 3 selected
                </span>
                {tags.length >= 3 && (
                  <span className='text-[11px] font-medium text-amber-600 dark:text-amber-400'>
                    Maximum 3 tags reached
                  </span>
                )}
              </div>

              {/* Tags Grid */}
              <div className='max-h-56 overflow-y-auto pr-1 custom-scrollbar space-y-2'>
                <div className='flex flex-wrap gap-1.5'>
                  {filteredTags.map((tag) => {
                    const isSelected = tags.includes(tag);
                    const isMaxReached = tags.length >= 3 && !isSelected;

                    return (
                      <button
                        key={tag}
                        type='button'
                        disabled={isMaxReached}
                        onClick={() => {
                          if (isSelected) {
                            update('tags', tags.filter((t) => t !== tag).join(', '));
                          } else if (tags.length < 3) {
                            update('tags', [...tags, tag].join(', '));
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isMaxReached
                              ? 'cursor-not-allowed bg-slate-100 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                        }`}
                        title={isMaxReached ? 'Maximum 3 tags already selected' : ''}
                      >
                        {isSelected && <FiCheck className='size-3' />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom tag addition */}
                {tagSearchQuery.trim() &&
                  !taxonomy.tags.some((t) => t.toLowerCase() === tagSearchQuery.trim().toLowerCase()) && (
                    <div className='pt-1'>
                      <button
                        type='button'
                        disabled={tags.length >= 3}
                        onClick={() => {
                          const newTag = tagSearchQuery.trim();
                          if (!tags.includes(newTag) && tags.length < 3) {
                            update('tags', [...tags, newTag].join(', '));
                            setTagSearchQuery('');
                          }
                        }}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-500/60 bg-emerald-50/50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <FiPlus className='size-3' />
                        <span>Add &ldquo;{tagSearchQuery.trim()}&rdquo;</span>
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
              <button
                type='button'
                onClick={() => update('tags', '')}
                disabled={tags.length === 0}
                className='text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-40 dark:text-slate-400 dark:hover:text-red-400'
              >
                Clear all
              </button>

              <button
                type='button'
                onClick={() => setTagsModalOpen(false)}
                className='rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500'
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleInspector;
