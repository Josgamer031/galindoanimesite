import { useState } from 'react';
import { Play } from 'lucide-react';
import type { Episode } from '../types';

function svgPlaceholder(title: string, hue: number): string {
  const t = title.substring(0, 20);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue},60%,22%)"/><stop offset="100%" stop-color="hsl(${hue+30},50%,12%)"/></linearGradient></defs><rect fill="url(#g)" width="400" height="225"/><text x="200" y="112" fill="rgba(255,255,255,0.55)" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`
  )}`;
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

interface EpisodeCardProps {
  episode: Episode;
  onClick: () => void;
}

export default function EpisodeCard({ episode, onClick }: EpisodeCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const hue = hashHue(episode.title);
  const imgSrc = imgErr || !episode.cover ? svgPlaceholder(episode.title, hue) : episode.cover;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[20px] text-left w-full focus:outline-none surface-card shadow-xl"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1F2027]">
        <img
          src={imgSrc}
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={() => setImgErr(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-[#F47521]/90 flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Episode badge */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F47521] text-white">
            E{episode.chapter}
          </span>
        </div>

        {/* Orange bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F47521] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>

      <div className="pt-2 pb-1">
        <h3 className="text-[13px] font-semibold text-white/90 line-clamp-1 group-hover:text-[#F47521] transition-colors">
          {episode.title}
        </h3>
        <p className="text-[11px] text-white/35 mt-0.5">Episodio {episode.chapter}</p>
      </div>
    </button>
  );
}
