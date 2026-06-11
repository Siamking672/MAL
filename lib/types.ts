export type MediaKind = "anime" | "manga";

export type NormalizedProfile = {
  username: string;
  url?: string;
  image?: string;
  about?: string;
  joined?: string;
  lastOnline?: string;
  statistics?: Record<string, unknown>;
  favorites?: Record<string, unknown>;
};

export type MediaItem = {
  id: number;
  kind: MediaKind;
  title: string;
  titleEnglish?: string;
  url?: string;
  image?: string;
  mediaType?: string;
  status: string;
  statusKey: string;
  score: number;
  progress: number;
  total?: number;
  progressLabel: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  userStartDate?: string;
  userEndDate?: string;
  synopsis?: string;
  genres?: string[];
  studios?: string[];
};

export type DashboardStats = {
  anime: {
    total: number;
    completed: number;
    watching: number;
    planning: number;
    averageScore: number;
  };
  manga: {
    total: number;
    completed: number;
    reading: number;
    planning: number;
    averageScore: number;
  };
  scoreDistribution: Record<string, number>;
  statusBreakdown: Record<string, number>;
  genres: Array<{ name: string; count: number }>;
  studios: Array<{ name: string; count: number }>;
};

export type DashboardPayload = {
  profile: NormalizedProfile | null;
  anime: MediaItem[];
  manga: MediaItem[];
  stats: DashboardStats;
  username: string;
  lastSyncedAt?: string;
  fromCache: boolean;
};
