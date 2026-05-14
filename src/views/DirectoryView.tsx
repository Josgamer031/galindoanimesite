import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import type { Anime } from '../types';
import { getDirectoryAnimes, FALLBACK_ANIMES } from '../services/animeflv';
import AnimeCard from '../components/AnimeCard';
import { CardSkeleton } from '../components/Skeleton';

interface DirectoryViewProps {
  onAnimeClick: (animeId: string) => void;
}

export default function DirectoryView({ onAnimeClick }: DirectoryViewProps) {
  const [animes, setAnimes] = useState<Anime[]>(FALLBACK_ANIMES);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState('rating');

  useEffect(() => {
    setLoading(true);
    getDirectoryAnimes(page, order).then(setAnimes).finally(() => setLoading(false));
  }, [page, order]);

  const orders = [
    { v: 'rating', l: 'Mejor Valorados' },
    { v: 'updated', l: 'Actualizados' },
    { v: 'added', l: 'Recientes' },
    { v: 'title', l: 'Título A-Z' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-24 pb-16 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cr-orange/10 flex items-center justify-center">
            <Compass className="w-4 h-4 text-cr-orange" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Explorar Anime</h1>
            <p className="text-xs text-white/40">Descubre todo el catálogo</p>
          </div>
        </div>

        {/* Order tabs */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/[0.04]">
          {orders.map(o => (
            <button
              key={o.v}
              onClick={() => { setOrder(o.v); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                order === o.v
                  ? 'bg-cr-orange text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
        {loading
          ? Array.from({ length: 21 }).map((_, i) => <CardSkeleton key={i} />)
          : animes.map((a, i) => (
              <AnimeCard key={`${a.id}-${i}`} anime={a} onClick={() => onAnimeClick(a.id)} />
            ))
        }
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-12">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-white/50 hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => Math.max(1, page - 2) + i).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                n === page
                  ? 'bg-cr-orange text-white shadow-lg shadow-cr-orange/20'
                  : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPage(p => p + 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-white/50 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
