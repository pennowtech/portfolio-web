/* eslint-disable react/no-unescaped-entities */
import Head from 'next/head';
import Link from 'next/link';
import HeaderMain from '@components/HeaderMain';
import FullLayout from '@components/FullLayout';

const LingoraDeleteAccount = () => {
  return (
    <FullLayout
      metaInfo={{
        title: 'Delete Your Lingora Account | SinghBuildsTech',
        metaDesc: 'How to permanently delete your Lingora account and synced data.',
        metaKeywords: 'Lingora, Delete Account, Data Deletion, Google Account'
      }}
    >
      <HeaderMain />
      <div className='lingora-delete-root bg-[var(--bg)] text-[var(--ink)] antialiased font-sans text-base leading-[1.62] selection:bg-[var(--accent-soft)] selection:text-[var(--accent)]'>
        <Head>
          <style>{`
            .lingora-delete-root {
              --bg: #fbfaff; --surface: #ffffff; --ink: #201c30; --ink-muted: #5b5570; --ink-faint: #8a83a0;
              --accent: #534ab7; --accent-soft: #eeecfb; --rule: #e4e0f4;
              --danger: #b3261e; --danger-soft: #fbebea;
              --good: #1e7a52; --good-soft: #e6f5ee;
              --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            @media (prefers-color-scheme: dark) {
              .lingora-delete-root {
                --bg: #16131f; --surface: #1e1a2b; --ink: #ece9f7; --ink-muted: #a89fc2; --ink-faint: #766f8c;
                --accent: #9c8fe8; --accent-soft: #292440; --rule: #322c47;
                --danger: #ff8a80; --danger-soft: #3a1f1d;
                --good: #6bd6a6; --good-soft: #163326;
              }
            }
            .dark .lingora-delete-root {
              --bg: #16131f; --surface: #1e1a2b; --ink: #ece9f7; --ink-muted: #a89fc2; --ink-faint: #766f8c;
              --accent: #9c8fe8; --accent-soft: #292440; --rule: #322c47;
              --danger: #ff8a80; --danger-soft: #3a1f1d;
              --good: #6bd6a6; --good-soft: #163326;
            }

            .lingora-delete-page { max-width: 640px; margin: 0 auto; padding: 56px 24px 80px; }

            .lingora-delete-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin: 0 0 12px; }
            .lingora-delete-h1 { font-size: clamp(1.8rem, 4vw, 2.2rem); font-weight: 800; margin: 0 0 14px; text-wrap: balance; letter-spacing: -0.01em; color: var(--ink); }
            .lingora-delete-lede { font-size: 17px; color: var(--ink-muted); margin: 0 0 36px; }
            .lingora-delete-a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }

            .lingora-delete-h2 { font-size: 1.05rem; font-weight: 800; margin: 0 0 14px; color: var(--ink); }
            .lingora-delete-section { margin-bottom: 34px; }

            .lingora-delete-steps { list-style: none; margin: 0; padding: 0; counter-reset: step; }
            .lingora-delete-steps li { counter-increment: step; padding-left: 42px; position: relative; margin-bottom: 16px; font-size: 15px; color: var(--ink); }
            .lingora-delete-steps li::before {
              content: counter(step);
              position: absolute; left: 0; top: -1px;
              width: 26px; height: 26px; border-radius: 50%;
              background: var(--accent-soft); color: var(--accent);
              font-size: 13px; font-weight: 800;
              display: flex; align-items: center; justify-content: center;
            }
            .lingora-delete-ui-path { display: inline-flex; align-items: center; gap: 6px; background: var(--accent-soft); color: var(--accent); font-weight: 700; font-size: 13.5px; padding: 6px 13px; border-radius: 999px; margin: 2px 0 18px; }

            .lingora-delete-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            @media (max-width: 540px) { .lingora-delete-split { grid-template-columns: 1fr; } }
            .lingora-delete-card { border-radius: 14px; padding: 18px 20px; border: 1px solid var(--rule); }
            .lingora-delete-card.deleted { background: var(--danger-soft); border-color: color-mix(in srgb, var(--danger) 30%, transparent); }
            .lingora-delete-card.kept { background: var(--good-soft); border-color: color-mix(in srgb, var(--good) 30%, transparent); }
            .lingora-delete-card h3 { margin: 0 0 10px; font-size: 14px; font-weight: 800; }
            .lingora-delete-card.deleted h3 { color: var(--danger); }
            .lingora-delete-card.kept h3 { color: var(--good); }
            .lingora-delete-card ul { margin: 0; padding-left: 18px; list-style-type: disc; }
            .lingora-delete-card li { margin-bottom: 6px; font-size: 14px; color: var(--ink); }

            .lingora-delete-retention-note { font-size: 14.5px; color: var(--ink-muted); background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 16px 18px; margin-top: 16px; }

            .lingora-delete-email-box { background: var(--accent-soft); border-radius: 14px; padding: 20px 22px; }
            .lingora-delete-email-box p { margin: 0 0 8px; font-size: 14.5px; color: var(--ink); }
            .lingora-delete-email-box a { font-weight: 700; font-size: 16px; color: var(--accent); }

            .lingora-delete-footer { margin-top: 48px; padding-top: 22px; border-top: 1px solid var(--rule); font-size: 13.5px; color: var(--ink-faint); }
          `}</style>
        </Head>

        <div className='lingora-delete-page'>
          <p className='lingora-delete-eyebrow'>Account Deletion</p>
          <h1 className='lingora-delete-h1'>Delete Your Lingora Account</h1>
          <p className='lingora-delete-lede'>
            You can permanently delete your Lingora cloud account and all data synced to it at any time, directly from
            within the app — no need to contact support.
          </p>

          <section className='lingora-delete-section'>
            <h2 className='lingora-delete-h2'>How to delete your account</h2>
            <p className='lingora-delete-ui-path'>
              Lingora app → Settings → Sync → Danger zone → "Delete account &amp; sync data"
            </p>
            <ol className='lingora-delete-steps'>
              <li>
                Open the <strong>Lingora</strong> app and go to <strong>Settings → Sync</strong>.
              </li>
              <li>
                Scroll to the <strong>Danger zone</strong> section and tap{' '}
                <strong>"Delete account &amp; sync data."</strong>
              </li>
              <li>
                Confirm the action when prompted — Lingora will ask you to confirm once more since this cannot be
                undone.
              </li>
              <li>Your account and all associated cloud data are deleted immediately.</li>
            </ol>
          </section>

          <section className='lingora-delete-section'>
            <h2 className='lingora-delete-h2'>What happens when you delete your account</h2>
            <div className='lingora-delete-split'>
              <div className='lingora-delete-card deleted'>
                <h3>Permanently deleted</h3>
                <ul>
                  <li>
                    Every deck, card, and review-history record you've ever synced to Lingora's cloud storage
                    (Firestore) — a hard, immediate delete
                  </li>
                  <li>Lingora's authorization to your Google account is revoked</li>
                  <li>You're signed out of Cloud Sync</li>
                  <li>Local sync settings on this device (last-synced time, sync preferences)</li>
                </ul>
              </div>
              <div className='lingora-delete-card kept'>
                <h3>Not deleted</h3>
                <ul>
                  <li>
                    Your decks, cards, and review progress stored locally on your device — untouched and fully usable
                    offline
                  </li>
                </ul>
              </div>
            </div>
            <div className='lingora-delete-retention-note'>
              <strong>Retention period:</strong> none. We do not keep backups of your account data beyond what's
              technically necessary to complete the deletion request itself — there is no additional grace period or
              archival copy retained after deletion.
            </div>
            <p style={{ marginTop: '16px', fontSize: '14.5px', color: 'var(--ink-muted)' }}>
              If you'd also like to remove Lingora's local data from this device, uninstall the app or clear its data
              from your device's app settings — this is separate from the cloud account deletion above.
            </p>
          </section>

          <section className='lingora-delete-section'>
            <h2 className='lingora-delete-h2'>Can't access the app?</h2>
            <div className='lingora-delete-email-box'>
              <p>
                If you no longer have access to the app but still want your synced account data deleted, email us and
                we'll process the request manually:
              </p>
              <a href='mailto:singhbuildstech@gmail.com'>singhbuildstech@gmail.com</a>
            </div>
          </section>

          <footer className='lingora-delete-footer'>
            <p>
              This page describes account deletion specifically. For the full privacy policy, see{' '}
              <Link className='lingora-delete-a' href='/privacy/lingora'>
                Lingora's Privacy Policy
              </Link>
              .
            </p>
          </footer>
        </div>
      </div>
    </FullLayout>
  );
};

export default LingoraDeleteAccount;
