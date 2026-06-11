import { createClient } from "@libsql/client/web";

type CacheRow = {
  value: string;
  updated_at: string;
};

const databaseUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const turso = createClient({
  url: databaseUrl,
  authToken: databaseUrl.startsWith("file:") ? undefined : authToken
});

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await turso.execute(`
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
  const result = await turso.execute({
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
  await turso.execute({
    sql: `
      INSERT INTO cache_entries (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    args: [key, JSON.stringify(value), updatedAt]
  });
  return updatedAt;
}
