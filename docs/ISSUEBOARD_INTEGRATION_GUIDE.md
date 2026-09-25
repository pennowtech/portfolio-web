# Issueboard Integration Guide

This guide explains how to connect external applications, mobile apps, feedback widgets, and automated systems with our Issueboard.

---

## The Two Integration Scenarios

We provide two distinct ways to create issues, depending on who or what is submitting them:

| Feature                  | Scenario 1: Client App User Feedback (`/api/submit-issue`)                            | Scenario 2: Direct System & Automation API (`/api/issues`)                                    |
| :----------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **Who is it for?**       | Mobile apps (e.g. Lingora), websites, desktop apps, and end-user feedback widgets.    | CI/CD pipelines, backend microservices, Sentry/logging alerts, developer CLI tools.           |
| **Authentication**       | **None required (Public CORS)**. Built for public end-users.                          | **Requires `ISSUEBOARD_API_KEY`** (or active admin session).                                  |
| **Dual-Posting**         | **Yes**: Creates an issue on our private Issueboard **and** forwards it to GitHub.    | **No**: Purely private Issueboard management with complete project workspace fidelity.        |
| **File / Image Uploads** | Yes (Base64 in JSON or multipart form files).                                         | Yes (Base64 in JSON or multipart form files).                                                 |
| **Control Level**        | User-friendly: title, description, category, diagnostic device metadata, attachments. | Advanced: story points, active sprint assignment, status, checklists, parent subtask linking. |

---

## Scenario 1: End-User Feedback & Bug Reporting (`POST /api/submit-issue`)

Use this endpoint whenever you are building a "Report a Problem", "Send Feedback", or "Contact Support" screen inside a mobile app (like **Lingora**), a web app, or a desktop client.

### How It Works Behind the Scenes

1. **Private Issueboard**: An issue is created immediately in your private Issueboard.
2. **Lingora Auto-Routing**: If `targetRepo` is `'Lingora'` (or `'lemony'`), it is automatically routed to project **Lemony** (project key **`LEM`**).
3. **Automatic Categories & Labels**: If the user selects a category (like `AudioBug` or `GrammarChecker`), the system automatically sets the issue type (e.g. `bug`) and creates a label with an accessible color if it doesn't already exist.
4. **Attachment Hosting**: Screenshots, logs and other files are stored as objects in the private Supabase Storage bucket (`issueboard-private`). The database only keeps metadata (name, type, size, checksum, storage path), never the file bytes.
5. **GitHub Forwarding**: If a GitHub App is configured, the issue is forwarded to the corresponding GitHub repository with the execution metadata. GitHub's API cannot upload images, so each screenshot is embedded through a permanent signed link on this site (`/api/attachment-link/<id>?sig=…`) that redirects to a fresh short-lived storage URL each time it is opened. Only images are served this way; other files are listed by name and stay on the Issueboard ticket.
6. **Graceful Safety**: If GitHub is temporarily unavailable, down, or not yet installed on the repo, the request still succeeds (`200 OK`) and the ticket is safely preserved in our private Issueboard. If the ticket or an attachment could not be saved, the response says so in a `warnings` array instead of failing silently.
7. **Safe Retries**: Send an `Idempotency-Key` header (any unique string per user action, such as a UUID) and retry freely after a timeout: a repeat returns the existing ticket with `duplicate: true` instead of filing another issue.
8. **Size Limit**: A request may be at most **4 MB in total**, attachments included (Vercel rejects larger bodies). Base64 inside JSON is about a third bigger than the file, so prefer multipart uploads and compress screenshots.

---

### Request Parameters for `POST /api/submit-issue`

You can send these as standard **JSON** (`Content-Type: application/json`) or as **Multipart Form Data** (`multipart/form-data`).

