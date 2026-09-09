# Issue Management Workspace — Product and Technical Requirements

## 1. Purpose

Build a private, mobile-friendly issue and project-management workspace inside the SinghBuildsTech portfolio website. The workspace must support project backlogs, sprint planning, Kanban execution, issue details, checklists, nested work, images, and Slack-based issue creation without using GitHub, Jira, Trello, Notion, or Discord as the system of record.

The application will use:

- the existing Google/NextAuth administrator login for website access;
- Supabase PostgreSQL as the authoritative issue-management datastore;
- a private Supabase Storage bucket for images and other permitted attachments;
- Vercel for the existing Next.js application and lightweight authenticated API endpoints;
- Slack Block Kit as the preferred external issue-entry experience;
- browser-side image compression before website uploads.

GitHub is not part of the runtime architecture. Issue #66 and its screenshots are product references only.

### 1.1 Development branch strategy

- `issueboard/main` is the long-lived integration branch for the complete issue-management initiative.
- The requirements document and all issue-board implementation work belong to `issueboard/main` until the complete feature is accepted.
- Every feature, fix, experiment, migration, or hardening branch for this initiative must branch from the latest `issueboard/main`.
- Those child branches must merge back into `issueboard/main`, not directly into the repository's `main` branch.
- `issueboard/main` must remain buildable and reviewable as child branches are integrated.
- The repository's `main` branch must receive the initiative only after the complete feature set, migrations, security controls, documentation, and acceptance tests are finished.
- Production secrets and real customer data must never be committed to any branch.

## 2. Goals

1. Provide one secure workspace for planning and tracking personal or approved project work.
2. Make creating, prioritizing, scheduling, and completing issues convenient on desktop and mobile.
3. Provide Jira-style backlog and sprint planning with a focused Kanban board.
4. Show subtasks and checklist progress directly in the parent issue.
5. Store compressed issue images privately without routing file bodies through Vercel Functions.
6. Allow an authorized Slack user to create structured issues, including images, from Slack mobile.
7. Preserve a clear audit history for all important mutations.
8. Degrade safely and intelligibly if the Supabase Free Plan project is paused or unavailable.

## 3. Non-negotiable requirements

### 3.1 Supabase persistence

- Supabase PostgreSQL is the only authoritative database for projects, sprints, issues, comments, checklists, relationships, and audit events.
- Supabase Storage is the attachment store. The initial deployment must fit within the Free Plan allowance, currently 1 GB of file storage.
- The attachment bucket must be private. The application must never expose a service-role key or permanent unrestricted object URL.
- Database schema changes must be represented as versioned SQL migrations committed to the repository.
- Row Level Security must be enabled on exposed tables even when the normal website flow accesses them through a protected server API.

### 3.2 Supabase Free Plan pausing

- The product must assume that a low-activity Free Plan project can be paused after a seven-day low-activity period.
- A paused or unreachable database must not appear as an empty board and must never trigger destructive reconciliation.
- The UI must distinguish `temporarily unavailable` from `no projects/issues` and display a private administrator-facing recovery message.
- Read and mutation APIs must return a stable service-unavailable response, for example `503` with code `DATASTORE_UNAVAILABLE`, without leaking provider details or secrets.
- Client mutations must retain unsaved form content locally and offer an explicit retry after service restoration.
- The operations guide must document Supabase warning emails, manual project restoration, post-resume verification, and the one-year restoration window stated by Supabase.
- Availability-sensitive production use must recommend a paid Supabase plan; artificial traffic must not be represented as a guaranteed anti-pause mechanism.
- An authenticated health check may report database and storage readiness, but it must not expose connection information and must not modify business data.

### 3.3 Vercel-safe uploads

- Image/file bodies must never be uploaded through a normal Next.js API Route, Server Action, or Vercel Function.
- The design must remain below Vercel's current 4.5 MB function request and response payload ceiling.
- A small authenticated API request may create a short-lived, single-object Supabase signed upload authorization.
- The browser must upload the compressed object directly to Supabase Storage.
- A separate small finalize request must validate the stored object and create its attachment database record.
- Storage object paths must be generated by the server; clients must not select arbitrary bucket paths.
- Direct upload must support progress, cancellation, retry, duplicate-submit protection, and cleanup of abandoned objects.

