import { App } from 'octokit';
import { isIssueboardSupabaseConfigured } from '@utils/issueboard/supabaseAdmin';
import { getProjectByKey, createProject } from '@utils/issueboard/projectService';
import { createExternalIssue, idempotencyReference } from '@utils/issueboard/externalIssueService';
import { readRawBody, RequestBodyTooLargeError, SERVERLESS_BODY_LIMIT_BYTES } from '@utils/issueboard/readRawBody';
import { issueTicketUrl, stableAttachmentUrl } from '@utils/issueboard/attachmentLinks';
import { consumeIssueboardRateLimit } from '@utils/issueboard/api';

export const config = {
  api: {
    bodyParser: false
  }
};

const parseJsonSafe = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

function getGitHubApp() {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  if (!appId || !privateKey) {
    return null;
  }

  return new App({
    appId,
    privateKey
  });
}

const resolveTargetProject = async (targetRepo) => {
  const repoNormalized = String(targetRepo || '')
    .trim()
    .toLowerCase();

  // For Lingora, map to project 'Lemony' with key 'LEM'
  if (repoNormalized === 'lingora' || repoNormalized === 'lemony' || repoNormalized === 'lem') {
    let lemProject = await getProjectByKey('LEM');
    if (!lemProject) {
      try {
        lemProject = await createProject(
          {
            projectKey: 'LEM',
            name: 'Lemony',
            description: 'Lemony (Lingora) project issue tracking',
            defaultIssueType: 'task'
          },
          'system'
        );
      } catch (createErr) {
        console.error('Could not auto-create LEM project:', createErr);
      }
    }
    if (lemProject) return 'LEM';
  }

  // Check if targetRepo matches another existing project key or name
  if (targetRepo) {
    const existing = await getProjectByKey(String(targetRepo).trim().toUpperCase());
    if (existing) return existing.key;
  }

  // Fallback to default project PORT
  const portProject = await getProjectByKey('PORT');
  if (portProject) return 'PORT';

  return 'LEM';
};

const resolveIssueType = (category) => {
  const cat = String(category || '')
    .trim()
    .toLowerCase();
  if (/bug|error|crash|defect|fault/i.test(cat)) return 'bug';
  if (/feature|story|enhancement|idea/i.test(cat)) return 'story';
  if (/epic/i.test(cat)) return 'epic';
  return 'task';
};

const extractAttachments = async (payload, formData) => {
  const attachments = [];

  // Extract from formData if multipart
  if (formData) {
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === 'object' && typeof value.arrayBuffer === 'function') {
        const file = value;
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          attachments.push({
            filename: file.name || key || 'attachment',
            mimeType: file.type || 'application/octet-stream',
            buffer
          });
        }
      }
    }
  }

  // Extract from JSON payload (supports attachments, images, files, screenshot)
  const candidateLists = [
    payload.attachments,
    payload.images,
    payload.files,
    payload.screenshot ? [payload.screenshot] : null
  ];

  for (const list of candidateLists) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item) continue;
        if (typeof item === 'string') {
          const isDataUrl = item.startsWith('data:');
          let mimeType = 'image/png';
          if (isDataUrl) {
            const match = /^data:([^;]+);base64,/.exec(item);
            if (match) mimeType = match[1];
          }
          attachments.push({
            filename: `attachment-${attachments.length + 1}.${mimeType.split('/')[1] || 'png'}`,
            mimeType,
            base64: item
          });
        } else if (typeof item === 'object') {
          attachments.push({
            filename: item.filename || item.name || `attachment-${attachments.length + 1}`,
            mimeType: item.mimeType || item.type || item.contentType || 'application/octet-stream',
            base64: item.base64 || item.data || null,
            buffer: item.buffer || null
          });
        }
      }
    }
  }

  return attachments;
};

// Best-effort per-instance limiter, used only when the shared (Supabase) limiter is unavailable -- for example
// before the database is configured. Without it the public endpoint would either 500 or be completely unguarded.
const localHits = new Map();
const consumeLocalRateLimit = (actor, limit, windowMs) => {
  const now = Date.now();
  const recent = (localHits.get(actor) || []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    localHits.set(actor, recent);
    return false;
  }
  recent.push(now);
  localHits.set(actor, recent);
  if (localHits.size > 5000)
    for (const [key, hits] of localHits) if (!hits.some((at) => now - at < windowMs)) localHits.delete(key);
  return true;
};

const consumeSubmitRateLimit = async (actor) => {
  if (isIssueboardSupabaseConfigured()) {
    try {
      return await consumeIssueboardRateLimit({
        actor,
        operation: 'submit-issue:create',
        limit: 10,
        windowSeconds: 60
      });
    } catch (error) {
      console.error('Shared rate limiter unavailable, using local limiter:', error.message);
    }
  }
  return consumeLocalRateLimit(actor, 10, 60_000);
};

