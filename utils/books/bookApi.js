const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || 'The bookshelf request failed.');
  return payload;
};

export const fetchBooks = async () => {
  const payload = await parseResponse(await fetch('/api/admin/books', { headers: { Accept: 'application/json' } }));
  return payload.books;
};

export const fetchBook = async (id) => {
  const payload = await parseResponse(await fetch(`/api/admin/books/${encodeURIComponent(id)}`));
  return payload.book;
};

export const createPersistedBook = async (book) => {
  const payload = await parseResponse(
    await fetch('/api/admin/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    })
  );
  return payload.book;
};

export const updatePersistedBook = async (id, updates) => {
  const payload = await parseResponse(
    await fetch(`/api/admin/books/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
  );
  return payload.book;
};

export const deletePersistedBook = async (id) => {
  await parseResponse(await fetch(`/api/admin/books/${encodeURIComponent(id)}`, { method: 'DELETE' }));
};
