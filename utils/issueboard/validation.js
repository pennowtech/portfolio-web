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

export const validationErrorResponse = (error) => ({
  code: 'VALIDATION_ERROR',
  message: 'Check the submitted project fields.',
  fields: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
});
