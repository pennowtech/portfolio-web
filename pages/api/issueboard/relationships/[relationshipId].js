import { deleteRelationship } from '@utils/issueboard/relationshipService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['DELETE'])) return;
  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  if (!requireSameOriginMutation(req, res)) return;

  const relationshipId = String(req.query.relationshipId || '');
  if (!uuidPattern.test(relationshipId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid relationship id.' } });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'relationships:delete',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const deleted = await deleteRelationship(relationshipId);
    if (!deleted)
      return res.status(404).json({
        ok: false,
        requestId,
        error: { code: 'RELATIONSHIP_NOT_FOUND', message: 'Relationship not found.' }
      });
    return res.status(200).json({ ok: true, requestId });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