### 3.4 Browser image compression

- Install and use `browser-image-compression` in client-only code.
- Compression must normally execute in a Web Worker to avoid blocking the UI.
- Orientation must be normalized and unnecessary EXIF metadata must not be retained by default.
- Website uploads must accept only explicitly supported image formats, initially JPEG, PNG, and WebP.
- The default output target is at most 1 MB per image and at most 1920 pixels on the longest edge.
- The application must re-check the actual compressed byte size and MIME type before requesting an upload authorization.
- If the compressed result exceeds the configured maximum, the upload must be rejected with an actionable message rather than sent through Vercel.
- Animated formats, SVG, HEIC/HEIF, malformed images, and decompression-bomb risks require explicit handling; unsupported formats must fail closed.
- The UI must show original size, compressed size, reduction percentage, preview, progress, and removal controls.
- Client compression is an optimization and safety layer, not a trust boundary. Stored-object metadata must also be verified server-side before attachment finalization.

### 3.5 Slack integration and request authenticity

- Slack is the preferred chat integration for the first release; Discord is optional and must not delay Slack delivery.
- Slack issue creation must use Block Kit modals with structured project, issue type, priority, sprint, title, description, and optional file inputs.
- Every Slack HTTP request must be verified from the untouched raw request body using `X-Slack-Signature`, `X-Slack-Request-Timestamp`, HMAC-SHA256, and the server-only Slack signing secret.
- Signature comparison must use a timing-safe comparison.
- Requests older than five minutes must be rejected to reduce replay risk.
- Deprecated verification tokens are not sufficient.
- Slack requests must be acknowledged within three seconds.
- Event IDs or a deterministic request identifier must be persisted for idempotency so Slack retries cannot create duplicate issues.
- Slack workspace, enterprise (when present), and user IDs must be checked against explicit server-side allow-lists.
- Secrets, Slack file URLs, access tokens, raw signatures, and private message bodies must never be written to application logs.

### 3.6 Existing website authentication

- The existing Google OAuth/NextAuth session remains the authentication gate for the website workspace.
- Only the exact normalized email configured in `ADMIN_EMAIL`, or a future explicit administrator allow-list, may access issue-management pages and APIs.
- Every server endpoint must independently validate the session; hiding routes or client-side guards is not authorization.
- State-changing browser requests must pass same-origin/CSRF protections.
- Production startup/build must fail closed when the NextAuth secret is absent. A predictable fallback secret is prohibited.

## 4. Users and roles

### 4.1 Initial role

- **Administrator:** full access to projects, issues, sprints, attachments, configuration, integrations, and audit history.

### 4.2 Extensible roles

The schema and authorization layer should permit later addition of:

- **Project manager:** administer assigned projects and sprints;
- **Contributor:** create and update work in assigned projects;
- **Viewer:** read assigned projects without mutation rights;
- **Integration actor:** narrowly scoped Slack identity, never an interactive website session.

Role checks must be server-side and project-scoped. The initial single-admin release does not need a role-management UI.

## 5. Information architecture

Private routes:

- `/admin/issues` — default project workspace and board;
- `/admin/issues/projects` — project list and project settings;
- `/admin/issues/backlog` — selected project's backlog and sprint planning;
- `/admin/issues/board` — selected sprint or continuous-flow board;
- `/admin/issues/calendar` — due-date and sprint timeline view;
- `/admin/issues/reports` — delivery and workload summaries;
- `/admin/issues/settings` — issue types, statuses, priorities, labels, Slack integration, storage usage;
- `/admin/issues/[issueKey]` — shareable private issue detail route.

All routes must be responsive, keyboard accessible, marked `noindex`, excluded from the sitemap, and server-protected before private data is rendered.

## 6. Core domain model

All primary keys should use UUIDs. Timestamps should use `timestamptz` in UTC. Mutable records require `created_at`, `updated_at`, `created_by`, and `updated_by` where applicable.

### 6.1 Projects

Required fields:

