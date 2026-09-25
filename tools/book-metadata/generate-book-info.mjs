/* eslint-disable no-console */
/**
 * Book Metadata & Cover Generator - Standalone Version
 *
 * Generates comprehensive book metadata (title, author, overview, themes, etc.)
 * and downloads book covers for a given list of book titles.
 *
 * Supports multiple AI providers:
 *   - mistral (default model: mistral-small-latest)
 *   - ollama  (default model: llama3.2:latest, local or cloud)
 *   - openai  (default model: gpt-4o-mini)
 *   - gemini  (default model: gemini-2.5-flash)
 *
 * node generate-book-info.mjs --titles "Think and Grow Rich" --provider mistral --model labs-leanstral-1-5-1 --debug --cover-source openlibrary
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(baseDir, 'output');
const coversDir = path.join(outputDir, 'covers');
const logsDir = path.join(baseDir, 'logs');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });
fs.mkdirSync(logsDir, { recursive: true });

// Debug logging
let DEBUG_MODE = false;
function debug(message) {
  if (DEBUG_MODE) console.log(`[DEBUG] ${message}`);
}

// Simple failure logger
function createFailureLogger(baseDir, generator) {
  const logsDir = path.join(baseDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  let sequence = 0;
  let activePath = null;
  const filenamePrefix = 'generate-errors-';

  function timestampForFilename(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
  }

  function createLogPath() {
    const suffix = sequence === 0 ? '' : `-${sequence}`;
    sequence += 1;
    activePath = path.join(logsDir, `${filenamePrefix}${timestampForFilename()}${suffix}.jsonl`);
    fs.closeSync(fs.openSync(activePath, 'a'));
    return activePath;
  }

  function logFailure(details) {
    const record = { timestamp: new Date().toISOString(), generator, ...details };
    let line = `${JSON.stringify(record)}\n`;
    if (!activePath) createLogPath();
    if (activePath && fs.existsSync(activePath)) {
      const currentBytes = fs.statSync(activePath).size;
      if (currentBytes + Buffer.byteLength(line, 'utf8') > 5 * 1024 * 1024) createLogPath();
    }
    fs.appendFileSync(activePath, line, 'utf8');
    return activePath;
  }

  return { logFailure };
}

// Load .env files
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return false;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    let loadedKeys = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
          loadedKeys.push(key);
        }
      }
    }
    debug(`Loaded .env from ${envPath}: ${loadedKeys.join(', ') || 'none'}`);
    return true;
  } catch {
    return false;
  }
}

// Search for .env files in multiple locations
const envPaths = [
  path.resolve(baseDir, '.env'),
  path.resolve(baseDir, '.env.local'),
  path.resolve(baseDir, '..', '.env'),
  path.resolve(baseDir, '..', '.env.local')
];

envPaths.forEach((p) => loadEnv(p));

const args = process.argv.slice(2);
const getArgValue = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : (args[index + 1] ?? null);
};

if (args.includes('--help')) {
  console.log(`Book Metadata & Cover Generator

Providers:
  --provider NAME  AI provider: 'mistral', 'ollama', 'openai', 'gemini' (default: ollama)
  --api-key KEY    API key for provider (defaults to env variables)

Input:
  --titles "Book 1, Book 2"  Comma-separated list
  --input FILE             JSON file with book list
  --image FILE             Image file (bookshelf photo) to extract titles from

Output:
  --output FILE    Output JSON file (default: output/books.json)
  --covers-dir DIR Directory for covers (default: output/covers)
  --cover-source   Preferred cover source: 'google' or 'openlibrary' (default: google first, then openlibrary)

AI Options:
  --model NAME      Model name
  --host URL        Ollama host (default: http://localhost:11434)
  --delay MS        Delay between requests (default: 200 for ollama, 500 for cloud)
  --temperature T   AI temperature (default: 0.15)
  --debug           Enable debug logging
  --help            Show this help

Examples:
  node generate-book-info.mjs --titles "Think and Grow Rich" --provider ollama --model ornith-1.5:9b
  node generate-book-info.mjs --titles "Think and Grow Rich" --provider mistral --model labs-leanstral-1-5-1
  node generate-book-info.mjs --titles "Think and Grow Rich" --provider ollama --debug
  node generate-book-info.mjs --titles "Think and Grow Rich" --cover-source openlibrary
`);
  process.exit(0);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

// Parse arguments
DEBUG_MODE = args.includes('--debug');

const rawProvider = (getArgValue('--provider') ?? '').toLowerCase();
let provider = rawProvider;
if (!provider) {
  const modelArg = getArgValue('--model')?.toLowerCase() ?? '';
  if (modelArg.startsWith('mistral') || modelArg.startsWith('codestral') || modelArg.startsWith('pixtral')) {
    provider = 'mistral';
  } else if (modelArg.startsWith('gpt') || modelArg.startsWith('o1') || modelArg.startsWith('o3')) {
    provider = 'openai';
  } else if (modelArg.startsWith('gemini')) {
    provider = 'gemini';
  } else {
    provider = 'ollama';
  }
}

if (!['mistral', 'ollama', 'unsloth', 'openai', 'gemini'].includes(provider)) {
  fail(`Unknown provider '${provider}'. Use: mistral, ollama, unsloth, openai, gemini`);
}

const defaultModels = {
  mistral: 'mistral-small-latest',
  ollama: 'llama3.2:latest',
  unsloth: 'unsloth-model',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash'
};
const model = getArgValue('--model') ?? defaultModels[provider];
let apiKey = getArgValue('--api-key')?.trim() ?? '';

if (!apiKey) {
  const envVar =
    provider === 'mistral'
      ? 'MISTRAL_API_KEY'
      : provider === 'openai'
        ? 'OPENAI_API_KEY'
        : provider === 'gemini'
          ? 'GEMINI_API_KEY'
          : provider === 'unsloth'
            ? 'UNSLOTH_API_KEY'
            : 'OLLAMA_API_KEY';
  apiKey = process.env[envVar]?.trim() ?? '';
}

debug(`Provider: ${provider}, Model: ${model}`);
debug(`API Key: ${apiKey ? `***.${apiKey.slice(-4)}` : 'not set'}`);

if ((provider === 'mistral' || provider === 'openai' || provider === 'gemini') && !apiKey) {
  console.error(`\n${provider.toUpperCase()} requires an API key.`);
  console.error(
    `Set ${provider === 'mistral' ? 'MISTRAL_API_KEY' : provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'} in .env`
  );
  console.error(`\nSearched for .env in:`);
  envPaths.forEach((p) => console.error(`  ${fs.existsSync(p) ? '✓' : '✗'} ${p}`));
  process.exit(1);
}

const host = (getArgValue('--host') || 'http://localhost:11434').replace(/\/$/, '');
const customOutputPath = getArgValue('--output');
const customCoversDir = getArgValue('--covers-dir');
const coverSource = getArgValue('--cover-source')?.toLowerCase();
const throttleDelay = parseInt(getArgValue('--delay') || (provider === 'ollama' ? '200' : '500'), 10);
const temperature = parseFloat(getArgValue('--temperature') || '0.15');

const failureLogger = createFailureLogger(baseDir, `book-metadata:${provider}`);

// Parse input
let bookTitles = [];
const titlesArg = getArgValue('--titles');
const inputFile = getArgValue('--input');
const imageFile = getArgValue('--image');

if (imageFile) {
  const imagePath = path.resolve(baseDir, imageFile);
  if (!fs.existsSync(imagePath)) fail(`Image file not found: ${imagePath}`);
  bookTitles = await extractTitlesFromImage(imagePath);
} else if (titlesArg) {
  bookTitles = titlesArg
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t);
} else if (inputFile) {
  const inputPath = path.resolve(baseDir, inputFile);
  if (!fs.existsSync(inputPath)) fail(`Input file not found: ${inputPath}`);
  try {
    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    bookTitles = Array.isArray(inputData) ? inputData : inputData.books || [];
  } catch (e) {
    fail(`Failed to parse input file: ${e.message}`);
  }
} else {
  fail('No input. Use --titles, --input, or --image.');
}

if (bookTitles.length === 0) {
  fail('No book titles to process.');
}

const finalOutputPath = customOutputPath ? path.resolve(baseDir, customOutputPath) : path.join(outputDir, 'books.json');
const finalCoversDir = customCoversDir ? path.resolve(baseDir, customCoversDir) : coversDir;

console.log('=======================================================');
console.log('Book Metadata & Cover Generator');
console.log(`Provider: ${provider.toUpperCase()}`);
console.log(`Model: ${model}`);
console.log(`Books: ${bookTitles.join(', ')}`);
console.log(`Output: ${finalOutputPath}`);
console.log('=======================================================\n');

if (DEBUG_MODE) {
  console.log('[DEBUG MODE ENABLED]\n');
}

// Image-based title extraction
async function extractTitlesFromImage(imagePath) {
  debug(`Extracting book titles from image: ${imagePath}`);

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

  const prompt = `Analyze this image of a bookshelf or book stack. Identify all visible book titles and authors from the spines/covers.

Return ONLY a JSON array of objects with "title" and "author" fields:
[
  {"title": "Book Title", "author": "Author Name"},
  {"title": "Another Book", "author": "Another Author"}
]

If a title or author is unclear, use "Unknown". Only include books you can clearly read.`;

  try {
    debug(`AI request to ${provider} (${model}) for image analysis`);

    let response;
    if (provider === 'mistral') {
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });
    } else if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });
    } else if (provider === 'gemini') {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }]
              }
            ],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
    } else {
      // Ollama with vision model
      response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          images: [base64Image],
          format: 'json',
          stream: false,
          options: { temperature: 0.1, num_predict: 2048 }
        })
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`${provider.toUpperCase()} HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const { rawText } = await extractRawContent(response);
    const parsed = JSON.parse(rawText);

    // Handle both array and object with books array
    const books = Array.isArray(parsed) ? parsed : parsed.books || [];
    const titles = books.filter((b) => b.title && b.title !== 'Unknown').map((b) => b.title);

    console.log(`Extracted ${titles.length} book titles from image: ${titles.join(', ')}`);
    return titles;
  } catch (err) {
    failureLogger.logFailure({ imagePath, errorMessage: err.message });
    throw new Error(`Failed to extract titles from image: ${err.message}`);
  }
}

// Book cover functions
async function downloadBookCover(title, author = '', isbn = '') {
  debug(`Searching cover for: "${title}"${isbn ? ` (ISBN: ${isbn})` : ''}`);

  // Determine order based on coverSource flag
  // No flag or 'google' → Google first, then Open Library
  // 'openlibrary' → Open Library first, then Google
  const googleFirst = coverSource !== 'openlibrary';

  const tryFirst = googleFirst ? 'google' : 'openlibrary';
  const trySecond = googleFirst ? 'openlibrary' : 'google';

  // Try first source
  const firstResult = await tryCoverSource(tryFirst, title, author, isbn);
  if (firstResult) return firstResult;

  // Fallback to second source
  debug(`  ${tryFirst} failed, trying ${trySecond}...`);
  const secondResult = await tryCoverSource(trySecond, title, author, isbn);
  if (secondResult) return secondResult;

  return { coverUrl: null, source: null };
}

async function tryCoverSource(source, title, author, isbn) {
  if (source === 'google') {
    try {
      const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim() ?? '';
      let query = isbn ? `isbn:${isbn}` : `intitle:${title}${author ? `+inauthor:${author}` : ''}`;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${googleBooksApiKey ? `&key=${googleBooksApiKey}` : ''}`;
      debug(`  Google Books URL: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const volume = data.items?.[0]?.volumeInfo;
      if (volume) {
        const links = volume.imageLinks;
        if (links) {
          const coverUrl = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
          if (coverUrl) {
            return {
              coverUrl: coverUrl.replace('http://', 'https://'),
              source: 'google',
              ratings: {
                google: volume.averageRating
                  ? {
                      average: volume.averageRating,
                      count: volume.ratingsCount || 0
                    }
                  : null
              }
            };
          }
        }
        // Return ratings even if no cover
        if (volume.averageRating) {
          return {
            coverUrl: null,
            source: 'google',
            ratings: {
              google: {
                average: volume.averageRating,
                count: volume.ratingsCount || 0
              }
            }
          };
        }
      }
      // Fallback to title+author search if ISBN search failed
      if (isbn) {
        debug(`  Google Books ISBN search failed, trying title+author search...`);
        const fallbackQuery = `intitle:${title}${author ? `+inauthor:${author}` : ''}`;
        const titleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(fallbackQuery)}&maxResults=1${googleBooksApiKey ? `&key=${googleBooksApiKey}` : ''}`;
        const titleRes = await fetch(titleUrl);
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          const titleVolume = titleData.items?.[0]?.volumeInfo;
          if (titleVolume) {
            const titleLinks = titleVolume.imageLinks;
            if (titleLinks) {
              const coverUrl =
                titleLinks.extraLarge ||
                titleLinks.large ||
                titleLinks.medium ||
                titleLinks.thumbnail ||
                titleLinks.smallThumbnail;
              if (coverUrl) {
                return {
                  coverUrl: coverUrl.replace('http://', 'https://'),
                  source: 'google',
                  ratings: titleVolume.averageRating
                    ? {
                        google: {
                          average: titleVolume.averageRating,
                          count: titleVolume.ratingsCount || 0
                        }
                      }
                    : {}
                };
              }
            }
            if (titleVolume.averageRating) {
              return {
                coverUrl: null,
                source: 'google',
                ratings: {
                  google: {
                    average: titleVolume.averageRating,
                    count: titleVolume.ratingsCount || 0
                  }
                }
              };
            }
          }
        }
      }
    } catch (e) {
      debug(`  Google Books failed: ${e.message}`);
    }
    return null;
  }

  if (source === 'openlibrary') {
    try {
      let url = isbn
        ? `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`
        : `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}&limit=1`;
      debug(`  Open Library URL: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.docs?.[0]?.cover_id || data.docs?.[0]?.cover_i) {
        const coverId = data.docs[0].cover_id || data.docs[0].cover_i;
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        const verify = await fetch(coverUrl, { method: 'HEAD' });
        if (verify.ok) return { coverUrl, source: 'openlibrary' };
      }
      // Fallback to title+author search if ISBN search failed
      if (isbn) {
        debug(`  Open Library ISBN search failed, trying title+author search...`);
        const titleUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}&limit=1`;
        const titleRes = await fetch(titleUrl);
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          if (titleData.docs?.[0]?.cover_id || titleData.docs?.[0]?.cover_i) {
            const coverId = titleData.docs[0].cover_id || titleData.docs[0].cover_i;
            const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
            const verify = await fetch(coverUrl, { method: 'HEAD' });
            if (verify.ok) return { coverUrl, source: 'openlibrary' };
          }
        }
      }
    } catch (e) {
      debug(`  Open Library failed: ${e.message}`);
    }
    return null;
  }

  return null;
}

async function saveCoverImage(coverUrl, title) {
  if (!coverUrl) return null;
  try {
    debug(`Downloading cover: ${coverUrl}`);
    const res = await fetch(coverUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());

    // Extract extension from URL or content-type
    let ext = 'jpg';
    const contentType = res.headers.get('content-type');
    if (contentType) {
      const mimeExt = contentType.split('/')[1]?.split(';')[0];
      if (mimeExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(mimeExt)) {
        ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
      }
    }
    if (ext === 'jpg') {
      const urlExt = coverUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExt)) {
        ext = urlExt === 'jpeg' ? 'jpg' : urlExt;
      }
    }

    const safeTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
    const localPath = path.join(finalCoversDir, `${safeTitle}.${ext}`);
    fs.writeFileSync(localPath, data);
    debug(`  Saved: ${localPath} (${data.length} bytes)`);
    return localPath;
  } catch (e) {
    debug(`  Failed: ${e.message}`);
    return null;
  }
}

// AI functions
function generateBookPrompt(title) {
  return `You are an expert literary analyst. Provide comprehensive metadata for the book "${title}".

CRITICAL LANGUAGE REQUIREMENT: Regardless of the original language of the book (even for non-English books such as German, French, Spanish, Japanese, etc.), the "description", "whyRead", "keyThemes", "targetAudience", and "legacy" fields MUST ALWAYS be written in fluent English.

Return strict JSON matching this schema:
{
  "title": "${title}",
  "author": "Full author name",
  "publishedYear": "Year as number (e.g., 1937) or 'Unknown'",
  "genre": "Primary genre or genres separated by commas",
  "publisher": "Original publisher or 'Unknown'",
  "pages": "Approximate page count as number or 'Unknown'",
  "language": "Primary language (e.g., 'German', 'English', etc.)",
  "isbn13": "ISBN-13 code or null",
  "description": "Brief overview/synopsis of the book written in ENGLISH (2-4 sentences)",
  "whyRead": "Why one should read this book, formatted as 3-5 structured bullet points 'Key Point: Brief description' separated by \\n written in ENGLISH (e.g. 'Timeless principles: ... \\n Proven methodology: ...')",
  "keyThemes": ["Theme 1 in English", "Theme 2 in English", "Theme 3 in English"],
  "targetAudience": ["Primary audience in English", "Secondary audience in English"],
  "notableQuotes": ["Famous quote from the book"],
  "legacy": "Cultural impact or influence written in English (1-2 sentences)",
  "similarBooks": ["Book 1 similar to this", "Book 2 similar to this"]
}

IMPORTANT: Every string field MUST have a value. Use 'Unknown' or 'None' if information is not available. Do NOT return empty strings or null for string fields. All array fields should have at least one item.
Return ONLY the JSON object, no markdown, no commentary.`;
}

async function requestAI({ prompt }) {
  debug(`AI request to ${provider} (${model})`);

  if (provider === 'mistral') {
    return fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert literary analyst. Output valid JSON only, no markdown, no commentary.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature
      })
    });
  }

  if (provider === 'openai') {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert literary analyst. Output valid JSON only, no markdown, no commentary.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature
      })
    });
  }

  if (provider === 'gemini') {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature }
      })
    });
  }

  // Ollama
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return fetch(`${host}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      prompt,
      format: 'json',
      stream: false,
      options: { temperature, num_predict: 2048 }
    })
  });
}

async function extractRawContent(response) {
  const responseBody = await response.text();
  debug(`Response: HTTP ${response.status}, ${responseBody.length} chars`);

  let rawText = '';
  try {
    const payload = JSON.parse(responseBody);
    if (provider === 'mistral' || provider === 'openai') {
      rawText = payload.choices?.[0]?.message?.content?.trim() || '';
    } else if (provider === 'gemini') {
      rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      rawText = payload.response?.trim() || '';
    }
  } catch {
    throw new Error(`Failed to parse JSON: ${responseBody.slice(0, 200)}`);
  }

  if (rawText.startsWith('```')) {
    rawText = rawText
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  }
  if (!rawText) throw new Error(`Empty response: ${responseBody.slice(0, 200)}`);
  return { rawText, responseBody };
}

// MORE LENIENT validation - sets defaults instead of throwing errors
function validateBookEntry(entry, requestedTitle) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error('Response was not a JSON object');
  }

  // Set defaults for all fields instead of requiring them
  const defaults = {
    title: requestedTitle,
    author: 'Unknown',
    publishedYear: 'Unknown',
    genre: 'Unknown',
    publisher: 'Unknown',
    pages: 'Unknown',
    language: 'Unknown',
    isbn13: null,
    description: 'No description available',
    whyRead: null,
    keyThemes: [],
    targetAudience: [],
    notableQuotes: [],
    legacy: null,
    similarBooks: [],
    coverUrl: null,
    coverSource: null,
    coverLocalPath: null
  };

  // Apply defaults for missing or empty fields
  const result = { ...defaults, ...entry };

  // Clean up string fields (exclude numeric fields handled below)
  ['title', 'author', 'genre', 'publisher', 'language', 'description', 'legacy'].forEach((f) => {
    if (typeof result[f] !== 'string' || result[f].trim() === '') {
      result[f] = defaults[f];
    } else {
      result[f] = result[f].trim();
    }
  });

  // Ensure arrays
  ['keyThemes', 'targetAudience', 'notableQuotes', 'similarBooks'].forEach((f) => {
    if (!Array.isArray(result[f]) || result[f].length === 0) {
      result[f] = defaults[f];
    }
  });

  // Parse numeric fields - handle both strings and numbers
  ['publishedYear', 'pages'].forEach((f) => {
    if (typeof result[f] === 'string' && result[f] !== 'Unknown') {
      const num = parseInt(result[f], 10);
      if (!isNaN(num)) result[f] = num;
    } else if (typeof result[f] === 'number') {
      // Already a number, keep it
    } else {
      result[f] = defaults[f];
    }
  });

  return result;
}

async function generateBookMetadata(title, index) {
  const prompt = generateBookPrompt(title);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      debug(`\n--- Attempt ${attempt}/5 for "${title}" [Provider: ${provider}, Model: ${model}] ---`);
      const response = await requestAI({ prompt });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`${provider.toUpperCase()} HTTP ${response.status}: ${body.slice(0, 200)}`);
      }
      const { rawText } = await extractRawContent(response);
      debug(`Parsing response...`);
      const parsed = JSON.parse(rawText);
      const validated = validateBookEntry(parsed, title);
      validated.aiProvider = provider;
      validated.aiModel = model;
      validated.provider = provider;
      validated.model = model;
      return validated;
    } catch (err) {
      failureLogger.logFailure({ title, index, attempt, provider, model, errorMessage: err.message });
      console.warn(`  [Warning] Attempt ${attempt}/5 failed (Provider: ${provider}, Model: ${model}): ${err.message}`);
      if (attempt === 5) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

function saveOutputFile(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, filePath);
}

async function main() {
  let booksProcessed = 0;
  const allBooks = [];
  const failedBooks = [];

  for (const [index, title] of bookTitles.entries()) {
    const bookNum = index + 1;
    process.stdout.write(`[${bookNum}/${bookTitles.length}] Processing "${title}"... `);

    try {
      const metadata = await generateBookMetadata(title, index);

      try {
        const coverInfo = await downloadBookCover(metadata.title, metadata.author, metadata.isbn13);
        if (coverInfo.coverUrl) {
          metadata.coverUrl = coverInfo.coverUrl;
          metadata.coverSource = coverInfo.source;
          const localPath = await saveCoverImage(coverInfo.coverUrl, metadata.title);
          if (localPath) metadata.coverLocalPath = path.relative(finalCoversDir, localPath);
        }
        // Store ratings from cover source (e.g., Google Books)
        if (coverInfo.ratings) {
          metadata.ratings = coverInfo.ratings;
        }
      } catch (e) {
        debug(`Cover error: ${e.message}`);
      }

      allBooks.push(metadata);
      booksProcessed++;
      console.log('OK');

      if (throttleDelay > 0) await new Promise((r) => setTimeout(r, throttleDelay));
    } catch (err) {
      console.log('FAILED');
      failedBooks.push({ title, error: err.message });
      allBooks.push({ title, error: err.message, status: 'failed' });
    }
  }

  const outputData = {
    generatedAt: new Date().toISOString(),
    generatedBy: `${provider} (${model})`,
    bookCount: allBooks.length,
    successful: booksProcessed,
    failed: failedBooks.length,
    books: allBooks
  };

  saveOutputFile(finalOutputPath, outputData);

  console.log('\n=======================================================');
  console.log(`Done! Processed ${booksProcessed}/${bookTitles.length} books.`);
  if (failedBooks.length > 0) {
    console.log(`\nFailed: ${failedBooks.length}`);
    failedBooks.forEach(({ title, error }) => console.log(`  - ${title}: ${error}`));
  }
  console.log(`\nOutput: ${finalOutputPath}`);
  console.log(`Covers: ${finalCoversDir}`);
  console.log('=======================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
