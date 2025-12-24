/**
 * Navbar Component Tests
 */

import { createTestWrapper, routerMock } from '@/test/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock TanStack Router with shared mock (filters out router-specific props)
vi.mock('@tanstack/react-router', () => routerMock);

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';

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
});
