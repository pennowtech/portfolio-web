# Book Metadata & Cover Generator

A tool to generate comprehensive book metadata and download book covers using AI and public APIs.

## Features

- **Generate book metadata** (title, author, year, genre, description, themes, audience, etc.)
- **Download book covers** from Open Library or Google Books API
- **Save covers locally** with organized filenames
- **Output structured JSON** with all metadata and cover paths
- **Multi-provider AI support**: Mistral, Ollama, OpenAI, Gemini
- **Error logging** for failed requests
- **Retry mechanism** for robust AI generation

## Output Structure

The generated JSON output includes:

```json
{
  "generatedAt": "2024-01-01T12:00:00.000Z",
  "generatedBy": "mistral (mistral-small-latest)",
  "bookCount": 5,
  "successful": 5,
  "failed": 0,
  "books": [
    {
      "title": "Think and Grow Rich",
      "author": "Napoleon Hill",
      "publishedYear": 1937,
      "genre": "Self-help, Personal Development",
      "publisher": "The Ralston Society",
      "pages": 256,
      "language": "English",
      "isbn13": "978-1614279573",
      "description": "A classic personal development book...",
      "keyThemes": ["Mindset", "Success Principles", "Subconscious Mind"],
      "targetAudience": ["Entrepreneurs", "Self-help readers"],
      "notableQuotes": ["Whatever the mind can conceive..."],
      "awards": null,
      "sales": ">15 million copies",
      "series": null,
      "editions": "Revised for the 21st Century",
      "legacy": "Foundation of modern self-help literature...",
      "similarBooks": ["The Millionaire Mind", "Rich Dad Poor Dad"],
      "coverUrl": "https://covers.openlibrary.org/b/id/123456-L.jpg",
      "coverLocalPath": "Think_and_Grow_Rich.jpg",
      "coverSource": "openlibrary"
    }
  ]
}
```

## Installation

No installation required. Uses Node.js built-in modules.

### Dependencies

- Node.js 18+ (for `fetch` support)
- AI Provider API key (for Mistral, OpenAI, or Gemini)
- Ollama running locally (for Ollama provider)

## Usage

### 1. Using Command Line Arguments

```bash
# Process specific book titles
node generate-book-info.mjs --titles "Think and Grow Rich, The Millionaire Mind"

# Using a specific provider
node generate-book-info.mjs --titles "Blink" --provider mistral

# With custom output location
node generate-book-info.mjs --titles "Blink" --output my-books.json
```

### 2. Using Input File

Create `input-books.json` in the `input/` directory:

```json
["Think and Grow Rich", "The Millionaire Mind", "Blink"]
```

Then run:

```bash
node generate-book-info.mjs
```

Or specify a custom input file:

```bash
node generate-book-info.mjs --input my-book-list.json
```

### 3. With Environment Variables

Create a `.env` file in the `book-metadata/` directory:

```
MISTRAL_API_KEY=your_mistral_key
OPENAI_API_KEY=your_openai_key
```

Then run:

```bash
node generate-book-info.mjs --provider mistral --titles "Think and Grow Rich"
```

## Provider Options

| Provider | Default Model          | API Key Env Var   | Notes          |
| -------- | ---------------------- | ----------------- | -------------- |
| Mistral  | `mistral-small-latest` | `MISTRAL_API_KEY` | Cloud API      |
| Ollama   | `llama3.2:latest`      | `OLLAMA_API_KEY`  | Local or cloud |
| OpenAI   | `gpt-4o-mini`          | `OPENAI_API_KEY`  | Cloud API      |
| Gemini   | `gemini-2.5-flash`     | `GEMINI_API_KEY`  | Cloud API      |

## All Command Line Options

```
Providers:
  --provider NAME  AI provider: 'mistral', 'ollama', 'openai', 'gemini' (default: ollama)
  --api-key KEY    API key for provider (defaults to env: MISTRAL_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OLLAMA_API_KEY)

Input Options:
  --titles "Book 1, Book 2, ..."  Comma-separated list of book titles
  --input FILE    JSON file with book titles array
  --image FILE    Path to image file (OCR support - requires Tesseract)

Output Options:
  --output FILE   Output JSON file (default: output/books.json)
  --covers-dir DIR Directory to save covers (default: output/covers)

AI Options:
  --model NAME     Model name (defaults vary by provider)
  --host URL       Ollama host URL (default: http://localhost:11434)
  --delay MS       Delay between requests in milliseconds (default: 500 for cloud, 200 for ollama)
  --temperature T  AI temperature (default: 0.15)
  --help           Show help message
```

## Examples

### Example 1: Quick Test

```bash
node generate-book-info.mjs --titles "Think and Grow Rich" --provider mistral
```

### Example 2: Batch Processing

```bash
node generate-book-info.mjs --input input-books.json --provider openai --model gpt-4o-mini
```

### Example 3: Local Ollama

```bash
# Make sure Ollama is running locally
node generate-book-info.mjs --titles "Blink, The Millionaire Mind" --delay 500
```

## Book Cover Sources

The script tries multiple sources for book covers:

1. **Open Library** (primary) - Free, no API key required
2. **Google Books API** (fallback) - Free, no API key required

Covers are saved locally in the `output/covers/` directory with sanitized filenames.

## Error Handling

- Failed AI requests are retried up to 5 times
- Errors are logged to `logs/generate-errors-*.jsonl`
- Books that fail are included in output with `status: 'failed'` and error message

## Notes

- For image input (OCR), Tesseract OCR must be installed separately
- API keys should be kept secure (use `.env` files or environment variables)
- Throttling (`--delay`) is recommended for cloud APIs to avoid rate limits
