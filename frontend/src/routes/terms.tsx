import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-text-primary mb-2 text-4xl font-bold">Terms of Use</h1>
      <p className="text-text-tertiary mb-10 text-sm">Last updated: March 2026</p>

      <div className="space-y-8">
        <Section title="1. Acceptance of Terms">
          By accessing or using CinéConnect, you agree to be bound by these Terms of Use. If you do
          not agree, please do not use the service. CinéConnect is a student project developed for
          educational purposes by Paul Compagnon and Franck YAPI.
        </Section>

        <Section title="2. Description of Service">
          CinéConnect is a social platform for film enthusiasts. It allows users to track films,
          write reviews, manage a watchlist, and connect with other users. Film data is provided by
          the OMDB API and The Movie Database (TMDb). CinéConnect is not affiliated with either
          service.
        </Section>

        <Section title="3. User Accounts">
          You must provide accurate information when creating an account. You are responsible for
          maintaining the security of your account credentials. You may not share your account or
          use another person&apos;s account without permission. We reserve the right to suspend or
          terminate accounts that violate these terms.
        </Section>

        <Section title="4. User Content">
          By posting reviews or other content on CinéConnect, you grant us a non-exclusive,
          royalty-free license to display that content within the platform. You are solely
          responsible for content you post. Content that is offensive, defamatory, or illegal is
          prohibited and may be removed without notice.
        </Section>

        <Section title="5. Intellectual Property">
          Film data, posters, and metadata displayed on CinéConnect are sourced from OMDB and TMDb
          and remain the property of their respective rights holders. The CinéConnect interface,
          logo, and original code are the property of the project authors.
        </Section>

        <Section title="6. Limitation of Liability">
          CinéConnect is provided &quot;as is&quot; without warranties of any kind. As a student
          project, the service may be unavailable at times or contain errors. The authors are not
          liable for any damages arising from the use of or inability to use the service.
        </Section>

        <Section title="7. Changes to Terms">
          We may update these terms from time to time. Continued use of CinéConnect after changes
          constitutes acceptance of the updated terms.
        </Section>

        <Section title="8. Contact">
          For questions about these terms, please{' '}
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
      <p className="text-text-secondary leading-relaxed">{children}</p>
    </section>
  );
}
