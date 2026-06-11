"use client";

import { BookOpen, Clock3, Library, ListChecks, Star, Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import { DetailsModal } from "@/components/DetailsModal";
import { PageSkeleton } from "@/components/Skeletons";
import { StatCard } from "@/components/StatCard";
import type { DashboardPayload, MediaItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load dashboard");
        return payload as DashboardPayload;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  const recent = useMemo(() => {
    if (!data) return [];
    return [...data.anime, ...data.manga]
      .filter((item) => item.updatedAt)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8);
  }, [data]);

  if (error) {
    return <SetupError message={error} />;
  }

  if (!data) return <PageSkeleton />;

  if (!data.username) {
    return <SetupError message="Add your MyAnimeList username from the Settings page or set MAL_USERNAME in .env.local." />;
  }

  return (
    <div className="space-y-8">
      <section className="card-glass overflow-hidden rounded-[2.2rem] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
              Personal anime dashboard
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              {data.profile?.username || data.username}'s MyAnimeList library.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Synced through Jikan, cached in Turso, and presented as a fast modern dashboard for anime, manga, progress, scores, and recent updates.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-white/10"><Clock3 size={16} /> Last sync {formatDate(data.lastSyncedAt)}</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 dark:bg-white/10">{data.fromCache ? "Loaded from Turso cache" : "Freshly synced"}</span>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-xs overflow-hidden rounded-[2rem] bg-slate-200 shadow-glow dark:bg-slate-800">
            {data.profile?.image ? <Image src={data.profile.image} alt={data.profile.username} fill className="object-cover" sizes="320px" /> : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
              <p className="text-2xl font-black">{data.profile?.username || data.username}</p>
              {data.profile?.url ? <a className="text-sm font-semibold text-indigo-200" href={data.profile.url} target="_blank" rel="noreferrer">View MAL profile</a> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total anime" value={data.stats.anime.total} icon={Library} hint="All anime entries" />
        <StatCard label="Completed" value={data.stats.anime.completed} icon={ListChecks} hint="Finished anime" />
        <StatCard label="Watching" value={data.stats.anime.watching} icon={Clock3} hint="Currently watching" />
        <StatCard label="Manga" value={data.stats.manga.total} icon={BookOpen} hint="All manga entries" />
        <StatCard label="Avg score" value={data.stats.anime.averageScore || "-"} icon={Star} hint="Anime score average" />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Recently updated</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Latest anime & manga activity</h2>
          </div>
          <Trophy className="hidden text-indigo-500 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recent.map((item) => <AnimeCard key={`${item.kind}-${item.id}`} item={item} view="grid" onOpen={setSelected} />)}
        </div>
      </section>

      <DetailsModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function SetupError({ message }: { message: string }) {
  return (
    <div className="card-glass mx-auto max-w-2xl rounded-[2rem] p-6 text-center">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">Dashboard needs setup</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{message}</p>
      <a href="/settings" className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-500">Open Settings</a>
    </div>
  );
}
