"use client";

import { ExternalLink, Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DetailsModal({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const [details, setDetails] = useState<Partial<MediaItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    let alive = true;
    setDetails(null);
    setError("");
    setLoading(true);

    fetch(`/api/details?kind=${item.kind}&id=${item.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load details");
        return data.details as Partial<MediaItem>;
      })
      .then((payload) => alive && setDetails(payload))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Failed to load details"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [item]);

  const merged = useMemo(() => ({ ...item, ...details }), [item, details]);
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:items-center" onClick={onClose}>
      <div className="card-glass max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">{item.kind}</p>
            <h2 className="line-clamp-1 text-xl font-black text-slate-950 dark:text-white">{merged.title}</h2>
          </div>
          <button onClick={onClose} className="focus-ring rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
          <div>
            <div className="relative aspect-[3/4.3] overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-800">
              {merged.image ? <Image src={merged.image} alt={merged.title || item.title} fill className="object-cover" sizes="220px" /> : null}
            </div>
            {merged.url ? (
              <a href={merged.url} target="_blank" rel="noreferrer" className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-500">
                Open on MAL <ExternalLink size={16} />
              </a>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{item.status}</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 inline-flex items-center gap-1"><Star size={13} fill="currentColor" /> Your score {item.score || "-"}</span>
              {merged.mediaType ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{merged.mediaType}</span> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Progress" value={item.progressLabel} />
              <Info label="Started" value={formatDate(item.userStartDate || merged.startDate)} />
              <Info label="Updated" value={formatDate(item.updatedAt)} />
            </div>

            {loading ? <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading full details...</p> : null}
            {error ? <p className="rounded-2xl bg-rose-100 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">{error}</p> : null}

            {merged.genres?.length ? (
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">Genres</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {merged.genres.map((genre) => (
                    <span key={genre} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{genre}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {merged.studios?.length ? (
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">Studios</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {merged.studios.map((studio) => (
                    <span key={studio} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{studio}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">Synopsis</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{merged.synopsis || "No synopsis available yet."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
