import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import type { Anime } from '../types';
import { getAnimesByGenre, GENRES, FALLBACK_ANIMES } from '../services/animeflv';
import AnimeCard from '../components/AnimeCard';
import { CardSkeleton } from '../components/Skeleton';

interface GenreViewProps {
  initialGenre?: string;
  onAnimeClick: (animeId: string) => void;
}

export default function GenreView({ initialGenre, onAnimeClick }: GenreViewProps) {
  const [genre, setGenre] = useState(initialGenre || '');
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (genre) {
      // Show filtered fallback instantly
      const instant = FALLBACK_ANIMES.filter(a => a.genres?.some(g => g.toLowerCase() === genre.toLowerCase()));
      if (instant.length > 0) setAnimes(instant);
      setLoading(true);
      getAnimesByGenre(genre, page).then(data => { if (data.length > 0) setAnimes(data); }).finally(() => setLoading(false));
    }
  }, [genre, page]);

  useEffect(() => {
    if (initialGenre) { setGenre(initialGenre); setPage(1); }
  }, [initialGenre]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-24 pb-16 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Tag className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Géneros</h1>
          <p className="text-xs text-white/40">Encuentra anime por categoría</p>
        </div>
      </div>

      {/* Genre chips - horizontal scroll on mobile, wrap on desktop */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => { setGenre(g); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              genre === g
                ? 'bg-cr-orange text-white shadow-md shadow-cr-orange/20'
                : 'bg-white/[0.03] text-white/40 border border-white/[0.04] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results */}
      {genre && (
        <>
          <h2 className="text-base font-bold text-white mb-5">
            <span className="text-cr-orange">{genre}</span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
              {Array.from({ length: 14 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : animes.length === 0 ? (
            <p className="text-center text-white/30 py-16">Sin resultados para este género.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
              {animes.map((a, i) => (
                <AnimeCard key={`${a.id}-${i}`} anime={a} onClick={() => onAnimeClick(a.id)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {animes.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-white/30 font-medium">Pág. {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-white/50 hover:text-white transition-all"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
