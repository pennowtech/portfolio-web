import { createRelationship, listRelationships } from '@utils/issueboard/relationshipService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { createRelationshipSchema, validationErrorResponse } from '@utils/issueboard/validation';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

const sendDatastoreError = (res, requestId, error) => {
  const normalized = normalizeIssueboardDatastoreError(error);
  return res
    .status(normalized.status)
    .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
};

const ERROR_MESSAGES = {
  ISSUE_NOT_FOUND: 'Issue not found.',
  INVALID_TARGET: 'Provide a valid issue key.',
  TARGET_NOT_FOUND: 'That issue was not found.',
  SELF_LINK: 'An issue cannot be related to itself.',
  DUPLICATE: 'That relationship already exists.'
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

  const issueKey = String(req.query.issueKey || '').toUpperCase();
  const match = issueKeyPattern.exec(issueKey);
  if (!match)
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid issue key.' } });
  const [, projectKey, issueNumberText] = match;
  const issueNumber = Number(issueNumberText);

  if (req.method === 'GET') {
    try {
      const relationships = await listRelationships(projectKey, issueNumber);
      if (relationships === null)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
      return res.status(200).json({ ok: true, requestId, relationships });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  if (!requireSameOriginMutation(req, res)) return;
  const parsed = createRelationshipSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'relationships:create',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const result = await createRelationship(
      projectKey,
      issueNumber,
      parsed.data.targetIssueKey,
      parsed.data.relationshipType,
      actor.email
    );
    if (result.error)
      return res.status(result.error === 'ISSUE_NOT_FOUND' || result.error === 'TARGET_NOT_FOUND' ? 404 : 400).json({
        ok: false,
        requestId,
        error: { code: result.error, message: ERROR_MESSAGES[result.error] }
      });
    return res.status(201).json({ ok: true, requestId, relationships: result.relationships });
  } catch (error) {
    return sendDatastoreError(res, requestId, error);
  }
}
