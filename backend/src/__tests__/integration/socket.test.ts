/**
 * Socket Handlers Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getOnlineUsers, isUserOnline, _testExports } from '@/socket';

const { isRateLimited, sanitizeContent, isValidRoomId, canAccessRoom, messageRateLimits } =
  _testExports;

// These are unit tests for the exported helper functions ; unit but in the folder integration why ????
// Full socket integration tests would require a test server setup
// To mutch information about how the real system work be carreful

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

describe('Socket Security Functions', () => {
  describe('sanitizeContent', () => {
    it('returns empty string for non-string input', () => {
      expect(sanitizeContent(null)).toBe('');
      expect(sanitizeContent(undefined)).toBe('');
      expect(sanitizeContent(123)).toBe('');
      expect(sanitizeContent({})).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitizeContent('  hello  ')).toBe('hello');
    });

    it('escapes HTML entities', () => {
      expect(sanitizeContent('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(sanitizeContent('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes single quotes', () => {
      expect(sanitizeContent("it's working")).toBe('it&#x27;s working');
    });

    it('truncates long messages to 2000 characters', () => {
      const longMessage = 'a'.repeat(3000);
      const result = sanitizeContent(longMessage);
      expect(result.length).toBe(2000);
    });

    it('returns normal text unchanged except for entities', () => {
      expect(sanitizeContent('Hello World')).toBe('Hello World');
    });
  });

  describe('isValidRoomId', () => {
    it('returns false for non-string input', () => {
      expect(isValidRoomId(null)).toBe(false);
      expect(isValidRoomId(undefined)).toBe(false);
      expect(isValidRoomId(123)).toBe(false);
    });

    it('accepts valid UUID format', () => {
      expect(isValidRoomId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('accepts valid conversation pattern (user1_user2)', () => {
      expect(
        isValidRoomId('550e8400-e29b-41d4-a716-446655440000_660e8400-e29b-41d4-a716-446655440001')
      ).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidRoomId('invalid')).toBe(false);
      expect(isValidRoomId('')).toBe(false);
      expect(isValidRoomId('room-123')).toBe(false);
    });
  });

  describe('canAccessRoom', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns true if userId is in roomId', () => {
      const roomId = `${userId}_other-user-id`;
      expect(canAccessRoom(userId, roomId)).toBe(true);
    });

    it('returns true if userId is second in roomId', () => {
      const roomId = `other-user-id_${userId}`;
      expect(canAccessRoom(userId, roomId)).toBe(true);
    });

    it('returns false if userId is not in roomId', () => {
      const roomId = 'user1_user2';
      expect(canAccessRoom(userId, roomId)).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    beforeEach(() => {
      // Clear rate limit map before each test
      messageRateLimits.clear();
    });

    it('returns false for first message', () => {
      expect(isRateLimited('new-user')).toBe(false);
    });

    it('returns false for few messages', () => {
      const userId = 'test-user';
      for (let i = 0; i < 5; i++) {
        expect(isRateLimited(userId)).toBe(false);
      }
    });

    it('returns true after exceeding limit', () => {
      const userId = 'spammer';
      // Send 20 messages (the limit)
      for (let i = 0; i < 20; i++) {
        isRateLimited(userId);
      }
      // 21st message should be rate limited
      expect(isRateLimited(userId)).toBe(true);
    });

    it('tracks different users separately', () => {
      // Fill up user1's limit
      for (let i = 0; i < 20; i++) {
        isRateLimited('user1');
      }
      // user1 is limited, but user2 is not
      expect(isRateLimited('user1')).toBe(true);
      expect(isRateLimited('user2')).toBe(false);
    });
  });
});
