// Shared raw-body reader for routes that disable Next's bodyParser (to handle
// multipart/form-data or raw JSON themselves). Caps total size so a request
// can't force the server to buffer an unbounded amount of data in memory
// before any auth/validation runs -- especially important for routes that are
// intentionally public and unauthenticated.
export const MAX_REQUEST_BODY_BYTES = 20 * 1024 * 1024; // 20 MB

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Request body exceeds the maximum allowed size.');
    this.name = 'RequestBodyTooLargeError';
  }
}

export const readRawBody = (req, maxBytes = MAX_REQUEST_BODY_BYTES) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new RequestBodyTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
