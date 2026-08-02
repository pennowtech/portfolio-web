# SinghBuildsTech Domain

The portfolio's canonical production address is [singhbuildstech.com](https://singhbuildstech.com). This guide covers
the one-time external configuration needed to connect that domain. For normal production releases, see
[Releases](RELEASES.md).

## Implemented in the application

The repository is configured with:

- `NEXT_PUBLIC_SITE_URL=https://singhbuildstech.com` as the production URL
- Canonical links on every public page
- Open Graph and Twitter sharing metadata
- A public `/robots.txt`
- A dynamic `/sitemap.xml` containing core pages, articles, and tags
- Permanent redirects from `www.singhbuildstech.com` and the former Vercel production alias to the apex domain
- Domain references in the Privacy Policy and Imprint
- No obsolete `pennow.tech` image-host rule

The canonical URL is centralized in `utils/site.js`. Local overrides belong in `.env.local`; the documented variable
template is `.env.example`.

## Register and connect the domain

At the domain registrar, purchase `singhbuildstech.com` if it is still available. Then:

1. Open the existing project in Vercel.
2. Go to **Settings → Domains**.
3. Add `singhbuildstech.com` and `www.singhbuildstech.com`.
4. Make `singhbuildstech.com` the primary domain.
5. Configure `www.singhbuildstech.com` to redirect to the primary domain.
6. Add the exact DNS records Vercel displays at the registrar.
7. Wait for both DNS verification and the HTTPS certificate to complete.

Do not copy generic DNS record values from tutorials; the Vercel project is the source of truth. See
[Vercel's custom-domain guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Vercel environment

Add this variable to the Production environment in **Settings → Environment Variables**:

```dotenv
NEXT_PUBLIC_SITE_URL=https://singhbuildstech.com
```

Redeploy after saving it. The full variable list and verification flow are in [Deployment](DEPLOYMENT.md).

## Google services

These settings are external and cannot be applied by the website build:

1. In the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin), add `singhbuildstech.com` and
   `www.singhbuildstech.com` as authorized domains. Keep `localhost` for local development. See
   [reCAPTCHA](RECAPTCHA.md).
2. In Google Analytics, change the GA4 web stream URL to `https://singhbuildstech.com`. See
   [Analytics](ANALYTICS.md).
3. In Google Search Console, create a **Domain property** for `singhbuildstech.com` and complete the DNS verification.
4. Submit `https://singhbuildstech.com/sitemap.xml` in Search Console after the first domain deployment.

## Verify the switch

After DNS is active and a release has been deployed:

1. Open both the apex and `www` URLs over HTTPS.
2. Confirm that `www` redirects to `https://singhbuildstech.com` while preserving the page path.
3. Confirm the former Vercel production alias redirects to the same canonical host.
4. View a page's source and confirm its canonical and `og:url` values use the apex domain.
5. Open `/robots.txt` and `/sitemap.xml` and confirm both reference the apex domain.
6. Submit a contact-form test and confirm reCAPTCHA reports no hostname error.
7. Check Vercel, Search Console, and Analytics for unexpected host or indexing errors.
