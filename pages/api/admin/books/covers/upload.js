import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { requireIssueboardAdminApi, requireSameOriginMutation } from '@utils/issueboard/api';

export const config = {
  api: { bodyParser: false }
};

const UPLOAD_DIR = path.join(process.cwd(), 'tools/book-metadata/output/covers');
const MAX_SIZE = 5 * 1024 * 1024;

// Signature -> { mimetype, extension }. Checked against the actual uploaded
// bytes so a spoofed Content-Type/filename can't smuggle in other content.
const SIGNATURES = [
  { bytes: [0xff, 0xd8, 0xff], mimetype: 'image/jpeg', ext: '.jpg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimetype: 'image/png', ext: '.png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mimetype: 'image/gif', ext: '.gif' }
];

const detectImageType = (buffer) => {
  const bySignature = SIGNATURES.find((sig) => sig.bytes.every((byte, i) => buffer[i] === byte));
  if (bySignature) return bySignature;
  // WebP: RIFF....WEBP
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mimetype: 'image/webp', ext: '.webp' };
  }
  return null;
};

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireSameOriginMutation(req, res)) return;

  const form = formidable({ maxFileSize: MAX_SIZE });

  try {
    const [, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.size > MAX_SIZE) {
      return res.status(400).json({ error: 'File too large. Max 5MB' });
    }

    const header = Buffer.alloc(16);
    const fd = fs.openSync(file.filepath, 'r');
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);

    const detected = detectImageType(header);
    if (!detected) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${detected.ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.copyFileSync(file.filepath, filepath);

    const url = `/api/admin/books/covers/${filename}`;
    res.status(200).json({ url });
  } catch (e) {
    console.error('Cover upload error:', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}
