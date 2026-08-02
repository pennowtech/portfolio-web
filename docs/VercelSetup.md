## Production and Vercel configuration

Add every hostname where the contact form will be used, including:

```text
your-domain.com
www.your-domain.com
your-project.vercel.app
```

Only include hostnames you actually control. Preview deployments may use additional Vercel hostnames, so those may need to be added separately when testing reCAPTCHA on previews.

In Vercel:

1. Open the project.
2. Go to **Settings → Environment Variables**.
3. Confirm these variables contain keys from the same reCAPTCHA configuration:

   ```text
   NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
   GOOGLE_RECAPTCHA_SECRET_KEY
   ```

4. Enable them for the intended Production and Preview environments.
5. Redeploy the website.

Do not use the secret key as `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY`.

## Report of recent modifications

### 1. Privacy Policy

### 2. Imprint

Added `/imprint` with:

- Operator name
- Country
- Email address
- Contact-form reference
- Portfolio purpose
- A clear warning that a geographic address must be added if §5 DDG applies
