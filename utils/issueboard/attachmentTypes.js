// Single source of truth for attachment MIME handling, shared by validation.js
// (request-shape enforcement) and attachmentService.js (storage + DB writes).
// SVG is deliberately excluded: it can carry inline <script>, and attachments
// with an image/* mimeType are rendered directly via <img src> in IssueDetail,
// so an SVG would be a stored-XSS vector if it slipped through.
export const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/json': 'json',
  'application/zip': 'zip'
};

export const ACCEPTED_ATTACHMENT_MIME_TYPES = Object.keys(MIME_EXTENSION);

export const isImageMime = (mime) => Boolean(mime && mime.startsWith('image/'));
