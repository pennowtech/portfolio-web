import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';
import { listIssues } from './issueService';
import { listSprints } from './sprintService';

const WEEK_MS = 7 * 86_400_000;
const AGEING_THRESHOLD_MS = 14 * 86_400_000;

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday-start week
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
};

const countBy = (items, keyFn) => {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (key == null) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

// Reports are computed from current issue/sprint state rather than
// day-by-day historical snapshots, which this schema doesn't keep. Charts
// that would require that history (a true burndown curve, or "committed vs
// completed" for a *completed* sprint once carried-over issues have moved
// out) are intentionally omitted rather than faked, per the requirement
// that reports must not turn sparse/reconstructed data into misleading
// metrics.
export const getProjectReport = async (projectKey) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  const [issues, sprints] = await Promise.all([listIssues({ projectKey }), listSprints(projectKey)]);

  const now = Date.now();
  const openIssues = issues.filter((issue) => issue.status?.category !== 'done');
  const doneIssues = issues.filter((issue) => issue.status?.category === 'done');

  const byStatus = countBy(issues, (issue) => issue.status?.name);
  const byPriority = countBy(issues, (issue) => issue.priority);
  const byType = countBy(issues, (issue) => issue.type);

  const overdue = openIssues.filter((issue) => issue.dueAt && new Date(issue.dueAt).getTime() < now);
  const ageing = openIssues.filter((issue) => now - new Date(issue.createdAt).getTime() > AGEING_THRESHOLD_MS);

  // Last 6 ISO weeks of created vs completed counts, from real timestamps.
  const weekBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(startOfWeek(now).getTime() - i * WEEK_MS);
    weekBuckets.push({ weekStart, created: 0, completed: 0 });
  }
  const bucketFor = (timestamp) => {
    const ts = new Date(timestamp).getTime();
    return weekBuckets.find((bucket, index) => {
      const bucketEnd = bucket.weekStart.getTime() + WEEK_MS;
      const isLast = index === weekBuckets.length - 1;
      return ts >= bucket.weekStart.getTime() && (isLast ? true : ts < bucketEnd);
    });
  };
  for (const issue of issues) {
    const createdBucket = bucketFor(issue.createdAt);
    if (createdBucket) createdBucket.created += 1;
    if (issue.completedAt) {
      const completedBucket = bucketFor(issue.completedAt);
      if (completedBucket) completedBucket.completed += 1;
    }
  }

  const activeSprint = sprints.find((sprint) => sprint.state === 'active');
  let activeSprintReport = null;
  if (activeSprint) {
    const sprintIssues = issues.filter((issue) => issue.sprintId === activeSprint.id);
    const committedPoints = sprintIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedPoints = sprintIssues
      .filter((issue) => issue.status?.category === 'done')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    activeSprintReport = {
      id: activeSprint.id,
      name: activeSprint.name,
      startsAt: activeSprint.startsAt,
      endsAt: activeSprint.endsAt,
      totalIssues: sprintIssues.length,
      completedIssues: sprintIssues.filter((issue) => issue.status?.category === 'done').length,
      committedPoints,
      completedPoints
    };
  }

  const lastCompletedSprint = [...sprints]
    .filter((sprint) => sprint.state === 'completed')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  let lastCompletedSprintReport = null;
  if (lastCompletedSprint) {
    const remainingIssues = issues.filter((issue) => issue.sprintId === lastCompletedSprint.id);
    const completedPoints = remainingIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const admin = getIssueboardSupabaseAdmin();
    const { data: auditRow } = await admin
      .from('issueboard_audit_events')
      .select('safe_metadata')
      .eq('project_id', project.id)
      .eq('action', 'sprint.completed')
      .contains('safe_metadata', { sprintId: lastCompletedSprint.id })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastCompletedSprintReport = {
      id: lastCompletedSprint.id,
      name: lastCompletedSprint.name,
      completedAt: lastCompletedSprint.completedAt,
      completedIssues: remainingIssues.length,
      completedPoints,
      carriedOverIssues: auditRow?.safe_metadata?.carriedOverIssues ?? null
    };
  }

  return {
    totalIssues: issues.length,
    openIssues: openIssues.length,
    doneIssues: doneIssues.length,
    unassignedIssues: openIssues.filter((issue) => !issue.assignee).length,
    byStatus,
    byPriority,
    byType,
    overdue: overdue.map((issue) => ({ key: issue.key, title: issue.title, dueAt: issue.dueAt })),
    ageing: ageing.map((issue) => ({ key: issue.key, title: issue.title, createdAt: issue.createdAt })),
    weeklyFlow: weekBuckets.map((bucket) => ({
      weekStart: bucket.weekStart.toISOString(),
      created: bucket.created,
      completed: bucket.completed
    })),
    activeSprint: activeSprintReport,
    lastCompletedSprint: lastCompletedSprintReport
  };
};