// What the caller sees for an issueboard attachment: images get a permanent link (the raw storage URL expires in
// minutes); other files are listed by name only.
const describeAttachments = (attachments = []) =>
  attachments.map((a) => ({
    id: a.id,
    filename: a.originalFilename,
    mimeType: a.mimeType,
    url: a.mimeType?.startsWith('image/') ? stableAttachmentUrl(a.id) : null
  }));

const issueboardSummary = (issue) => ({
  key: issue.key,
  issueNumber: issue.issueNumber,
  url: issueTicketUrl(issue.key),
  attachments: describeAttachments(issue.attachments)
});

export default async function handler(req, res) {
  // 1. Full CORS Support (Required for React Native and Tauri Desktop custom schemes)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key, X-Request-Id, Idempotency-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // This endpoint is intentionally public and unauthenticated (it's the bridge
  // for the site's own feedback form and external client apps), so IP-based
  // rate limiting is the only abuse guard available for it.
  const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const allowed = await consumeSubmitRateLimit(clientIp);
  if (!allowed) {
    return res.status(429).json({ success: false, error: 'Too many requests. Try again shortly.' });
  }

  let payload = {};
  let formData = null;

  try {
    const rawBuffer = await readRawBody(req, SERVERLESS_BODY_LIMIT_BYTES);
    const contentType = req.headers['content-type'] || '';

    // 2. Parse Body (Supports both multipart/form-data and application/json)
    if (contentType.includes('multipart/form-data')) {
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const webRequest = new Request(`${proto}://${host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: rawBuffer
      });

      formData = await webRequest.formData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          payload[key] = value;
        }
      }

      if (typeof payload.attachments === 'string') {
        const parsed = parseJsonSafe(payload.attachments);
        if (Array.isArray(parsed)) payload.attachments = parsed;
      }
    } else {
      const text = rawBuffer.toString('utf-8');
      if (text.trim()) {
        payload = JSON.parse(text);
      }
    }
  } catch (parseErr) {
    if (parseErr instanceof RequestBodyTooLargeError) {
      return res.status(413).json({
        success: false,
        error: 'Request is too large (limit 4 MB in total, including attachments). Send fewer or smaller images.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Invalid request payload: ${parseErr.message}`
    });
  }

  // 3. Destructure Client Payload
  const {
    title,
    body,
    email,
    targetOwner = 'pennowtech',
    targetRepo = 'Lingora',
    category = 'General',
    app: clientApp = '',
    platform = 'App Client',
    deviceMeta = ''
  } = payload || {};

  if (!title?.trim() || !body?.trim() || !targetOwner || !targetRepo) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, body, targetOwner, targetRepo.'
    });
  }

  // 4. Ingest and normalize attachments
  const attachments = await extractAttachments(payload, formData);

  // 5. Post issue to our Issueboard (Lemony/LEM for Lingora, or PORT)
  let issueboardIssue = null;
  // Anything the caller should know went wrong without the whole request failing.
  const warnings = [];
  const idempotencyKey = String(req.headers['idempotency-key'] || payload?.idempotencyKey || '').trim();
  if (!isIssueboardSupabaseConfigured()) {
    warnings.push('Issue board storage is not configured; no ticket was created.');
  } else {
    try {
      const projectKey = await resolveTargetProject(targetRepo);
      const issueType = resolveIssueType(category);
      const categoryLabel = (category || 'General').trim();

      const labelsToAttach = [categoryLabel, 'user-report'];
      if (clientApp?.trim()) {
        labelsToAttach.push(`app:${clientApp.trim().toLowerCase()}`);
      }

      issueboardIssue = await createExternalIssue(
        {
          projectKey,
          title: title.trim(),
          description: body.trim(),
          issueType,
          assignee: null,
          labels: labelsToAttach,
          attachments,
          // Only set when the caller sent an Idempotency-Key. (source, source_reference) is unique, so a shared
          // constant here would make every submission after the first lose its reference.
          sourceReference: idempotencyKey ? idempotencyReference(projectKey, idempotencyKey) : null
        },
        email?.trim() || 'user-report'
      );
    } catch (ibError) {
      console.error('Error posting issue to Issueboard in submit-issue:', ibError);
      warnings.push('The issue board ticket could not be created.');
    }
  }

  if (issueboardIssue?.attachmentErrors?.length) {
    warnings.push(
      `Some attachments were not saved: ${issueboardIssue.attachmentErrors
        .map((a) => `${a.filename} (${String(a.code).toLowerCase().replace(/_/g, ' ')})`)
        .join(', ')}.`
    );
  }

  // A retry of a request that already succeeded: the ticket (and its GitHub issue) exist, so don't file another.
  if (issueboardIssue?.duplicate) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      issueUrl: null,
      issueNumber: null,
      issueboard: issueboardSummary(issueboardIssue),
      notice: 'This request was already received; no new issue was created.'
    });
  }

  // 6. Forward to GitHub
  const boardInfo = issueboardIssue ? issueboardSummary(issueboardIssue) : null;
  const respond = (fields) =>
    res.status(200).json({
      success: true,
      issueUrl: null,
      issueNumber: null,
      issueboard: boardInfo,
      ...fields,
      ...(warnings.length > 0 ? { warnings } : {})
    });

  const app = getGitHubApp();
  if (!app) {
    if (issueboardIssue)
      return respond({ notice: 'Issue saved to Issueboard. GitHub App credentials are not configured.' });

    console.error('GITHUB_APP_ID or GITHUB_PRIVATE_KEY is not configured in server environment.');
    return res.status(500).json({
      success: false,
      error: 'GitHub App credentials are not configured on the server.',
      ...(warnings.length > 0 ? { warnings } : {})
    });
  }

  try {
    // Dynamically resolve GitHub App installation for Org (pennowtech) or User
    const { data: installation } = await app.octokit
      .request('GET /orgs/{org}/installation', { org: targetOwner })
      .catch(() => app.octokit.request('GET /users/{username}/installation', { username: targetOwner }));

    if (!installation?.id) {
      if (issueboardIssue) {
        return respond({ notice: `GitHub App is not installed for ${targetOwner}. Issue was saved to Issueboard.` });
      }

      return res.status(404).json({
        success: false,
        error: `GitHub App is not installed for ${targetOwner}. Please install the app on the repository/organization first.`
      });
    }

    // Authenticate using ephemeral installation token
    const octokit = await app.getInstallationOctokit(installation.id);

    // Structure Formatted Markdown Body with Diagnostics
    const metadataLines = [
      `- **Sender Email:** ${email?.trim() || 'Anonymous App User'}`,
      clientApp?.trim() ? `- **App Target:** \`${clientApp.trim()}\`` : null,
      `- **Origin Client Application:** ${platform}`,
      `- **Operating System / Build:** ${deviceMeta || 'No diagnostic context provided.'}`,
      issueboardIssue
        ? `- **Issueboard Ticket:** [${issueboardIssue.key}](${issueTicketUrl(issueboardIssue.key)})`
        : null,
      `- **Generated Timestamp:** ${new Date().toISOString()}`
    ].filter(Boolean);

    // GitHub's API cannot upload images, so screenshots stay in Supabase Storage and the issue embeds a permanent
    // signed link that redirects to a fresh short-lived URL each time it is opened. Other files are only named.
    const altText = (name) =>
      String(name || 'screenshot')
        .replace(/[[\]()\n\r]/g, ' ')
        .trim() || 'screenshot';
    let attachmentMarkdown = '';
    if (boardInfo?.attachments?.length > 0) {
      const links = boardInfo.attachments.map((att) =>
        att.url
          ? `![${altText(att.filename)}](${att.url})`
          : `- 📄 ${altText(att.filename)} (attached to the Issueboard ticket)`
      );
      attachmentMarkdown = `\n\n---\n### 📎 Attachments\n` + links.join('\n');
    }

    const formattedBody = [
      `${body.trim()}`,
      `\n\n---`,
      `### 📋 Execution Environment Metadata`,
      ...metadataLines,
      attachmentMarkdown
    ]
      .filter(Boolean)
      .join('\n');

    const categoryLabel = (category || 'general').toLowerCase();
    const labels = [categoryLabel, 'user-report'];
    if (clientApp?.trim()) {
      labels.push(`app:${clientApp.trim().toLowerCase()}`);
    }

    // Submit Issue to Targeted Repository
    const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: targetOwner,
      repo: targetRepo,
      title: `[${category}] ${title.trim()}`,
      body: formattedBody,
      labels
    });

    return respond({ issueUrl: response.data.html_url, issueNumber: response.data.number });
  } catch (error) {
    console.error('Internal Request Router Error:', error);

    // If GitHub failed but Issueboard succeeded, still provide a positive response
    if (issueboardIssue) return respond({ notice: 'Issue saved to Issueboard. GitHub forward failed.' });

    return res.status(500).json({
      success: false,
      error: 'The issue could not be created. Please try again later.',
      ...(warnings.length > 0 ? { warnings } : {})
    });
  }
}
