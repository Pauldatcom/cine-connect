/**
 * FilterPanel Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestWrapper } from '@/__tests__/test-utils';
import { FilterPanel, defaultFilters } from '@/components/ui/FilterPanel';

// Mock genres API
vi.mock('@/lib/api/tmdb', async () => {
  const actual = await vi.importActual('@/lib/api/tmdb');
  return {
    ...actual,
    getGenres: vi.fn().mockResolvedValue({
      genres: [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
        { id: 18, name: 'Drama' },
      ],
    }),
  };
});

describe('FilterPanel', () => {
  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    onReset: vi.fn(),
  };

  describe('rendering', () => {
    it('renders filter header', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('starts collapsed', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Sort by should not be visible when collapsed
      expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('expands on header click', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('collapses on second header click', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!); // Expand
      fireEvent.click(header!); // Collapse

      expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
    });
  });

  describe('sort options', () => {
    it('renders sort dropdown when expanded', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('calls onFiltersChange when sort changes', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'vote_average.desc' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'vote_average.desc' })
      );
    });
  });

  describe('decade filter', () => {
    it('renders decade buttons when expanded', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.getByText('2020s')).toBeInTheDocument();
      expect(screen.getByText('2010s')).toBeInTheDocument();
      expect(screen.getByText('1990s')).toBeInTheDocument();
    });

    it('calls onFiltersChange when decade selected', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const decade2020 = screen.getByText('2020s');
      fireEvent.click(decade2020);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ decade: 2020, yearFrom: 2020, yearTo: 2029 })
      );
    });

    it('clears decade when All is selected', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, decade: 2020, yearFrom: 2020, yearTo: 2029 }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ decade: undefined, yearFrom: undefined, yearTo: undefined })
      );
    });
  });

  describe('rating filter', () => {
    it('renders rating buttons when expanded', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.getByText('Any')).toBeInTheDocument();
      expect(screen.getByText('7+')).toBeInTheDocument();
      expect(screen.getByText('8+')).toBeInTheDocument();
    });

    it('calls onFiltersChange when rating selected', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const rating8 = screen.getByText('8+');
      fireEvent.click(rating8);

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ ratingMin: 8 }));
    });
  });

  describe('clear button', () => {
    it('renders clear button when expanded', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls onReset when clear clicked', () => {
      const onReset = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onReset={onReset}
            filters={{ ...defaultFilters, ratingMin: 7 }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      expect(onReset).toHaveBeenCalled();
    });

    it('is disabled when no active filters', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const clearButton = screen.getByText('Clear All').closest('button');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('active filter count', () => {
    it('shows badge when filters are active', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} filters={{ ...defaultFilters, ratingMin: 7 }} />
        </Wrapper>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('counts multiple genres', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} filters={{ ...defaultFilters, genres: [28, 35] }} />
        </Wrapper>
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('collapsed filter tags', () => {
    it('shows genre tags when collapsed and genres are active', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} filters={{ ...defaultFilters, genres: [28] }} />
        </Wrapper>
      );

      // Wait for genres to load and display
      await screen.findByText('Action');
    });

    it('removes genre when clicking X on genre tag', async () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, genres: [28] }}
          />
        </Wrapper>
      );

      // Wait for genres to load
      const actionTag = await screen.findByText('Action');
      const closeButton = actionTag.parentElement?.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ genres: [] }));
    });

    it('shows decade tag when collapsed and decade is active', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            filters={{ ...defaultFilters, decade: 2020, yearFrom: 2020, yearTo: 2029 }}
          />
        </Wrapper>
      );

      expect(screen.getByText('2020s')).toBeInTheDocument();
    });

    it('removes decade when clicking X on decade tag', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, decade: 2020, yearFrom: 2020, yearTo: 2029 }}
          />
        </Wrapper>
      );

      const decadeTag = screen.getByText('2020s');
      const closeButton = decadeTag.parentElement?.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ decade: undefined, yearFrom: undefined, yearTo: undefined })
      );
    });

    it('shows rating tag when collapsed and rating is active', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} filters={{ ...defaultFilters, ratingMin: 7 }} />
        </Wrapper>
      );

      expect(screen.getByText('7+ rating')).toBeInTheDocument();
    });

    it('removes rating when clicking X on rating tag', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, ratingMin: 7 }}
          />
        </Wrapper>
      );

      const ratingTag = screen.getByText('7+ rating');
      const closeButton = ratingTag.parentElement?.querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ ratingMin: undefined })
      );
    });
  });

  describe('defaultFilters', () => {
    it('has correct default values', () => {
      expect(defaultFilters.genres).toEqual([]);
      expect(defaultFilters.sortBy).toBe('popularity.desc');
      expect(defaultFilters.decade).toBeUndefined();
      expect(defaultFilters.ratingMin).toBeUndefined();
    });
  });

  describe('year range', () => {
    it('shows year range inputs when no decade is selected', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
    });

    it('hides year range inputs when decade is selected', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            filters={{ ...defaultFilters, decade: 2020, yearFrom: 2020, yearTo: 2029 }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      expect(screen.queryByPlaceholderText('From')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('To')).not.toBeInTheDocument();
    });

    it('calls onFiltersChange when yearFrom is set', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const fromInput = screen.getByPlaceholderText('From');
      fireEvent.change(fromInput, { target: { value: '2000' } });

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ yearFrom: 2000 }));
    });

    it('calls onFiltersChange when yearTo is set', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const toInput = screen.getByPlaceholderText('To');
      fireEvent.change(toInput, { target: { value: '2010' } });

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ yearTo: 2010 }));
    });

    it('clears yearFrom when input is emptied', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, yearFrom: 2000 }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const fromInput = screen.getByPlaceholderText('From');
      fireEvent.change(fromInput, { target: { value: '' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ yearFrom: undefined })
      );
    });

    it('clears yearTo when input is emptied', () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, yearTo: 2010 }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      const toInput = screen.getByPlaceholderText('To');
      fireEvent.change(toInput, { target: { value: '' } });

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ yearTo: undefined }));
    });
  });

  describe('genre toggle', () => {
    it('toggles genre on and off', async () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} onFiltersChange={onFiltersChange} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      // Wait for genres to load
      const actionButton = await screen.findByText('Action');
      fireEvent.click(actionButton);

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ genres: [28] }));
    });

    it('removes genre when clicking active genre button', async () => {
      const onFiltersChange = vi.fn();
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel
            {...defaultProps}
            onFiltersChange={onFiltersChange}
            filters={{ ...defaultFilters, genres: [28] }}
          />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      // Wait for genres to load and click the active genre to toggle off
      const actionButton = await screen.findByText('Action');
      fireEvent.click(actionButton);

      expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ genres: [] }));
    });

    it('shows active genre with correct styling', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <FilterPanel {...defaultProps} filters={{ ...defaultFilters, genres: [28] }} />
        </Wrapper>
      );

      // Expand
      const header = screen.getByText('Filters').closest('button');
      fireEvent.click(header!);

      // Wait for genres to load - active genre should have green background
      const actionButton = await screen.findByText('Action');
      expect(actionButton).toHaveClass('bg-letterboxd-green');
    });
  });
});
