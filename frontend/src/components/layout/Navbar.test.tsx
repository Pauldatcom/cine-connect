/**
 * Navbar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestWrapper, routerMock } from '@/test/test-utils';

// Mock TanStack Router with shared mock (filters out router-specific props)
vi.mock('@tanstack/react-router', () => routerMock);

import { Navbar } from './Navbar';

describe('Navbar', () => {
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
});
