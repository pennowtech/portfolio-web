# Deployment

SinghBuildsTech is deployed on Vercel. This guide covers production environment variables and verification. Configure
the underlying services first using [Notion](NOTION.md), [Contact Form](CONTACT_FORM.md),
[reCAPTCHA](RECAPTCHA.md), and [Analytics](ANALYTICS.md).

## Domains

Add every hostname in Vercel where the contact form will be used, including:

```text
your-domain.com
www.your-domain.com
your-project.vercel.app
```

Only include hostnames you actually control. Preview deployments may use additional Vercel hostnames, so those may need to be added separately when testing reCAPTCHA on previews.

## Environment variables

In Vercel:

1. Open the project.
2. Go to **Settings → Environment Variables**.
3. Add the variables required by the enabled features:

   ```text
   NOTION_KEY
   NOTION_DATABASE_ID
   NOTION_CONTACT_FORM_DATABASE_ID
   NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
   GOOGLE_RECAPTCHA_SECRET_KEY
   NEXT_PUBLIC_GOOGLE_ANALYTICS
   ```

4. Enable them for the intended Production and Preview environments.
5. Redeploy the website.

Map the Google **site key** to `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` and the different Google **secret key** to
`GOOGLE_RECAPTCHA_SECRET_KEY`. See [reCAPTCHA key roles](RECAPTCHA.md#site-key-and-secret-key) before adding them.

Only `NEXT_PUBLIC_` variables are exposed to browser code. Keep Notion and reCAPTCHA secrets server-only.

## Deploy and verify

1. Save the environment variables.
2. Redeploy the latest `main` branch.
3. Confirm the homepage, article archive, article page, contact form, Privacy Policy, and Imprint load successfully.
4. Submit a test contact enquiry and confirm its arrival in Notion.
5. Remove the test record when verification is complete.
6. Review the Vercel function and deployment logs for unexpected errors.

For local commands and refresh troubleshooting, see [Development](DEVELOPMENT.md).
The `Quality: Verify` shortcut documented in [VS Code Tasks](VSCODE_TASKS.md) runs the local pre-deployment checks but
does not deploy or change Vercel configuration.
