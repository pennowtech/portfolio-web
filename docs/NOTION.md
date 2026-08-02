# Notion

The portfolio reads articles and About content from a Notion database through an internal connection. Contact-form
storage is a separate concern documented in [Contact Form](CONTACT_FORM.md).

## Create an internal connection

1. Sign in to the [Notion integrations portal](https://www.notion.so/profile/integrations).
2. Create a new internal connection named `SinghBuildsTech Portfolio`.
3. Select the workspace containing the portfolio database.
4. Enable **Read content**.
5. Copy the installation access token. This becomes `NOTION_KEY`.

Never commit or share the token. Rotate it immediately if it is exposed.

## Grant database access

1. Open the original articles database as a full page.
2. Select `•••` → **Connections** → **Add connection**.
3. Select the SinghBuildsTech connection and confirm access.

## Find the database ID

Copy the full-page database link. In a URL such as:

```text
https://app.notion.com/p/d566a3d6865d4435a2945829eb4c9bd8?v=...
```

the database ID is the 32-character value before the query string:

```text
d566a3d6865d4435a2945829eb4c9bd8
```

The `v` parameter identifies a view and is not the database ID.

## Local configuration

Add the credentials to `.env.local`:

```dotenv
NOTION_KEY=ntn_your_private_installation_token
NOTION_DATABASE_ID=your_articles_database_id
```

Restart `npm run dev` after changing environment variables.

## Troubleshooting

- **Unauthorized:** recopy the connection token and check for quotes or whitespace.
- **Object not found:** grant the connection access and verify the database ID came from the full database page.
- **No articles:** confirm the database schema matches `utils/notion.jsx` and that intended articles are published.
- **Production differs locally:** verify the same variables in Vercel using [Deployment](DEPLOYMENT.md).

For official background, see Notion's
[internal connection guide](https://developers.notion.com/guides/get-started/internal-connections).
