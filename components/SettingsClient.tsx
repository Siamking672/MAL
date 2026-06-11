"use client";

import { CheckCircle2, Database, Loader2, RefreshCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export function SettingsClient() {
  const [username, setUsername] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load settings");
        setUsername(payload.username || "");
        setLastSyncedAt(payload.lastSyncedAt);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to save username");
      setUsername(payload.username);
      setMessage("Username saved. Run manual sync to refresh data.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save username");
    } finally {
      setSaving(false);
    }
  }

  async function sync() {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Sync failed");
      setLastSyncedAt(payload.lastSyncedAt);
      setMessage("Sync complete. Your Turso cache is updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card-glass rounded-[2rem] p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Settings</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Connect MyAnimeList</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          This starter uses Jikan, so connection means entering a public MAL username. OAuth tokens are not used because Jikan is auth-less and read-only.
        </p>
      </section>

      <section className="card-glass rounded-[2rem] p-6">
        {loading ? (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading settings...</div>
        ) : (
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="text-sm font-black text-slate-950 dark:text-white">MyAnimeList username</label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Example: your_username"
                className="focus-ring mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={save} disabled={saving || !username.trim()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save username
              </button>
              <button onClick={sync} disabled={syncing || !username.trim()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
                Manual sync
              </button>
            </div>

            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white"><Database size={16} /> Turso cache</div>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Last synced: {formatDate(lastSyncedAt)}</p>
            </div>

            {message ? <p className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"><CheckCircle2 size={16} /> {message}</p> : null}
            {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">{error}</p> : null}
          </div>
        )}
      </section>

      <section className="card-glass rounded-[2rem] p-6">
        <h2 className="text-xl font-black text-slate-950 dark:text-white">Environment variables</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-100"><code>{`MAL_USERNAME=your_mal_username
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token
JIKAN_BASE_URL=https://api.jikan.moe/v4
CACHE_TTL_SECONDS=21600`}</code></pre>
      </section>
    </div>
  );
}