- stable project key, such as `PORT`;
- name, description, icon/color;
- active/archived lifecycle;
- default issue type, priority, and workflow;
- issue sequence counter used to generate keys such as `PORT-42`;
- optional start/end dates;
- sort order and ownership metadata.

Project keys must be unique, uppercase, and immutable after issues exist unless a dedicated migration flow is introduced.

### 6.2 Workflows and statuses

- Each project uses a workflow containing ordered statuses.
- Status categories are `backlog`, `todo`, `in_progress`, and `done`.
- Administrators may rename statuses and set color, WIP limit, order, and active state.
- Status deletion is blocked while referenced; migration to another status is required.
- Board transitions must be validated server-side.

### 6.3 Sprints

Required fields:

- project, name, goal, sequence;
- planned start and end dates;
- lifecycle: `planned`, `active`, `completed`, `cancelled`;
- capacity notes and optional retrospective;
- created/completed timestamps.

Rules:

- At most one active sprint per project in the initial release.
- Starting a sprint requires start/end dates and at least one planned issue unless explicitly confirmed.
- Completing a sprint requires choosing where incomplete issues move: backlog or a planned sprint.
- Historical sprint membership and completion metrics must remain reportable.

### 6.4 Issues

Required fields:

- generated human-readable issue key;
- project and optional sprint;
- type: task, bug, story, feature, improvement, research, or configurable equivalent;
- title and rich Markdown/plain-text description;
- status, priority, reporter, optional assignee;
- labels;
- story points or estimate;
- due date, start date, rank, and completion timestamp;
- optional parent issue;
- archived/deleted metadata using recoverable soft deletion;
- source: website, Slack, import, or system;
- source reference for idempotency and traceability.

Validation:

- Title: 3–200 characters after trimming.
- Description: bounded by a documented maximum.
- Parent and child must belong to the same project initially.
- Cyclic parent relationships are prohibited.
- Rank changes must be transactional and collision-safe.
- Closed issues can be reopened with an audit event.

### 6.5 Subtasks and relationships

- Subtasks are full issues linked by `parent_issue_id`, not checklist items.
- Parent issues show completed/total subtask progress.
- Subtasks can be opened, assigned, prioritized, scheduled, and discussed independently.
- Configurable nesting limit defaults to one child level for the first release.
- Issue relationships support `blocks`, `is_blocked_by`, `relates_to`, and `duplicates`.
- Relationship creation must prevent invalid self-links and duplicate inverse links.
- The issue detail view must provide a searchable relationship picker for linking any authorized existing issue as a parent, child/subtask, blocker, blocked issue, related issue, or duplicate.
- Search results must show project key, issue key, title, status, and relationship conflicts without loading the entire issue catalogue into the browser.
- Parent changes must prevent hierarchy cycles and respect the configured nesting limit.
- Directional relationships must render reciprocally: adding `A blocks B` displays `B is blocked by A`; symmetric relationships such as `relates_to` must not create duplicate rows.
- Removing a relationship removes only that link and must never delete either issue.
- Cross-project relationships may be allowed only when the authenticated actor can access both projects; parent/subtask links remain same-project in the initial release.

### 6.6 Checklists

- An issue may contain multiple ordered checklists.
- Checklist items support text, checked state, order, optional assignee, and optional due date.
- Checklist progress is displayed on cards and issue details.
- Checklist items are lightweight completion criteria and do not receive issue keys.
- Each checklist item and supported description bullet must expose a keyboard- and touch-accessible quick-action menu with **Create linked subtask**, **Link existing subtask**, **Unlink subtask**, and the normal edit/delete actions allowed by its state.
- Creating a subtask from a checklist item or bullet preserves its text, records a bidirectional link, and opens the new subtask without losing the parent's navigation context.
- A checklist item may link to at most one subtask in the initial release, and a subtask may link back to at most one checklist item.
- A linked checklist item and subtask share one completion outcome: closing/completing the subtask checks the checklist item, and checking the checklist item completes the linked subtask.
- Reopening either side must reopen/uncheck the other side. This synchronization must be transactional, idempotent, audited, and protected against recursive update loops.
- Linking an already completed checklist item to an open subtask, or the reverse, must require the user to choose which current state wins before synchronization begins.
- Deleting or unlinking either side must not silently delete the other record.
- AI-generated checklist suggestions are a future enhancement and require explicit user review before persistence.

