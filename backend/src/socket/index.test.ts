/**
 * Socket Handlers Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { getOnlineUsers, isUserOnline } from './index.js';

// These are unit tests for the exported helper functions
// Full socket integration tests would require a test server setup

describe('Socket Helper Functions', () => {
  describe('getOnlineUsers', () => {
    it('returns an array', () => {
      const users = getOnlineUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('returns unique users', () => {
      const users = getOnlineUsers();
      const uniqueUsers = [...new Set(users)];
      expect(users.length).toBe(uniqueUsers.length);
    });
  });

  describe('isUserOnline', () => {
    it('returns false for non-connected user', () => {
      const online = isUserOnline('random-user-id-12345');
      expect(online).toBe(false);
    });

    it('returns a boolean value', () => {
      const result = isUserOnline('any-user');
      expect(typeof result).toBe('boolean');
    });
  });
});
