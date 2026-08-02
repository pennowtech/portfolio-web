# Portfolio Contact Form: Notion and reCAPTCHA Setup

This guide configures the portfolio contact form to validate submissions with Google reCAPTCHA v3 and store successful
messages in a dedicated Notion database.

## Prerequisites

- Access to the Notion workspace used by the portfolio
- Access to the portfolio's internal Notion connection
- Access to the Google reCAPTCHA Admin Console
- Access to the portfolio project in Vercel

## 1. Create the Notion contact database

1. Create a new page in Notion.
2. Select **Table** → **New database**.
3. Name the database `Portfolio Contact Messages`.
4. Rename the default `Name` property to `FirstName`.
5. Add the following properties with the exact spelling, capitalization, and types:

| Property    | Notion type |
| ----------- | ----------- |
| `FirstName` | Title       |
| `LastName`  | Text        |
| `Email`     | Email       |
| `Message`   | Text        |
| `Status`    | Status      |

6. Add a `New` option to the `Status` property.
7. Remove any sample records if they are no longer needed.

The API uses these property names when it creates a contact record. A renamed or differently typed property can cause a
submission to fail.

## 2. Give the Notion connection access

1. Open `Portfolio Contact Messages` as a full-page database.
2. Select the `•••` menu in the upper-right corner.
3. Select **Connections** → **Add connection**.
4. Choose the internal connection used by the portfolio.
5. Confirm access.
6. In the [Notion Developer portal](https://www.notion.so/profile/integrations), open the connection and confirm that
   **Read content** and **Insert content** are enabled.

## 3. Copy the contact database ID

1. Open the contact database as a full page.
2. Select `•••` → **Copy link**.
3. Find the 32-character identifier before the query parameters.

For example, in:

```text
https://www.notion.so/workspace/0123456789abcdef0123456789abcdef?v=...
```

the database ID is:

```text
0123456789abcdef0123456789abcdef
```

Store this value as `NOTION_CONTACT_FORM_DATABASE_ID`.

## 4. Create Google reCAPTCHA v3 keys

1. Open the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create).
2. Enter a recognizable label such as `SinghBuildsTech Portfolio`.
3. Select **Score based (v3)**.
4. Add the production domain.
5. Add `localhost` when local testing is required and the console permits it.
6. Accept the terms and create the configuration.
7. Copy the generated site key and secret key.

The site key is safe to expose to the browser. The secret key must remain server-only.

## 5. Configure local environment variables

Add the following values to `.env.local` in the project root:

```dotenv
NOTION_KEY=ntn_your_existing_integration_token
NOTION_DATABASE_ID=your_articles_database_id
NOTION_CONTACT_FORM_DATABASE_ID=your_contact_database_id

NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
GOOGLE_RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

Do not add quotes or spaces around the values. Never commit `.env.local`.

Do not use the older misspelled variable names:

```text
NEXT_PUBLIC_GOOGLE_CAPATCHA_SITE_KEY
NEXT_PUBLIC_GOOGLE_CAPATCHA_SECRET_KEY
```

Restart the development server after changing environment variables:

```shell
npm run dev
```

## 6. Test locally

1. Open [http://localhost:3000/contact](http://localhost:3000/contact).
2. Complete and submit the form.
3. Confirm that the button changes to `Sending…`.
4. Confirm that a success message appears.
5. Open `Portfolio Contact Messages` in Notion.
6. Confirm that a new record was created with a `New` status.

If submission fails, inspect the `/api/contact` request in the browser Network panel. Its response identifies validation,
reCAPTCHA, configuration, or upstream failures without exposing private credentials.

## Contact-data retention

- Review the Notion contact database at least once every quarter.
- Delete contact records no later than 12 months after the last substantive communication.
- Retain a record longer only when an engagement remains active or a statutory retention duty applies.
- Record any exception and its reason in the Notion entry.
- Do not place special-category, credential, financial, or other unnecessary confidential data in the contact database.

## 7. Configure Vercel

1. Open the portfolio project in Vercel.
2. Go to **Settings** → **Environment Variables**.
3. Add:

   ```text
   NOTION_KEY
   NOTION_DATABASE_ID
   NOTION_CONTACT_FORM_DATABASE_ID
   NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
   GOOGLE_RECAPTCHA_SECRET_KEY
   ```

4. Enable the variables for **Production** and **Preview** as required.
5. Save the configuration.
6. Redeploy the application so the new values become available.

## 8. Verify production

1. Open the deployed contact page.
2. Send a test message.
3. Confirm the success state in the browser.
4. Confirm the new record in Notion.
5. Remove the test record when it is no longer required.

## Troubleshooting

- **The form says it is not configured:** verify the contact database ID and server-only keys in the active Vercel
  environment.
- **Notion returns `object_not_found`:** reconnect the integration to the contact database and verify its ID.
- **Notion rejects a property:** compare every property name and type with the schema table above.
- **reCAPTCHA rejects the submission:** confirm the production domain is registered and the site key and secret belong
  to the same reCAPTCHA configuration.
- **Local changes have no effect:** stop and restart `npm run dev`.
- **Vercel changes have no effect:** redeploy after changing environment variables.

## Security notes

- Keep `NOTION_KEY` and `GOOGLE_RECAPTCHA_SECRET_KEY` server-only.
- Only the reCAPTCHA site key should use the `NEXT_PUBLIC_` prefix.
- Do not log form contents, CAPTCHA tokens, or credentials.
- Do not cache or reuse reCAPTCHA tokens; they are short-lived and single-use.
