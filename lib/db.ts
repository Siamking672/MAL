// Tiny Turso SQL-over-HTTP client for Cloudflare Workers.
// This avoids @libsql/client / @tursodatabase/serverless bundling and bind-arg issues in OpenNext.

type CacheRow = {
  value: string;
  updated_at: string;
};

type HranaValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: string }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

type HranaResult = {
  cols?: Array<{ name: string }>;
  rows?: HranaValue[][];
};

let schemaReady = false;

function getDatabaseConfig() {
  const rawUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!rawUrl) {
    throw new Error("Missing TURSO_DATABASE_URL. Add it in Cloudflare Workers → Settings → Variables and Secrets.");
  }

  if (!authToken) {
    throw new Error("Missing TURSO_AUTH_TOKEN. Add it as a Cloudflare secret.");
  }

  if (rawUrl.startsWith("file:")) {
    throw new Error("TURSO_DATABASE_URL cannot be a file: URL on Cloudflare. Use your remote Turso URL, for example libsql://your-db.turso.io.");
  }

  const url = toTursoHttpPipelineUrl(rawUrl);
  return { url, authToken };
}

function toTursoHttpPipelineUrl(rawUrl: string) {
  let url = rawUrl.trim();

  if (url.startsWith("libsql://")) {
    url = `https://${url.slice("libsql://".length)}`;
  } else if (url.startsWith("wss://")) {
    url = `https://${url.slice("wss://".length)}`;
  } else if (url.startsWith("ws://")) {
    url = `http://${url.slice("ws://".length)}`;
  }

  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/v2/pipeline")) {
    url = `${url}/v2/pipeline`;
  }
  return url;
}

function toHranaArg(value: unknown): HranaValue {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { type: "integer", value: String(value) };
    return { type: "float", value: String(value) };
  }
  if (typeof value === "boolean") return { type: "integer", value: value ? "1" : "0" };
  return { type: "text", value: String(value) };
}

function fromHranaValue(value: HranaValue | undefined): unknown {
  if (!value || value.type === "null") return null;
  if (value.type === "integer") return Number(value.value);
  if (value.type === "float") return Number(value.value);
  if (value.type === "text") return value.value;
  if (value.type === "blob") return value.base64;
  return null;
}

async function execute(sql: string, args: unknown[] = []): Promise<HranaResult> {
  const { url, authToken } = getDatabaseConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
            args: args.map(toHranaArg)
          }
        },
        { type: "close" }
      ]
    })
  });

  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) {
    throw new Error(`Turso HTTP error ${response.status}: ${JSON.stringify(payload)}`);
  }

  const first = payload?.results?.[0];
  if (first?.type !== "ok") {
    const message = first?.error?.message || first?.error || payload?.error || "Unknown Turso query error";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return first?.response?.result || { cols: [], rows: [] };
}

function resultToObjects<T>(result: HranaResult): T[] {
  const columns = result.cols?.map((col) => col.name) || [];
  const rows = result.rows || [];
  return rows.map((row) => {
    const object: Record<string, unknown> = {};
    row.forEach((value, index) => {
      object[columns[index] || String(index)] = fromHranaValue(value);
    });
    return object as T;
  });
}

export async function ensureSchema() {
  if (schemaReady) return;
  await execute(`
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
  const result = await execute(
    "SELECT value, updated_at FROM cache_entries WHERE key = ? LIMIT 1",
    [key]
  );
  const row = resultToObjects<CacheRow>(result)[0];
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
  const serializedValue = JSON.stringify(value ?? null) ?? "null";

  await execute(
    `
      INSERT INTO cache_entries (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    [key, serializedValue, updatedAt]
  );
  return updatedAt;
}
