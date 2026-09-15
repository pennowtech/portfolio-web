import { z } from 'zod';

export const createProjectSchema = z
  .object({
    projectKey: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][A-Z0-9]{1,9}$/, 'Use 2–10 uppercase letters or numbers.'),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000).default(''),
    defaultIssueType: z.enum(['task', 'story', 'bug', 'epic']).default('task')
  })
  .strict();

export const createIssueSchema = z
  .object({
    projectKey: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][A-Z0-9]{1,9}$/, 'Provide a valid project key.'),
    issueType: z.enum(['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research', 'subtask']),
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters.')
      .max(200, 'Title must be at most 200 characters.'),
    description: z.string().trim().max(20000).default(''),
    priority: z.enum(['highest', 'high', 'medium', 'low', 'lowest']).default('medium'),
    assignee: z.string().trim().max(200).optional(),
    storyPoints: z.number().min(0).max(999).optional(),
    dueAt: z.string().datetime().optional(),
    parentIssueId: z.string().uuid().optional()
  })
  .strict();

export const validationErrorResponse = (error) => ({
  code: 'VALIDATION_ERROR',
  message: 'Check the submitted project fields.',
  fields: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
});
