import type { MediaItem, MediaKind, NormalizedProfile } from "@/lib/types";

const BASE_URL = (process.env.JIKAN_BASE_URL || "https://api.jikan.moe/v4").replace(/\/$/, "");

const animeStatuses: Record<string, { label: string; key: string }> = {
  "1": { label: "Watching", key: "watching" },
  "2": { label: "Completed", key: "completed" },
  "3": { label: "On Hold", key: "on_hold" },
  "4": { label: "Dropped", key: "dropped" },
  "6": { label: "Plan to Watch", key: "plan_to_watch" },
  watching: { label: "Watching", key: "watching" },
  completed: { label: "Completed", key: "completed" },
  on_hold: { label: "On Hold", key: "on_hold" },
  dropped: { label: "Dropped", key: "dropped" },
  plan_to_watch: { label: "Plan to Watch", key: "plan_to_watch" }
};

const mangaStatuses: Record<string, { label: string; key: string }> = {
  "1": { label: "Reading", key: "reading" },
  "2": { label: "Completed", key: "completed" },
  "3": { label: "On Hold", key: "on_hold" },
  "4": { label: "Dropped", key: "dropped" },
  "6": { label: "Plan to Read", key: "plan_to_read" },
  reading: { label: "Reading", key: "reading" },
  completed: { label: "Completed", key: "completed" },
  on_hold: { label: "On Hold", key: "on_hold" },
  dropped: { label: "Dropped", key: "dropped" },
  plan_to_read: { label: "Plan to Read", key: "plan_to_read" }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getImage(source: any) {
  return (
    source?.images?.webp?.large_image_url ||
    source?.images?.jpg?.large_image_url ||
    source?.images?.webp?.image_url ||
    source?.images?.jpg?.image_url ||
    source?.image_url ||
    source?.picture_url ||
    undefined
  );
}

function asArrayNames(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => entry?.name).filter(Boolean);
}

