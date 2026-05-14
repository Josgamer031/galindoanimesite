export interface Anime {
  id: string;
  title: string;
  cover: string;
  banner?: string;
  synopsis: string;
  rating: string;
  type: string;
  url: string;
  status?: string;
  genres?: string[];
  episodes?: number;
  debut?: string;
}

export interface Episode {
  title: string;
  chapter: number;
  cover: string;
  url: string;
  animeId?: string;
}

export interface AnimeDetail {
  title: string;
  alternativeTitles: string[];
  status: string;
  rating: string;
  type: string;
  cover: string;
  banner?: string;
  synopsis: string;
  genres: string[];
  episodeList: { episode: number; id: number }[];
  url: string;
  related?: Anime[];
}

export interface EpisodeServer {
  server: string;
  title: string;
  url: string;
  code?: string;
  mediaUrl?: string;
}

export interface WatchHistoryEntry {
  animeId: string;
  animeTitle: string;
  animeCover: string;
  episode: number;
  timestamp: number;
  progress?: number; // 0-100
}

export type View = 'home' | 'search' | 'anime' | 'episode' | 'directory' | 'genre';
