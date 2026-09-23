// Book-shelf-specific settings (currently just an optional Google Books API
// key) -- kept separate from utils/admin/aiConfigStore.js since it's not an
// AI provider credential, it's a quota-lifting key for the keyless Google
// Books lookups in utils/books/bookMetadataLookup.js.
const STORAGE_KEY = 'sb_books_settings';

export const DEFAULT_BOOK_SETTINGS = { googleBooksApiKey: '' };

export const loadBookSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_BOOK_SETTINGS, ...JSON.parse(stored) } : DEFAULT_BOOK_SETTINGS;
  } catch {
    return DEFAULT_BOOK_SETTINGS;
  }
};

export const saveBookSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore -- settings just won't persist across reloads
  }
};