### 6.7 Comments and activity

- Issues support ordered comments with author and timestamps.
- Comment editing preserves an edited indicator; deletion is soft and auditable.
- Activity events record issue creation, field changes, moves, sprint changes, assignments, attachment actions, and Slack ingestion.
- The issue activity timeline must be readable without exposing secret integration payloads.
- User-authored comments and machine audit events must be distinguishable.

### 6.8 Attachments

Attachment metadata includes:

- issue ID, private storage bucket, immutable object path;
- original filename and normalized display name;
- detected MIME type, byte size, width, and height;
- SHA-256 digest where practical;
- source (`website` or `slack`), uploader, and timestamps;
- processing state: `pending`, `ready`, `rejected`, `deleted`, or `orphaned`;
- optional thumbnail path.

The database stores metadata only; binary content stays in Supabase Storage.

## 7. Product feature set

### 7.1 Project selection and overview

- Project dropdown available consistently across workspace views.
- Create, edit, archive, and restore projects.
- Overview cards for open issues, active sprint, overdue work, unassigned work, and completion rate.
- Recent activity and quick-create action.
- Selected project persisted in the URL and optionally as a non-sensitive preference.

### 7.2 Backlog

- Ranked backlog grouped separately from planned and active sprints.
- Inline issue creation from backlog and sprint sections.
- Drag or keyboard action to reorder and move issues between backlog/sprints.
- Multi-select bulk changes for sprint, status, priority, labels, and assignee.
- Search and filters with clear/reset controls.
- Collapsible issue rows showing type, key, priority, assignee, estimate, labels, attachment indicator, and subtask/checklist progress.
- Sprint create, edit, start, complete, and cancel actions with confirmation where consequential.

### 7.3 Sprint/Kanban board

- Columns derive from the selected project's ordered workflow statuses.
- Cards can be moved using pointer and keyboard controls.
- Optimistic updates must roll back cleanly on failure.
- Cards show issue key, title, type, priority, assignee, labels, estimate, due-state, attachment count, and progress indicators.
- Quick-create is available in permitted columns.
- WIP limits are displayed and enforced or warned according to project configuration.
- Filters include assignee, type, priority, label, sprint, overdue state, and free-text search.
- Board supports active sprint and backlog/continuous-flow modes.
- Issue details open in a responsive drawer/modal while retaining a canonical route.

### 7.4 Issue editor and detail view

- Create, view, edit, duplicate, archive, restore, close, and reopen issues.
- Autosave may be used only with visible save state and conflict handling; explicit save is acceptable initially.
- Markdown description with safe preview and sanitized rendering.
- Inline editing for common fields.
- Subtask list with quick creation and progress.
- Multiple checklists with reorder and progress.
- Comments and activity timeline.
- Image gallery with preview, captions, download, and authorized deletion.
- Copy issue link and issue key.
- Unsaved-change warning before navigation.
- Closing the issue detail drawer, modal, or full-page view must return to the exact originating screen rather than a fixed default route.
- Origin restoration includes project, view (overview/backlog/board/calendar/search), sprint, filters, sorting, pagination, selected grouping, and practical scroll position.
- Direct links with no safe internal origin fall back to the selected project's board or backlog; untrusted external return URLs must never be followed.
- Opening another issue or subtask from issue details pushes an internal navigation stack; Close and browser Back return one level at a time.
- View state should live in the URL where practical, and scroll restoration occurs after the originating collection loads.
- Mobile layout must allow all essential operations without horizontal scrolling.

### 7.4.1 Website design-system reuse

- The production workspace must use the repository's Tailwind CSS configuration and responsive/dark-mode conventions.
- Reuse suitable website assets and components, including local fonts, theme switching, authenticated layout patterns, buttons, form treatments, focus behavior, drawers, dialogs, and icons.
- The standalone HTML prototype is a review artifact only; its embedded CSS must not become a parallel production design system.
- Issueboard-specific primitives may be introduced when existing website components cannot satisfy dense application UI, accessibility, or mobile behavior, but they must use shared Tailwind tokens and conventions.