| Parameter                  | Type   | Required | Description                                                                                | Example                                                               |
| :------------------------- | :----- | :------: | :----------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| `title`                    | string | **Yes**  | A short, clear headline describing the problem or suggestion.                              | `"Audio cuts off after 10 seconds"`                                   |
| `body`                     | string | **Yes**  | Full description, steps to reproduce, or feedback details.                                 | `"When speaking a sentence longer than 10s..."`                       |
| `targetRepo`               | string | **Yes**  | The destination repository or project name. Use `'Lingora'` for the Lemony project.        | `'Lingora'`                                                           |
| `targetOwner`              | string |    No    | GitHub organization or owner. Defaults to `'pennowtech'`.                                  | `'pennowtech'`                                                        |
| `category`                 | string |    No    | Category name. Auto-maps to issue type and creates project label. Defaults to `'General'`. | `'AudioBug'`, `'UI'`, `'Vocabulary'`                                  |
| `email`                    | string |    No    | The end-user's contact email (if provided).                                                | `'user@example.com'`                                                  |
| `app`                      | string |    No    | Client application identifier. Automatically tagged as `app:<app>`.                        | `'lingora-mobile'`, `'lingora-web'`                                   |
| `platform`                 | string |    No    | Client platform or operating system version.                                               | `'iOS 18.2'`, `'Android 14'`, `'macOS 15'`                            |
| `deviceMeta`               | string |    No    | Device hardware model, app build number, or diagnostic info.                               | `'iPhone 15 Pro, Build 1.0.4 (28)'`                                   |
| `attachments`              | array  |    No    | Screenshots or files. Accepts Base64 data strings or file objects.                         | `[{ "filename": "shot.png", "base64": "data:image/png;base64,..." }]` |
| `Idempotency-Key` (header) | string |    No    | Makes retries safe (see above). Also accepted as an `idempotencyKey` field.                | `'6f1c3f52-…'`                                                        |

---

### Scenario 1 Code Examples

#### A. Mobile App (React Native, Flutter, Swift, or Web) Sending JSON with a Screenshot

```javascript
// Example in React Native / JavaScript
const submitUserFeedback = async () => {
  const payload = {
    title: 'Dictation stops listening unexpectedly',
    body: 'The microphone icon turns off after exactly 5 seconds during lesson 3.',
    targetRepo: 'Lingora', // Automatically routes to Project LEM (Lemony)
    category: 'AudioBug', // Automatically sets type "bug" & creates "AudioBug" label
    email: 'learner@gmail.com',
    app: 'lingora-mobile',
    platform: 'iOS 18.2',
    deviceMeta: 'iPhone 15 Pro, App Version 1.2.0',
    attachments: [
      {
        filename: 'screenshot.png',
        mimeType: 'image/png',
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA...' // Base64 image
      }
    ]
  };

  const response = await fetch('https://singhbuildstech.com/api/submit-issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (result.success) {
    console.log('Issue created on Issueboard:', result.issueboard?.key); // e.g. LEM-1
    console.log('Forwarded to GitHub:', result.issueUrl);
  }
};
```

#### B. Multipart Form Upload (Sending a Real File / Crash Log)

```javascript
// Example using standard FormData
const formData = new FormData();
formData.append('title', 'App crash when clicking finish lesson');
formData.append('body', 'Crash occurred immediately after completing test quiz.');
formData.append('targetRepo', 'Lingora');
formData.append('category', 'Crash');
formData.append('platform', 'Android 14');
formData.append('deviceMeta', 'Google Pixel 8, Build 204');

// Attach actual file (from file picker or disk)
formData.append('file', crashLogBlob, 'crash_dump.txt');

const response = await fetch('https://singhbuildstech.com/api/submit-issue', {
  method: 'POST',
  body: formData // Browser/client automatically sets multipart/form-data boundary
});

const result = await response.json();
```

---

## Scenario 2: Direct Developer & Automation API (`POST /api/issues`)

Use this endpoint for internal automation, backend services, CI/CD pipelines, or administrative scripts where you want full control over the Issueboard workspace.

### Authentication (`ISSUEBOARD_API_KEY`)

Requests to `/api/issues` are protected and require the `ISSUEBOARD_API_KEY`.

Pass your key in any of these three ways:

1. **HTTP Header (Recommended)**:
   ```http
   Authorization: Bearer ib_live_YOUR_API_KEY
   ```
2. **Custom Header**:
   ```http
   X-API-Key: ib_live_YOUR_API_KEY
   ```
3. **Query Parameter**:
   ```http
   POST /api/issues?apiKey=ib_live_YOUR_API_KEY
   ```

---

### Request Parameters for `POST /api/issues`

