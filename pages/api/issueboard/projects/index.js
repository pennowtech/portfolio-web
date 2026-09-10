import { createProject, listProjects } from '@utils/issueboard/projectService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { createProjectSchema, validationErrorResponse } from '@utils/issueboard/validation';

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
    return res
      .status(503)
      .json({
        ok: false,
        requestId,
        error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
      });
  }

  if (req.method === 'GET') {
    try {
      return res.status(200).json({ ok: true, requestId, projects: await listProjects() });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  if (!requireSameOriginMutation(req, res)) return;
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'projects:create',
      limit: 10,
      windowSeconds: 60
    });
    if (!allowed)
      return res
        .status(429)
        .json({
          ok: false,
          requestId,
          error: { code: 'RATE_LIMITED', message: 'Too many project creation attempts. Try again shortly.' }
        });
    const project = await createProject(parsed.data, actor.email);
    return res.status(201).json({ ok: true, requestId, project });
  } catch (error) {
    if (error?.code === '23505')
      return res
        .status(409)
        .json({
          ok: false,
          requestId,
          error: { code: 'PROJECT_KEY_EXISTS', message: 'That project key is already in use.' }
        });
    return sendDatastoreError(res, requestId, error);
  }
}
