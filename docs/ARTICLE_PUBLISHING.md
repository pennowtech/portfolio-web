# Publishing Articles

The memorable author entry point is `/write`. It sends an approved signed-in author to the editor and everyone else to
Google sign-in. A discreet **Write** link is also available in the footer. The private workspace creates draft or
published portfolio articles directly inside the same Notion
articles database used by the public website. It is not linked from public navigation or included in the sitemap.

## Storage and publishing flow

```text
Private website editor
        ↓
Existing NOTION_DATABASE_ID in the current Notion teamspace
        ↓
Existing portfolio article reader
```

There is no second Notion space, database, local article store, or GitHub content copy. New pages inherit the teamspace
location of the existing database. Drafts use `Published = false` and remain invisible to the public article query;
published pages use `Published = true` and are fetched through the same reader as current articles.

## Security model

The author workspace uses Auth.js with Google OAuth:

- Google verifies the identity and can enforce the account's two-factor authentication or passkey
- Only the exact email in `ADMIN_EMAIL` is accepted
- The Google provider and verified-email requirement are checked during sign-in
- Protected pages verify the server-side session before rendering
- The publishing API independently verifies the session and approved email
- Auth.js uses an encrypted JWT session in secure, server-only cookies
- Auth.js handles OAuth state and CSRF protection for sign-in and sign-out
- Publishing requests also require the same browser origin
- Admin responses use `no-store`; pages use `noindex`; `/admin/` is excluded in `robots.txt`

The Google client secret, Auth.js secret, and Notion token never enter the browser bundle. Hiding the admin URL and
excluding it from search engines are not treated as authentication.

## Create Google OAuth credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project for SinghBuildsTech.
3. Open **Google Auth Platform** and configure the consent screen.
4. Use an external audience for a personal Gmail account. While the app remains in testing, add
   `singhbuildstech@gmail.com` as a test user.
5. Go to **Data Access → Add scopes**: Request only the default OpenID Connect identity scopes: profile, email, and OpenID.
6. Go to **Clients → Create client → Web application**.
7. Give it a recognizable name such as `SinghBuildsTech Author Workspace`.
8. Add these authorized redirect URIs:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://singhbuildstech.com/api/auth/callback/google
   ```

9. Save the client and copy its client ID and client secret.

Do not add broad Google API scopes; the workspace only needs verified identity. Preview deployments need a separately
registered callback URI or a separate OAuth client because Google does not accept arbitrary wildcard redirect hosts.

## Configure Auth.js

Generate a random Auth.js encryption secret:

```shell
openssl rand -base64 32
```

Add this local configuration to `.env.local`:

```dotenv
ADMIN_EMAIL=singhbuildstech@gmail.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_SECRET=generated_random_secret
NEXTAUTH_URL=http://localhost:3000
```

Add the same variables to the Vercel Production environment, changing only:

```dotenv
NEXTAUTH_URL=https://singhbuildstech.com
```

None of these names may use a `NEXT_PUBLIC_` prefix. Restart the local server or redeploy Vercel after changing them.
Changing `NEXTAUTH_SECRET` invalidates existing author sessions.

To enable integrated cover-image search, configure one or both provider keys:

```dotenv
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
PEXELS_API_KEY=your_pexels_api_key
```

Create each key through that provider's developer portal. The editor uses server-side API requests, hotlinks selected
images as required by the provider, records Unsplash selection events, and adds photographer/provider attribution to
the article. Do not prefix either key with `NEXT_PUBLIC_`.

## Grant Notion publishing access

The Notion integration previously needed only **Read content** for articles. Direct publishing additionally requires:

1. Open the SinghBuildsTech integration in the Notion integrations portal.
2. Enable **Read content** and **Insert content**.
3. Save the integration capabilities.
4. Open the existing articles database in its current Notion teamspace.
5. Select `•••` → **Connections** and confirm the SinghBuildsTech integration is connected.

The database must retain these existing properties:

| Property      | Expected Notion type |
| ------------- | -------------------- |
| `Name`        | Title                |
| `Description` | Rich text            |
| `Tags`        | Multi-select         |
| `category`    | Select               |
| `Published`   | Checkbox             |
| `Posted on`   | Date                 |
| `Slug`        | Formula or rich text |

If `Slug` remains a formula, it should generate the same lowercase, hyphen-separated value shown by the editor. The
publisher does not attempt to overwrite formula properties.

## Write an article

1. Open `/admin/login` and continue with the approved Google account.
2. Enter the title; the editor proposes a URL slug automatically.
3. Add the description, category, tags, publication date, and cover image. Categories and tags are suggested from the
   current Notion schema. Covers can use a permanent HTTPS URL, a file uploaded into Notion, or Unsplash search.
4. Write in the syntax-highlighted Markdown editor and review the live portfolio preview.
5. Select **Save as Notion draft** to create the page with `Published` disabled.
6. Select **Publish article** and confirm the warning to create it with `Published` enabled.
7. Use the result links to inspect the Notion page and, when published, the portfolio article.

Publishing is intentionally explicit. A draft is not publicly queried by the website. A newly published article can be
opened directly immediately; cached article listings refresh automatically within approximately 60 seconds.

## Editor controls

The editor opens in **Split** mode. Use the view selector above the content area to switch between:

- **Edit** for a full-width Markdown source editor
- **Preview** for a full-width rendering of the public article
- **Split** for source and preview together; they stack vertically on smaller screens

The formatting toolbar can apply normal text, H2–H4 headings, bold, italic, links, quotes, inline or fenced code,
bulleted lists, numbered lists, task lists, GFM tables, horizontal rules, and a generated table of contents. Select text
before choosing a formatting action, or place the cursor where new content should be inserted.

The **Article outline** dropdown is generated from the current H2–H6 headings. Its indentation reflects heading depth,
and selecting an entry scrolls the source editor directly to that section. Use `Ctrl+B`/`Cmd+B` for bold and
`Ctrl+I`/`Cmd+I` for italic.

Select the **?** button beside **Sign out** for the in-editor guide. Its accordion sections include publishing workflow,
view modes, Markdown examples, GFM tables and tasks, syntax-highlighted code, and custom article elements.

## Markdown support

The authoring view and public article renderer support:

- Headings, paragraphs, emphasis, links, images, blockquotes, and horizontal rules
- Ordered and unordered lists
- GitHub-flavored tables, task lists, autolinks, and strikethrough
- Inline code and fenced code blocks with language-aware syntax highlighting
- Line-highlight metadata already supported by the portfolio code renderer
- Raw HTML and the `youtube`, `linkedin`, `twitter`, `note`, and `highlight` article elements
- Day and night themes inherited from the main website

The original Markdown is stored losslessly in a marked code block within the Notion article page. The portfolio
recognizes that source block and renders it directly. Older articles made from native Notion blocks continue using the
existing Notion-to-Markdown conversion.

## Operational cautions

- Protect the approved Google account with two-factor authentication or a passkey.
- Keep Google OAuth credentials, `NEXTAUTH_SECRET`, and the Notion token out of Git, screenshots, logs, and articles.
- Use a publicly accessible HTTPS cover image; temporary signed image URLs can expire.
- Avoid opening multiple save requests for the same article, because each request creates a new Notion page.
- Verify the generated slug before publishing. Changing it later changes the public article URL.
- Sign out on shared computers. Sessions expire automatically after eight hours.

For the underlying database and token setup, see [Notion](NOTION.md). For production variables, see
[Deployment](DEPLOYMENT.md).
