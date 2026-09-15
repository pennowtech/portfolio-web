import { useCallback, useEffect, useState } from 'react';

const initialState = { status: 'loading', project: null, issues: [], statuses: [], error: null };

const jsonFetch = async (url, init) => {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
};

// Loads the first available project and its issues. Distinguishes a
// temporarily unavailable datastore (§3.2) from a workspace that genuinely
// has no projects yet, so the UI never renders an unavailable board as empty.
export const useIssueboardData = () => {
  const [state, setState] = useState(initialState);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const { ok: projectsOk, payload: projectsPayload } = await jsonFetch('/api/issueboard/projects');
      if (!projectsOk || !projectsPayload?.ok) {
        setState({
          status: 'unavailable',
          project: null,
          issues: [],
          error: projectsPayload?.error?.message || 'Issue management is temporarily unavailable.'
        });
        return;
      }

      const project = projectsPayload.projects[0] || null;
      if (!project) {
        setState({ status: 'no-projects', project: null, issues: [], statuses: [], error: null });
        return;
      }

      const [issuesResult, statusesResult] = await Promise.all([
        jsonFetch(`/api/issueboard/issues?projectKey=${encodeURIComponent(project.key)}`),
        jsonFetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/statuses`)
      ]);
      if (!issuesResult.ok || !issuesResult.payload?.ok) {
        setState({
          status: 'unavailable',
          project,
          issues: [],
          statuses: [],
          error: issuesResult.payload?.error?.message || 'Issue management is temporarily unavailable.'
        });
        return;
      }

      setState({
        status: 'ready',
        project,
        issues: issuesResult.payload.issues,
        statuses: statusesResult.ok && statusesResult.payload?.ok ? statusesResult.payload.statuses : [],
        error: null,
        loadedAt: Date.now()
      });
    } catch {
      setState({
        status: 'unavailable',
        project: null,
        issues: [],
        statuses: [],
        error: 'Issue management could not be reached. Check your connection and try again.'
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createIssue = useCallback(async (input) => {
    const { ok, payload } = await jsonFetch('/api/issueboard/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!ok || !payload?.ok) {
      const error = new Error(payload?.error?.message || 'Could not create the issue.');
      error.code = payload?.error?.code;
      error.fields = payload?.error?.fields;
      throw error;
    }
    setState((current) => ({ ...current, issues: [...current.issues, payload.issue] }));
    return payload.issue;
  }, []);

  const moveIssueStatus = useCallback(async (issue, statusId) => {
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        assignee: issue.assignee || undefined,
        statusId,
        expectedUpdatedAt: issue.updatedAt
      })
    });
    if (!ok || !payload?.ok) {
      const error = new Error(payload?.error?.message || 'Could not move the issue.');
      error.code = payload?.error?.code;
      throw error;
    }
    setState((current) => ({
      ...current,
      issues: current.issues.map((entry) => (entry.id === payload.issue.id ? payload.issue : entry))
    }));
    return payload.issue;
  }, []);

  return { ...state, reload: load, createIssue, moveIssueStatus };
};
