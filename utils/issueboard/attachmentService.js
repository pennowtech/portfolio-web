import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';
import { getProjectByKey } from './projectService';
import { ACCEPTED_ATTACHMENT_MIME_TYPES, MIME_EXTENSION, isImageMime } from './attachmentTypes';

const BUCKET = 'issueboard-private';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB for images
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB for documents and files
const MAX_DIMENSION = 8000; // guards against decompression-bomb-style oversized images
const SIGNED_DOWNLOAD_TTL_SECONDS = 300; // 5 minutes -- keep the exposure window on a private bucket short

// sharp's decoded `metadata().format` for each image mime we accept -- used to confirm
// the uploaded bytes actually are what the client claimed, not just trust the header.
const SHARP_FORMAT_BY_MIME = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

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

  if (!ACCEPTED_ATTACHMENT_MIME_TYPES.includes(mimeType)) return { error: 'UNSUPPORTED_TYPE' };

  const isImg = isImageMime(mimeType);
  const maxAllowed = isImg ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > maxAllowed) return { error: 'TOO_LARGE' };

  const extension = MIME_EXTENSION[mimeType];
  const objectPath = `${issue.id}/${randomUUID()}.${extension}`;
  const admin = getIssueboardSupabaseAdmin();
  const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (signError) throw signError;

  const displayName = originalFilename.trim().slice(0, 200) || (isImg ? 'image' : 'attachment');

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
      created_by: actor || 'system'
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
  const effectiveMime = attachment.mime_type;
  const isImg = isImageMime(effectiveMime);
  const maxAllowed = isImg ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (buffer.length === 0 || buffer.length > maxAllowed) return reject('SIZE_MISMATCH');

  let width = null;
  let height = null;
  if (isImg) {
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      return reject('INVALID_IMAGE');
    }
    const expectedFormat = SHARP_FORMAT_BY_MIME[effectiveMime];
    if (expectedFormat && metadata.format !== expectedFormat) return reject('TYPE_MISMATCH');
    if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION)
      return reject('DIMENSIONS_INVALID');
    width = metadata.width;
    height = metadata.height;
  }

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const { data: updated, error: updateError } = await admin
    .from('issueboard_attachments')
    .update({
      state: 'ready',
      byte_size: buffer.length,
      width,
      height,
      checksum_sha256: checksum,
      finalized_at: new Date().toISOString()
    })
    .eq('id', attachmentId)
    .select(
      'id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at,created_by,object_path'
    )
    .single();
  if (updateError) throw updateError;

  const project = await getProjectByKey(projectKey);
  await admin.from('issueboard_audit_events').insert({
    project_id: project.id,
    issue_id: issue.id,
    actor,
    action: 'attachment.uploaded',
    safe_metadata: { attachmentId, byteSize: buffer.length, mimeType: effectiveMime }
  });

  return { attachment: toAttachment(updated) };
};

export const getAttachment = async (projectKey, issueNumber, attachmentId) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin
    .from('issueboard_attachments')
    .select(
      'id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at,created_by,object_path'
    )
    .eq('id', attachmentId)
    .eq('issue_id', issue.id)
    .eq('state', 'ready')
    .maybeSingle();
  if (error || !data) return null;

  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(data.object_path, SIGNED_DOWNLOAD_TTL_SECONDS, {
      download: data.display_name
    });

  return { ...toAttachment(data), url: signed?.signedUrl || null };
};

export const listAttachments = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin
    .from('issueboard_attachments')
    .select(
      'id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at,created_by,object_path'
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

export const uploadAttachmentDirect = async (
  projectKey,
  issueNumber,
  { originalFilename, mimeType, buffer },
  actor
) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return { error: 'ISSUE_NOT_FOUND' };

  if (!ACCEPTED_ATTACHMENT_MIME_TYPES.includes(mimeType)) return { error: 'UNSUPPORTED_TYPE' };

  const isImg = isImageMime(mimeType);
  const maxAllowed = isImg ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (!buffer || buffer.length === 0 || buffer.length > maxAllowed) return { error: 'TOO_LARGE' };

  let width = null;
  let height = null;
  if (isImg) {
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      return { error: 'INVALID_IMAGE' };
    }
    const expectedFormat = SHARP_FORMAT_BY_MIME[mimeType];
    if (expectedFormat && metadata.format !== expectedFormat) return { error: 'TYPE_MISMATCH' };
    if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      return { error: 'DIMENSIONS_INVALID' };
    }
    width = metadata.width;
    height = metadata.height;
  }

  const extension = MIME_EXTENSION[mimeType] || 'bin';
  const objectPath = `${issue.id}/${randomUUID()}.${extension}`;
  const admin = getIssueboardSupabaseAdmin();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType: mimeType, upsert: true });
  if (uploadError) throw uploadError;

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const displayName = (originalFilename || '').trim().slice(0, 200) || (isImg ? 'image' : 'attachment');

  const { data: attachment, error: insertError } = await admin
    .from('issueboard_attachments')
    .insert({
      issue_id: issue.id,
      bucket_id: BUCKET,
      object_path: objectPath,
      original_filename: displayName,
      display_name: displayName,
      mime_type: mimeType,
      byte_size: buffer.length,
      width,
      height,
      checksum_sha256: checksum,
      state: 'ready',
      created_by: actor || 'api',
      finalized_at: new Date().toISOString()
    })
    .select(
      'id,original_filename,display_name,mime_type,byte_size,width,height,state,created_at,finalized_at,created_by,object_path'
    )
    .single();

  if (insertError) throw insertError;

  const project = await getProjectByKey(projectKey);
  await admin.from('issueboard_audit_events').insert({
    project_id: project.id,
    issue_id: issue.id,
    actor: actor || 'api',
    action: 'attachment.uploaded',
    safe_metadata: { attachmentId: attachment.id, byteSize: buffer.length, mimeType }
  });

  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(attachment.object_path, SIGNED_DOWNLOAD_TTL_SECONDS);

  return { attachment: { ...toAttachment(attachment), url: signed?.signedUrl || null } };
};
