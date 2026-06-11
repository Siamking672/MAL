"use client";

import { Grid2X2, List, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import { DetailsModal } from "@/components/DetailsModal";
import { PageSkeleton } from "@/components/Skeletons";
import type { DashboardPayload, MediaItem, MediaKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const filters = {
  anime: [
    { value: "all", label: "All" },
    { value: "watching", label: "Watching" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
    { value: "plan_to_watch", label: "Plan to Watch" }
  ],
  manga: [
    { value: "all", label: "All" },
    { value: "reading", label: "Reading" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
    { value: "plan_to_read", label: "Plan to Read" }
  ]
};

export function ListPageClient({ kind }: { kind: MediaKind }) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load list");
        return payload as DashboardPayload;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load list"));
  }, []);

  const items = useMemo(() => {
    const base = kind === "anime" ? data?.anime || [] : data?.manga || [];
    const filtered = base.filter((item) => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase().trim());
      const matchesStatus = status === "all" || item.statusKey === status;
      return matchesQuery && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sort === "score") return b.score - a.score;
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "progress") return b.progress - a.progress;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [data, kind, query, sort, status]);

  if (error) {
    return <div className="card-glass rounded-3xl p-6 text-rose-600 dark:text-rose-200">{error}</div>;
  }
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <section className="card-glass rounded-[2rem] p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">{kind} list</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{kind === "anime" ? "Anime" : "Manga"} library</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{items.length} entries shown from {kind === "anime" ? data.anime.length : data.manga.length} total.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setView("grid")} className={toggleClass(view === "grid")}><Grid2X2 size={16} /> Grid</button>
            <button onClick={() => setView("list")} className={toggleClass(view === "list")}><List size={16} /> List</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title..."
              className="focus-ring h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
            />
          </label>

          <label className="relative block">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="focus-ring h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm font-black text-slate-800 dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
              {filters[kind].map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
            </select>
          </label>

          <select value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring h-12 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-800 dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
            <option value="updated">Sort by updated</option>
            <option value="score">Sort by score</option>
            <option value="title">Sort by title</option>
            <option value="progress">Sort by progress</option>
          </select>
        </div>
      </section>

      {items.length ? (
        <section className={view === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"}>
          {items.map((item) => <AnimeCard key={`${item.kind}-${item.id}`} item={item} view={view} onOpen={setSelected} />)}
        </section>
      ) : (
        <div className="card-glass rounded-3xl p-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No entries match your filters.</div>
      )}

      <DetailsModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function toggleClass(active: boolean) {
  return cn(
    "focus-ring inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition",
    active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
  );
}
