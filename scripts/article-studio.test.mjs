import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyArticle, articleSlug, draftKey, readArticleDraft, writeArticleDraft } from '../utils/articleDraft.js';
import { validateArticle } from '../utils/articleValidation.js';

test('unfinished drafts can be saved without publication metadata or a complete body', () => {
  const draft = { ...emptyArticle('2026-09-24'), title: 'Hi', slug: 'hi', tags: [] };
  assert.deepEqual(validateArticle(draft).errors, {});
  const published = validateArticle({ ...draft, published: true });
  assert.ok(published.errors.title);
  assert.ok(published.errors.description);
  assert.ok(published.errors.markdown);
});

test('publishing validation remains strict and cover artwork remains optional', () => {
  const draft = {
    ...emptyArticle('2026-09-24'),
    title: 'A reliable service',
    slug: 'a-reliable-service',
    description: 'How to design retries that are safe for the user.',
    markdown: 'A practical engineering example. '.repeat(10),
    tags: [],
    published: true
  };
  assert.deepEqual(validateArticle(draft).errors, {});
  assert.ok(validateArticle({ ...draft, coverUrl: 'javascript:alert(1)' }).errors.coverUrl);
  assert.ok(validateArticle({ ...draft, tags: Array.from({ length: 13 }, (_, i) => `tag${i}`) }).errors.tags);
  assert.ok(validateArticle({ ...draft, markdown: 'x'.repeat(150001) }).errors.markdown);
});

test('local backups preserve Markdown and pending cover data and separate author/article identity', () => {
  const items = new Map();
  const storage = { getItem: (key) => items.get(key), setItem: (key, value) => items.set(key, value) };
  const form = {
    ...emptyArticle('2026-09-24'),
    title: 'First thought',
    markdown: '<note heading="Keep">\nAn unfinished idea\n</note>',
    coverUpload: { name: 'cover.png', dataUrl: 'data:image/png;base64,AAAA' }
  };
  const key = draftKey('writer@example.com', 'article-1');
  writeArticleDraft(storage, key, form, true);
  assert.deepEqual(readArticleDraft(storage, key).form, form);
  assert.equal(readArticleDraft(storage, key).slugEdited, true);
  assert.equal(readArticleDraft(storage, draftKey('other@example.com', 'article-1')), null);
  assert.equal(readArticleDraft(storage, draftKey('writer@example.com', 'article-2')), null);
  assert.equal(readArticleDraft(storage, draftKey('writer@example.com', '')), null);
});

test('malformed backups are not restored and storage failures are never reported as success', () => {
  const storage = {
    getItem: () => JSON.stringify({ version: 1, slugEdited: true, form: { title: 'Incomplete shape' } })
  };
  assert.equal(readArticleDraft(storage, 'key'), null);
  assert.throws(() => readArticleDraft({ getItem: () => '{' }, 'key'));
  assert.throws(
    () =>
      writeArticleDraft(
        {
          setItem: () => {
            throw new Error('Quota exceeded');
          }
        },
        'key',
        emptyArticle(),
        false
      ),
    /Quota exceeded/
  );
});

test('generated slugs work for accented titles, symbols, and non-Latin scripts', () => {
  assert.equal(articleSlug('C++ & Café'), 'c-plus-plus-and-cafe');
  assert.match(articleSlug('工程設計'), /^article-[a-z0-9]+$/);
  assert.equal(articleSlug(''), '');
  assert.ok(articleSlug('long title '.repeat(100)).length <= 160);
});
