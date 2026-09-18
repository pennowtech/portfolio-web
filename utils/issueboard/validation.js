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

export const updateIssueSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters.')
      .max(200, 'Title must be at most 200 characters.'),
    description: z.string().trim().max(20000).default(''),
    priority: z.enum(['highest', 'high', 'medium', 'low', 'lowest']),
    assignee: z.string().trim().max(200).optional(),
    statusId: z.string().uuid(),
    expectedUpdatedAt: z.string().datetime({ offset: true })
  })
  .strict();

export const setArchivedSchema = z
  .object({
    archived: z.boolean()
  })
  .strict();

export const commentBodySchema = z
  .object({
    body: z.string().trim().min(1, 'Comment cannot be empty.').max(50000, 'Comment is too long.')
  })
  .strict();

export const labelNameSchema = z
  .object({
    name: z.string().trim().min(1, 'Label name cannot be empty.').max(50, 'Label name must be at most 50 characters.')
  })
  .strict();

export const checklistTitleSchema = z
  .object({
    title: z.string().trim().min(1, 'Checklist title is required.').max(200)
  })
  .strict();

export const checklistItemBodySchema = z
  .object({
    body: z.string().trim().min(1, 'Item text cannot be empty.').max(1000)
  })
  .strict();

export const checklistItemCompleteSchema = z
  .object({
    isComplete: z.boolean()
  })
  .strict();

export const linkChecklistItemSubtaskSchema = z
  .object({
    subtaskKey: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9]{1,9}-\d{1,10}$/i, 'Provide a valid issue key.'),
    resolution: z.enum(['checklist', 'subtask']).optional()
  })
  .strict();

export const createRelationshipSchema = z
  .object({
    targetIssueKey: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9]{1,9}-\d{1,10}$/i, 'Provide a valid issue key.'),
    relationshipType: z.enum(['relates_to', 'blocks', 'duplicates'])
  })
  .strict();

export const authorizeUploadSchema = z
  .object({
    originalFilename: z.string().trim().min(1).max(200),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    byteSize: z.number().int().positive().max(1_048_576)
  })
  .strict();

export const createSprintSchema = z
  .object({
    name: z.string().trim().min(1, 'Sprint name is required.').max(100),
    goal: z.string().trim().max(2000).default('')
  })
  .strict();

export const startSprintSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    force: z.boolean().default(false)
  })
  .strict();

export const completeSprintSchema = z
  .object({
    destinationSprintId: z.string().uuid().optional()
  })
  .strict();

export const setIssueSprintSchema = z
  .object({
    sprintId: z.string().uuid().nullable()
  })
  .strict();

export const validationErrorResponse = (error) => ({
  code: 'VALIDATION_ERROR',
  message: 'Check the submitted project fields.',
  fields: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
});