| Parameter         | Type   | Required | Description                                                                                 | Example                                          |
| :---------------- | :----- | :------: | :------------------------------------------------------------------------------------------ | :----------------------------------------------- |
| `projectKey`      | string | **Yes**  | The project key on your board.                                                              | `'PORT'`, `'LEM'`                                |
| `title`           | string | **Yes**  | Issue title (minimum 3 characters).                                                         | `'Build offline lesson caching'`                 |
| `issueType`       | string |    No    | Issue type: `task`, `story`, `bug`, `epic`, `subtask`.                                      | `'story'`                                        |
| `description`     | string |    No    | Markdown description of the task.                                                           | `'### Acceptance Criteria\n- Works offline'`     |
| `priority`        | string |    No    | Priority level: `highest`, `high`, `medium`, `low`, `lowest`.                               | `'high'`                                         |
| `assignee`        | string |    No    | Name or email of team member to assign.                                                     | `'Sukhdeep Singh'`                               |
| `storyPoints`     | number |    No    | Story point estimation (1, 2, 3, 5, 8, etc.).                                               | `5`                                              |
| `sprint`          | string |    No    | Pass `'active'` to assign directly to current running sprint, or pass a specific sprint ID. | `'active'`                                       |
| `status`          | string |    No    | Name of the status column (e.g. `'To do'`, `'In progress'`).                                | `'To do'`                                        |
| `labels`          | array  |    No    | List of label strings. Auto-creates any new labels.                                         | `['offline', 'mobile', 'storage']`               |
| `checklist`       | array  |    No    | Checklist items (string or `{ body: string, isComplete: boolean }`).                        | `['Database schema', 'Sync worker']`             |
| `parentIssueKey`  | string |    No    | Issue key of parent if this is a child subtask.                                             | `'LEM-12'`                                       |
| `attachments`     | array  |    No    | Base64 or binary files to attach.                                                           | `[{ filename: 'wireframe.png', base64: '...' }]` |
| `sourceReference` | string |    No    | External reference link or ID (e.g. Sentry issue link, Jira link).                          | `'sentry:issue/10492'`                           |

---

### Scenario 2 Code Examples

#### A. Node.js / JavaScript Script

```javascript
import fetch from 'node-fetch';

const createSprintTask = async () => {
  const apiKey = process.env.ISSUEBOARD_API_KEY;

  const response = await fetch('https://singhbuildstech.com/api/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      projectKey: 'LEM',
      title: 'Implement voice recognition audio cache',
      issueType: 'story',
      storyPoints: 5,
      priority: 'high',
      sprint: 'active', // Automatically attaches to currently running sprint
      labels: ['audio', 'performance'],
      checklist: [
        'Research CoreAudio buffer limits',
        { body: 'Setup memory cache', isComplete: true },
        'Add automated playback test'
      ]
    })
  });

  const data = await response.json();
  console.log('Created Ticket:', data.issue.key); // e.g. LEM-4
};
```

#### B. cURL (Terminal / CI Pipeline)

```bash
curl -X POST https://singhbuildstech.com/api/issues \
  -H "Authorization: Bearer ib_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "PORT",
    "title": "CI/CD Deployment Failure in staging worker",
    "issueType": "bug",
    "priority": "highest",
    "labels": ["devops", "ci"],
    "description": "Worker timed out after 300s waiting for database migration."
  }'
```

#### C. Python

```python
import os
import requests

API_KEY = os.getenv("ISSUEBOARD_API_KEY", "ib_live_YOUR_API_KEY")

response = requests.post(
    "https://singhbuildstech.com/api/issues",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "projectKey": "LEM",
        "title": "Fix dictionary pronunciation link",
        "issueType": "task",
        "priority": "medium",
        "labels": ["content", "polish"]
    }
)

ticket = response.json()
print("Ticket created:", ticket.get("issue", {}).get("key"))
```

---

## How to Manage the `ISSUEBOARD_API_KEY`

### 1. Where to Find It (If Lost or Forgotten)

If you ever forget or lose your API key, you can retrieve it from your existing configuration without needing to regenerate it:

- **In Local Development**:
  Check your local environment file [`.env.local`](.env.local):
  ```bash
  grep "ISSUEBOARD_API_KEY" .env.local
  ```
- **In Production (Vercel)**:
  1. Open your **Vercel Dashboard** and select this portfolio project.
  2. Go to **Settings** → **Environment Variables**.
  3. Locate `ISSUEBOARD_API_KEY` in the list.
  4. Click the **Eye icon (Reveal)** or **Copy** button to view the active secret key.
- **Via Vercel CLI**:
  You can also inspect or pull your production environment variables directly from your terminal:
  ```bash
  npx vercel env pull .env.production.local
  ```

---

### 2. How to Generate a New Key

If the key was deleted, compromised, or you want to start fresh, generate a new secure 256-bit key with this terminal command:

```bash
node -e "console.log('ib_live_' + require('crypto').randomBytes(24).toString('hex'))"
```

---

### 3. Where to Save the Key

- **Locally**: Add or update it in your `.env.local`:
  ```bash
  ISSUEBOARD_API_KEY=ib_live_YOUR_API_KEY
  ```
- **Production**: Add it in **Vercel Settings → Environment Variables** for `Production`, `Preview`, and `Development` environments.

---

### 4. Rotating the Key

When you update `ISSUEBOARD_API_KEY`:

1. Save the new value in Vercel and locally.
2. Redeploy the project (or restart `npm run dev`).
3. Update any external scripts, mobile apps, or CI pipelines to use the new key.
4. Any requests made with the previous key will immediately receive `401 Unauthorized`.