### 7.5 Search and filtering

- Search by issue key, title, and description.
- Filter by project, status, sprint, type, priority, assignee, label, source, due state, and updated date.
- Sort by rank, priority, created, updated, due date, or issue key.
- Filter state is represented in the URL when practical.
- PostgreSQL indexes must support expected filters; text search should use PostgreSQL full-text search or trigram indexing rather than loading all issues into the browser.

### 7.6 Reports

Initial reports:

- active-sprint progress;
- created versus completed issues over time;
- issues by status, priority, and type;
- overdue and ageing work;
- planned versus completed story points;
- sprint completion summary and carried-over work.

Charts must have text/table equivalents and must avoid misleading metrics when data is sparse.

### 7.7 Notifications

- In-app success/error feedback for mutations.
- Optional Slack confirmation containing the created issue key and a private website link.
- Optional reminders for overdue issues and sprint boundaries are later enhancements.

## 8. Website image-upload workflow

1. User selects or captures an image in the browser.
2. Client validates declared type and configurable original-size ceiling.
3. `browser-image-compression` compresses and resizes it in a Web Worker.
4. Client decodes the result to ensure it remains a valid supported image.
5. Client displays before/after sizes and preview.
6. Authenticated client sends metadata only to `POST /api/admin/issues/uploads/authorize`.
7. Server validates Google admin session, same origin, issue access, quotas, MIME allow-list, size, and rate limits.
8. Server generates an immutable object path and short-lived Supabase signed upload authorization.
9. Browser uploads bytes directly to the private Supabase bucket.
10. Client sends object path and upload result metadata to `POST /api/admin/issues/uploads/finalize`.
11. Server confirms the object exists at the authorized path, validates stored size/type and issue ownership, then creates the attachment record.
12. Failed or expired uploads remain `pending` and are removed by an authenticated cleanup job after a retention window.

Authorization responses must not contain the Supabase service-role key. Signed upload validity should be as short as the supported workflow reasonably permits.

## 9. Slack feature set

### 9.1 Entry points

Preferred first-release entry points:

- global shortcut: **Create issue**;
- message shortcut: **Create issue from message**;
- optional `/issue create` slash command that opens the same modal.

The message shortcut pre-fills the description from the selected message and stores a non-secret Slack reference. Channel history ingestion beyond the explicitly selected message is out of scope initially.

### 9.2 Block Kit modal

Required fields:

- project;
- issue type;
- title;
- description;
- priority;
- sprint/backlog selection;
- optional labels;
- optional image file input;
- explicit submit and cancel actions.

Dynamic selectors must expose only projects, sprints, and labels authorized for that Slack workspace/user.

### 9.3 Slack images

Browser-side compression cannot apply to images uploaded inside Slack. Slack ingestion therefore uses a separate controlled pipeline:

1. Slack sends only interaction/file metadata to the verified endpoint; the large image body does not enter through the Vercel request.
2. The app acknowledges Slack within three seconds after validation and durable idempotent intake.
3. A server-side worker downloads the permitted Slack file using the bot token.
4. The worker validates content type and magic bytes, enforces original and decoded-dimension limits, strips metadata, compresses/resizes with a maintained server-side image processor, and uploads directly to the private Supabase bucket.
5. The worker associates the ready attachment with the issue and posts a Slack confirmation.
6. Temporary files, buffers, and Slack download URLs are discarded promptly.

Slack's own file-input ceiling is not the application's accepted ceiling. The application must enforce a smaller documented limit appropriate to Vercel execution time, memory, and Supabase quota. If durable background execution cannot be guaranteed by the selected Vercel plan/runtime, Slack media processing must run in a Supabase Edge Function or another approved durable worker rather than pretending that work after an HTTP response is reliable.

### 9.4 Slack identity and authorization

- Map approved Slack user IDs to an internal integration actor or administrator record.
- Do not authorize by mutable display name or email alone.
- Restrict the app to configured workspace/team IDs.
- Private-channel content must not be reproduced outside its intended issue without explicit action and authorization.
- Store minimum source metadata: team ID, channel ID, message timestamp, and invoking user ID; do not retain full raw payloads.
- Support idempotent retries and clear user-visible errors.

