export const isIssueboardDevAuthBypassEnabled = () =>
  process.env.NODE_ENV === 'development' && process.env.ISSUEBOARD_DEV_AUTH_BYPASS === 'true';

export const issueboardDevIdentity = 'Local development';
