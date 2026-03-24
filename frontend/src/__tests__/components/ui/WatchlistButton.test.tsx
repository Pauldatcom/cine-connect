/**
 * WatchlistButton Component Tests
 */

import { WatchlistButton } from '@/components/ui/WatchlistButton';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToggleWatchlist = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useWatchlist', () => ({
  useIsInWatchlist: vi.fn(),
  useToggleWatchlist: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { useIsInWatchlist, useToggleWatchlist } from '@/hooks/useWatchlist';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseIsInWatchlist = useIsInWatchlist as ReturnType<typeof vi.fn>;
const mockUseToggleWatchlist = useToggleWatchlist as ReturnType<typeof vi.fn>;

const FILM_ID = '11111111-1111-1111-1111-111111111111';

describe('WatchlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: false,
    });
    mockUseToggleWatchlist.mockReturnValue({
      toggleWatchlist: mockToggleWatchlist,
      isLoading: false,
    });
  });

  it('returns null when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { container } = render(<WatchlistButton filmId={FILM_ID} />);

    expect(container.firstChild).toBeNull();
    expect(mockUseIsInWatchlist).toHaveBeenCalledWith(undefined);
  });

  it('calls useIsInWatchlist with filmId when authenticated', () => {
    render(<WatchlistButton filmId={FILM_ID} />);

    expect(mockUseIsInWatchlist).toHaveBeenCalledWith(FILM_ID);
  });

  it('renders "Add to Watchlist" when not in watchlist (variant button)', () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: false,
    });

    render(<WatchlistButton filmId={FILM_ID} variant="button" />);

    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeInTheDocument();
    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
  });

  it('renders "In Watchlist" when in watchlist (variant button)', () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: true },
      isLoading: false,
    });

    render(<WatchlistButton filmId={FILM_ID} variant="button" />);

    expect(screen.getByRole('button', { name: /in watchlist/i })).toBeInTheDocument();
    expect(screen.getByText('In Watchlist')).toBeInTheDocument();
  });

  it('renders icon variant with title "Add to Watchlist" when not in watchlist', () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: false,
    });

    render(<WatchlistButton filmId={FILM_ID} variant="icon" />);

    const btn = screen.getByRole('button', { name: /add to watchlist/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Add to Watchlist');
  });

  it('renders icon variant with title "Remove from Watchlist" when in watchlist', () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: true },
      isLoading: false,
    });

    render(<WatchlistButton filmId={FILM_ID} variant="icon" />);

    const btn = screen.getByRole('button', { name: /remove from watchlist/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Remove from Watchlist');
  });

  it('calls toggleWatchlist with filmId and isInWatchlist on click', async () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: false,
    });
    mockToggleWatchlist.mockResolvedValue(undefined);

    render(<WatchlistButton filmId={FILM_ID} />);

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /add to watchlist/i });
    await user.click(button);

    expect(mockToggleWatchlist).toHaveBeenCalledTimes(1);
    expect(mockToggleWatchlist).toHaveBeenCalledWith(FILM_ID, false);
  });

  it('calls toggleWatchlist with filmId and true when removing from watchlist', async () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: true },
      isLoading: false,
    });
    mockToggleWatchlist.mockResolvedValue(undefined);

    render(<WatchlistButton filmId={FILM_ID} />);

    const user = userEvent.setup();
    // variant=button shows "In Watchlist" as text, not "Remove from Watchlist"
    const button = screen.getByRole('button', { name: /in watchlist/i });
    await user.click(button);

    expect(mockToggleWatchlist).toHaveBeenCalledWith(FILM_ID, true);
  });

  it('disables button when isLoading (checking or toggling)', () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: true,
    });

    render(<WatchlistButton filmId={FILM_ID} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when isToggling', () => {
    mockUseToggleWatchlist.mockReturnValue({
      toggleWatchlist: mockToggleWatchlist,
      isLoading: true,
    });

    render(<WatchlistButton filmId={FILM_ID} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call toggleWatchlist when clicking while loading', async () => {
    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
      isLoading: true,
    });

    render(<WatchlistButton filmId={FILM_ID} />);

    const user = userEvent.setup();
    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockToggleWatchlist).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<WatchlistButton filmId={FILM_ID} className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
