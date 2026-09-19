import { addProjectUser, listProjectUsers, removeProjectUser } from '@utils/issueboard/userService';
import { getProjectByKey } from '@utils/issueboard/projectService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import {
  createProjectUserSchema,
  removeProjectUserSchema,
  validationErrorResponse
} from '@utils/issueboard/validation';

const projectKeyPattern = /^[A-Z][A-Z0-9]{1,9}$/;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET', 'POST', 'DELETE'])) return;
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

  try {
    const project = await getProjectByKey(projectKey);
    if (!project)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });

    if (req.method === 'GET') {
      const users = await listProjectUsers(project);
      return res.status(200).json({ ok: true, requestId, users });
    }

    if (!requireSameOriginMutation(req, res)) return;

    if (req.method === 'POST') {
      const parsed = createProjectUserSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

      const allowed = await consumeIssueboardRateLimit({
        actor: actor.email,
        operation: 'users:add',
        limit: 30,
        windowSeconds: 60
      });
      if (!allowed)
        return res.status(429).json({
          ok: false,
          requestId,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
        });

      await addProjectUser(project, parsed.data, actor.email);
      const users = await listProjectUsers(project);
      return res.status(201).json({ ok: true, requestId, users });
    }

    if (req.method === 'DELETE') {
      const parsed = removeProjectUserSchema.safeParse({ email: req.query.userEmail || req.body?.email });
      if (!parsed.success)
        return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

      await removeProjectUser(project, parsed.data.email, actor.email);
      const users = await listProjectUsers(project);
      return res.status(200).json({ ok: true, requestId, users });
    }
  } catch (error) {
    if (error.code === 'USER_EXISTS')
      return res.status(409).json({
        ok: false,
        requestId,
        error: { code: 'USER_EXISTS', message: 'A user with this email already exists in this project.' }
      });
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
