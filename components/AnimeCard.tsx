"use client";

import { CalendarDays, Star } from "lucide-react";
import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function AnimeCard({ item, view, onOpen }: { item: MediaItem; view: "grid" | "list"; onOpen: (item: MediaItem) => void }) {
  if (view === "list") {
    return (
      <button
        onClick={() => onOpen(item)}
        className="card-glass focus-ring flex w-full items-center gap-4 rounded-3xl p-3 text-left transition hover:-translate-y-0.5"
      >
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
          {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{item.status}</span>
            {item.mediaType ? <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.mediaType}</span> : null}
          </div>
          <h3 className="mt-2 line-clamp-1 text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Progress {item.progressLabel} • Updated {formatDate(item.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
          <Star size={15} fill="currentColor" />
          {item.score || "-"}
        </div>
      </button>
    );
  }

  return (
    <button onClick={() => onOpen(item)} className="card-glass focus-ring group overflow-hidden rounded-[1.7rem] text-left transition hover:-translate-y-1">
      <div className="relative aspect-[3/4.3] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {item.image ? (
          <Image src={item.image} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px" />
        ) : null}
        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">{item.status}</div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-amber-600 backdrop-blur-md dark:bg-slate-950/80 dark:text-amber-300">
          <Star size={13} fill="currentColor" />
          {item.score || "-"}
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-black text-slate-950 dark:text-white">{item.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{item.progressLabel}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {formatDate(item.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}
