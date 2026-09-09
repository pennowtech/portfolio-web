const ISSUEBOARD_ROOT = '/admin/issues';

export const isSafeIssueboardReturnTo = (value) => {
  if (typeof value !== 'string' || !value.startsWith(ISSUEBOARD_ROOT) || value.startsWith('//')) return false;
  try {
    const parsed = new URL(value, 'https://issueboard.local');
    return parsed.origin === 'https://issueboard.local' && parsed.pathname.startsWith(ISSUEBOARD_ROOT);
  } catch {
    return false;
  }
};

export const getSafeIssueboardReturnTo = (value, fallback = `${ISSUEBOARD_ROOT}?view=board`) =>
  isSafeIssueboardReturnTo(value) ? value : fallback;

export const issueHref = (issueKey, returnTo) => ({
  pathname: `${ISSUEBOARD_ROOT}/${encodeURIComponent(issueKey)}`,
  query: isSafeIssueboardReturnTo(returnTo) ? { returnTo } : {}
});

export const workspaceHref = (view, extra = {}) => ({
  pathname: ISSUEBOARD_ROOT,
  query: { view, ...extra }
});
