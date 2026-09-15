import { useCallback, useEffect, useState } from 'react';

const initialState = { status: 'loading', project: null, issues: [], error: null };

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
        setState({ status: 'no-projects', project: null, issues: [], error: null });
        return;
      }

      const { ok: issuesOk, payload: issuesPayload } = await jsonFetch(
        `/api/issueboard/issues?projectKey=${encodeURIComponent(project.key)}`
      );
      if (!issuesOk || !issuesPayload?.ok) {
        setState({
          status: 'unavailable',
          project,
          issues: [],
          error: issuesPayload?.error?.message || 'Issue management is temporarily unavailable.'
        });
        return;
      }

      setState({ status: 'ready', project, issues: issuesPayload.issues, error: null, loadedAt: Date.now() });
    } catch {
      setState({
        status: 'unavailable',
        project: null,
        issues: [],
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

  return { ...state, reload: load, createIssue };
};