### 9.5 Discord

Discord is a future adapter after the Slack flow is complete. It must reuse the same domain service and authorization model. If implemented, HTTP interactions must verify `X-Signature-Ed25519` and `X-Signature-Timestamp` against the Discord application public key using the raw request body. Slack HMAC verification must not be reused for Discord.

## 10. API and service boundaries

The UI, Slack adapter, and future Discord adapter must call shared domain services rather than duplicating issue rules.

Recommended logical modules:

- `issueService` — issue creation, updates, transitions, hierarchy, and relationships;
- `projectService` — projects, workflows, and settings;
- `sprintService` — planning and lifecycle transitions;
- `attachmentService` — signed upload authorization, finalization, signed download URLs, and cleanup;
- `auditService` — immutable activity recording;
- `slackService` — signature verification, modal construction, identity mapping, and idempotent ingestion;
- `supabaseAdmin` — server-only Supabase client and error normalization.

API conventions:

- JSON responses use stable machine-readable error codes and safe human messages.
- Mutation endpoints require session, role, origin, schema validation, and rate limiting.
- List endpoints use cursor-based or bounded pagination.
- API responses use `Cache-Control: no-store` for private operational data.
- Mutations support idempotency keys where duplicate submission is plausible.
- Database transactions or PostgreSQL functions protect multi-record operations such as ranking, sprint completion, and issue-key allocation.

## 11. Security requirements

### 11.1 Secret handling

- Keep Supabase service-role key, database credentials, Slack signing secret, and Slack bot token in server-only encrypted environment variables.
- Never prefix secrets with `NEXT_PUBLIC_`.
- Only the Supabase project URL and an intentionally public publishable/anon key may reach the client, and direct uploads should still use path-scoped signed upload authorizations.
- Production configuration must fail closed when mandatory secrets are missing.
- Logs and error trackers must redact authorization headers, cookies, signed URLs, signatures, and provider payloads.

### 11.2 Database security

- Enable RLS on every application and storage table exposed through Supabase APIs.
- Deny anonymous table access by default.
- Prefer server-mediated database mutations using the service role only after NextAuth authorization.
- Use least-privilege database functions for sensitive transactional operations where practical.
- Add foreign keys, uniqueness constraints, check constraints, and bounded values as defense in depth.
- Audit records are append-only to application actors.

### 11.3 Application security

- Validate all inputs with a shared schema library.
- Sanitize rendered Markdown and prohibit dangerous HTML/scripts.
- Use parameterized Supabase queries; never construct SQL from input.
- Enforce same-origin checks for website mutations.
- Apply per-user and per-IP rate limits to authentication-sensitive and mutation endpoints.
- Use secure, HTTP-only, SameSite cookies managed by NextAuth.
- Return generic upstream errors to clients and detailed redacted diagnostics only to protected logs.
- Do not trust browser-provided user IDs, roles, issue keys, storage paths, MIME types, or byte sizes.

### 11.4 Attachment security

- Private bucket only.
- Signed read URLs must be short-lived and generated only after authorization.
- Server-generated random object names prevent traversal, collision, and predictable enumeration.
- Validate extension, declared MIME type, detected magic bytes, decoded dimensions, and byte size.
- Reject SVG initially because active content requires additional sanitization.
- Reject executables and polyglot/suspicious files.
- Set safe download headers and a restrictive content disposition where appropriate.
- Deleting an attachment must soft-delete metadata first and use retryable object cleanup.
- Storage quota checks must reserve headroom rather than permitting uploads up to exactly 1 GB.

### 11.5 Slack endpoint security

- Disable the default JSON body parser on signature-verified routes until the raw body is captured.
- Validate timestamp freshness before HMAC work where safe, then use timing-safe signature comparison.
- Reject missing, malformed, stale, or mismatched signatures with no diagnostic detail.
- Enforce workspace and user allow-lists after cryptographic verification.
- Deduplicate Slack retry headers and event/interaction identifiers.
- Acknowledge valid requests promptly and perform slow work durably.

