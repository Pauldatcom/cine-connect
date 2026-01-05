/**
 * Footer Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTestWrapper } from '@/__tests__/test-utils';

// Mock TanStack Router - spread props to preserve className
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  describe('rendering', () => {
    it('renders the logo and brand name', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });
      expect(screen.getByText('CinéConnect')).toBeInTheDocument();
    });

    it('renders the tagline', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });
      expect(screen.getByText(/Track films you've watched/)).toBeInTheDocument();
    });

    it('renders explore links', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });

      expect(screen.getByText('Films')).toBeInTheDocument();
      expect(screen.getByText('Lists')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Discussion')).toBeInTheDocument();
    });

    it('renders resources links', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });

      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('renders legal links', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });

      expect(screen.getByText('Terms of Use')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    });

    it('renders copyright notice', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });
      expect(screen.getByText(/© 2024 CinéConnect/)).toBeInTheDocument();
    });

    it('renders TMDb attribution', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });
      expect(screen.getByText('TMDb')).toBeInTheDocument();
    });
  });

  describe('social links', () => {
    it('renders social media links', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Footer />, { wrapper: Wrapper });
      const socialLinks = container.querySelectorAll('a[href="#"]');
      expect(socialLinks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('accessibility', () => {
    it('uses semantic footer element', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Footer />, { wrapper: Wrapper });
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('has section headings', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });

      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('TMDb link opens in new tab', () => {
      const Wrapper = createTestWrapper();
      render(<Footer />, { wrapper: Wrapper });

      const tmdbLink = screen.getByText('TMDb').closest('a');
      expect(tmdbLink).toHaveAttribute('target', '_blank');
      expect(tmdbLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('structure', () => {
    it('has grid layout', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Footer />, { wrapper: Wrapper });
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('has border top', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Footer />, { wrapper: Wrapper });
      expect(container.querySelector('.border-t')).toBeInTheDocument();
    });
  });
});
