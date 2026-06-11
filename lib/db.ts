import { createClient } from "@tursodatabase/serverless/compat";

// Create the Turso client lazily. Next.js imports route files during `next build`
// to collect metadata, but Cloudflare secrets are runtime values. Creating the
// client at module import time makes the build try to use a fallback file: URL,
// which the Cloudflare/serverless Turso driver does not support.
type TursoClient = ReturnType<typeof createClient>;

type CacheRow = {
  value: string;
  updated_at: string;
};

let tursoClient: TursoClient | null = null;
let schemaReady = false;

function getDatabaseConfig() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL. Add it in Cloudflare Workers → Settings → Variables and Secrets.");
  }

  if (url.startsWith("file:")) {
    throw new Error("TURSO_DATABASE_URL cannot be a file: URL on Cloudflare. Use your remote Turso URL, for example libsql://your-db.turso.io.");
  }

  return { url, authToken: authToken || undefined };
}

function getTurso() {
  if (!tursoClient) {
    const { url, authToken } = getDatabaseConfig();
    tursoClient = createClient({ url, authToken });
  }
  return tursoClient;
}

export async function ensureSchema() {
  if (schemaReady) return;
  await getTurso().execute(`
    CREATE TABLE IF NOT EXISTS cache_entries (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  schemaReady = true;
}

export async function getCache<T>(key: string): Promise<{ value: T; updatedAt: string } | null> {
  await ensureSchema();
  const result = await getTurso().execute({
    sql: "SELECT value, updated_at FROM cache_entries WHERE key = ? LIMIT 1",
    args: [key]
  });
  const row = result.rows[0] as unknown as CacheRow | undefined;
  if (!row) return null;
  try {
    return { value: JSON.parse(row.value) as T, updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T) {
  await ensureSchema();
  const updatedAt = new Date().toISOString();

  // JSON.stringify(undefined) returns undefined, which violates the NOT NULL
  // constraint in Turso. Store JSON null instead of letting SQLite receive NULL.
  const serializedValue = JSON.stringify(value ?? null) ?? "null";

  await getTurso().execute({
    sql: `
      INSERT INTO cache_entries (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    args: [key, serializedValue, updatedAt]
  });
  return updatedAt;
}
