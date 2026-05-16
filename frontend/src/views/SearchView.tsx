import { useState, useEffect } from 'react';
import { Search, Frown } from 'lucide-react';
import type { Anime } from '../types';
import { searchAnime, FALLBACK_ANIMES } from '../services/animeflv';
import AnimeCard from '../components/AnimeCard';
import { CardSkeleton } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';

interface SearchViewProps {
  query: string;
  onAnimeClick: (animeId: string) => void;
}

export default function SearchView({ query, onAnimeClick }: SearchViewProps) {
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const q = debouncedQuery.toLowerCase();
    const instant = FALLBACK_ANIMES.filter(a => a.title.toLowerCase().includes(q) || a.synopsis.toLowerCase().includes(q));
    if (instant.length > 0) setResults(instant);
    
    setLoading(true);
    searchAnime(debouncedQuery).then(data => { if (data.length > 0) setResults(data); }).finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-24 pb-16 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-cr-orange/10 flex items-center justify-center">
          <Search className="w-4 h-4 text-cr-orange" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Resultados</h1>
          <p className="text-xs text-white/40">
            Buscando: <span className="text-cr-orange font-medium">"{query}"</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
          {Array.from({ length: 14 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Frown className="w-14 h-14 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">Sin resultados</h3>
          <p className="text-white/30 text-sm text-center max-w-sm">
            No encontramos animes para "{query}". Intenta con otro término.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
          {results.map((anime, i) => (
            <AnimeCard key={`${anime.id}-${i}`} anime={anime} onClick={() => onAnimeClick(anime.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
