"use client";

import { BarChart3, BookOpen, Library, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageSkeleton } from "@/components/Skeletons";
import { StatCard } from "@/components/StatCard";
import type { DashboardPayload } from "@/lib/types";

export function StatsClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load stats");
        return payload as DashboardPayload;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));
  }, []);

  const maxScoreCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.stats.scoreDistribution), 1);
  }, [data]);

  if (error) return <div className="card-glass rounded-3xl p-6 text-rose-600 dark:text-rose-200">{error}</div>;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <section className="card-glass rounded-[2rem] p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Stats</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Your MAL numbers</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Scores, statuses, genres, and studios are calculated from synced Jikan data and cached detail records when available.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Anime entries" value={data.stats.anime.total} icon={Library} />
        <StatCard label="Manga entries" value={data.stats.manga.total} icon={BookOpen} />
        <StatCard label="Anime average" value={data.stats.anime.averageScore || "-"} icon={Star} />
        <StatCard label="Manga average" value={data.stats.manga.averageScore || "-"} icon={BarChart3} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Score distribution</h2>
          <div className="mt-6 space-y-3">
            {Object.entries(data.stats.scoreDistribution).reverse().map(([score, count]) => (
              <div key={score} className="grid grid-cols-[40px_1fr_48px] items-center gap-3">
                <span className="text-sm font-black text-slate-600 dark:text-slate-300">{score}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(count / maxScoreCount) * 100}%` }} />
                </div>
                <span className="text-right text-sm font-black text-slate-600 dark:text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Status breakdown</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(data.stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{status}</p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TopList title="Favorite genres" items={data.stats.genres} empty="Genres appear after Jikan provides them in list/detail cache." />
        <TopList title="Favorite studios" items={data.stats.studios} empty="Studios appear after details are cached from opened anime." />
      </section>
    </div>
  );
}

function TopList({ title, items, empty }: { title: string; items: Array<{ name: string; count: number }>; empty: string }) {
  return (
    <div className="card-glass rounded-[2rem] p-6">
      <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">#{index + 1} {item.name}</span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{item.count}</span>
          </div>
        )) : <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">{empty}</p>}
      </div>
    </div>
  );
}
