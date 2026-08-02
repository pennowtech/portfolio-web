# Development

This guide covers local installation, development, validation, and troubleshooting. Service-specific setup is documented
separately in [Notion](NOTION.md), [Contact Form](CONTACT_FORM.md), [reCAPTCHA](RECAPTCHA.md), and
[Analytics](ANALYTICS.md).

## Requirements

- Node.js 24
- npm
- Access to the required Notion and Google service credentials

## Install and run

```shell
npm ci
npm run dev
```

In VS Code, the equivalent tasks are `Setup: Install dependencies` and `Develop: Start dev server`. Open
**Terminal → Run Task…** to select them. The complete task reference is available in [VS Code Tasks](VSCODE_TASKS.md).

Open [http://localhost:3000](http://localhost:3000).

Environment variables belong in `.env.local`, which must never be committed. Copy the variable names from the relevant
service guide rather than placing credentials in documentation or source code.

## Validation

```shell
npm run lint
npm run build
```

Use the `Quality: Verify` VS Code task to run lint, a non-destructive formatting check, and the production build in
sequence. Individual lint, formatting, and build tasks are also available; see [VS Code Tasks](VSCODE_TASKS.md).

The production build may report that Notion is unreachable in a network-restricted environment. The application uses
its local fallback content so static generation can still complete.

## Unexpected automatic refreshes

The application contains no scheduled browser reload, polling refresh, or timed router navigation. Normal Next.js Fast
Refresh runs only when source files change during development.

This workspace disables Console Ninja's automatic Next.js instrumentation in `.vscode/settings.json`. The extension was
intercepting the Next.js process while its logger WebSocket repeatedly failed, which can produce reconnects and apparent
browser refreshes.

After pulling this setting:

1. Stop the development server.
2. Run **Developer: Reload Window** in VS Code, or restart VS Code.
3. Start the server again with `npm run dev` or the `Develop: Start dev server` task.
4. Hard-refresh the browser once.

If refreshes continue, run a production-mode comparison:

```shell
npm run build
npm run start
```

The equivalent VS Code sequence is `Build: Production export` followed by `Serve: Start production server`.

If the behavior occurs only under `npm run dev`, inspect editor extensions and the Next.js terminal for file-change or
WebSocket reconnect messages. If it also occurs under `npm run start` or on Vercel, record the exact URL, interval, and
browser console/network event before changing application code.

## Deployment

Local success does not publish changes. Follow [Deployment](DEPLOYMENT.md) for Vercel environment variables and
production verification.
