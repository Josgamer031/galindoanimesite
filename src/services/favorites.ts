export interface Favorite {
  animeId: string;
  title: string;
  cover: string;
  addedAt: number;
}

const STORAGE_KEY = 'galindo_favorites';

export function getFavorites(): Favorite[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(animeId: string, title: string, cover: string): void {
  try {
    const favorites = getFavorites();
    if (!favorites.some(f => f.animeId === animeId)) {
      favorites.push({ animeId, title, cover, addedAt: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  } catch {
    // ignore
  }
}

export function removeFavorite(animeId: string): void {
  try {
    const favorites = getFavorites().filter(f => f.animeId !== animeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

export function isFavorite(animeId: string): boolean {
  return getFavorites().some(f => f.animeId === animeId);
}

export function toggleFavorite(animeId: string, title: string, cover: string): boolean {
  if (isFavorite(animeId)) {
    removeFavorite(animeId);
    return false;
  } else {
    addFavorite(animeId, title, cover);
    return true;
  }
}
