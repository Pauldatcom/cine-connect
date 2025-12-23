/**
 * Utility Functions Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatRelativeTime, debounce } from './utils';

describe('cn (className merge)', () => {
  it('merges class names', () => {
    const result = cn('class1', 'class2');

    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isInactive = false;
    const result = cn('base', isActive && 'active', isInactive && 'inactive');

    expect(result).toBe('base active');
  });

  it('handles arrays', () => {
    const result = cn(['class1', 'class2']);

    expect(result).toBe('class1 class2');
  });

  it('handles objects', () => {
    const result = cn({ active: true, inactive: false });

    expect(result).toBe('active');
  });

  it('merges conflicting Tailwind classes', () => {
    const result = cn('p-4', 'p-6');

    // tailwind-merge should keep the last one
    expect(result).toBe('p-6');
  });

  it('handles undefined and null', () => {
    const result = cn('class1', undefined, null, 'class2');

    expect(result).toBe('class1 class2');
  });

  it('handles empty strings', () => {
    const result = cn('', 'class1', '', 'class2');

    expect(result).toBe('class1 class2');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent times', () => {
    const date = new Date('2024-01-15T11:59:30Z');

    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes for times within an hour', () => {
    const date = new Date('2024-01-15T11:45:00Z');

    expect(formatRelativeTime(date)).toBe('15 min ago');
  });

  it('returns hours for times within a day', () => {
    const date = new Date('2024-01-15T09:00:00Z');

    expect(formatRelativeTime(date)).toBe('3 hours ago');
  });

  it('returns days for times within a week', () => {
    const date = new Date('2024-01-13T12:00:00Z');

    expect(formatRelativeTime(date)).toBe('2 days ago');
  });

  it('returns formatted date for older times', () => {
    const date = new Date('2024-01-01T12:00:00Z');

    const result = formatRelativeTime(date);
    // Should return locale date string
    expect(result).toContain('2024');
  });

  it('handles string dates', () => {
    const result = formatRelativeTime('2024-01-15T11:55:00Z');

    expect(result).toBe('5 min ago');
  });

  it('handles Date objects', () => {
    const date = new Date('2024-01-15T11:00:00Z');

    expect(formatRelativeTime(date)).toBe('1 hours ago');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('cancels previous calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(50);

    debouncedFn('second');
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('handles multiple rapid calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    for (let i = 0; i < 10; i++) {
      debouncedFn(i);
    }

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(9);
  });

  it('allows calls after delay', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(100);

    debouncedFn('second');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });
});
