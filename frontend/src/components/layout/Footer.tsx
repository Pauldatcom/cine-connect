import { Link } from '@tanstack/react-router';
import { Film, Github, Twitter, Instagram } from 'lucide-react';

/**
 * Footer Component - Letterboxd style
 */
export function Footer() {
  return (
    <footer className="border-border bg-bg-nav mt-auto border-t">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="group flex items-center gap-2">
              <div className="bg-letterboxd-green group-hover:bg-letterboxd-green-dark flex h-10 w-10 items-center justify-center rounded transition-colors">
                <Film className="text-bg-primary h-5 w-5" />
              </div>
              <span className="font-display text-text-primary text-xl font-bold">CinéConnect</span>
            </Link>
            <p className="text-text-secondary mt-4 text-sm leading-relaxed">
              Track films you&apos;ve watched. Save those you want to see. Tell your friends
              what&apos;s good.
            </p>
            {/* Social links */}
            <div className="mt-6 flex gap-4">
              <a
                href="#"
                className="text-text-tertiary hover:text-letterboxd-green transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-text-tertiary hover:text-letterboxd-green transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-text-tertiary hover:text-letterboxd-green transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-text-primary mb-4 text-xs font-semibold uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/films">Films</FooterLink>
              <FooterLink to="/lists">Lists</FooterLink>
              <FooterLink to="/members">Members</FooterLink>
              <FooterLink to="/discussion">Discussion</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-text-primary mb-4 text-xs font-semibold uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/help">Help</FooterLink>
              <FooterLink to="/api-docs">API</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary mb-4 text-xs font-semibold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/terms">Terms of Use</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/cookies">Cookie Policy</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-border border-t py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-text-tertiary text-center text-sm md:text-left">
            © 2024 CinéConnect. Made with 🎬 for film lovers.
          </p>
          <p className="text-text-tertiary text-sm">
            Film data from{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-letterboxd-blue hover:underline"
            >
              TMDb
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-text-secondary hover:text-letterboxd-green text-sm transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
