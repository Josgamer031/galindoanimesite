import { useState, useEffect } from 'react';
import { Star, Play, ChevronDown, ChevronUp, ArrowLeft, Search, Bookmark, Share2, Clock } from 'lucide-react';
import { svgPlaceholder } from '../services/animeflv';
import type { AnimeDetail } from '../types';
import { getAnimeDetail } from '../services/animeflv';
import { DetailSkeleton } from '../components/Skeleton';

interface AnimeDetailViewProps {
  animeId: string;
  onEpisodeClick: (animeId: string, episode: number) => void;
  onBack: () => void;
  onGenreClick: (genre: string) => void;
}

export default function AnimeDetailView({ animeId, onEpisodeClick, onBack, onGenreClick }: AnimeDetailViewProps) {
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllEps, setShowAllEps] = useState(false);
  const [epSearch, setEpSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAnimeDetail(animeId).then(setAnime).finally(() => setLoading(false));
  }, [animeId]);

  if (loading) return <DetailSkeleton />;
  if (!anime) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-white/40 text-lg">Anime no encontrado</p>
        <button onClick={onBack} className="mt-4 text-cr-orange hover:underline text-sm font-semibold">Volver al inicio</button>
      </div>
    </div>
  );

  const filtered = anime.episodeList
    .filter(ep => !epSearch || ep.episode.toString().includes(epSearch))
    .sort((a, b) => sortDesc ? b.episode - a.episode : a.episode - b.episode);
  const displayed = showAllEps ? filtered : filtered.slice(0, 60);

  return (
    <div className="min-h-screen">
      {/* Banner with blurred cover */}
      <div className="relative h-72 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={anime.cover || svgPlaceholder(anime.title)}
          alt=""
          className="w-full h-full object-cover scale-110 blur-md brightness-50"
          onError={(e) => { (e.target as HTMLImageElement).src = svgPlaceholder(anime.title); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141519] via-[#141519]/50 to-[#141519]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141519]/80 to-transparent" />
        
        {/* Back */}
        <button
          onClick={onBack}
          className="absolute top-20 left-4 lg:left-8 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 -mt-44 sm:-mt-52 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Cover poster */}
          <div className="w-44 sm:w-52 lg:w-60 shrink-0 mx-auto lg:mx-0">
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">
              <img
                src={anime.cover}
                alt={anime.title}
                className="w-full aspect-[2/3] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = svgPlaceholder(anime.title); }}
              />
            </div>

            {/* Action buttons under cover (mobile friendly) */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  bookmarked
                    ? 'bg-cr-orange text-white'
                    : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={bookmarked ? 'white' : 'none'} />
                {bookmarked ? 'Guardado' : 'Guardar'}
              </button>
              <button className="flex items-center justify-center w-10 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/[0.06] transition-all">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Info panel */}
          <div className="flex-1 min-w-0 pt-2 lg:pt-8">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-1 text-center lg:text-left">
              {anime.title}
            </h1>
            {anime.alternativeTitles.length > 0 && (
              <p className="text-white/30 text-sm mb-3 text-center lg:text-left">{anime.alternativeTitles.join(' / ')}</p>
            )}

            {/* Meta tags */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
              {anime.rating && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cr-yellow/10 text-cr-yellow text-xs font-bold">
                  <Star className="w-3 h-3" fill="currentColor" />
                  {anime.rating}
                </span>
              )}
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                anime.status.toLowerCase().includes('emisi')
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-white/[0.06] text-white/50'
              }`}>
                <Clock className="w-3 h-3" />
                {anime.status}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cr-orange/10 text-cr-orange text-xs font-bold">
                {anime.type}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 text-xs font-bold">
                {anime.episodeList.length} episodios
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 mb-5">
              {anime.genres.map(g => (
                <button
                  key={g}
                  onClick={() => onGenreClick(g)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold text-white/60 bg-white/[0.04] border border-white/[0.06] hover:text-cr-orange hover:border-cr-orange/30 hover:bg-cr-orange/[0.06] transition-all"
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Sinopsis</h3>
              <p className="text-sm text-white/60 leading-relaxed">{anime.synopsis || 'Sinopsis no disponible.'}</p>
            </div>

            {/* Quick play */}
            {anime.episodeList.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => onEpisodeClick(animeId, anime.episodeList[0].episode)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cr-orange hover:bg-cr-orange-dark text-white font-bold text-sm rounded-full transition-all shadow-lg shadow-cr-orange/20 hover:shadow-cr-orange/40 active:scale-[0.97]"
                >
                  <Play className="w-4 h-4" fill="white" />
                  Episodio 1
                </button>
                {anime.episodeList.length > 1 && (
                  <button
                    onClick={() => onEpisodeClick(animeId, anime.episodeList[anime.episodeList.length - 1].episode)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-sm rounded-full transition-all border border-white/[0.06]"
                  >
                    <Play className="w-4 h-4" />
                    Último Ep. {anime.episodeList[anime.episodeList.length - 1].episode}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        {anime.episodeList.length > 0 && (
          <div className="mt-12 mb-16">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-white">
                Episodios
                <span className="text-white/30 font-normal ml-2 text-sm">({anime.episodeList.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={epSearch}
                    onChange={(e) => setEpSearch(e.target.value)}
                    placeholder="# Ep"
                    className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cr-orange/40"
                  />
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                </div>
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  {sortDesc ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  {sortDesc ? 'Recientes' : 'Primeros'}
                </button>
              </div>
            </div>

            {/* Episode grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-1.5">
              {displayed.map(ep => (
                <button
                  key={ep.episode}
                  onClick={() => onEpisodeClick(animeId, ep.episode)}
                  className="group relative py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:border-cr-orange/40 hover:bg-cr-orange/[0.06] transition-all text-center"
                >
                  <span className="text-xs font-semibold text-white/60 group-hover:text-cr-orange transition-colors">
                    {ep.episode}
                  </span>
                </button>
              ))}
            </div>

            {filtered.length > 60 && !showAllEps && (
              <button
                onClick={() => setShowAllEps(true)}
                className="mt-4 mx-auto block px-6 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-cr-orange hover:border-cr-orange/30 transition-all font-semibold"
              >
                Mostrar todos ({filtered.length} episodios)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