## 12. Reliability and data integrity

- Use transactions for issue creation plus audit record, sprint completion, ranking, and hierarchy changes.
- Issue key allocation must remain unique under concurrent requests.
- Use optimistic concurrency (version number or `updated_at`) to prevent silent overwrites.
- Retriable client operations must be idempotent.
- Direct-upload authorization, object upload, and database finalization are separate states and require orphan cleanup.
- Provider outages must not be converted into empty success responses.
- Destructive operations use soft deletion and an administrator restore path.
- Define retention for soft-deleted issues, deleted attachments, audit logs, and abandoned uploads.
- Document export and recovery procedures because the Supabase Free Plan does not include the same backup guarantees as paid production tiers.

## 13. Performance and quotas

- Initial board load should fetch only the selected project and relevant sprint/backlog window.
- Paginate large backlogs, activity feeds, comments, and search results.
- Use database indexes for project/status/sprint/rank, parent, updated date, due date, source reference, and normalized search.
- Avoid N+1 queries for cards, labels, subtasks, checklists, and attachment counts.
- Lazy-load full descriptions, comments, activity, and signed attachment URLs when issue details open.
- Track storage bytes in application metadata and periodically reconcile against Supabase Storage.
- Warn administrators at configurable thresholds, initially 70%, 85%, and 95% of the planned storage budget.
- Enforce per-file, per-issue, and overall storage limits.

## 14. Accessibility and responsive behavior

- Meet WCAG 2.2 AA for new private workspace UI where practical.
- All drag-and-drop actions require keyboard-accessible alternatives.
- Status and priority must never be communicated by color alone.
- Dialogs and drawers must trap/restore focus correctly and support Escape where safe.
- Form controls require labels, clear validation, and screen-reader announcements for async results.
- Touch targets must be usable on Slack/website mobile workflows.
- Board columns may horizontally scroll on small screens, but issue creation, editing, and transitions must have non-drag mobile controls.
- Respect reduced-motion preferences.

## 15. Observability and operations

- Structured, redacted logs with request/correlation IDs.
- Error monitoring for API failures, failed Slack verification, database unavailability, attachment processing, and orphan cleanup.
- Do not log normal Slack signature failures at a level that enables log-flood attacks.
- Private health screen for database reachability, storage reachability, schema version, integration configuration presence, and recent job failures.
- Document how to resume a paused Supabase project and verify:
  1. database connectivity;
  2. migrations/schema version;
  3. private bucket access;
  4. signed upload and download;
  5. issue list integrity;
  6. Slack create flow.
- Document Free Plan quotas and upgrade triggers.

## 16. Testing requirements

### 16.1 Unit tests

- validation schemas;
- permissions and project-scoped authorization;
- issue-key generation and ranking;
- sprint lifecycle rules;
- hierarchy cycle detection;
- checklist calculations;
- Slack timestamp/signature verification using known vectors;
- upload path generation and metadata validation;
- provider-error normalization.

### 16.2 Integration tests

- authenticated/unauthenticated API behavior;
- RLS denial for anonymous and unauthorized access;
- transactional issue creation and audit insertion;
- concurrent issue-key creation;
- sprint completion and carry-over;
- signed upload authorization/finalization;
- stale, malformed, and duplicate Slack requests;
- Supabase unavailable/paused behavior.

### 16.3 End-to-end tests

- Google-authenticated administrator enters the workspace;
- project creation and selection;
- backlog issue creation and ordering;
- sprint creation, start, board transition, and completion;
- issue edit, checklist, subtask, comment, archive, and restore;
- browser compression followed by direct upload and private image viewing;
- responsive mobile issue workflow;
- keyboard board transition;
- Slack modal issue creation with idempotent retry simulation.

Automated tests must not require production credentials or modify production data.

## 17. Delivery phases

### Phase 0 — security and foundations

- Remove predictable NextAuth secret fallback and validate required production configuration.
- Add Supabase clients, migrations, RLS policies, private bucket, shared validation, and protected API conventions.
- Add provider-unavailable handling and operations documentation.

### Phase 1 — project, issue, and backlog MVP

