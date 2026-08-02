# Releases

Production releases are initiated by semantic version tags. The workflow is defined in
`.github/workflows/production.yaml` and deploys the tagged commit to Vercel production.

## Release format

- Package version: `0.1.0`
- Git tag: `v0.1.0`
- Tag pattern accepted by the workflow: `v*.*.*`

The tag without its leading `v` must exactly match the `version` in `package.json`. The workflow stops before deployment
when they differ.

## Create a release

1. Confirm the intended release commit is merged into `main`.
2. Pull the current `main` branch.
3. Update `package.json` and `package-lock.json` to the intended semantic version.
4. Run the local validation documented in [Development](DEVELOPMENT.md), or use the `Quality: Verify` task from
   [VS Code Tasks](VSCODE_TASKS.md).
5. Commit and merge the version change.
6. Create an annotated tag on the merged commit:

   ```shell
   git tag -a v0.1.0 -m "Release v0.1.0"
   ```

7. Push that exact tag:

   ```shell
   git push origin v0.1.0
   ```

## Automated pipeline

The tag push performs these steps in GitHub Actions:

1. Check out the tagged commit.
2. Configure Node.js 24.
3. Confirm the tag and package versions match.
4. Install locked dependencies with `npm ci`.
5. Run ESLint.
6. pull the Vercel production environment.
7. Build the production artifact with Vercel.
8. Deploy the prebuilt artifact to Vercel production.

The workflow can also be started manually with **Run workflow** for recovery or diagnostics. Manual runs deploy the
selected commit without a tag-version comparison.

## Verification

After the workflow succeeds:

1. Open the GitHub Actions run and confirm every step passed.
2. Confirm the matching production deployment appears in Vercel.
3. Check the homepage, article archive, one article page, contact form, Privacy Policy, and Imprint.
4. Submit and remove a test contact record when the release changes the contact path.

For Vercel variables and domains, see [Deployment](DEPLOYMENT.md).
