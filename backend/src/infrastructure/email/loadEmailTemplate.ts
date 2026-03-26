/**
 * Load UTF-8 templates from ./templates next to this module (works in dev + prod if templates are copied to dist).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const templatesDir = join(dirname(fileURLToPath(import.meta.url)), 'templates');

export function loadEmailTemplate(filename: string): string {
  return readFileSync(join(templatesDir, filename), 'utf8');
}
