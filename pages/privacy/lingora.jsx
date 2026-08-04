/* eslint-disable react/no-unescaped-entities */
import Head from 'next/head';
import Link from 'next/link';
import HeaderMain from '@components/HeaderMain';
import FullLayout from '@components/FullLayout';

const LingoraPrivacy = () => {
  return (
    <FullLayout
      metaInfo={{
        title: 'Lingora Privacy Policy | SinghBuildsTech',
        metaDesc:
          "Lingora's public privacy policy — what data is collected, why, where it's stored, and how to delete it.",
        metaKeywords: 'Lingora, Privacy Policy, Android App'
      }}
    >
      <HeaderMain />
      <div className='lingora-privacy-root bg-[var(--bg)] text-[var(--ink)] antialiased font-sans text-base leading-[1.62] selection:bg-[var(--accent-soft)] selection:text-[var(--accent)]'>
        <Head>
          <style>{`
            .lingora-privacy-root {
              --bg: #fbfaff;
              --surface: #ffffff;
              --ink: #201c30;
              --ink-muted: #5b5570;
              --ink-faint: #8a83a0;
              --accent: #534ab7;
              --accent-soft: #eeecfb;
              --rule: #e4e0f4;
              --good: #1e7a52;
              --good-soft: #e6f5ee;
              --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            @media (prefers-color-scheme: dark) {
              .lingora-privacy-root {
                --bg: #16131f;
                --surface: #1e1a2b;
                --ink: #ece9f7;
                --ink-muted: #a89fc2;
                --ink-faint: #766f8c;
                --accent: #9c8fe8;
                --accent-soft: #292440;
                --rule: #322c47;
                --good: #6bd6a6;
                --good-soft: #163326;
              }
            }
            .dark .lingora-privacy-root {
              --bg: #16131f;
              --surface: #1e1a2b;
              --ink: #ece9f7;
              --ink-muted: #a89fc2;
              --ink-faint: #766f8c;
              --accent: #9c8fe8;
              --accent-soft: #292440;
              --rule: #322c47;
              --good: #6bd6a6;
              --good-soft: #163326;
            }

            .lingora-shell {
              display: grid;
              grid-template-columns: 260px minmax(0, 720px);
              gap: 56px;
              max-width: 1040px;
              margin: 0 auto;
              padding: 56px 24px 100px;
            }
            @media (max-width: 860px) {
              .lingora-shell {
                grid-template-columns: 1fr;
              }
            }

            .lingora-toc {
              position: sticky;
              top: 32px;
              align-self: start;
            }
            @media (max-width: 860px) {
              .lingora-toc {
                position: static;
                margin-bottom: 8px;
              }
            }

            .lingora-toc-label {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--ink-faint);
              margin: 0 0 12px;
            }
            .lingora-toc a {
              display: block;
              font-size: 13.5px;
              color: var(--ink-muted);
              text-decoration: none;
              padding: 5px 0;
              border-left: 2px solid transparent;
              padding-left: 12px;
              margin-left: -13px;
              transition: color 0.15s ease, border-color 0.15s ease;
            }
            .lingora-toc a:hover, .lingora-toc a:focus-visible {
              color: var(--accent);
              border-left-color: var(--accent);
            }

            .lingora-main { min-width: 0; }
            .lingora-header-top { margin-bottom: 40px; }
            .lingora-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin: 0 0 12px; }
            .lingora-h1 { font-size: clamp(1.9rem, 4vw, 2.4rem); font-weight: 800; margin: 0 0 10px; text-wrap: balance; letter-spacing: -0.01em; color: var(--ink); }
            .lingora-updated { font-size: 14px; color: var(--ink-faint); margin: 0; }

            .lingora-callout {
              background: var(--good-soft);
              border: 1px solid color-mix(in srgb, var(--good) 30%, transparent);
              border-radius: 14px;
              padding: 22px 24px;
              margin: 28px 0 40px;
            }
            .lingora-callout h2 { font-size: 15px; font-weight: 800; color: var(--good); margin: 0 0 12px; letter-spacing: 0.01em; }
            .lingora-callout ul { margin: 0; padding-left: 20px; list-style-type: disc; }
            .lingora-callout li { margin-bottom: 7px; font-size: 14.5px; color: var(--ink); }
            .lingora-callout li:last-child { margin-bottom: 0; }

            .lingora-section { margin-bottom: 44px; scroll-margin-top: 24px; }
            .lingora-section-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.005em; color: var(--ink); }
            .lingora-section-num { color: var(--accent); font-variant-numeric: tabular-nums; margin-right: 8px; }
            .lingora-h3 { font-size: 1.02rem; font-weight: 700; margin: 24px 0 8px; color: var(--ink); }
            .lingora-p { margin: 0 0 14px; color: var(--ink); }
            .lingora-p.muted { color: var(--ink-muted); font-size: 14.5px; }
            .lingora-ul, .lingora-ol { margin: 0 0 14px; padding-left: 22px; }
            .lingora-ul { list-style-type: disc; }
            .lingora-li { margin-bottom: 6px; }
            .lingora-strong { font-weight: 700; }
            .lingora-a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
            .lingora-code { background: var(--accent-soft); padding: 1px 6px; border-radius: 5px; font-size: 0.88em; font-family: ui-monospace, "SF Mono", Menlo, monospace; color: var(--accent); }

            .lingora-table-wrap { overflow-x: auto; border: 1px solid var(--rule); border-radius: 12px; margin: 4px 0 18px; }
            .lingora-table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: 14px; }
            .lingora-table th, .lingora-table td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--rule); vertical-align: top; color: var(--ink); }
            .lingora-table thead th { background: var(--accent-soft); font-weight: 700; color: var(--ink); font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.04em; }
            .lingora-table tbody tr:last-child td { border-bottom: none; }
            .lingora-table td.provider { font-weight: 700; white-space: nowrap; }

            .lingora-flow-steps { list-style: none; margin: 0 0 14px; padding: 0; counter-reset: step; }
            .lingora-flow-steps li { counter-increment: step; padding-left: 34px; position: relative; margin-bottom: 12px; font-size: 14.5px; color: var(--ink); }
            .lingora-flow-steps li::before {
              content: counter(step);
              position: absolute; left: 0; top: 0;
              width: 22px; height: 22px; border-radius: 50%;
              background: var(--accent-soft); color: var(--accent);
              font-size: 12px; font-weight: 800;
              display: flex; align-items: center; justify-content: center;
            }

            .lingora-ui-path { display: inline-flex; align-items: center; gap: 6px; background: var(--accent-soft); color: var(--accent); font-weight: 700; font-size: 13px; padding: 5px 12px; border-radius: 999px; margin: 4px 0 16px; }

            .lingora-footer-bottom { margin-top: 60px; padding-top: 26px; border-top: 1px solid var(--rule); font-size: 13.5px; color: var(--ink-faint); }
          `}</style>
        </Head>

        <div className='lingora-shell'>
          <nav className='lingora-toc' aria-label='Table of contents'>
            <p className='lingora-toc-label'>On this page</p>
            <a href='#summary'>Quick summary</a>
            <a href='#collect'>Information we collect</a>
            <a href='#use'>How we use it</a>
            <a href='#third-parties'>Third-party services</a>
            <a href='#storage'>Where data is stored</a>
            <a href='#sharing'>Data sharing</a>
            <a href='#controls'>Your choices &amp; controls</a>
            <a href='#deletion'>Deleting your data</a>
            <a href='#retention'>Data retention</a>
            <a href='#children'>Children's privacy</a>
            <a href='#security'>Security</a>
            <a href='#changes'>Changes to this policy</a>
            <a href='#contact'>Contact us</a>
          </nav>

          <main className='lingora-main'>
            <header className='lingora-header-top'>
              <p className='lingora-eyebrow'>Privacy Policy</p>
              <h1 className='lingora-h1'>Lingora Privacy Policy</h1>
              <p className='lingora-updated'>
                Last updated: August 4, 2026 &nbsp;·&nbsp; Applies to the Lingora app (Android package{' '}
                <code className='lingora-code'>com.lingora.mobile</code>)
              </p>
            </header>

            <section id='summary' className='lingora-section'>
              <div className='lingora-callout'>
                <h2>The short version</h2>
                <ul>
                  <li>
                    Lingora works fully offline by default. Your decks, cards, and review history are stored only on
                    your device unless you explicitly turn on Cloud Sync.
                  </li>
                  <li>
                    We don't use any analytics or crash-reporting service. Nothing about how you use the app is tracked
                    or sent to us.
                  </li>
                  <li>We don't run ads, and we don't sell or share your data with advertisers.</li>
                  <li>
                    If you use AI-powered lessons or translation, the word or sentence you look up is sent directly from
                    your device to the AI provider <em>you</em> chose (e.g. OpenAI, Google), using an API key that{' '}
                    <em>you</em> provide. We do not operate a server in that path and never see that content ourselves.
                  </li>
                  <li>
                    API keys you enter are stored only in your device's secure storage (Android Keystore / iOS
                    Keychain). They are never sent to us, never synced, and never included in backups.
                  </li>
                  <li>
                    You can permanently delete your cloud account and synced data at any time, from inside the app, in a
                    couple of taps.
                  </li>
                </ul>
              </div>
              <p className='lingora-p muted'>
                The rest of this page explains all of that in full detail, as required by the Google Play Store and
                other app marketplaces.
              </p>
            </section>

            <section id='collect' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>1.</span>Information We Collect
              </h2>

              <h3 className='lingora-h3'>Account information (only if you enable Cloud Sync)</h3>
              <p className='lingora-p'>
                Lingora offers an optional Cloud Sync feature so your vocabulary can follow you across devices. If you
                choose to turn it on, you sign in with your Google account via Firebase Authentication. This gives
                Lingora a unique account identifier for you, plus the email address and display name your Google account
                provides — this identity information is used only to authenticate you and is shown to you inside the
                app's Sync settings screen. It is <strong>not</strong> written into your synced vocabulary data (see
                below).
              </p>
              <p className='lingora-p'>
                If you never turn on Cloud Sync, no account information is created or collected at all — the app is
                fully usable offline with no sign-in.
              </p>

              <h3 className='lingora-h3'>Your vocabulary and learning data</h3>
              <p className='lingora-p'>
                As you use Lingora, the app stores your decks, flashcards, example sentences, synonyms, review history,
                and spaced-repetition scheduling data. This is always stored locally on your device. If — and only if —
                you enable Cloud Sync, this same data is also stored in our Firestore database (part of Google
                Firebase), associated with your account identifier, so it can sync to your other devices.
              </p>

              <h3 className='lingora-h3'>Words, sentences, and text you look up (AI &amp; translation features)</h3>
              <p className='lingora-p'>
                When you search for a word or ask Lingora to generate a lesson, example sentences, or a grammar
                explanation, the word or sentence text is sent directly from your device to whichever AI or translation
                provider you have configured (see the Third-Party Services table below), using an API key that you
                personally supply and control. Lingora does not operate a server in this data path — there is no
                Lingora-owned backend that receives, logs, or relays this content. We do not see, store, or have access
                to what you look up through these providers.
              </p>
              <p className='lingora-p'>
                If you don't configure any AI provider, you can still use Lingora's free, fully offline local dictionary
                — in that case no lookup data leaves your device at all.
              </p>

              <h3 className='lingora-h3'>Pronunciation (text-to-speech)</h3>
              <p className='lingora-p'>
                Lingora can read words aloud using your device's own built-in voice (fully offline, nothing leaves your
                device), or, if you choose to configure one, a cloud voice provider (OpenAI, ElevenLabs, or Deepgram)
                using your own API key — again sent directly from your device to that provider, not through us.
              </p>

              <h3 className='lingora-h3'>API keys</h3>
              <p className='lingora-p'>
                Any API key you enter for an AI, translation, or pronunciation provider is stored exclusively in your
                device's secure, encrypted storage (Android Keystore-backed secure storage, or iOS Keychain). Your keys
                are never transmitted to Lingora's developers, never included in Cloud Sync, and never included in any
                backup or export file.
              </p>

              <h3 className='lingora-h3'>Feedback</h3>
              <p className='lingora-p'>
                Lingora includes a "Send Feedback" screen. As of the current version of the app, this screen does not
                transmit anything anywhere — it is a local preview of an upcoming feature, and submitting it does not
                send data to us or to any third party. This section of the policy will be updated if and when that
                feature is connected to a live submission system, and we will describe exactly what is sent at that
                time.
              </p>

              <h3 className='lingora-h3'>
                What we do <em>not</em> collect
              </h3>
              <ul className='lingora-ul'>
                <li className='lingora-li'>No analytics or usage-tracking SDK of any kind</li>
                <li className='lingora-li'>No crash-reporting or diagnostics SDK of any kind</li>
                <li className='lingora-li'>No advertising identifiers, and no advertising or ad-tracking SDKs</li>
                <li className='lingora-li'>No location data</li>
                <li className='lingora-li'>No access to your contacts, photos, or other apps</li>
                <li className='lingora-li'>No sale of personal data, ever</li>
              </ul>
            </section>

            <section id='use' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>2.</span>How We Use Your Information
              </h2>
              <p className='lingora-p'>Whatever information exists (see above) is used only to:</p>
              <ul className='lingora-ul'>
                <li className='lingora-li'>
                  Operate the app's core functionality — storing your vocabulary and scheduling your reviews
                </li>
                <li className='lingora-li'>
                  Authenticate you and sync your data across your own devices, if you've enabled Cloud Sync
                </li>
                <li className='lingora-li'>
                  Generate the lesson, translation, or pronunciation you specifically requested, via the provider you
                  specifically configured
                </li>
              </ul>
              <p className='lingora-p'>
                We do not use your data for advertising, profiling, or any purpose beyond operating the features you've
                actively chosen to use.
              </p>
            </section>

            <section id='third-parties' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>3.</span>Third-Party Services
              </h2>
              <p className='lingora-p'>
                Lingora is a "bring your own key" app: every AI, translation, and pronunciation provider below is{' '}
                <strong>optional</strong> and only active if you personally configure it with your own account/API key.
                Each request goes directly from your device to that provider — Lingora does not sit in the middle.
              </p>

              <div className='lingora-table-wrap'>
                <table className='lingora-table'>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Used for</th>
                      <th>What's sent</th>
                      <th>Required?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='provider'>Firebase Authentication (Google)</td>
                      <td>Signing you in for Cloud Sync</td>
                      <td>Your Google account identity (email, display name, account ID)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Firebase Firestore (Google)</td>
                      <td>Storing your synced decks/cards/progress</td>
                      <td>Your vocabulary &amp; review data, keyed to your account ID</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>OpenAI</td>
                      <td>AI lesson generation, translation, pronunciation</td>
                      <td>The word/sentence you look up (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Mistral AI</td>
                      <td>AI lesson generation</td>
                      <td>The word/sentence you look up (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Google Gemini</td>
                      <td>AI lesson generation</td>
                      <td>The word/sentence you look up (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Anthropic (Claude)</td>
                      <td>AI lesson generation</td>
                      <td>The word/sentence you look up (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>DeepL</td>
                      <td>Translation</td>
                      <td>The word/sentence you translate (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Google Translate</td>
                      <td>Free-tier translation</td>
                      <td>The word/sentence you translate</td>
                      <td>Optional (default translation option)</td>
                    </tr>
                    <tr>
                      <td className='provider'>ElevenLabs</td>
                      <td>Cloud text-to-speech</td>
                      <td>The word/sentence to be spoken (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                    <tr>
                      <td className='provider'>Deepgram</td>
                      <td>Cloud text-to-speech</td>
                      <td>The word/sentence to be spoken (only if configured)</td>
                      <td>Optional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className='lingora-p muted'>
                Each of these providers has its own privacy policy governing how it handles data it receives; we
                encourage you to review the policy of any provider you choose to configure.
              </p>
            </section>

            <section id='storage' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>4.</span>Where Your Data Is Stored
              </h2>
              <ul className='lingora-ul'>
                <li className='lingora-li'>
                  <strong>On your device, always:</strong> your vocabulary, decks, review history, settings, and API
                  keys are stored locally, using standard on-device secure storage.
                </li>
                <li className='lingora-li'>
                  <strong>In the cloud, only if you enable Cloud Sync:</strong> your vocabulary and review data (never
                  your API keys) is additionally stored in Google Firebase / Firestore, under Google's infrastructure
                  and security practices.
                </li>
              </ul>
              <p className='lingora-p'>
                If you never enable Cloud Sync, none of your data ever leaves your device except for the specific word
                or sentence you actively send to an AI/translation/pronunciation provider you've configured.
              </p>
            </section>

            <section id='sharing' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>5.</span>Data Sharing
              </h2>
              <p className='lingora-p'>
                We do not sell your personal data. We do not share it with advertisers or data brokers. The only
                "sharing" that happens is the direct, on-demand transmission described above: when you trigger a lookup,
                translation, or pronunciation request, the relevant text is sent straight to the specific third-party
                provider you configured for that purpose, and (if enabled) your account/sync data is stored with Google
                Firebase to power Cloud Sync. Neither of these is shared any further by us.
              </p>
            </section>

            <section id='controls' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>6.</span>Your Choices &amp; Controls
              </h2>
              <ul className='lingora-ul'>
                <li className='lingora-li'>
                  <strong>Stay fully offline:</strong> use Lingora's free local dictionary and never configure an AI
                  provider or Cloud Sync — no data leaves your device, ever.
                </li>
                <li className='lingora-li'>
                  <strong>Choose your own AI provider:</strong> pick which service (if any) receives your lookups, and
                  switch or remove it at any time in Settings.
                </li>
                <li className='lingora-li'>
                  <strong>Turn Cloud Sync on or off:</strong> at any time, in Settings → Sync.
                </li>
                <li className='lingora-li'>
                  <strong>Export your data:</strong> back up your full library to a file you control, at any time.
                </li>
                <li className='lingora-li'>
                  <strong>Delete your cloud account and synced data:</strong> see the next section.
                </li>
              </ul>
            </section>

            <section id='deletion' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>7.</span>Deleting Your Data
              </h2>
              <p className='lingora-p'>
                You can permanently delete your cloud account and everything synced to it, directly inside the app, at
                any time. For step-by-step guidance, see our dedicated{' '}
                <Link href='/privacy/lingora/delete-account' className='lingora-a'>
                  Account Deletion Guide
                </Link>
                .
              </p>
              <p className='lingora-ui-path'>Settings → Sync → Danger zone → "Delete account &amp; sync data"</p>
              <p className='lingora-p'>
                Tapping this button (after confirming — the app will ask "Delete account &amp; sync data?" once more
                before proceeding, since this cannot be undone) does the following:
              </p>
              <ol className='lingora-flow-steps'>
                <li>
                  Permanently deletes every document you've ever synced to our Firestore database — this is a hard
                  delete, not a soft/recoverable one.
                </li>
                <li>
                  Revokes the app's Google sign-in authorization for your account, disconnecting Lingora from your
                  Google account entirely.
                </li>
                <li>Signs you out of Cloud Sync locally.</li>
                <li>Clears local sync bookkeeping (last-synced time, sync settings) from your device.</li>
              </ol>
              <p className='lingora-p'>
                <strong>What this does not delete:</strong> your decks, cards, and review progress stored locally on
                this device are left completely untouched and remain fully usable offline. If you want to remove your
                local data too, uninstall the app or clear its data from your device's app settings.
              </p>
              <p className='lingora-p'>
                If you'd rather request deletion by email instead of using the in-app control, contact us at the address
                in the Contact section below and we will process your request.
              </p>
            </section>

            <section id='retention' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>8.</span>Data Retention
              </h2>
              <p className='lingora-p'>
                Locally stored data remains on your device for as long as you keep the app installed, or until you
                delete it yourself. Cloud-synced data (Firestore) is retained only for as long as your Cloud Sync
                account is active, and is permanently deleted the moment you use the deletion flow described above. We
                do not keep backups of deleted account data beyond what's necessary to complete the deletion itself.
              </p>
            </section>

            <section id='children' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>9.</span>Children's Privacy
              </h2>
              <p className='lingora-p'>
                Lingora is not directed at children under 13, and we do not knowingly collect personal information from
                children under 13. If you believe a child has provided us with personal information (for example, by
                creating a Cloud Sync account), please contact us and we will take steps to delete it.
              </p>
            </section>

            <section id='security' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>10.</span>Security
              </h2>
              <p className='lingora-p'>
                API keys and other sensitive settings are stored using your device's dedicated secure storage system
                (Android Keystore-backed encrypted storage, or iOS Keychain), the same mechanism used for other
                sensitive on-device credentials. Cloud-synced data in Firestore is protected by security rules that
                restrict access to your own authenticated account only. No method of storage or transmission is 100%
                secure, but we design Lingora to minimize what could ever be at risk by keeping as much as possible on
                your device by default.
              </p>
            </section>

            <section id='changes' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>11.</span>Changes to This Policy
              </h2>
              <p className='lingora-p'>
                If we change what data Lingora collects or how it's used — for example, if the Feedback feature
                described above becomes connected to a live submission system — we will update this page and revise the
                "Last updated" date at the top. We encourage you to review this page periodically.
              </p>
            </section>

            <section id='contact' className='lingora-section'>
              <h2 className='lingora-section-title'>
                <span className='lingora-section-num'>12.</span>Contact Us
              </h2>
              <p className='lingora-p'>
                If you have questions about this policy, or want to request deletion of your data by email instead of
                using the in-app control, contact us at:
              </p>
              <p className='lingora-p'>
                <strong>
                  <a className='lingora-a' href='mailto:singhbuildstech@gmail.com'>
                    singhbuildstech@gmail.com
                  </a>
                </strong>
              </p>
            </section>

            <footer className='lingora-footer-bottom'>
              <p>
                Lingora — a German/Spanish vocabulary app. This policy describes the app's data practices as of the date
                above and applies to the Android app identified by package{' '}
                <code className='lingora-code'>com.lingora.mobile</code>.
              </p>
            </footer>
          </main>
        </div>
      </div>
    </FullLayout>
  );
};

export default LingoraPrivacy;
