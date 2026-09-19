import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';
import { getProjectByKey } from './projectService';

const RELATED_ISSUE_SELECT =
  'issue_number,issue_type,title,priority,project:issueboard_projects(project_key),status:issueboard_statuses(name,category)';

// relates_to is inherently symmetric; duplicates is treated as symmetric too
// (matching common issue-tracker semantics -- "A duplicates B" and "B duplicates A"
// are the same claim). `kind` is the precise type the user picked
// (relationship_kind column); parent/child both normalize to the same
// source=parent/target=child edge, so they share one label pair, same as
// predecessor/successor share the underlying `blocks` edge.
const forwardLabel = {
  blocks: 'blocks',
  relates_to: 'relates to',
  duplicates: 'duplicates',
  predecessor: 'predecessor',
  successor: 'successor',
  parent: 'parent of',
  child: 'parent of'
};
const inverseLabel = {
  blocks: 'is blocked by',
  relates_to: 'relates to',
  duplicates: 'is duplicated by',
  predecessor: 'successor',
  successor: 'predecessor',
  parent: 'child of',
  child: 'child of'
};

const toRelatedIssue = (row) => ({
  key: `${row.project.project_key}-${row.issue_number}`,
  title: row.title,
  issueType: row.issue_type || 'task',
  priority: row.priority,
  status: row.status ? { name: row.status.name, category: row.status.category } : null
});

const getOutgoingLabel = (row) => {
  const kind = row.relationship_kind || row.relationship_type;
  return forwardLabel[kind] || kind;
};

const getIncomingLabel = (row) => {
  const kind = row.relationship_kind || row.relationship_type;
  return inverseLabel[kind] || kind;
};

export const listRelationships = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const [outgoing, incoming] = await Promise.all([
    getIssueboardSupabaseAdmin()
      .from('issueboard_relationships')
      .select(
        `id,relationship_type,relationship_kind,created_by,created_at,target:issueboard_issues!issueboard_relationships_target_issue_id_fkey(${RELATED_ISSUE_SELECT})`
      )
      .eq('source_issue_id', issue.id),
    getIssueboardSupabaseAdmin()
      .from('issueboard_relationships')
      .select(
        `id,relationship_type,relationship_kind,created_by,created_at,source:issueboard_issues!issueboard_relationships_source_issue_id_fkey(${RELATED_ISSUE_SELECT})`
      )
      .eq('target_issue_id', issue.id)
  ]);
  if (outgoing.error) throw outgoing.error;
  if (incoming.error) throw incoming.error;

  const outgoingRows = outgoing.data.map((row) => ({
    id: row.id,
    label: getOutgoingLabel(row),
    type: row.relationship_type,
    issue: toRelatedIssue(row.target)
  }));
  const incomingRows = incoming.data.map((row) => ({
    id: row.id,
    label: getIncomingLabel(row),
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
  let dbType = relationshipType;
  let sourceId = issue.id;
  let targetId = targetIssue.id;

  if (relationshipType === 'predecessor') {
    // Target is predecessor of current issue -> target blocks current
    dbType = 'blocks';
    sourceId = targetIssue.id;
    targetId = issue.id;
  } else if (relationshipType === 'successor') {
    // Current issue blocks target issue
    dbType = 'blocks';
    sourceId = issue.id;
    targetId = targetIssue.id;
  } else if (relationshipType === 'parent') {
    dbType = 'relates_to';
    sourceId = targetIssue.id;
    targetId = issue.id;
  } else if (relationshipType === 'child') {
    dbType = 'relates_to';
    sourceId = issue.id;
    targetId = targetIssue.id;
  }

  // Check duplicate
  const { data: existing, error: checkError } = await admin
    .from('issueboard_relationships')
    .select('id,relationship_type')
    .or(
      `and(source_issue_id.eq.${sourceId},target_issue_id.eq.${targetId}),and(source_issue_id.eq.${targetId},target_issue_id.eq.${sourceId})`
    );

  if (checkError) throw checkError;
  if (existing && existing.length > 0) {
    const isDup = existing.some((e) => e.relationship_type === dbType);
    if (isDup) return { error: 'DUPLICATE' };
  }

  const { error } = await admin.from('issueboard_relationships').insert({
    source_issue_id: sourceId,
    target_issue_id: targetId,
    relationship_type: dbType,
    relationship_kind: relationshipType,
    created_by: actor || 'system'
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
    .select('id,issue_number,issue_type,title,status:issueboard_statuses(name,category)')
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .limit(10);

  const cleanQuery = String(query || '').trim();
  if (cleanQuery) {
    const numMatch = cleanQuery.match(/^(?:[A-Za-z]+-)?(\d+)$/);
    if (numMatch) {
      const issueNum = parseInt(numMatch[1], 10);
      request = request.or(`title.ilike.%${cleanQuery}%,issue_number.eq.${issueNum}`);
    } else {
      request = request.ilike('title', `%${cleanQuery}%`);
    }
  }

  if (excludeIssueId) request = request.neq('id', excludeIssueId);

  const { data, error } = await request;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    key: `${project.key}-${row.issue_number}`,
    title: row.title,
    issueType: row.issue_type || 'task',
    status: row.status ? { name: row.status.name, category: row.status.category } : null
  }));
};
