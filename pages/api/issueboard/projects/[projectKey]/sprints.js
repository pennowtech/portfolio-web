import { createSprint, listSprints } from '@utils/issueboard/sprintService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { createSprintSchema, validationErrorResponse } from '@utils/issueboard/validation';

const projectKeyPattern = /^[A-Z][A-Z0-9]{1,9}$/;

const sendDatastoreError = (res, requestId, error) => {
  const normalized = normalizeIssueboardDatastoreError(error);
  return res
    .status(normalized.status)
    .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET', 'POST'])) return;
  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  const projectKey = String(req.query.projectKey || '')
    .trim()
    .toUpperCase();
  if (!projectKeyPattern.test(projectKey))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid project key.' } });

  if (req.method === 'GET') {
    try {
      const sprints = await listSprints(projectKey);
      if (sprints === null)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
      return res.status(200).json({ ok: true, requestId, sprints });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  if (!requireSameOriginMutation(req, res)) return;
  const parsed = createSprintSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'sprints:create',
      limit: 20,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const sprint = await createSprint(projectKey, parsed.data, actor.email);
    return res.status(201).json({ ok: true, requestId, sprint });
  } catch (error) {
    return sendDatastoreError(res, requestId, error);
  }
}
