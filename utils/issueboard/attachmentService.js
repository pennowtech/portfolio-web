import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';
import { getProjectByKey } from './projectService';

const BUCKET = 'issueboard-private';
const MAX_BYTES = 1_048_576; // 1 MB, matches the bucket's configured file_size_limit
const MAX_DIMENSION = 8000; // guards against decompression-bomb-style oversized images
const SIGNED_DOWNLOAD_TTL_SECONDS = 300;

const MIME_EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const SHARP_FORMAT_MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const toAttachment = (row) => ({
  id: row.id,
  originalFilename: row.original_filename,
  displayName: row.display_name,
  mimeType: row.mime_type,
  byteSize: row.byte_size,
  width: row.width,
  height: row.height,
  state: row.state,
  createdAt: row.created_at,
  finalizedAt: row.finalized_at
});

export const authorizeUpload = async (projectKey, issueNumber, { originalFilename, mimeType, byteSize }, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return { error: 'ISSUE_NOT_FOUND' };

  const extension = MIME_EXTENSION[mimeType];
  if (!extension) return { error: 'UNSUPPORTED_TYPE' };
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_BYTES) return { error: 'TOO_LARGE' };

  const objectPath = `${issue.id}/${randomUUID()}.${extension}`;
  const admin = getIssueboardSupabaseAdmin();
  const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (signError) throw signError;

  const displayName = originalFilename.trim().slice(0, 200) || 'image';
  const { data: attachment, error: insertError } = await admin
    .from('issueboard_attachments')
    .insert({
      issue_id: issue.id,
      bucket_id: BUCKET,
      object_path: objectPath,
      original_filename: originalFilename.slice(0, 200),
      display_name: displayName,
      mime_type: mimeType,
      byte_size: byteSize,
      state: 'pending',
      created_by: actor
    })
    .select('id,object_path')
    .single();
  if (insertError) throw insertError;

  return {
    attachmentId: attachment.id,
    objectPath: attachment.object_path,
    signedUrl: signed.signedUrl,
    token: signed.token
  };
};

export const finalizeUpload = async (projectKey, issueNumber, attachmentId, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return { error: 'ISSUE_NOT_FOUND' };

  const admin = getIssueboardSupabaseAdmin();
  const { data: attachment, error: findError } = await admin
    .from('issueboard_attachments')
    .select('id,issue_id,object_path,mime_type')
    .eq('id', attachmentId)
    .eq('issue_id', issue.id)
    .eq('state', 'pending')
    .maybeSingle();
  if (findError) throw findError;
  if (!attachment) return { error: 'ATTACHMENT_NOT_FOUND' };

  const reject = async (reason) => {
    await admin.from('issueboard_attachments').update({ state: 'rejected' }).eq('id', attachmentId);
    await admin.storage.from(BUCKET).remove([attachment.object_path]);
    return { error: reason };
  };

  const { data: blob, error: downloadError } = await admin.storage.from(BUCKET).download(attachment.object_path);
  if (downloadError || !blob) return reject('UPLOAD_NOT_FOUND');

  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return reject('SIZE_MISMATCH');

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    return reject('INVALID_IMAGE');
  }
  const detectedMime = SHARP_FORMAT_MIME[metadata.format];
  if (!detectedMime || detectedMime !== attachment.mime_type) return reject('TYPE_MISMATCH');
  if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    return reject('DIMENSIONS_INVALID');
  }

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const { data: updated, error: updateError } = await admin
    .from('issueboard_attachments')
    .update({
      state: 'ready',
      byte_size: buffer.length,
      width: metadata.width,
      height: metadata.height,
      checksum_sha256: checksum,
      finalized_at: new Date().toISOString()
    })
    .eq('id', attachmentId)
    .select('id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at')
    .single();
  if (updateError) throw updateError;

  const project = await getProjectByKey(projectKey);
  await admin.from('issueboard_audit_events').insert({
    project_id: project.id,
    issue_id: issue.id,
    actor,
    action: 'attachment.uploaded',
    safe_metadata: { attachmentId, byteSize: buffer.length, mimeType: attachment.mime_type }
  });

  return { attachment: toAttachment(updated) };
};

export const listAttachments = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin
    .from('issueboard_attachments')
    .select(
      'id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at,object_path'
    )
    .eq('issue_id', issue.id)
    .eq('state', 'ready')
    .order('created_at');
  if (error) throw error;

  return Promise.all(
    data.map(async (row) => {
      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(row.object_path, SIGNED_DOWNLOAD_TTL_SECONDS);
      return { ...toAttachment(row), url: signed?.signedUrl || null };
    })
  );
};

export const deleteAttachment = async (projectKey, issueNumber, attachmentId, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return false;

  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin
    .from('issueboard_attachments')
    .update({ state: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)
    .eq('issue_id', issue.id)
    .eq('state', 'ready')
    .select('object_path')
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  await admin.storage.from(BUCKET).remove([data.object_path]);

  const project = await getProjectByKey(projectKey);
  await admin.from('issueboard_audit_events').insert({
    project_id: project.id,
    issue_id: issue.id,
    actor,
    action: 'attachment.deleted',
    safe_metadata: { attachmentId }
  });
  return true;
};
