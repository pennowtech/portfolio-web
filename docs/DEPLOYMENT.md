# Deployment

SinghBuildsTech is deployed on Vercel. This guide covers production environment variables and verification. Configure
the underlying services first using [Notion](NOTION.md), [Contact Form](CONTACT_FORM.md),
[reCAPTCHA](RECAPTCHA.md), and [Analytics](ANALYTICS.md).

## Domains

Add these hostnames to the existing Vercel project:

```text
singhbuildstech.com
www.singhbuildstech.com
```

Set `singhbuildstech.com` as the primary domain and redirect `www.singhbuildstech.com` to it. Add the DNS records shown
by Vercel rather than copying generic values from another provider. Vercel provisions HTTPS after DNS verification.

The application also contains permanent redirects from the `www` hostname and the former
`portfolio-web-wheat.vercel.app` production alias to the primary domain. The complete domain checklist is in
[Domain](DOMAIN_NAME.md).

## Environment variables

In Vercel:

1. Open the project.
2. Go to **Settings → Environment Variables**.
3. Add the variables required by the enabled features:

   ```text
   NEXT_PUBLIC_SITE_URL
   NOTION_KEY
   NOTION_DATABASE_ID
   NOTION_CONTACT_FORM_DATABASE_ID
   NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
   GOOGLE_RECAPTCHA_SECRET_KEY
   NEXT_PUBLIC_GOOGLE_ANALYTICS
   ```

4. Enable them for the intended Production and Preview environments.
5. Redeploy the website.

Set the production site URL to:

```dotenv
NEXT_PUBLIC_SITE_URL=https://singhbuildstech.com
```

This value is used for canonical links, social-sharing metadata, and the XML sitemap. Do not include a trailing slash.

Map the Google **site key** to `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` and the different Google **secret key** to
`GOOGLE_RECAPTCHA_SECRET_KEY`. See [reCAPTCHA key roles](RECAPTCHA.md#site-key-and-secret-key) before adding them.

Only `NEXT_PUBLIC_` variables are exposed to browser code. Keep Notion and reCAPTCHA secrets server-only.

## Production releases

Production deployment is tag-driven. A semantic version tag matching `v*.*.*` starts the GitHub Actions release
workflow, which verifies that the tag matches `package.json`, installs dependencies, runs ESLint, builds with Vercel,
and deploys the prebuilt artifact to Vercel production.

Follow the complete procedure in [Releases](RELEASES.md). Pushing or merging `main` alone does not deploy production;
feature branches continue to receive Vercel preview deployments.

## Deploy and verify

1. Save the environment variables.
2. Create and push the approved release tag by following [Releases](RELEASES.md).
3. Confirm the homepage, article archive, article page, contact form, Privacy Policy, and Imprint load successfully.
4. Submit a test contact enquiry and confirm its arrival in Notion.
5. Remove the test record when verification is complete.
6. Review the Vercel function and deployment logs for unexpected errors.

For local commands and refresh troubleshooting, see [Development](DEVELOPMENT.md).
The `Quality: Verify` shortcut documented in [VS Code Tasks](VSCODE_TASKS.md) runs the local pre-deployment checks but
does not deploy or change Vercel configuration.
