import { z } from 'zod';
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from './attachmentTypes';

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

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000).default(''),
    defaultIssueType: z.enum(['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research']),
    defaultPriority: z.enum(['highest', 'high', 'medium', 'low', 'lowest'])
  })
  .strict();

export const setProjectArchivedSchema = z
  .object({
    archived: z.boolean()
  })
  .strict();

const statusFieldsSchema = {
  name: z.string().trim().min(1).max(50),
  category: z.enum(['backlog', 'todo', 'in_progress', 'done']),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, 'Use a hex color like #10b981.'),
  wipLimit: z.number().int().positive().max(999).optional()
};

export const createStatusSchema = z.object(statusFieldsSchema).strict();
export const updateStatusSchema = z.object(statusFieldsSchema).strict();

export const reorderStatusesSchema = z
  .object({
    statusIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, 'Use a hex color like #10b981.');

export const createLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(50)
  })
  .strict();

export const createProjectUserSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(200),
    role: z.string().trim().min(1).max(50).optional()
  })
  .strict();

export const removeProjectUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200)
  })
  .strict();

export const updateLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema
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
    parentIssueId: z.string().uuid().optional(),
    statusId: z.string().uuid().optional()
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
    relationshipType: z.enum(['relates_to', 'blocks', 'duplicates', 'predecessor', 'successor', 'parent', 'child'])
  })
  .strict();

export const authorizeUploadSchema = z
  .object({
    originalFilename: z.string().trim().min(1).max(200),
    mimeType: z.enum(ACCEPTED_ATTACHMENT_MIME_TYPES),
    byteSize: z.number().int().positive().max(10_485_760)
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

export const setIssueWorkStateSchema = z
  .object({
    workState: z.enum(['normal', 'blocked', 'rejected'])
  })
  .strict();

export const validationErrorResponse = (error) => ({
  code: 'VALIDATION_ERROR',
  message: 'Check the submitted project fields.',
  fields: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
});
