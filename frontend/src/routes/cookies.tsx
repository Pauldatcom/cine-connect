import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
});

const COOKIES = [
  {
    name: 'refresh_token',
    purpose: 'Authentication',
    duration: '7 days',
    type: 'HttpOnly',
    desc: 'Stores your session refresh token to keep you logged in. Cannot be read by JavaScript.',
  },
];

export function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-text-primary mb-2 text-4xl font-bold">Cookie Policy</h1>
      <p className="text-text-tertiary mb-10 text-sm">Last updated: March 2026</p>

      <div className="space-y-8">
        <section className="card">
          <h2 className="text-text-primary mb-3 text-lg font-semibold">What are cookies?</h2>
          <p className="text-text-secondary leading-relaxed">
            Cookies are small text files stored on your device by your browser. CinéConnect uses
            cookies only for authentication — we do not use advertising, tracking, or analytics
            cookies.
          </p>
        </section>

        <section className="card">
          <h2 className="text-text-primary mb-4 text-lg font-semibold">Cookies we use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-text-tertiary pb-3 text-left font-medium">Name</th>
                  <th className="text-text-tertiary pb-3 text-left font-medium">Purpose</th>
                  <th className="text-text-tertiary pb-3 text-left font-medium">Duration</th>
                  <th className="text-text-tertiary pb-3 text-left font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-border border-b last:border-0">
                    <td className="text-text-primary py-3 font-mono">{c.name}</td>
                    <td className="text-text-secondary py-3">{c.purpose}</td>
                    <td className="text-text-secondary py-3">{c.duration}</td>
                    <td className="py-3">
                      <span className="rounded bg-green-400/10 px-2 py-0.5 text-xs text-green-400">
                        {c.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-text-tertiary mt-4 text-sm">{COOKIES[0]?.desc}</p>
        </section>

        <section className="card">
          <h2 className="text-text-primary mb-3 text-lg font-semibold">Cookies we do NOT use</h2>
          <ul className="text-text-secondary space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-red-400">✕</span>
              <span>Advertising or tracking cookies (Google Ads, Facebook Pixel, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-red-400">✕</span>
              <span>Analytics cookies (Google Analytics, Hotjar, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-red-400">✕</span>
              <span>Third-party social media cookies</span>
            </li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-text-primary mb-3 text-lg font-semibold">Managing cookies</h2>
          <p className="text-text-secondary leading-relaxed">
            You can disable cookies in your browser settings. However, disabling the{' '}
            <code className="bg-bg-tertiary rounded px-1">refresh_token</code> cookie will prevent
            you from staying logged in between sessions. You can clear your session at any time by
            clicking &quot;Sign Out&quot; on your{' '}
            <Link to="/profil" className="text-letterboxd-green hover:underline">
              profile page
            </Link>
            .
          </p>
        </section>

        <section className="card">
          <h2 className="text-text-primary mb-3 text-lg font-semibold">Contact</h2>
          <p className="text-text-secondary leading-relaxed">
            Questions about our cookie usage?{' '}
            <Link to="/contact" className="text-letterboxd-green hover:underline">
              Contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
