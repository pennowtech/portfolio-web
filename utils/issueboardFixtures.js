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
    labels: ['bug', 'upload'],
    checklist: '2/4',
    checklistItems: [
      { text: 'Compress in a web worker', done: true },
      { text: 'Preserve portrait orientation', done: true },
      { text: 'Add size validation', done: false },
      { text: 'Cover mobile upload flow', done: false }
    ],
    attachments: 2,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' },
    due: 'Today'
  },
  {
    key: 'PORT-69',
    type: 'Story',
    title: 'Responsive backlog and board navigation',
    status: 'To do',
    priority: 'Medium',
    estimate: 3,
    labels: ['enhancement', 'mobile'],
    checklist: '1/4',
    checklistItems: [
      { text: 'Define mobile navigation', done: true },
      { text: 'Test backlog layout', done: false },
      { text: 'Test board scrolling', done: false },
      { text: 'Verify touch targets', done: false }
    ],
    attachments: 0,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
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
    checklistItems: [
      { text: 'Read raw request body', done: true },
      { text: 'Validate timestamp', done: true },
      { text: 'Compare signing secret', done: true },
      { text: 'Reject replay attempts', done: true }
    ],
    attachments: 0,
    creator: { name: 'Slack', initials: 'SL' }
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
    checklistItems: [
      { text: 'Build desktop navigation', done: true },
      { text: 'Build mobile navigation', done: true },
      { text: 'Add project switcher', done: false }
    ],
    attachments: 1,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
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
    checklistItems: [
      { text: 'Define admin policy', done: false },
      { text: 'Define integration policy', done: false },
      { text: 'Test anonymous access', done: false }
    ],
    attachments: 0,
    creator: { name: 'API', initials: 'AP' }
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
    checklistItems: [
      { text: 'Document scope', done: true },
      { text: 'Document security', done: true },
      { text: 'Document branch strategy', done: true }
    ],
    attachments: 0,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
  }
];

export const boardSubtasks = [
  {
    key: 'PORT-81',
    parentKey: 'PORT-66',
    type: 'Subtask',
    title: 'Preserve EXIF orientation',
    status: 'To do',
    priority: 'High',
    estimate: 2,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
  },
  {
    key: 'PORT-82',
    parentKey: 'PORT-66',
    type: 'Subtask',
    title: 'Add portrait compression tests',
    status: 'In progress',
    priority: 'Medium',
    estimate: 1,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
  },
  {
    key: 'PORT-83',
    parentKey: 'PORT-69',
    type: 'Subtask',
    title: 'Verify board on narrow screens',
    status: 'Review',
    priority: 'Medium',
    estimate: 1,
    creator: { name: 'API', initials: 'AP' }
  },
  {
    key: 'PORT-84',
    parentKey: 'PORT-70',
    type: 'Subtask',
    title: 'Test replay attack rejection',
    status: 'Testing',
    priority: 'Highest',
    estimate: 2,
    creator: { name: 'Slack', initials: 'SL' }
  },
  {
    key: 'PORT-85',
    parentKey: 'PORT-71',
    type: 'Subtask',
    title: 'Polish mobile project switcher',
    status: 'Done',
    priority: 'Low',
    estimate: 1,
    creator: { name: 'Sukhdeep Singh', initials: 'SS' }
  }
];

export const boardStatuses = ['To do', 'In progress', 'Review', 'Testing', 'Done'];