- Projects, configurable statuses, issues, labels, comments, and activity.
- Project selector, searchable backlog, issue detail/editor, archive/restore.
- Responsive protected workspace.

### Phase 2 — sprints and board

- Sprint lifecycle and planning.
- Kanban board, ranking, transitions, filters, WIP feedback, and quick-create.
- Sprint summaries and core reports.

### Phase 3 — hierarchy and checklists

- Subtasks, parent progress, checklists, relationships, and dependency visibility.

### Phase 4 — secure attachments

- Browser image compression.
- Signed direct-to-Supabase upload and private signed viewing.
- Quotas, cleanup, gallery, and attachment audit events.

### Phase 5 — Slack

- Verified Slack endpoints, identity mapping, shortcuts, Block Kit modal, issue creation, deduplication, and confirmation.
- Controlled Slack image download, server-side compression, Supabase upload, and failure recovery.

### Phase 6 — hardening and enhancements

- Advanced reports, saved filters, realtime refresh where useful, exports, stronger backup process, and optional Discord adapter.
- AI-generated checklist suggestions only after privacy, cost, prompt-injection, and explicit-confirmation requirements are defined.

## 18. Acceptance criteria

The first complete release is acceptable when:

1. No GitHub/Jira/Trello/Notion API is required for issue-management operation.
2. An unapproved or signed-out website visitor cannot read or mutate any project data or private attachment.
3. An administrator can manage multiple projects, backlogs, sprints, board statuses, issues, checklists, subtasks, comments, labels, and attachments on desktop and mobile.
4. Board and backlog mutations remain consistent under refresh, retry, and concurrent issue creation.
5. Website images are compressed in-browser and uploaded directly to a private Supabase bucket; image bytes do not pass through Vercel Functions.
6. Oversized, unsupported, or malformed images are rejected safely on both client and finalization paths.
7. The application produces a clear recoverable unavailable state when Supabase is paused instead of showing an empty board or losing an edit.
8. A permitted Slack user can create a structured issue from Slack mobile using Block Kit.
9. Forged, stale, disallowed-workspace, disallowed-user, and duplicate Slack requests do not create issues.
10. Slack-originated supported images are validated, compressed server-side, stored privately in Supabase, and attached to exactly one issue without traversing the inbound Vercel request body.
11. Every significant mutation creates a safe audit event.
12. Secrets and privileged tokens are absent from browser bundles, API responses, logs, source control, and stored integration payloads.
13. Unit, integration, and critical end-to-end tests pass in CI using isolated test configuration.

## 19. Explicitly deferred or out of scope

- GitHub issue or GitHub Projects integration;
- Jira, Trello, or Notion synchronization;
- public issue boards or anonymous issue submission;
- arbitrary file types and executable attachments;
- SVG uploads;
- multi-tenant self-service signup in the initial release;
- billing, time invoicing, or payroll;
- guaranteed high availability while remaining on a pausable Free Plan;
- automatic AI-generated subtasks without human review;
- Discord integration before Slack acceptance criteria are met.

## 20. Required configuration

Names are illustrative and must remain server-only unless explicitly marked public:

```dotenv
# Existing administrator authentication
ADMIN_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Supabase server access
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ISSUE_BUCKET=issue-attachments

# Optional publishable browser configuration; never use the service-role key here
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Slack
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_ALLOWED_TEAM_IDS=
SLACK_ALLOWED_USER_IDS=
```

The implementation must document which public Supabase values are actually required. If signed upload URLs can be consumed without initializing a privileged browser client, unnecessary client environment values should be omitted.

## 21. Decision record

- **System of record:** Supabase PostgreSQL.
- **Binary storage:** private Supabase Storage bucket.
- **Website identity:** existing Google OAuth/NextAuth administrator session.
- **Website upload transport:** browser compression followed by direct signed upload to Supabase.
- **Primary chat adapter:** Slack Block Kit.
- **Slack trust mechanism:** raw-body HMAC signature verification, timestamp freshness, allow-lists, and idempotency.
- **GitHub:** explicitly not used by the feature.
- **Free Plan posture:** supported for low-volume use with graceful pause handling; not described as high availability.
