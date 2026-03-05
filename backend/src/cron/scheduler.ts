/**
 * In-process scheduler for periodic tasks (sync films, chat-bot).
 * Only active when ENABLE_CRON=true.
 * See docs/CRON.md for system cron alternative.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import cron from 'node-cron';

import { logger } from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_SYNC_SCHEDULE = '0 3 * * *'; // 3:00 AM daily
const DEFAULT_CHAT_BOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Spawn a script from dist/scripts and log outcome.
 * When running from dist/index.js, __dirname is dist/, so scripts live in dist/scripts/.
 */
function runScript(scriptName: string, args: string[] = []): void {
  const scriptPath = join(__dirname, 'scripts', `${scriptName}.js`);
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('close', (code) => {
    if (code === 0) {
      logger.info(`[Cron] ${scriptName} finished successfully`);
    } else {
      logger.error(`[Cron] ${scriptName} exited with code ${code}`, undefined, {
        stderr: stderr || undefined,
      });
    }
  });
}

/**
 * Start scheduled tasks when ENABLE_CRON is true.
 * Call once at server startup.
 */
export function startScheduler(): void {
  if (process.env.ENABLE_CRON !== 'true') {
    return;
  }

  const syncSchedule = process.env.CRON_SYNC_FILMS_SCHEDULE ?? DEFAULT_SYNC_SCHEDULE;
  const chatBotIntervalMs =
    parseInt(process.env.CRON_CHAT_BOT_INTERVAL_MS ?? String(DEFAULT_CHAT_BOT_INTERVAL_MS), 10) ||
    DEFAULT_CHAT_BOT_INTERVAL_MS;

  if (cron.validate(syncSchedule)) {
    cron.schedule(syncSchedule, () => {
      runScript('sync-films-from-tmdb', ['--recent']);
    });
    logger.info(`[Cron] Sync films (recent) scheduled: ${syncSchedule}`);
  }

  setInterval(() => {
    runScript('chat-bot-worker', ['--once']);
  }, chatBotIntervalMs);
  logger.info(`[Cron] Chat-bot interval: ${chatBotIntervalMs / 1000}s`);
}
