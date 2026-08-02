### PrivacyConsent component

It:

- Appears only when Google Analytics is configured
- Does not appear when analytics is absent
- Offers “Essential only”
- Offers “Accept analytics”
- Provides a Privacy Policy link
- Allows the choice to be changed through “Privacy settings” in the footer

Our local configuration currently does not contain `NEXT_PUBLIC_GOOGLE_ANALYTICS`, so the analytics consent banner should not appear locally.

#### Consent storage

It:

- Stores the visitor’s choice in local storage
- Uses the key `sbtPrivacyConsent`
- Notifies the application when consent changes
- Removes known Google Analytics cookies when consent is withdrawn

The storage key uses the current SinghBuildsTech prefix: `sbtPrivacyConsent`.

#### Consent-controlled Analytics

Added [Analytics.jsx](/Users/sukhdeep.singh/Mine/portfolio-web/components/Analytics.jsx).

Google Analytics now:

- Remains completely unloaded before consent
- Loads only after “Accept analytics”
- Tracks client-side page navigation after consent
- Requests IP anonymisation
- Stays disabled when the analytics environment variable is absent

The obsolete `utils/ga.jsx` helper was removed.
