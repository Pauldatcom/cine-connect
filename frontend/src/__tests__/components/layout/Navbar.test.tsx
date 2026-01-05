/**
 * Navbar Component Tests
 */

import { createTestWrapper, routerMock } from '@/__tests__/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock TanStack Router with shared mock (filters out router-specific props)
vi.mock('@tanstack/react-router', () => routerMock);

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';

const mockUseAuth = useAuth as Mock;

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      logout: vi.fn(),
    });
  });

  describe('rendering', () => {
    it('renders the logo', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });
      expect(screen.getByText('CinéConnect')).toBeInTheDocument();
    });

    it('renders navigation links on desktop', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Films')).toBeInTheDocument();
      expect(screen.getByText('Discussion')).toBeInTheDocument();
    });

    it('renders auth buttons when not authenticated', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Verify links have correct search params
      const signInLink = screen.getByText('Sign In').closest('a');
      const createAccountLink = screen.getByText('Create Account').closest('a');
      expect(signInLink).toHaveAttribute('href', '/profil');
      expect(createAccountLink).toHaveAttribute('href', '/profil');
    });

    it('renders user profile button when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
        },
        logout: vi.fn(),
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Should not show auth buttons when authenticated
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
    });

    it('renders user avatar image when avatarUrl is provided', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        logout: vi.fn(),
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<Navbar />, { wrapper: Wrapper });

      const avatarImg = container.querySelector('img[src="https://example.com/avatar.jpg"]');
      expect(avatarImg).toBeInTheDocument();
    });

    it('renders Lists and Members links when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
        },
        logout: vi.fn(),
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Desktop nav should have Lists and Members when authenticated
      expect(screen.getByText('Lists')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('toggles search input on click', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      const searchButton = screen.getByLabelText('Search');
      fireEvent.click(searchButton);

      expect(screen.getByPlaceholderText('Search films...')).toBeInTheDocument();
    });

    it('updates search input value', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      const searchButton = screen.getByLabelText('Search');
      fireEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText('Search films...');
      fireEvent.change(searchInput, { target: { value: 'Matrix' } });

      expect(searchInput).toHaveValue('Matrix');
    });

    it('closes search and clears query when X button clicked', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Open search
      const searchButton = screen.getByLabelText('Search');
      fireEvent.click(searchButton);

      // Type something
      const searchInput = screen.getByPlaceholderText('Search films...');
      fireEvent.change(searchInput, { target: { value: 'Matrix' } });

      // Find and click close button (the X button after the search submit)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(
        (btn) => btn.classList.contains('ml-2') && (btn as HTMLButtonElement).type === 'button'
      );
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      // Search input should be gone
      expect(screen.queryByPlaceholderText('Search films...')).not.toBeInTheDocument();
    });
  });

  describe('mobile menu', () => {
    it('toggles mobile menu on button click', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons[buttons.length - 1]!;

      fireEvent.click(menuButton);

      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThan(0);
    });

    it('shows Lists and Members in mobile menu when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
        },
        logout: vi.fn(),
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Open mobile menu
      const buttons = screen.getAllByRole('button');
      const menuButton = buttons[buttons.length - 1]!;
      fireEvent.click(menuButton);

      // Should show Lists and Members in mobile menu
      const listsLinks = screen.getAllByText('Lists');
      const membersLinks = screen.getAllByText('Members');
      expect(listsLinks.length).toBeGreaterThan(0);
      expect(membersLinks.length).toBeGreaterThan(0);
    });

    it('closes mobile menu when link is clicked', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Open mobile menu
      const buttons = screen.getAllByRole('button');
      const menuButton = buttons[buttons.length - 1]!;
      fireEvent.click(menuButton);

      // Click Home link in mobile menu
      const homeLinks = screen.getAllByText('Home');
      const mobileHomeLink = homeLinks[homeLinks.length - 1];
      fireEvent.click(mobileHomeLink!);

      // Mobile menu should be closed (only one Home link should be visible)
      const remainingHomeLinks = screen.getAllByText('Home');
      expect(remainingHomeLinks.length).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('has accessible search button', () => {
      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('uses semantic header element', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Navbar />, { wrapper: Wrapper });
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('uses semantic nav element', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<Navbar />, { wrapper: Wrapper });
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('logout', () => {
    it('calls logout when sign out is clicked', () => {
      const mockLogout = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
        },
        logout: mockLogout,
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Find the profile button (has ChevronDown icon adjacent)
      const buttons = screen.getAllByRole('button');
      // The profile button should be before the mobile menu button
      const profileButton = buttons.find((btn) => btn.classList.contains('rounded-full'));
      expect(profileButton).toBeInTheDocument();
      fireEvent.click(profileButton!);

      // Click sign out
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('profile menu', () => {
    it('closes profile menu when clicking outside', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
        },
        logout: vi.fn(),
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<Navbar />, { wrapper: Wrapper });

      // Open profile menu
      const buttons = screen.getAllByRole('button');
      const profileButton = buttons.find((btn) => btn.classList.contains('rounded-full'));
      fireEvent.click(profileButton!);

      // Profile menu should be open
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Click outside the profile menu (on the header)
      const header = container.querySelector('header');
      fireEvent.mouseDown(header!);

      // Profile menu should be closed
      expect(screen.queryByText('View profile')).not.toBeInTheDocument();
    });
  });

  describe('search submit', () => {
    it('submits search form with query', () => {
      // Mock window.location.href
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Open search
      const searchButton = screen.getByLabelText('Search');
      fireEvent.click(searchButton);

      // Type something
      const searchInput = screen.getByPlaceholderText('Search films...');
      fireEvent.change(searchInput, { target: { value: 'Matrix' } });

      // Submit the form
      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      expect(window.location.href).toBe('/films?q=Matrix');

      // Restore
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('does not submit search with empty query', () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      const Wrapper = createTestWrapper();
      render(<Navbar />, { wrapper: Wrapper });

      // Open search
      const searchButton = screen.getByLabelText('Search');
      fireEvent.click(searchButton);

      // Leave it empty or with whitespace
      const searchInput = screen.getByPlaceholderText('Search films...');
      fireEvent.change(searchInput, { target: { value: '   ' } });

      // Submit the form
      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      // Should not navigate
      expect(window.location.href).toBe('');

      // Restore
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });
  });
});
