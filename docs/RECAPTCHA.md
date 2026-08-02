# reCAPTCHA

The contact form uses Google reCAPTCHA v3 for spam protection. The provider is scoped to pages that render the form,
including the homepage. See [Contact Form](CONTACT_FORM.md) for the complete submission flow and
[Deployment](DEPLOYMENT.md) for production variables.

## Site key and secret key

Google provides two different values for the same reCAPTCHA configuration:

| Google value | Environment variable                    | Used by                       | Visibility             |
| ------------ | --------------------------------------- | ----------------------------- | ---------------------- |
| Site key     | `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` | `components/ContactForm.jsx`  | Public browser value   |
| Secret key   | `GOOGLE_RECAPTCHA_SECRET_KEY`           | `pages/api/contact/index.jsx` | Server-only credential |

The site key is expected to appear wherever browser code initializes or describes reCAPTCHA. The secret key must appear
only in server-side configuration and must never use a `NEXT_PUBLIC_` variable name.

The values must come from the same reCAPTCHA v3 configuration, but they must not be identical. If a secret was ever
stored in a `NEXT_PUBLIC_` variable or committed to the repository, rotate it in Google immediately because it may have
been included in a browser bundle.

## Domain error

As the contact form is included on the homepage, reCAPTCHA also loads there.

### “ERROR for site owner”

“Invalid domain for site key” means the hostname currently serving the website is not authorized for the configured reCAPTCHA site key.

When local keys are configured, the usual cause is that the associated Google configuration does not include
`localhost`.

## Configure authorized domains

1. Open the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).

2. Select the reCAPTCHA configuration whose site key is stored as:

   ```dotenv
   NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
   ```

3. Open its settings.

4. Under **Domains**, add:

   ```text
   localhost
   ```

5. If you sometimes use the IP address instead of localhost, also add:

   ```text
   127.0.0.1
   ```

6. Enter hostnames only. Do not enter:

   ```text
   http://localhost:3000
   ```

   Use:

   ```text
   localhost
   ```

7. Confirm that the configuration is a score-based reCAPTCHA v3 configuration.

8. Copy the displayed **site key** to `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` and the displayed **secret key** to
   `GOOGLE_RECAPTCHA_SECRET_KEY`.

9. Save the changes.

10. Restart the development server:

    ```shell
    npm run dev
    ```

11. Hard-refresh the browser.

Google configuration changes may take a few minutes to become effective.

## Loading behavior

The implementation lives in `components/ContactForm.jsx`.

Previously, the reCAPTCHA provider wrapped the entire application. It now wraps only the contact form.

Because the homepage contains the contact form, reCAPTCHA still loads on the homepage. It no longer loads on article, privacy, imprint, or archive pages without the form.

The form now includes:

- A Privacy Policy reference
- Contact-data usage information
- Google’s required Privacy Policy and Terms disclosure

## Badge disclosure

Google permits hiding the badge when the required reCAPTCHA attribution is displayed prominently in the form.

That disclosure has already been added beneath the submit button:

> This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.

The floating badge is hidden while the required disclosure remains visible with the form.
