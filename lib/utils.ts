import type { DashboardStats, MediaItem } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function average(items: MediaItem[]) {
  const scored = items.filter((item) => item.score > 0);
  if (!scored.length) return 0;
  return Number((scored.reduce((sum, item) => sum + item.score, 0) / scored.length).toFixed(2));
}

function countBy(items: MediaItem[], getter: (item: MediaItem) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getter(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topValues(items: MediaItem[], getter: (item: MediaItem) => string[] | undefined) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const value of getter(item) || []) {
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
}

export function buildStats(anime: MediaItem[], manga: MediaItem[]): DashboardStats {
  const all = [...anime, ...manga];
  const scoreDistribution: Record<string, number> = {};
  for (let score = 1; score <= 10; score++) scoreDistribution[String(score)] = 0;
  for (const item of all) {
    if (item.score > 0) scoreDistribution[String(item.score)] = (scoreDistribution[String(item.score)] || 0) + 1;
  }

  return {
    anime: {
      total: anime.length,
      completed: anime.filter((item) => item.statusKey === "completed").length,
      watching: anime.filter((item) => item.statusKey === "watching").length,
      planning: anime.filter((item) => item.statusKey === "plan_to_watch").length,
      averageScore: average(anime)
    },
    manga: {
      total: manga.length,
      completed: manga.filter((item) => item.statusKey === "completed").length,
      reading: manga.filter((item) => item.statusKey === "reading").length,
      planning: manga.filter((item) => item.statusKey === "plan_to_read").length,
      averageScore: average(manga)
    },
    scoreDistribution,
    statusBreakdown: countBy(all, (item) => item.status),
    genres: topValues(all, (item) => item.genres),
    studios: topValues(all, (item) => item.studios)
  };
}

export function getCacheTtlSeconds() {
  const raw = Number(process.env.CACHE_TTL_SECONDS || "21600");
  return Number.isFinite(raw) && raw > 0 ? raw : 21600;
}

export function isFresh(updatedAt: string | undefined, ttlSeconds = getCacheTtlSeconds()) {
  if (!updatedAt) return false;
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return false;
  return Date.now() - updated < ttlSeconds * 1000;
}
