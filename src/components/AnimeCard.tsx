import { useState, useMemo } from 'react';
import { Star, Heart } from 'lucide-react';
import type { Anime } from '../types';
import { isFavorite, toggleFavorite } from '../services/favorites';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

function svgPlaceholder(title: string, hue: number, w = 300, h = 450): string {
  const t = title.substring(0, 18);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue},60%,22%)"/><stop offset="100%" stop-color="hsl(${hue+30},50%,12%)"/></linearGradient></defs><rect fill="url(#g)" width="${w}" height="${h}"/><text x="${w/2}" y="${h/2}" fill="rgba(255,255,255,0.55)" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`
  )}`;
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export default function AnimeCard({ anime, onClick }: AnimeCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const [isFav, setIsFav] = useState(() => isFavorite(anime.id));
  const hue = hashHue(anime.title);
  const imgSrc = imgErr || !anime.cover ? svgPlaceholder(anime.title, hue) : anime.cover;

  const handleFavToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleFavorite(anime.id, anime.title, anime.cover);
    setIsFav(newState);
  };

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[20px] text-left w-full focus:outline-none surface-card shadow-xl"
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#1F2027]">
        <img
          src={imgSrc}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={() => setImgErr(true)}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite button */}
        <button
          onClick={handleFavToggle}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#F47521]/80 duration-300 z-20"
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#F47521] text-[#F47521]' : 'text-white'}`} />
        </button>

        {/* Hover info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {anime.synopsis && (
            <p className="text-[11px] text-white/80 line-clamp-3 mb-2 leading-relaxed">{anime.synopsis}</p>
          )}
          <div className="flex items-center gap-2">
            {anime.rating && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#FFD233]">
                <Star className="w-3 h-3" fill="currentColor" />{anime.rating}
              </span>
            )}
            {anime.status && (
              <span className={`text-[11px] font-medium ${anime.status.toLowerCase().includes('emisi') ? 'text-green-400' : 'text-white/40'}`}>
                {anime.status}
              </span>
            )}
          </div>
        </div>

        {/* Type badge */}
        {anime.type && anime.type !== 'Anime' && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-[#F47521]/90 text-white">
            {anime.type}
          </span>
        )}

        {/* Orange bottom bar on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F47521] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>

      {/* Title */}
      <div className="pt-2.5 pb-1">
        <h3 className="text-[13px] font-semibold text-white/90 line-clamp-2 group-hover:text-[#F47521] transition-colors leading-snug">
          {anime.title}
        </h3>
        {anime.status && (
          <p className={`text-[11px] mt-0.5 font-medium ${anime.status.toLowerCase().includes('emisi') ? 'text-[#F47521]/70' : 'text-white/25'}`}>
            {anime.status === 'En emisión' ? '● En emisión' : anime.type}
          </p>
        )}
      </div>
    </button>
  );
}
