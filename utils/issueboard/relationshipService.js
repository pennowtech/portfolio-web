import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';
import { getProjectByKey } from './projectService';

const RELATED_ISSUE_SELECT =
  'issue_number,title,priority,project:issueboard_projects(project_key),status:issueboard_statuses(name,category)';

// relates_to is inherently symmetric; duplicates is treated as symmetric too
// (matching common issue-tracker semantics -- "A duplicates B" and "B duplicates A"
// are the same claim). Only blocks has a distinct inverse label.
const inverseLabel = { blocks: 'is blocked by', relates_to: 'relates to', duplicates: 'is duplicated by' };
const forwardLabel = { blocks: 'blocks', relates_to: 'relates to', duplicates: 'duplicates' };
const symmetricTypes = new Set(['relates_to', 'duplicates']);

const toRelatedIssue = (row) => ({
  key: `${row.project.project_key}-${row.issue_number}`,
  title: row.title,
  priority: row.priority,
  status: row.status ? { name: row.status.name, category: row.status.category } : null
});

export const listRelationships = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const [outgoing, incoming] = await Promise.all([
    getIssueboardSupabaseAdmin()
      .from('issueboard_relationships')
      .select(
        `id,relationship_type,created_at,target:issueboard_issues!issueboard_relationships_target_issue_id_fkey(${RELATED_ISSUE_SELECT})`
      )
      .eq('source_issue_id', issue.id),
    getIssueboardSupabaseAdmin()
      .from('issueboard_relationships')
      .select(
        `id,relationship_type,created_at,source:issueboard_issues!issueboard_relationships_source_issue_id_fkey(${RELATED_ISSUE_SELECT})`
      )
      .eq('target_issue_id', issue.id)
  ]);
  if (outgoing.error) throw outgoing.error;
  if (incoming.error) throw incoming.error;

  const outgoingRows = outgoing.data.map((row) => ({
    id: row.id,
    label: forwardLabel[row.relationship_type],
    type: row.relationship_type,
    issue: toRelatedIssue(row.target)
  }));
  const incomingRows = incoming.data.map((row) => ({
    id: row.id,
    label: inverseLabel[row.relationship_type],
    type: row.relationship_type,
    issue: toRelatedIssue(row.source)
  }));
  return [...outgoingRows, ...incomingRows].sort((a, b) => a.issue.key.localeCompare(b.issue.key));
};

export const createRelationship = async (projectKey, issueNumber, targetIssueKey, relationshipType, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return { error: 'ISSUE_NOT_FOUND' };

  const targetMatch = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/.exec(targetIssueKey.toUpperCase());
  if (!targetMatch) return { error: 'INVALID_TARGET' };
  const targetProject = await getProjectByKey(targetMatch[1]);
  const targetIssue = targetProject ? await getIssueByKey(targetMatch[1], Number(targetMatch[2])) : null;
  if (!targetIssue) return { error: 'TARGET_NOT_FOUND' };
  if (targetIssue.id === issue.id) return { error: 'SELF_LINK' };

  const admin = getIssueboardSupabaseAdmin();
  if (symmetricTypes.has(relationshipType)) {
    const { data: reverseExisting, error: reverseError } = await admin
      .from('issueboard_relationships')
      .select('id')
      .eq('source_issue_id', targetIssue.id)
      .eq('target_issue_id', issue.id)
      .eq('relationship_type', relationshipType)
      .maybeSingle();
    if (reverseError) throw reverseError;
    if (reverseExisting) return { error: 'DUPLICATE' };
  }

  const { error } = await admin.from('issueboard_relationships').insert({
    source_issue_id: issue.id,
    target_issue_id: targetIssue.id,
    relationship_type: relationshipType,
    created_by: actor
  });
  if (error) {
    if (error.code === '23505') return { error: 'DUPLICATE' };
    throw error;
  }
  return { relationships: await listRelationships(projectKey, issueNumber) };
};

export const deleteRelationship = async (relationshipId) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_relationships')
    .delete()
    .eq('id', relationshipId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

export const searchIssues = async (projectKey, query, excludeIssueId) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  let request = getIssueboardSupabaseAdmin()
    .from('issueboard_issues')
    .select('id,issue_number,title,status:issueboard_statuses(name,category)')
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .limit(10);
  if (query) request = request.ilike('title', `%${query}%`);
  if (excludeIssueId) request = request.neq('id', excludeIssueId);

  const { data, error } = await request;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    key: `${project.key}-${row.issue_number}`,
    title: row.title,
    status: row.status ? { name: row.status.name, category: row.status.category } : null
  }));
};
