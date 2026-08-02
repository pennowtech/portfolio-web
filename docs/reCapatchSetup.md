As the contact form is included on the homepage, reCAPTCHA also loads there. Google places its badge in a fixed position at the lower-right side of the browser.

## What if it shows “ERROR for site owner”

“Invalid domain for site key” means the hostname currently serving the website is not authorized for the configured reCAPTCHA site key.

Your local `.env.local` currently has both reCAPTCHA keys configured, but the associated Google configuration probably does not include `localhost`.

## How to fix it locally

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

8. Save the changes.

9. Restart the development server:

   ```shell
   npm run dev
   ```

10. Hard-refresh the browser.

Google configuration changes may take a few minutes to become effective.

## reCAPTCHA loading

Changed [ContactForm.jsx](/Users/sukhdeep.singh/Mine/portfolio-web/components/ContactForm.jsx).

Previously, the reCAPTCHA provider wrapped the entire application. It now wraps only the contact form.

Because the homepage contains the contact form, reCAPTCHA still loads on the homepage. It no longer loads on article, privacy, imprint, or archive pages without the form.

The form now includes:

- A Privacy Policy reference
- Contact-data usage information
- Google’s required Privacy Policy and Terms disclosure

## Can the right-side badge be hidden?

Yes. Google permits hiding the badge when the required reCAPTCHA attribution is displayed prominently in the form.

That disclosure has already been added beneath the submit button:

> This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.

Therefore, the floating badge is hidden while the required disclosure remains visible with the form.
