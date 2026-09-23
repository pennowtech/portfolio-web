import fs from 'fs';
import path from 'path';
import { requireIssueboardAdminApi } from '@utils/issueboard/api';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = req.query;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // Prevent directory traversal
  const sanitizedFilename = path.basename(filename);

  // Primary location: tools/book-metadata/output/covers
  const primaryPath = path.join(process.cwd(), 'tools/book-metadata/output/covers', sanitizedFilename);
  // Secondary fallback location: public/covers/books
  const fallbackPath = path.join(process.cwd(), 'public/covers/books', sanitizedFilename);

  let filePath = primaryPath;
  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      return res.status(404).json({ error: 'Cover image not found' });
    }
  }

  try {
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const contentType = MIME_TYPES[ext];
    if (!contentType) return res.status(415).json({ error: 'Unsupported cover image format' });

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error serving book cover:', err);
    res.status(500).json({ error: 'Failed to read cover image' });
  }
}
