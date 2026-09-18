import { useCallback, useEffect, useState } from 'react';

const initialState = {
  status: 'loading',
  project: null,
  projects: [],
  issues: [],
  statuses: [],
  sprints: [],
  error: null
};

const jsonFetch = async (url, init) => {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
};

const throwFromResponse = (payload, fallbackMessage) => {
  const error = new Error(payload?.error?.message || fallbackMessage);
  error.code = payload?.error?.code;
  error.fields = payload?.error?.fields;
  throw error;
};

// Loads the selected project (by key, falling back to the first available
// one when no key is given or it doesn't match a real project), its issues,
// statuses, and sprints, alongside the full project list for the switcher.
// Distinguishes a temporarily unavailable datastore (§3.2) from a workspace
// that genuinely has no projects yet, so the UI never renders an
// unavailable board as empty.
export const useIssueboardData = (projectKey) => {
  const [state, setState] = useState(initialState);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const { ok: projectsOk, payload: projectsPayload } = await jsonFetch('/api/issueboard/projects');
      if (!projectsOk || !projectsPayload?.ok) {
        setState({
          status: 'unavailable',
          project: null,
          projects: [],
          issues: [],
          statuses: [],
          sprints: [],
          error: projectsPayload?.error?.message || 'Issue management is temporarily unavailable.'
        });
        return;
      }

      const projects = projectsPayload.projects;
      const project = projects.find((entry) => entry.key === projectKey) || projects[0] || null;
      if (!project) {
        setState({
          status: 'no-projects',
          project: null,
          projects: [],
          issues: [],
          statuses: [],
          sprints: [],
          error: null
        });
        return;
      }

      const [issuesResult, statusesResult, sprintsResult] = await Promise.all([
        jsonFetch(`/api/issueboard/issues?projectKey=${encodeURIComponent(project.key)}`),
        jsonFetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/statuses`),
        jsonFetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/sprints`)
      ]);
      if (!issuesResult.ok || !issuesResult.payload?.ok) {
        setState({
          status: 'unavailable',
          project,
          projects,
          issues: [],
          statuses: [],
          sprints: [],
          error: issuesResult.payload?.error?.message || 'Issue management is temporarily unavailable.'
        });
        return;
      }

      setState({
        status: 'ready',
        project,
        projects,
        issues: issuesResult.payload.issues,
        statuses: statusesResult.ok && statusesResult.payload?.ok ? statusesResult.payload.statuses : [],
        sprints: sprintsResult.ok && sprintsResult.payload?.ok ? sprintsResult.payload.sprints : [],
        error: null,
        loadedAt: Date.now()
      });
    } catch {
      setState({
        status: 'unavailable',
        project: null,
        projects: [],
        issues: [],
        statuses: [],
        sprints: [],
        error: 'Issue management could not be reached. Check your connection and try again.'
      });
    }
  }, [projectKey]);

  useEffect(() => {
    load();
  }, [load]);

  const createIssue = useCallback(async (input) => {
    const { ok, payload } = await jsonFetch('/api/issueboard/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not create the issue.');
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
    if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not move the issue.');
    setState((current) => ({
      ...current,
      issues: current.issues.map((entry) => (entry.id === payload.issue.id ? payload.issue : entry))
    }));
    return payload.issue;
  }, []);

  const moveIssueSprint = useCallback(async (issue, sprintId) => {
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}/sprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId })
    });
    if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not move the issue.');
    setState((current) => ({
      ...current,
      issues: current.issues.map((entry) => (entry.id === payload.issue.id ? payload.issue : entry))
    }));
    return payload.issue;
  }, []);

  const setIssueWorkState = useCallback(async (issue, workState) => {
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}/work-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workState })
    });
    if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not update the issue state.');
    setState((current) => ({
      ...current,
      issues: current.issues.map((entry) => (entry.id === payload.issue.id ? payload.issue : entry))
    }));
    return payload.issue;
  }, []);

  const createSprint = useCallback(
    async (input) => {
      if (!state.project) throw new Error('No project selected.');
      const { ok, payload } = await jsonFetch(
        `/api/issueboard/projects/${encodeURIComponent(state.project.key)}/sprints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        }
      );
      if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not create the sprint.');
      setState((current) => ({ ...current, sprints: [payload.sprint, ...current.sprints] }));
      return payload.sprint;
    },
    [state.project]
  );

  const replaceSprint = (sprint) =>
    setState((current) => ({
      ...current,
      sprints: current.sprints.map((entry) => (entry.id === sprint.id ? sprint : entry))
    }));

  const startSprint = useCallback(async (sprintId, input) => {
    const { ok, payload } = await jsonFetch(`/api/issueboard/sprints/${sprintId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not start the sprint.');
    replaceSprint(payload.sprint);
    return payload.sprint;
  }, []);

  const completeSprint = useCallback(
    async (sprintId, destinationSprintId) => {
      const { ok, payload } = await jsonFetch(`/api/issueboard/sprints/${sprintId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationSprintId })
      });
      if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not complete the sprint.');
      replaceSprint(payload.sprint);
      await load();
      return payload.sprint;
    },
    [load]
  );

  const cancelSprint = useCallback(
    async (sprintId) => {
      const { ok, payload } = await jsonFetch(`/api/issueboard/sprints/${sprintId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!ok || !payload?.ok) throwFromResponse(payload, 'Could not cancel the sprint.');
      replaceSprint(payload.sprint);
      await load();
      return payload.sprint;
    },
    [load]
  );

  return {
    ...state,
    reload: load,
    createIssue,
    moveIssueStatus,
    moveIssueSprint,
    setIssueWorkState,
    createSprint,
    startSprint,
    completeSprint,
    cancelSprint
  };
};
