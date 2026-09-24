export const emptyArticle = (publicationDate = '') => ({
  title: '',
  slug: '',
  description: '',
  coverUrl: '',
  coverUpload: null,
  coverCredit: null,
  publicationDate,
  category: 'Software Architecture',
  tags: '',
  markdown: ''
});

export const articleSlug = (value) => {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/@/g, ' at ')
    .replace(/%/g, ' percent ')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug && value.trim()) {
    const hash = [...value].reduce((n, c) => (n * 31 + c.codePointAt(0)) >>> 0, 2166136261);
    return `article-${hash.toString(36)}`;
  }
  return slug.slice(0, 160).replace(/-+$/g, '');
};

export const articleTags = (value) => [
  ...new Set(
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  )
];
export const draftKey = (owner, articleId) => `sbt:article-draft:v1:${encodeURIComponent(owner)}:${articleId || 'new'}`;
export const formFingerprint = (form) => JSON.stringify(form);

// Stored data is versioned, scoped to the signed-in author, and never treated as HTML.
export const readArticleDraft = (storage, key) => {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const draft = JSON.parse(raw);
  if (draft.version !== 1 || !draft.form || typeof draft.slugEdited !== 'boolean') return null;
  const form = draft.form;
  if (
    Object.keys(emptyArticle()).some(
      (field) => !['coverUpload', 'coverCredit'].includes(field) && typeof form[field] !== 'string'
    )
  )
    return null;
  if (form.coverUpload && (typeof form.coverUpload.dataUrl !== 'string' || typeof form.coverUpload.name !== 'string'))
    return null;
  if (
    form.coverCredit &&
    ['photographer', 'profileUrl', 'provider', 'providerUrl'].some(
      (field) => typeof form.coverCredit[field] !== 'string'
    )
  )
    return null;
  return draft;
};

export const writeArticleDraft = (storage, key, form, slugEdited) => {
  const draft = { version: 1, savedAt: new Date().toISOString(), slugEdited, form };
  // Keep the full draft, including pending cover uploads. Quota errors are surfaced to the writer.
  storage.setItem(key, JSON.stringify(draft));
  return draft;
};
