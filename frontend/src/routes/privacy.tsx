import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-text-primary mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="text-text-tertiary mb-10 text-sm">Last updated: March 2026</p>

      <div className="space-y-8">
        <Section title="1. Information We Collect">
          When you register, we collect your email address, username, and optionally an avatar URL.
          If you sign in with Google, we receive your Google profile information (name, email,
          profile photo) via OAuth. We also store the films you add to your watchlist, reviews you
          write, and friend connections you make.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information solely to operate CinéConnect: to authenticate you, display your
          profile, and enable social features such as reviews and friends. We do not sell, rent, or
          share your personal data with third parties for marketing purposes.
        </Section>

        <Section title="3. Data Storage">
          Your data is stored in a PostgreSQL database. Access tokens are stored in memory only and
          are not persisted to disk. Refresh tokens are stored in secure, HttpOnly cookies that are
          not accessible to JavaScript.
        </Section>

        <Section title="4. Third-Party Services">
          CinéConnect uses the following external services:
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Google OAuth</strong> — for sign-in. Subject to{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-letterboxd-green hover:underline"
              >
                Google Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>OMDB API</strong> — film metadata. No personal data is shared.
            </li>
            <li>
              <strong>TMDb</strong> — film data, posters, cast. No personal data is shared.
            </li>
          </ul>
        </Section>

        <Section title="5. Your Rights">
          You may request deletion of your account and associated data at any time by{' '}
          <Link to="/contact" className="text-letterboxd-green hover:underline">
            contacting us
          </Link>
          . You may also update your profile information at any time from the{' '}
          <Link to="/settings" className="text-letterboxd-green hover:underline">
            Settings
          </Link>{' '}
          page.
        </Section>

        <Section title="6. Cookies">
          We use a single HttpOnly cookie to store your refresh token for session persistence. We do
          not use tracking or advertising cookies. See our{' '}
          <Link to="/cookies" className="text-letterboxd-green hover:underline">
            Cookie Policy
          </Link>{' '}
          for details.
        </Section>

        <Section title="7. Changes to This Policy">
          We may update this policy as the project evolves. We encourage you to review it
          periodically. Continued use of CinéConnect after changes constitutes acceptance of the
          updated policy.
        </Section>

        <Section title="8. Contact">
          For any privacy-related questions, please{' '}
          <Link to="/contact" className="text-letterboxd-green hover:underline">
            contact us
          </Link>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="text-text-primary mb-3 text-lg font-semibold">{title}</h2>
      <div className="text-text-secondary leading-relaxed">{children}</div>
    </section>
  );
}
