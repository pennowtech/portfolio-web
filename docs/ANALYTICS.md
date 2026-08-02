# Analytics and Privacy Consent

This guide explains how optional Google Analytics works in SinghBuildsTech. For the wider production configuration, see
[Deployment](DEPLOYMENT.md). For the public-facing data explanation, see the website's `/privacy` page.

## Privacy consent

It:

- Appears only when Google Analytics is configured
- Does not appear when analytics is absent
- Offers “Essential only”
- Offers “Accept analytics”
- Provides a Privacy Policy link
- Allows the choice to be changed through “Privacy settings” in the footer

Our local configuration currently does not contain `NEXT_PUBLIC_GOOGLE_ANALYTICS`, so the analytics consent banner should not appear locally.

## Consent storage

It:

- Stores the visitor’s choice in local storage
- Uses the key `sbtPrivacyConsent`
- Notifies the application when consent changes
- Removes known Google Analytics cookies when consent is withdrawn

The storage key uses the current SinghBuildsTech prefix: `sbtPrivacyConsent`.

## Consent-controlled Analytics

The implementation lives in `components/Analytics.jsx`.

Google Analytics now:

- Remains completely unloaded before consent
- Loads only after “Accept analytics”
- Tracks client-side page navigation after consent
- Requests IP anonymisation
- Stays disabled when the analytics environment variable is absent

The obsolete `utils/ga.jsx` helper was removed.

## Configuration

Set the GA4 measurement ID only when Analytics should be available:

```dotenv
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
```

Without this variable, Analytics, the consent prompt, and the footer's Privacy settings control remain disabled. Before
enabling it, configure the GA4 event-data retention period described in the Privacy Policy.

After changing a production environment variable, follow the redeployment steps in [Deployment](DEPLOYMENT.md).
