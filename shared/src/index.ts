/**
 * CinéConnect Shared Package
 * Contains types, constants, and utilities shared between frontend and backend
 */

// Use explicit /index.js paths — Node ESM does not resolve directory imports like `./types`.
export * from './types/index.js';
export * from './constants/index.js';
