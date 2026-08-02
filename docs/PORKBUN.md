# Porkbun Setup

Porkbun is the registrar and DNS provider for `singhbuildstech.com`; Vercel remains the website host. Keeping those
roles separate preserves the existing GitHub-to-Vercel deployment workflow and gives the domain a single, clear DNS
control point.

For the application-side domain configuration, see [Domain](DOMAIN_NAME.md). For releases and Vercel variables, see
[Deployment](DEPLOYMENT.md).

## Register and secure the domain

1. Create or sign in to a Porkbun account.
2. Search for `singhbuildstech.com`, confirm both the registration and renewal prices, and complete the purchase.
3. In **Domain Management**, open **Details** for the domain.
4. Confirm WHOIS privacy is enabled.
5. Enable automatic renewal and keep a valid payment method on the account.
6. Enable two-factor authentication on the Porkbun account.
7. Keep the domain locked unless an intentional registrar transfer is in progress.

Porkbun documents the registration process and included services in its
[registration guide](https://kb.porkbun.com/article/212-how-to-register-a-domain-at-porkbun).

## Connect the website to Vercel

Use Porkbun's nameservers and manage the website records in Porkbun. Do not purchase separate Porkbun web hosting;
the portfolio is already built and deployed by Vercel.

1. In Vercel, open the `portfolio-web` project.
2. Go to **Settings → Domains**.
3. Add both hostnames:

   ```text
   singhbuildstech.com
   www.singhbuildstech.com
   ```

4. Make `singhbuildstech.com` the primary production domain.
5. Configure `www.singhbuildstech.com` to redirect to the primary domain.
6. Copy the exact DNS records displayed by Vercel. The apex normally uses an A record and `www` normally uses a
   CNAME, but Vercel's displayed values are authoritative.
7. In Porkbun, open **Domain Management** and select **DNS** beside `singhbuildstech.com`.
8. Remove only default parking or URL-forwarding records that conflict with the Vercel hostnames. Do not remove MX,
   SPF, DKIM, DMARC, reCAPTCHA, or Search Console records.
9. Add the records supplied by Vercel:
   - Use a blank host or `@`, as Porkbun's form requires, for the apex record.
   - Use `www` as the host for the `www` CNAME.
10. Save the records and return to Vercel until both domains show as valid.
11. Wait for Vercel to provision HTTPS, then open both domain variants in a private browser window.

The dashboard procedure is documented by [Porkbun DNS](https://kb.porkbun.com/article/231-how-to-add-dns-records-on-porkbun)
and [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain).

Do not configure Porkbun URL forwarding for the apex or `www` hostnames. Vercel and the application already enforce
the canonical redirect, preserve paths, and serve the HTTPS certificate.

## Enable DNSSEC

After the website and email DNS records work correctly:

1. Open **Domain Management → Details** for the domain.
2. Find **Porkbun DNSSEC**.
3. Enable the toggle and confirm it turns green.
4. Allow time for the signed records to propagate.
5. Verify the domain with a DNSSEC checker such as DNSViz.

This procedure applies while the domain continues using Porkbun's nameservers. See
[Porkbun's DNSSEC guide](https://kb.porkbun.com/article/216-how-to-enable-porkbuns-cloudflare-dnssec).

## Configure free email forwarding

Create these two public addresses:

| Public address                | Forwarding destination      | Intended use                  |
| ----------------------------- | --------------------------- | ----------------------------- |
| `hello@singhbuildstech.com`   | `singhbuildstech@gmail.com` | General and portfolio contact |
| `privacy@singhbuildstech.com` | `singhbuildstech@gmail.com` | Privacy and data requests     |

For each address:

1. In Porkbun, open **Domain Management**.
2. Select the envelope icon in the **Email** column for `singhbuildstech.com`.
3. Find **Porkbun Email Forwarding → Create a New Forwarding Address**.
4. Enter `hello` in the address field and `singhbuildstech@gmail.com` as the destination.
5. Select **Create Email Forward**.
6. Repeat with `privacy` as the address and the same Gmail destination.
7. Confirm both entries appear under **Current Forwards**.

Porkbun permits up to 20 free forwarding addresses, but it does not support wildcard or catch-all forwards. See the
[official email-forwarding guide](https://kb.porkbun.com/article/10-how-to-set-up-email-forwarding-service).

### Organize forwarded mail in Gmail

In Gmail, create labels named `SinghBuildsTech` and `Privacy`. Then create filters:

- `to:hello@singhbuildstech.com` → apply the `SinghBuildsTech` label
- `to:privacy@singhbuildstech.com` → apply the `Privacy` label and mark it important

Test each forward from an address other than `singhbuildstech@gmail.com`. Sending a test from the forwarding destination
can trigger loop protection and produce a misleading failure.

### Understand the sending limitation

Free forwarding handles incoming mail only. A reply sent normally from Gmail will show
`singhbuildstech@gmail.com` as the sender, not the custom address. Do not claim that Gmail can send as either custom
address without a real SMTP mailbox.

If branded outbound email becomes important, purchase one hosted mailbox—for example
`hello@singhbuildstech.com`—from Porkbun or another email provider. The provider supplies authenticated SMTP, DKIM, and
DMARC configuration. `privacy@singhbuildstech.com` can then remain an alias or forward. Porkbun explains the distinction
in [hosted email versus forwarding](https://kb.porkbun.com/article/67-hosted-email-vs-email-forwarding).

Porkbun forwarding requires Porkbun's mail MX records. If forwarding stops, open the domain's Email page and use
**Fix DNS** to restore the required MX and SPF records. Do not point the domain's MX records at a second mail provider
at the same time.

## Complete the domain-dependent services

After DNS and HTTPS work:

1. Add `singhbuildstech.com` and `www.singhbuildstech.com` to the reCAPTCHA configuration described in
   [reCAPTCHA](RECAPTCHA.md).
2. Set the GA4 web stream URL as described in [Analytics](ANALYTICS.md).
3. Add a Google Search Console domain property and publish its TXT verification record through Porkbun DNS.
4. Submit `https://singhbuildstech.com/sitemap.xml` in Search Console.
5. Set `NEXT_PUBLIC_SITE_URL=https://singhbuildstech.com` in Vercel as described in [Deployment](DEPLOYMENT.md).

## Final verification

- `https://singhbuildstech.com` loads with a valid certificate.
- The `www` URL redirects to the apex domain and preserves the requested path.
- Vercel reports both domains as correctly configured.
- `/robots.txt` and `/sitemap.xml` use the apex hostname.
- reCAPTCHA no longer reports an invalid hostname.
- Messages to both forwarded addresses arrive in Gmail with the expected labels.
- DNSSEC validation succeeds.
- Porkbun auto-renewal and account two-factor authentication remain enabled.