export async function requestJikan<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "mal-dashboard/1.0"
    },
    // Jikan is external and should not be cached by Next here. Turso handles caching.
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const userPathMatch = path.match(/^\/users\/([^/]+)/);
    if (response.status === 404 && userPathMatch) {
      const username = decodeURIComponent(userPathMatch[1]);
      throw new Error(
        `Jikan could not find the public MyAnimeList profile/list for "${username}". Check the exact MAL username and make sure the profile and lists are public.`
      );
    }
    throw new Error(`Jikan request failed ${response.status}: ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPaginatedList(path: string) {
  const items: any[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const separator = path.includes("?") ? "&" : "?";
    const payload = await requestJikan<any>(`${path}${separator}page=${page}`);
    items.push(...(payload?.data || []));
    hasNext = Boolean(payload?.pagination?.has_next_page);
    page += 1;

    // Public Jikan is rate-limited, so keep sync polite and stable.
    if (hasNext) await sleep(650);
  }

  return items;
}

function statusFor(kind: MediaKind, rawStatus: any) {
  const value = String(rawStatus ?? "").toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
  const map = kind === "anime" ? animeStatuses : mangaStatuses;
  return map[value] || { label: rawStatus ? String(rawStatus) : "Unknown", key: rawStatus ? value : "unknown" };
}


const MAL_WEB_BASE = "https://myanimelist.net";

function decodeXml(value: string | undefined) {
  if (!value) return undefined;
  let text = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
  return text.trim() || undefined;
}

function readXmlTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]);
}

function toSafeDate(value: string | undefined) {
  if (!value || value === "0000-00-00") return undefined;
  return value;
}

function unixToIso(value: string | undefined) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return new Date(n * 1000).toISOString();
}

function animeTypeName(value: string | undefined) {
  return ({ "1": "TV", "2": "OVA", "3": "Movie", "4": "Special", "5": "ONA", "6": "Music" } as Record<string, string>)[value || ""] || undefined;
}

function mangaTypeName(value: string | undefined) {
  return ({ "1": "Manga", "2": "Novel", "3": "One-shot", "4": "Doujinshi", "5": "Manhwa", "6": "Manhua" } as Record<string, string>)[value || ""] || undefined;
}

function normalizeXmlMediaItem(block: string, kind: MediaKind): MediaItem | null {
  const isAnime = kind === "anime";
  const id = Number(readXmlTag(block, isAnime ? "series_animedb_id" : "series_mangadb_id") || 0);
  if (!id) return null;

  const progress = Number(readXmlTag(block, isAnime ? "my_watched_episodes" : "my_read_chapters") || 0) || 0;
  const total = Number(readXmlTag(block, isAnime ? "series_episodes" : "series_chapters") || 0) || undefined;
  const status = statusFor(kind, readXmlTag(block, "my_status"));
  const image = readXmlTag(block, "series_image");
  const title = readXmlTag(block, "series_title") || "Untitled";

  return {
    id,
    kind,
    title,
    url: `${MAL_WEB_BASE}/${kind}/${id}`,
    image,
    mediaType: isAnime ? animeTypeName(readXmlTag(block, "series_type")) : mangaTypeName(readXmlTag(block, "series_type")),
    status: status.label,
    statusKey: status.key,
    score: Number(readXmlTag(block, "my_score") || 0) || 0,
    progress,
    total,
    progressLabel: total ? `${progress}/${total}` : String(progress || 0),
    updatedAt: unixToIso(readXmlTag(block, "my_last_updated")),
    userStartDate: toSafeDate(readXmlTag(block, "my_start_date")),
    userEndDate: toSafeDate(readXmlTag(block, "my_finish_date"))
  };
}

export async function fetchMalXmlList(username: string, kind: MediaKind): Promise<MediaItem[]> {
  const url = `${MAL_WEB_BASE}/malappinfo.php?u=${encodeURIComponent(username)}&status=all&type=${kind}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/xml,text/xml,*/*",
      "User-Agent": "mal-dashboard/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`MyAnimeList XML fallback failed ${response.status}: ${response.statusText}`);
  }

  const xml = await response.text();
  if (/error\s*=\s*["']?invalid/i.test(xml) || xml.includes("Invalid username")) {
    throw new Error(`MyAnimeList XML fallback could not read ${kind} list for "${username}".`);
  }

  const tag = kind === "anime" ? "anime" : "manga";
  const blocks = xml.match(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "gi")) || [];
  return blocks
    .map((block) => normalizeXmlMediaItem(block, kind))
    .filter((item): item is MediaItem => Boolean(item));
}

export function normalizeProfile(raw: any): NormalizedProfile {
  const data = raw?.data || raw || {};
  return {
    username: data?.username || data?.name || "Unknown",
    url: data?.url,
    image: getImage(data),
    about: data?.about,
    joined: data?.joined,
    lastOnline: data?.last_online,
    statistics: data?.statistics,
    favorites: data?.favorites
  };
}

export function normalizeMediaItem(raw: any, kind: MediaKind): MediaItem | null {
  const source = raw?.anime || raw?.manga || raw?.entry || raw;
  const id = Number(source?.mal_id || raw?.mal_id);
  if (!id) return null;

  const score = Number(raw?.score ?? raw?.list_status?.score ?? 0) || 0;
  const watchedOrRead = Number(
    kind === "anime"
      ? raw?.watched_episodes ?? raw?.list_status?.num_episodes_watched ?? raw?.episodes_watched ?? 0
      : raw?.read_chapters ?? raw?.list_status?.num_chapters_read ?? raw?.chapters_read ?? 0
  ) || 0;
  const total = Number(kind === "anime" ? source?.episodes : source?.chapters) || undefined;

  const rawStatus = raw?.watching_status ?? raw?.reading_status ?? raw?.status ?? raw?.list_status?.status;
  const status = statusFor(kind, rawStatus);

  return {
    id,
    kind,
    title: source?.title || raw?.title || "Untitled",
    titleEnglish: source?.title_english,
    url: source?.url || raw?.url,
    image: getImage(source) || getImage(raw),
    mediaType: source?.type || raw?.type,
    status: status.label,
    statusKey: status.key,
    score,
    progress: watchedOrRead,
    total,
    progressLabel: total ? `${watchedOrRead}/${total}` : String(watchedOrRead || 0),
    updatedAt: raw?.updated_at || raw?.list_status?.updated_at,
    startDate: source?.aired?.from || source?.published?.from || source?.start_date || raw?.start_date,
    endDate: source?.aired?.to || source?.published?.to || source?.end_date || raw?.end_date,
    userStartDate: raw?.start_date || raw?.list_status?.start_date,
    userEndDate: raw?.end_date || raw?.list_status?.finish_date,
    synopsis: source?.synopsis,
    genres: asArrayNames(source?.genres),
    studios: asArrayNames(source?.studios)
  };
}

export function normalizeMediaList(rawList: any[], kind: MediaKind) {
  return rawList
    .map((raw) => normalizeMediaItem(raw, kind))
    .filter((item): item is MediaItem => Boolean(item));
}

export function normalizeDetails(raw: any, kind: MediaKind): Partial<MediaItem> {
  const source = raw?.data || raw || {};
  const total = Number(kind === "anime" ? source?.episodes : source?.chapters) || undefined;
  return {
    id: Number(source?.mal_id),
    kind,
    title: source?.title || "Untitled",
    titleEnglish: source?.title_english,
    url: source?.url,
    image: getImage(source),
    mediaType: source?.type,
    total,
    progressLabel: total ? `0/${total}` : "0",
    startDate: source?.aired?.from || source?.published?.from,
    endDate: source?.aired?.to || source?.published?.to,
    synopsis: source?.synopsis,
    genres: asArrayNames(source?.genres),
    studios: asArrayNames(source?.studios),
    score: Number(source?.score || 0),
    status: source?.status || "Unknown",
    statusKey: String(source?.status || "unknown").toLowerCase().replaceAll(" ", "_")
  };
}
