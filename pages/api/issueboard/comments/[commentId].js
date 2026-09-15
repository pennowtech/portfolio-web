import { deleteComment, updateComment } from '@utils/issueboard/commentService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { commentBodySchema, validationErrorResponse } from '@utils/issueboard/validation';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['PATCH', 'DELETE'])) return;
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

  const commentId = String(req.query.commentId || '');
  if (!uuidPattern.test(commentId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid comment id.' } });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'comments:mutate',
      limit: 60,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });

    if (req.method === 'DELETE') {
      const deleted = await deleteComment(commentId, actor.email);
      if (!deleted)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found.' } });
      return res.status(200).json({ ok: true, requestId });
    }

    const parsed = commentBodySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });
    const comment = await updateComment(commentId, parsed.data.body, actor.email);
    if (!comment)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found.' } });
    return res.status(200).json({ ok: true, requestId, comment });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
