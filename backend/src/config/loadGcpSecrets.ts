/**
 * On Cloud Run (or when LOAD_GCP_SECRETS=true), read secrets from Google Secret Manager into
 * process.env before config/env.ts runs validateEnv().
 *
 * GCP naming in this project (see Secret Manager console):
 * - Env-specific: STEM_PROD | STEM_DEV (e.g. DATA_BASE_URL_PROD, MAILGUN_API_KEY_DEV).
 * - Shared (no suffix): FRONTEND_URL, GOOGLE_CLIENT_ID, MAILGUN_DOMAIN, MAILGUN_API_BASE, …
 *
 * GCP_SECRET_ENV=prod|dev picks PROD vs DEV for suffixed secrets (default prod).
 * LOAD_GCP_SECRETS=false skips SM (local). K_SERVICE (Cloud Run) enables loading unless overridden.
 *
 * IAM: runtime service account needs secretmanager.secretAccessor on these secrets.
 */

type SecretManagerClient = import('@google-cloud/secret-manager').SecretManagerServiceClient;

interface SecretSpec {
  envKey: string;
  /** If set, try `${stem}_${PROD|DEV}` for each stem in order. */
  suffixedStems?: readonly string[];
  /** Exact GCP secret ids (no env suffix), tried after suffixed candidates. */
  plainSecretIds?: readonly string[];
  /** Missing secret throws when true (only for DATABASE_URL + JWT_SECRET in prod SM). */
  required: boolean;
}

/** How each process.env key maps to GCP secret ids (order = try order). Matches Cine Connect Secret Manager. */
const SECRET_SPECS: readonly SecretSpec[] = [
  // Required — DB uses DATA_BASE_URL_* in GCP; DATABASE_URL_* kept as fallback stem.
  { envKey: 'DATABASE_URL', required: true, suffixedStems: ['DATA_BASE_URL', 'DATABASE_URL'] },
  { envKey: 'JWT_SECRET', required: true, suffixedStems: ['JWT_SECRET'] },

  { envKey: 'MAILGUN_API_KEY', required: false, suffixedStems: ['MAILGUN_API_KEY'] },
  // Suffixed first, then unsuffixed TMDB_API_KEY if present (shared key).
  {
    envKey: 'TMDB_API_KEY',
    required: false,
    suffixedStems: ['TMDB_API_KEY'],
    plainSecretIds: ['TMDB_API_KEY'],
  },

  { envKey: 'MAILGUN_API_BASE', required: false, plainSecretIds: ['MAILGUN_API_BASE'] },
  { envKey: 'MAILGUN_DOMAIN', required: false, plainSecretIds: ['MAILGUN_DOMAIN'] },
  { envKey: 'MAILGUN_FROM', required: false, plainSecretIds: ['MAILGUN_FROM'] },

  { envKey: 'GOOGLE_CLIENT_ID', required: false, plainSecretIds: ['GOOGLE_CLIENT_ID'] },
  { envKey: 'GOOGLE_CLIENT_SECRET', required: false, plainSecretIds: ['GOOGLE_CLIENT_SECRET'] },
  { envKey: 'GOOGLE_CALLBACK_URL', required: false, plainSecretIds: ['GOOGLE_CALLBACK_URL'] },

  { envKey: 'FRONTEND_URL', required: false, plainSecretIds: ['FRONTEND_URL'] },

  // Optional if you add them in SM later
  {
    envKey: 'API_PUBLIC_URL',
    required: false,
    suffixedStems: ['API_PUBLIC_URL'],
    plainSecretIds: ['API_PUBLIC_URL'],
  },
  {
    envKey: 'JWT_EXPIRES_IN',
    required: false,
    suffixedStems: ['JWT_EXPIRES_IN'],
    plainSecretIds: ['JWT_EXPIRES_IN'],
  },
  {
    envKey: 'JWT_REFRESH_EXPIRES_IN',
    required: false,
    suffixedStems: ['JWT_REFRESH_EXPIRES_IN'],
    plainSecretIds: ['JWT_REFRESH_EXPIRES_IN'],
  },
];

function shouldLoadFromGcp(): boolean {
  if (process.env.LOAD_GCP_SECRETS === 'true') return true;
  if (process.env.LOAD_GCP_SECRETS === 'false') return false;
  return Boolean(process.env.K_SERVICE);
}

function projectId(): string {
  const id = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!id?.trim()) {
    throw new Error(
      'GCP Secret Manager: set GOOGLE_CLOUD_PROJECT (Cloud Run sets this automatically) or disable with LOAD_GCP_SECRETS=false'
    );
  }
  return id.trim();
}

function suffix(): 'PROD' | 'DEV' {
  const raw = (process.env.GCP_SECRET_ENV || 'prod').toLowerCase();
  if (raw === 'dev') return 'DEV';
  return 'PROD';
}

function isNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('NOT_FOUND') ||
    msg.includes('not found') ||
    (typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: number }).code === 5)
  );
}

async function accessSecret(
  client: SecretManagerClient,
  project: string,
  secretId: string
): Promise<string | null> {
  const name = `projects/${project}/secrets/${secretId}/versions/latest`;
  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data;
    const raw =
      typeof payload === 'string' ? payload : payload ? Buffer.from(payload).toString('utf8') : '';
    const trimmed = raw.trim();
    return trimmed || null;
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      return null;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[config] Secret Manager: failed to read ${secretId}:`, msg);
    throw err;
  }
}

async function resolveSpec(
  client: SecretManagerClient,
  project: string,
  sfx: 'PROD' | 'DEV',
  spec: SecretSpec
): Promise<{ value: string; secretId: string } | null> {
  const stems = spec.suffixedStems ?? [];
  for (const stem of stems) {
    const secretId = `${stem}_${sfx}`;
    const value = await accessSecret(client, project, secretId);
    if (value) {
      return { value, secretId };
    }
  }

  const plainIds = spec.plainSecretIds ?? [];
  for (const secretId of plainIds) {
    const value = await accessSecret(client, project, secretId);
    if (value) {
      return { value, secretId };
    }
  }

  return null;
}

export async function loadGcpSecretsIfNeeded(): Promise<void> {
  if (!shouldLoadFromGcp()) {
    return;
  }

  const project = projectId();
  const sfx = suffix();

  const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();

  for (const spec of SECRET_SPECS) {
    const { envKey, required } = spec;
    if (process.env[envKey]?.trim()) {
      continue;
    }

    const resolved = await resolveSpec(client, project, sfx, spec);
    if (resolved) {
      process.env[envKey] = resolved.value;
      const primarySuffixed = spec.suffixedStems?.length ? `${spec.suffixedStems[0]}_${sfx}` : null;
      if (primarySuffixed && resolved.secretId !== primarySuffixed) {
        console.info(`[config] Secret Manager: ${resolved.secretId} → process.env.${envKey}`);
      }
      continue;
    }

    if (required) {
      const parts: string[] = [];
      if (spec.suffixedStems?.length) {
        parts.push(...spec.suffixedStems.map((s) => `${s}_${sfx}`));
      }
      if (spec.plainSecretIds?.length) {
        parts.push(...spec.plainSecretIds);
      }
      const tried = parts.join(', ');
      console.error(
        `[config] Secret Manager: missing secret for required ${envKey} (tried: ${tried})`
      );
      throw new Error(`Missing Secret Manager secret for ${envKey}; tried: ${tried}`);
    }
  }
}
