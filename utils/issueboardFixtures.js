export const issueboardProject = {
  key: 'PORT',
  name: 'Portfolio Website',
  sprint: 'Sprint 04',
  sprintDates: '7–20 Sep',
  sprintProgress: 62
};

export const issueboardIssues = [
  {
    key: 'PORT-66',
    type: 'Bug',
    title: 'Image compression fails for portrait screenshots',
    status: 'In progress',
    priority: 'Highest',
    estimate: 5,
    labels: ['upload', 'frontend'],
    checklist: '2/4',
    attachments: 2,
    due: 'Today'
  },
  {
    key: 'PORT-69',
    type: 'Story',
    title: 'Responsive backlog and board navigation',
    status: 'To do',
    priority: 'Medium',
    estimate: 3,
    labels: ['frontend', 'mobile'],
    checklist: '1/4',
    attachments: 0
  },
  {
    key: 'PORT-70',
    type: 'Task',
    title: 'Slack request signature verification',
    status: 'Review',
    priority: 'High',
    estimate: 3,
    labels: ['security', 'slack'],
    checklist: '4/4',
    attachments: 0
  },
  {
    key: 'PORT-71',
    type: 'Story',
    title: 'Private project workspace navigation',
    status: 'In progress',
    priority: 'Medium',
    estimate: 5,
    labels: ['frontend'],
    checklist: '2/5',
    attachments: 1
  },
  {
    key: 'PORT-72',
    type: 'Task',
    title: 'Configure database row-level security policies',
    status: 'To do',
    priority: 'High',
    estimate: 3,
    labels: ['security', 'database'],
    checklist: '0/3',
    attachments: 0
  },
  {
    key: 'PORT-68',
    type: 'Task',
    title: 'Define issue-management requirements',
    status: 'Done',
    priority: 'Medium',
    estimate: 3,
    labels: ['documentation'],
    checklist: '3/3',
    attachments: 0
  }
];

export const boardStatuses = ['To do', 'In progress', 'Review', 'Done'];
