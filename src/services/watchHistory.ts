import type { WatchHistoryEntry } from '../types';

const KEY = 'ga_watch_history';
const MAX_ENTRIES = 30;

export function getWatchHistory(): WatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchHistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<WatchHistoryEntry, 'timestamp'>): void {
  const history = getWatchHistory();
  // Remove existing entry for this anime (we'll re-add with updated ep)
  const filtered = history.filter(h => h.animeId !== entry.animeId);
  // Add at the beginning
  filtered.unshift({
    ...entry,
    timestamp: Date.now(),
  });
  // Limit size
  const trimmed = filtered.slice(0, MAX_ENTRIES);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function removeFromHistory(animeId: string): void {
  const history = getWatchHistory().filter(h => h.animeId !== animeId);
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}
