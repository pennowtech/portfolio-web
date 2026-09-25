// Shared raw-body reader for routes that disable Next's bodyParser (to handle
// multipart/form-data or raw JSON themselves). Caps total size so a request
// can't force the server to buffer an unbounded amount of data in memory
// before any auth/validation runs -- especially important for routes that are
// intentionally public and unauthenticated.
export const MAX_REQUEST_BODY_BYTES = 20 * 1024 * 1024; // 20 MB

// The two public issue routes run as Vercel functions, which reject request bodies over ~4.5 MB before our code
// runs. Capping at 4 MB lets us return a clear error instead of an opaque platform one. (Base64 attachments in a
// JSON body count ~33% larger than the file, so prefer multipart uploads for screenshots.)
export const SERVERLESS_BODY_LIMIT_BYTES = 4 * 1024 * 1024;

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
    let tooLarge = false;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        // Don't req.destroy() here -- that tears down the underlying socket
        // (verified: the caller's res.status(413) never reaches the client,
        // it just sees a connection reset), which defeats the point of
        // returning a clean error. Instead keep draining without buffering
        // further chunks, so memory stays bounded but the socket -- and the
        // ability to write a real response on it -- stays alive.
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new RequestBodyTooLargeError());
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
