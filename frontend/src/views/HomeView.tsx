import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Info, Clock, TrendingUp, Flame, ChevronLeft, ChevronRight, History, X, Trash2, Heart } from 'lucide-react';
import type { Anime, Episode, WatchHistoryEntry } from '../types';
import { getLatestEpisodes, getOnAirAnimes, FALLBACK_EPISODES, FALLBACK_ANIMES } from '../services/animeflv';
import { getWatchHistory, removeFromHistory, clearHistory } from '../services/watchHistory';
import { getFavorites } from '../services/favorites';
import EpisodeCard from '../components/EpisodeCard';
import AnimeCard from '../components/AnimeCard';
import ContentRow from '../components/ContentRow';

interface HomeViewProps {
  onAnimeClick: (animeId: string) => void;
  onEpisodeClick: (animeId: string, episode: number) => void;
  onNavigate: (view: 'directory') => void;
}

// ===== Continue Watching Card =====
function ContinueCard({ entry, onPlay, onRemove, onAnime }: {
  entry: WatchHistoryEntry;
  onPlay: () => void;
  onRemove: () => void;
  onAnime: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const hue = Math.abs([...entry.animeTitle].reduce((a,c)=>c.charCodeAt(0)+((a<<5)-a),0))%360;
  const placeholder = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="400" height="225" rx="8" fill="hsl(${hue},50%,18%)"/><text x="200" y="112" fill="rgba(255,255,255,.5)" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${entry.animeTitle.substring(0,20)}</text></svg>`)}`;
  const img = imgErr ? placeholder : entry.animeCover;
  const timeAgo = getTimeAgo(entry.timestamp);

  return (
    <div className="w-[240px] sm:w-[260px] lg:w-[280px] shrink-0 group relative">
      <button onClick={onPlay} className="w-full text-left focus:outline-none">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1F2027]">
          <img src={img} alt={entry.animeTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy" onError={() => setImgErr(true)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#F47521]/90 flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>

          {/* Episode badge */}
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F47521] text-white">
              E{entry.episode}
            </span>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
            <div className="h-full bg-[#F47521] rounded-r-full transition-all" style={{ width: `${entry.progress || 30}%` }} />
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="pt-2 flex items-start gap-2">
        <button onClick={onAnime} className="flex-1 min-w-0 text-left">
          <h3 className="text-[13px] font-semibold text-white/90 line-clamp-1 group-hover:text-[#F47521] transition-colors">
            {entry.animeTitle}
          </h3>
          <p className="text-[11px] text-white/30 mt-0.5">
            Ep. {entry.episode} • {timeAgo}
          </p>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-white/20 hover:text-red-400 transition-colors shrink-0 mt-0.5 opacity-0 group-hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return `hace ${Math.floor(days / 7)}sem`;
}

// ===== Main Component =====
export default function HomeView({ onAnimeClick, onEpisodeClick, onNavigate }: HomeViewProps) {
  const [episodes, setEpisodes] = useState<Episode[]>(FALLBACK_EPISODES);
  const [onAir, setOnAir] = useState<Anime[]>(FALLBACK_ANIMES);
  const [heroIdx, setHeroIdx] = useState(0);
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState(getFavorites());

  // Load watch history and favorites
  useEffect(() => {
    setHistory(getWatchHistory());
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eps, air] = await Promise.all([getLatestEpisodes(), getOnAirAnimes()]);
        if (!cancelled) {
          if (eps.length > 0) setEpisodes(eps);
          if (air.length > 0) setOnAir(air);
        }
      } catch { /**/ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshLatestEpisodes = async () => {
      try {
        const eps = await getLatestEpisodes();
        if (!cancelled && eps.length > 0) setEpisodes(eps);
      } catch { /**/ }
    };

    const interval = setInterval(refreshLatestEpisodes, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (onAir.length <= 1) return;
    const timer = setInterval(() => { setHeroIdx(prev => (prev + 1) % Math.min(onAir.length, 5)); }, 7000);
    return () => clearInterval(timer);
  }, [onAir]);

  const heroAnimes = onAir.slice(0, 5);
  const hero = heroAnimes[heroIdx] || onAir[0];

  const goHero = useCallback((dir: 'prev' | 'next') => {
    const max = Math.min(onAir.length, 5);
    if (max <= 0) return;
    setHeroIdx(prev => dir === 'next' ? (prev + 1) % max : (prev - 1 + max) % max);
  }, [onAir]);

  const handleRemoveHistory = (animeId: string) => {
    removeFromHistory(animeId);
    setHistory(getWatchHistory());
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const trendingAnimes = useMemo(() => {
    const shuffled = [...onAir].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 14);
  }, [onAir]);

  return (
    <div>
      {/* ===== HERO ===== */}
      {hero && (
        <section className="relative h-[70vh] sm:h-[75vh] min-h-[480px] max-h-[800px] overflow-hidden select-none">
          <div className="absolute inset-0" key={hero.id}>
            <img src={hero.cover} alt={hero.title} className="w-full h-full object-cover animate-hero-ken"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141519] via-[#141519]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141519] via-transparent to-[#141519]/30" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141519] to-transparent" />
          </div>

          <div className="relative z-10 h-full flex items-end max-w-[1400px] mx-auto px-4 lg:px-8 pb-24">
            <div className="max-w-xl animate-fade-up" key={hero.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F47521] text-white">★ Destacado</span>
                {hero.status && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    hero.status.toLowerCase().includes('emisi') ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
                  }`}>{hero.status}</span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-3 tracking-tight drop-shadow-lg">{hero.title}</h1>
              <p className="text-white/55 text-sm sm:text-[15px] leading-relaxed line-clamp-3 mb-6 max-w-lg">
                {hero.synopsis || 'Descubre los mejores animes del momento.'}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => onAnimeClick(hero.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#F47521] hover:bg-[#D4621A] text-white font-bold text-sm rounded-full transition-all shadow-lg shadow-[#F47521]/20 hover:shadow-[#F47521]/40 active:scale-[0.97]">
                  <Play className="w-4 h-4" fill="white" />EMPEZAR A VER
                </button>
                <button onClick={() => onAnimeClick(hero.id)}
                  className="flex items-center gap-2 px-5 py-3 bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm text-white font-semibold text-sm rounded-full transition-all border border-white/[0.08]">
                  <Info className="w-4 h-4" />Más info
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 z-20">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {heroAnimes.map((_, i) => (
                  <button key={i} onClick={() => setHeroIdx(i)}
                    className={`transition-all duration-300 rounded-full ${i === heroIdx ? 'w-8 h-2 bg-[#F47521]' : 'w-2 h-2 bg-white/25 hover:bg-white/50'}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => goHero('prev')} className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-sm flex items-center justify-center hover:bg-white/[0.15] transition-colors border border-white/[0.05]">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => goHero('next')} className="w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-sm flex items-center justify-center hover:bg-white/[0.15] transition-colors border border-white/[0.05]">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTENT ===== */}
      <div className="space-y-10 pb-16 -mt-4 relative z-10">

        {/* Latest Episodes */}
        <ContentRow
          title="Últimos Episodios"
          subtitle="Recién añadidos"
          icon={<div className="w-8 h-8 rounded-lg bg-[#F47521]/10 flex items-center justify-center"><Clock className="w-4 h-4 text-[#F47521]" /></div>}
        >
          {episodes.slice(0, 14).map((ep, i) => (
            <div key={`${ep.animeId}-${ep.chapter}-${i}`} className="w-[200px] sm:w-[220px] lg:w-[240px] shrink-0">
              <EpisodeCard episode={ep} onClick={() => ep.animeId && onEpisodeClick(ep.animeId, ep.chapter)} />
            </div>
          ))}
        </ContentRow>

        {/* Popular */}
        <ContentRow
          title="Popular ahora"
          subtitle="Los más vistos"
          icon={<div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><Flame className="w-4 h-4 text-red-400" /></div>}
          seeAllAction={() => onNavigate('directory')}
        >
          {onAir.slice(0, 14).map((anime, i) => (
            <div key={`pop-${anime.id}-${i}`} className="w-[150px] sm:w-[160px] lg:w-[175px] shrink-0">
              <AnimeCard anime={anime} onClick={() => onAnimeClick(anime.id)} />
            </div>
          ))}
        </ContentRow>

        {/* Favorites */}
        {favorites.length > 0 && (
          <ContentRow
            title="Mis Favoritos"
            subtitle="Tus animes guardados"
            icon={<div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><Heart className="w-4 h-4 text-red-400" fill="currentColor" /></div>}
          >
            {favorites.slice(0, 14).map((fav, i) => (
              <div key={`fav-${fav.animeId}-${i}`} className="w-[150px] sm:w-[160px] lg:w-[175px] shrink-0">
                <AnimeCard 
                  anime={{ 
                    id: fav.animeId, 
                    title: fav.title, 
                    cover: fav.cover,
                    synopsis: '',
                    rating: '',
                    type: 'Anime',
                    url: '',
                  }} 
                  onClick={() => onAnimeClick(fav.animeId)} 
                />
              </div>
            ))}
          </ContentRow>
        )}

        {/* Trending Grid */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Tendencias</h2>
              <p className="text-[12px] text-white/35">Animes que están dando de qué hablar</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-6">
            {trendingAnimes.map((anime, i) => (
              <AnimeCard key={`trend-${anime.id}-${i}`} anime={anime} onClick={() => onAnimeClick(anime.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
