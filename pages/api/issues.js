import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { issueboardRequestId } from '@utils/issueboard/api';
import { authenticateExternalApi } from '@utils/issueboard/externalAuth';
import { createExternalIssue } from '@utils/issueboard/externalIssueService';

export const config = {
  api: {
    bodyParser: false
  }
};

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const parseJsonSafe = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  // 1. Full CORS Support for external clients, desktop apps, webhooks & mobile apps
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  // 2. Health & Documentation Route
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'Issueboard External Issue API',
      version: '1.0',
      authentication: 'Bearer <API_KEY> or X-API-Key: <API_KEY>',
      endpoint: 'POST /api/issues',
      supportedFields: {
        projectKey: 'string (Required, e.g. "PORT")',
        title: 'string (Required, min 3 chars)',
        issueType: 'string (Optional: task | story | bug | epic | subtask | feature | improvement | research)',
        description: 'string (Optional markdown description)',
        priority: 'string (Optional: highest | high | medium | low | lowest)',
        assignee: 'string (Optional user name or email)',
        storyPoints: 'number (Optional, e.g. 3)',
        dueAt: 'ISO datetime string (Optional)',
        parentIssueKey: 'string (Optional key of parent, e.g. "PORT-12")',
        parentIssueId: 'uuid string (Optional ID of parent)',
        sprint: 'string (Optional: "active" to place in current sprint, or sprintId)',
        sprintId: 'uuid string (Optional target sprint ID)',
        status: 'string (Optional status name, e.g. "To do", "In progress")',
        statusId: 'uuid string (Optional status ID)',
        labels: 'array of strings or comma-separated string (e.g. ["frontend", "bug"])',
        checklist: 'array of items (strings or { body: string, isComplete: boolean })',
        attachments: 'array of { filename: string, mimeType?: string, base64?: string }',
        sourceReference: 'string (Optional external tracking ID/URL)'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      requestId,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed. Use POST to create issues.' }
    });
  }

  // 3. Authenticate Caller
  const auth = await authenticateExternalApi(req, res);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({
      ok: false,
      requestId,
      error: { code: 'UNAUTHORIZED', message: auth.error }
    });
  }

  // 4. Verify Datastore Availability
  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  try {
    const rawBuffer = await readRawBody(req);
    const contentType = req.headers['content-type'] || '';
    let payload = {};

    // 5. Parse Payload (Multipart form or JSON)
    if (contentType.includes('multipart/form-data')) {
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const webRequest = new Request(`${proto}://${host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: rawBuffer
      });

      const formData = await webRequest.formData();

      // Extract scalar fields
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          payload[key] = value;
        }
      }

      // Parse JSON fields if provided as serialized strings in form data
      if (typeof payload.labels === 'string') {
        const parsed = parseJsonSafe(payload.labels);
        payload.labels = Array.isArray(parsed)
          ? parsed
          : payload.labels
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (typeof payload.checklist === 'string') {
        const parsed = parseJsonSafe(payload.checklist);
        payload.checklist = Array.isArray(parsed)
          ? parsed
          : payload.checklist
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (typeof payload.storyPoints === 'string' && payload.storyPoints !== '') {
        payload.storyPoints = Number(payload.storyPoints);
      }

      // Extract file attachments from formData
      const attachments = [];
      for (const [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && typeof value.arrayBuffer === 'function') {
          const file = value;
          if (file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            attachments.push({
              filename: file.name || key || 'upload',
              mimeType: file.type || 'application/octet-stream',
              buffer
            });
          }
        }
      }
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
    } else {
      // JSON body
      const text = rawBuffer.toString('utf-8');
      if (text.trim()) {
        try {
          payload = JSON.parse(text);
        } catch {
          return res.status(400).json({
            ok: false,
            requestId,
            error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' }
          });
        }
      }
    }

    // 6. Validate Required Fields
    if (!payload.projectKey || typeof payload.projectKey !== 'string') {
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required field: projectKey.' }
      });
    }

    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid required field: title (minimum 3 characters).' }
      });
    }

    // 7. Create Issue via External Issue Service
    const createdIssue = await createExternalIssue(payload, auth.actor);

    return res.status(201).json({
      ok: true,
      requestId,
      issue: createdIssue
    });
  } catch (error) {
    console.error('Error in /api/issues:', error);
    if (error.code === 'PROJECT_NOT_FOUND' || error.status === 404) {
      return res.status(404).json({
        ok: false,
        requestId,
        error: { code: 'PROJECT_NOT_FOUND', message: error.message }
      });
    }

    if (error.code === 'PARENT_ISSUE_NOT_FOUND' || error.status === 400 || error.message?.includes('NESTING_LIMIT')) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: error.code || 'VALIDATION_ERROR', message: error.message }
      });
    }

    const normalized = normalizeIssueboardDatastoreError(error);
    return res.status(normalized.status).json({
      ok: false,
      requestId,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(process.env.NODE_ENV === 'development' ? { detail: error.message } : {})
      }
    });
  }
}
