# AI-native Add Book artefacts

Open [`index.html`](index.html) directly in a browser. These five interactive concepts are grounded in the implemented bookshelf AI pipeline:

1. **Evidence Studio** — recommended; title, ISBN, or cover-photo entry followed by a complete detail review.
2. **Cover Detective** — explicitly explains cover-photo identification, confirmation, enrichment, and cover retrieval.
3. **Two-Lane Enrichment** — shows AI metadata and Google Books cover lookup as independent operations.
4. **Edition Matchboard** — resolves ambiguous cover-photo identities before generating metadata.
5. **Guided Proof** — a step-by-step version of the full cover-to-record workflow.

The source contract in these prototypes is intentionally strict: the configured AI provider generates every metadata field represented by `generate-book-info.mjs`; Google Books supplies only the cover image. Cover-photo input is first interpreted by AI vision, then confirmed by the user, then enriched. The demos do not call APIs or save data.
