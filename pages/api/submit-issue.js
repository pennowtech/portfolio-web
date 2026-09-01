import { App } from 'octokit';

function getGitHubApp() {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  if (!appId || !privateKey) {
    return null;
  }

  return new App({
    appId,
    privateKey
  });
}

export default async function handler(req, res) {
  // 1. Full CORS Support (Required for React Native and Tauri Desktop custom schemes)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 2. Destructure Client Payload
  const {
    title,
    body,
    email,
    targetOwner = 'pennowtech',
    targetRepo = 'Lingora',
    category = 'General',
    platform = 'Mobile App',
    deviceMeta = ''
  } = req.body || {};

  if (!title?.trim() || !body?.trim() || !targetOwner || !targetRepo) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, body, targetOwner, targetRepo.'
    });
  }

  const app = getGitHubApp();
  if (!app) {
    console.error('GITHUB_APP_ID or GITHUB_PRIVATE_KEY is not configured in server environment.');
    return res.status(500).json({
      success: false,
      error: 'GitHub App credentials are not configured on the server.'
    });
  }

  try {
    // 3. Dynamically resolve GitHub App installation for Org (pennowtech) or User
    const { data: installation } = await app.octokit
      .request('GET /orgs/{org}/installation', { org: targetOwner })
      .catch(() => app.octokit.request('GET /users/{username}/installation', { username: targetOwner }));

    if (!installation?.id) {
      return res.status(404).json({
        success: false,
        error: `GitHub App is not installed for ${targetOwner}. Please install the app on the repository/organization first.`
      });
    }

    // 4. Authenticate using ephemeral installation token
    const octokit = await app.getInstallationOctokit(installation.id);

    // 5. Structure Formatted Markdown Body with Diagnostics
    const formattedBody = [
      `${body.trim()}`,
      `\n\n---`,
      `### 📋 Execution Environment Metadata`,
      `- **Sender Email:** ${email?.trim() || 'Anonymous App User'}`,
      `- **Origin Client Application:** ${platform}`,
      `- **Operating System / Build:** ${deviceMeta || 'No diagnostic context provided.'}`,
      `- **Generated Timestamp:** ${new Date().toISOString()}`
    ].join('\n');

    const categoryLabel = (category || 'general').toLowerCase();

    // 6. Submit Issue to Targeted Repository
    const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: targetOwner,
      repo: targetRepo,
      title: `[${category}] ${title.trim()}`,
      body: formattedBody,
      labels: [categoryLabel, 'user-report']
    });

    return res.status(200).json({
      success: true,
      issueUrl: response.data.html_url,
      issueNumber: response.data.number
    });
  } catch (error) {
    console.error('Internal Request Router Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Processing Failure'
    });
  }
}
