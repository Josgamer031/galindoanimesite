import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, MonitorPlay, Server, Maximize } from 'lucide-react';
import type { EpisodeServer } from '../types';
import { getEpisodeServers, getAnimeDetail } from '../services/animeflv';
import { saveToHistory } from '../services/watchHistory';

interface EpisodeViewProps {
  animeId: string;
  episode: number;
  onBack: () => void;
  onAnimeClick: (animeId: string) => void;
  onEpisodeChange: (episode: number) => void;
}

export default function EpisodeView({ animeId, episode, onBack, onAnimeClick, onEpisodeChange }: EpisodeViewProps) {
  const [servers, setServers] = useState<EpisodeServer[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = async () => {
    if (!playerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await playerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(false);
    getEpisodeServers(animeId, episode)
      .then(data => {
        setServers(data);
        setSelected(0);
        if (!data.length) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [animeId, episode]);

  // Save to watch history
  useEffect(() => {
    if (!loading && !error) {
      const saveHistory = async () => {
        const title = animeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let cover = `https://animeflv.net/uploads/animes/thumbs/${animeId}.jpg`;

        try {
          const detail = await getAnimeDetail(animeId);
          if (detail?.cover) cover = detail.cover;
        } catch {
          // fallback to auto-generated thumbnail URL
        }

        saveToHistory({
          animeId,
          animeTitle: title,
          animeCover: cover,
          episode,
          progress: Math.floor(Math.random() * 60) + 10,
        });
      };

      saveHistory();
    }
  }, [animeId, episode, loading, error]);

  const srv = servers[selected];
  const embedUrl = srv?.code || srv?.url || '';
  const title = animeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const directUrl = `https://www3.animeflv.net/ver/${animeId}-${episode}`;

  return (
    <div className="min-h-screen pt-16 pb-16 bg-[#0D0D11]" data-ga-ui>
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 text-xs">
          <button onClick={onBack} className="text-white/40 hover:text-[#F47521] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />Volver
          </button>
          <span className="text-white/20">/</span>
          <button onClick={() => onAnimeClick(animeId)} className="text-white/40 hover:text-[#F47521] transition-colors truncate max-w-[200px]">{title}</button>
          <span className="text-white/20">/</span>
          <span className="text-[#F47521] font-medium">Episodio {episode}</span>
        </div>

        {/* Player */}
        <div ref={playerRef} className="relative rounded-xl overflow-hidden bg-black ring-1 ring-white/[0.04] shadow-2xl shadow-black/60">
          <button
            onClick={handleFullscreen}
            className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all"
            title="Pantalla completa"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <div className="aspect-video">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-[#0D0D11]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-[#F47521]/20 border-t-[#F47521] rounded-full animate-spin" />
                  <p className="text-white/30 text-xs">Cargando reproductor...</p>
                </div>
              </div>
            ) : error || !embedUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-[#0D0D11]">
                <div className="text-center px-6">
                  <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">Servidor no disponible</h3>
                  <p className="text-white/30 text-xs mb-4 max-w-sm">No pudimos cargar el reproductor.</p>
                  <a href={directUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F47521] hover:bg-[#D4621A] text-white font-bold text-sm rounded-full transition-all">
                    <ExternalLink className="w-4 h-4" />Ver en AnimeFLV
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                title={`${title} - Episodio ${episode}`}
              />
            )}
          </div>
        </div>

        {/* Below player */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
            <p className="text-sm text-[#F47521] font-semibold mt-0.5">Episodio {episode}</p>
          </div>
          <a href={directUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/50 text-xs font-medium hover:text-[#F47521] hover:bg-white/[0.08] transition-all border border-white/[0.04]">
            <ExternalLink className="w-3 h-3" />AnimeFLV
          </a>
        </div>

        {/* Episode navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button onClick={() => onEpisodeChange(episode - 1)} disabled={episode <= 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Episodio</span> {episode - 1}
          </button>
          <button onClick={() => onAnimeClick(animeId)}
            className="px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/60 hover:text-[#F47521] hover:bg-[#F47521]/[0.06] hover:border-[#F47521]/20 transition-all">
            Ver todos los episodios
          </button>
          <button onClick={() => onEpisodeChange(episode + 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/60 hover:bg-white/[0.08] hover:text-white transition-all">
            <span className="hidden sm:inline">Episodio</span> {episode + 1}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Servers */}
        {servers.length > 0 && (
          <div className="mt-6 bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-[#F47521]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Servidores</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {servers.map((s, idx) => (
                <button key={idx} onClick={() => setSelected(idx)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    idx === selected
                      ? 'bg-[#F47521] text-white shadow-lg shadow-[#F47521]/20'
                      : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
                  }`}>
                  <MonitorPlay className="w-3.5 h-3.5" />
                  {s.title || s.server || `Server ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
