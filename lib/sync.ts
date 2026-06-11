import { getCache, setCache } from "@/lib/db";
import { fetchMalLoadJsonList, fetchMalXmlList, fetchPaginatedList, normalizeMediaList, normalizeProfile, requestJikan } from "@/lib/jikan";
import type { DashboardPayload, MediaItem, MediaKind, NormalizedProfile } from "@/lib/types";
import { buildStats, isFresh } from "@/lib/utils";

export function defaultUsername() {
  return process.env.MAL_USERNAME || "";
}

export async function getSavedUsername() {
  const settings = await getCache<{ username?: string }>("settings");
  return settings?.value?.username || defaultUsername();
}

export async function getSettingsInfo() {
  const username = await getSavedUsername();
  if (!username) return { username: "", lastSyncedAt: undefined as string | undefined };

  const lastSyncCache = await getCache<{ syncedAt?: string }>(`last-sync:${username}`);
  return {
    username,
    lastSyncedAt: lastSyncCache?.value?.syncedAt || lastSyncCache?.updatedAt
  };
}

export async function saveUsername(username: string) {
  const clean = username.trim();
  if (!clean) throw new Error("Username is required");
  await setCache("settings", { username: clean });
  return clean;
}

async function safeFetchList(username: string, kind: MediaKind, path: string) {
  try {
    const jikanItems = await fetchPaginatedList(path);
    if (jikanItems.length > 0) return normalizeMediaList(jikanItems, kind);
  } catch (error) {
    console.warn(`Jikan ${kind} list failed:`, error instanceof Error ? error.message : error);
  }

  try {
    const malJsonItems = await fetchMalLoadJsonList(username, kind);
    if (malJsonItems.length > 0) return malJsonItems;
  } catch (error) {
    console.warn(`MAL public JSON ${kind} fallback failed:`, error instanceof Error ? error.message : error);
  }

  try {
    const xmlItems = await fetchMalXmlList(username, kind);
    if (xmlItems.length > 0) return xmlItems;
  } catch (error) {
    console.warn(`MAL XML ${kind} fallback failed:`, error instanceof Error ? error.message : error);
  }

  return [];
}

export async function syncUser(username: string) {
  const clean = username.trim();
  if (!clean) throw new Error("MAL username is missing. Add MAL_USERNAME to .env.local or save it from Settings.");

  const encoded = encodeURIComponent(clean);
  const profileRaw = await requestJikan<unknown>(`/users/${encoded}/full`);
  const [anime, manga] = await Promise.all([
    safeFetchList(clean, "anime", `/users/${encoded}/animelist`),
    safeFetchList(clean, "manga", `/users/${encoded}/mangalist`)
  ]);

  const profile = normalizeProfile(profileRaw);

  await setCache(`profile:${clean}`, profile);
  await setCache(`anime:${clean}`, anime);
  await setCache(`manga:${clean}`, manga);
  const syncedAt = await setCache(`last-sync:${clean}`, { syncedAt: new Date().toISOString() });

  return { profile, anime, manga, syncedAt };
}

export async function getDashboard(forceSync = false): Promise<DashboardPayload> {
  const username = await getSavedUsername();
  if (!username) {
    return {
      profile: null,
      anime: [],
      manga: [],
      stats: buildStats([], []),
      username: "",
      fromCache: true
    };
  }

  const profileCache = await getCache<NormalizedProfile>(`profile:${username}`);
  const animeCache = await getCache<MediaItem[]>(`anime:${username}`);
  const mangaCache = await getCache<MediaItem[]>(`manga:${username}`);
  const lastSyncCache = await getCache<{ syncedAt: string }>(`last-sync:${username}`);
  const freshEnough = isFresh(lastSyncCache?.updatedAt);

  if (forceSync || !profileCache || !animeCache || !mangaCache || !freshEnough) {
    const synced = await syncUser(username);
    return {
      profile: synced.profile,
      anime: synced.anime,
      manga: synced.manga,
      stats: buildStats(synced.anime, synced.manga, synced.profile),
      username,
      lastSyncedAt: synced.syncedAt,
      fromCache: false
    };
  }

  return {
    profile: profileCache.value,
    anime: animeCache.value,
    manga: mangaCache.value,
    stats: buildStats(animeCache.value, mangaCache.value, profileCache.value),
    username,
    lastSyncedAt: lastSyncCache?.value?.syncedAt || lastSyncCache?.updatedAt,
    fromCache: true
  };
}

export async function getDetails(kind: MediaKind, id: number) {
  const key = `details:${kind}:${id}`;
  const cached = await getCache<unknown>(key);
  if (cached && isFresh(cached.updatedAt, 60 * 60 * 24 * 7)) return cached.value;

  const payload = await requestJikan<unknown>(`/${kind}/${id}/full`);
  await setCache(key, payload);
  return payload;
}
