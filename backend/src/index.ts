/**
 * Entry: .env then optional GCP Secret Manager, then HTTP server.
 * Secret loading MUST run before any module imports ./config/env.js (validateEnv).
 */

import 'reflect-metadata';
import { config } from 'dotenv';

config();

import { loadGcpSecretsIfNeeded } from './config/loadGcpSecrets.js';

await loadGcpSecretsIfNeeded();

await import('./server.js');
