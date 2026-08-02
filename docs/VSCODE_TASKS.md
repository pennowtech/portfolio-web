# VS Code Tasks

The workspace tasks in `.vscode/tasks.json` provide shortcuts for common setup, development, quality, build, serving,
and commit commands. Run one from **Terminal → Run Task…** or the command palette's **Tasks: Run Task** action.

| Task                             | Command or sequence                        | Use                                                             |
| -------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `Setup: Install dependencies`    | `npm ci`                                   | Install the exact dependency versions from `package-lock.json`. |
| `Develop: Start dev server`      | `npm run dev`                              | Start Next.js development mode with Fast Refresh.               |
| `Quality: Lint`                  | `npm run lint`                             | Run ESLint across the repository.                               |
| `Quality: Check formatting`      | `npx prettier --check .`                   | Report formatting differences without editing files.            |
| `Quality: Fix formatting`        | `npx prettier --write .`                   | Apply Prettier formatting to supported files.                   |
| `Build: Production export`       | `npm run build`                            | Create and validate the optimized production build.             |
| `Quality: Verify`                | Lint → formatting check → production build | Run the main pre-publish checks sequentially.                   |
| `Serve: Start production server` | `npm run start`                            | Serve an existing production build locally.                     |
| `Git: Guided commit`             | `npm run commit`                           | Stage the worktree and open the guided Commitizen prompt.       |

## Recommended workflows

### Start local development

1. Run `Setup: Install dependencies` after cloning or after dependency changes.
2. Run `Develop: Start dev server`.
3. Open [http://localhost:3000](http://localhost:3000).

### Validate a change

Run `Quality: Verify`. Use `Quality: Fix formatting` first when the formatting check reports differences.

### Compare production behavior

1. Run `Build: Production export`.
2. Run `Serve: Start production server`.

This comparison is useful when a problem appears only in development mode. See
[Development troubleshooting](DEVELOPMENT.md#unexpected-automatic-refreshes).

## Important behavior

- Background server tasks keep running in dedicated terminal panels; stop them before starting a second server on the
  same port.
- `Quality: Fix formatting` changes files. Review the resulting diff.
- `Git: Guided commit` runs a script that stages the entire worktree with `git add .`. Use it only when every current
  change belongs in the same commit.
- The tasks automate local commands only. Publishing still follows the repository's GitHub workflow and
  [Deployment](DEPLOYMENT.md).

For prerequisites, environment files, and non-VS Code commands, see [Development](DEVELOPMENT.md).
