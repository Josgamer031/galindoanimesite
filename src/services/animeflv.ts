import type { Anime, AnimeDetail, Episode, EpisodeServer } from '../types';

const API_BASE = '/api';
const BASE_URL = 'https://www4.animeflv.net';
const IMG_BASE = 'https://animeflv.net';

// Check if backend is available
let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    backendAvailable = response.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

// Helper to make API calls to the Python backend
async function apiCall<T>(endpoint: string): Promise<T | null> {
  const hasBackend = await checkBackend();
  if (!hasBackend) return null;
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// Image URL helpers
function fixImg(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return IMG_BASE + url;
  return url;
}

function svgPlaceholder(title: string): string {
  const h = Math.abs([...title].reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0)) % 360;
  const t = encodeURIComponent(title.substring(0, 18));
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${h},55%,22%)"/><stop offset="100%" stop-color="hsl(${h+30},45%,12%)"/></linearGradient></defs><rect fill="url(#g)" width="300" height="420" rx="8"/><text x="150" y="210" fill="rgba(255,255,255,.6)" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`)}`;
}

function isPlayableUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|m3u8|mpd)(?:\?.*)?$/i.test(url);
}

function normalizeUrl(url: string, base?: string): string {
  if (!url) return '';
  if (/^\/\//.test(url)) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  if (!base) return url;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

// Resolve playable media URL via Python backend proxy
export async function resolvePlayableMedia(url: string, _base?: string): Promise<string> {
  const candidate = normalizeUrl(url);
  if (!candidate) return '';
  if (isPlayableUrl(candidate)) return candidate;

  try {
    const response = await apiCall<{ mediaUrl: string }>(`/proxy?url=${encodeURIComponent(candidate)}`);
    return response?.mediaUrl || '';
  } catch {
    return '';
  }
}

// ==================== PUBLIC API ====================

export async function getLatestEpisodes(): Promise<Episode[]> {
  const response = await apiCall<{ episodes: Episode[] }>('/latest-episodes');
  if (response?.episodes && response.episodes.length > 0) {
    return response.episodes;
  }
  return FALLBACK_EPISODES;
}

export async function getOnAirAnimes(): Promise<Anime[]> {
  const response = await apiCall<{ animes: Anime[] }>('/on-air');
  if (response?.animes && response.animes.length > 0) {
    return response.animes;
  }
  return FALLBACK_ANIMES;
}

export async function searchAnime(query: string): Promise<Anime[]> {
  const response = await apiCall<{ animes: Anime[] }>(`/search?q=${encodeURIComponent(query)}`);
  if (response?.animes && response.animes.length > 0) {
    return response.animes;
  }
  // Fallback: filter local data
  const q = query.toLowerCase();
  return FALLBACK_ANIMES.filter(a => 
    a.title.toLowerCase().includes(q) || 
    a.synopsis.toLowerCase().includes(q)
  );
}

export async function getAnimesByGenre(genre: string, page = 1): Promise<Anime[]> {
  const response = await apiCall<{ animes: Anime[] }>(`/genre/${encodeURIComponent(genre)}?page_num=${page}`);
  if (response?.animes && response.animes.length > 0) {
    return response.animes;
  }
  // Fallback: filter local data
  return FALLBACK_ANIMES.filter(a => 
    a.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
  );
}

export async function getDirectoryAnimes(page = 1, order = 'rating'): Promise<Anime[]> {
  const response = await apiCall<{ animes: Anime[] }>(`/directory?page_num=${page}&order=${order}`);
  if (response?.animes && response.animes.length > 0) {
    return response.animes;
  }
  return FALLBACK_ANIMES;
}

export async function getAnimeDetail(animeId: string): Promise<AnimeDetail | null> {
  const response = await apiCall<AnimeDetail & { error?: string }>(`/anime/${encodeURIComponent(animeId)}`);
  if (response && !response.error) {
    return response;
  }
  return fallbackDetail(animeId);
}

export async function getEpisodeServers(animeId: string, episode: number): Promise<EpisodeServer[]> {
  const response = await apiCall<{ servers: EpisodeServer[] }>(`/episode/${encodeURIComponent(animeId)}/${episode}`);
  if (response?.servers && response.servers.length > 0) {
    // Resolve media URLs for servers that don't have one
    const resolvedServers = await Promise.all(response.servers.map(async server => {
      if (server.mediaUrl) return server;
      const candidate = server.url || server.code || '';
      if (!candidate) return server;
      const resolved = await resolvePlayableMedia(candidate);
      return { ...server, mediaUrl: resolved || server.mediaUrl };
    }));
    return resolvedServers;
  }
  return [];
}

// ==================== FALLBACK DATA ====================
// IDs verified from actual AnimeFLV HTML — images served from animeflv.net

const cv = (id: number) => `${IMG_BASE}/uploads/animes/covers/${id}.jpg`;
const th = (id: number) => `${IMG_BASE}/uploads/animes/thumbs/${id}.jpg`;

export const FALLBACK_EPISODES: Episode[] = [
  { title: 'One Piece',                     chapter: 1161, cover: th(7),    url: `${BASE_URL}/ver/one-piece-tv-1161`,   animeId: 'one-piece-tv' },
  { title: 'Re:Zero 4th Season',             chapter: 5,    cover: th(4371), url: `${BASE_URL}/ver/rezero-kara-hajimeru-isekai-seikatsu-4th-season-5`, animeId: 'rezero-kara-hajimeru-isekai-seikatsu-4th-season' },
  { title: 'Tongari Boushi no Atelier',      chapter: 7,    cover: th(4361), url: `${BASE_URL}/ver/tongari-boushi-no-atelier-7`, animeId: 'tongari-boushi-no-atelier' },
  { title: 'Liar Game',                      chapter: 6,    cover: th(4363), url: `${BASE_URL}/ver/liar-game-6`,        animeId: 'liar-game' },
  { title: 'Kill Ao',                        chapter: 5,    cover: th(4381), url: `${BASE_URL}/ver/kill-ao-5`,          animeId: 'kill-ao' },
  { title: 'Yozakura-san Chi 2nd Season',    chapter: 5,    cover: th(4385), url: `${BASE_URL}/ver/yozakurasan-chi-no-daisakusen-2nd-season-5`, animeId: 'yozakurasan-chi-no-daisakusen-2nd-season' },
  { title: 'Akane-banashi',                  chapter: 6,    cover: th(4354), url: `${BASE_URL}/ver/akanebanashi-6`,     animeId: 'akanebanashi' },
  { title: 'Tsue to Tsurugi no Wistoria S2', chapter: 5,    cover: th(4384), url: `${BASE_URL}/ver/tsue-to-tsurugi-no-wistoria-season-2-5`, animeId: 'tsue-to-tsurugi-no-wistoria-season-2' },
  { title: 'Diamond no Ace: Act II S2',      chapter: 6,    cover: th(4356), url: `${BASE_URL}/ver/diamond-no-ace-act-ii-second-season-6`, animeId: 'diamond-no-ace-act-ii-second-season' },
  { title: 'Marriagetoxin',                  chapter: 6,    cover: th(4365), url: `${BASE_URL}/ver/marriagetoxin-6`,    animeId: 'marriagetoxin' },
  { title: 'Needy Girl Overdose',            chapter: 6,    cover: th(4353), url: `${BASE_URL}/ver/needy-girl-overdose-6`, animeId: 'needy-girl-overdose' },
  { title: 'Otaku ni Yasashii Gal wa Inai!?',chapter: 5,    cover: th(4372), url: `${BASE_URL}/ver/otaku-ni-yasashii-gal-wa-inai-5`, animeId: 'otaku-ni-yasashii-gal-wa-inai' },
];

export const FALLBACK_ANIMES: Anime[] = [
  { id: 'aishiteru-game-wo-owarasetai',        title: 'Aishiteru Game wo Owarasetai',                cover: cv(4387), synopsis: 'En sexto grado, los amigos de la infancia Yukiya y Miku crearon un juego con el objetivo de avergonzar al otro al turno de decir "te quiero". Cuatro años despues, siguen intentando ganar.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/aishiteru-game-wo-owarasetai`, status: 'En emision', genres: ['Romance','Escolares','Comedia'] },
  { id: 'kuroneko-to-majo-no-kyoushitsu',       title: 'Kuroneko to Majo no Kyoushitsu',              cover: cv(4386), synopsis: 'La Academia Real Diana es una prestigiosa institucion que acepta a individuos con excepcionales habilidades magicas.', rating: '4.0', type: 'Anime', url: `${BASE_URL}/anime/kuroneko-to-majo-no-kyoushitsu`, status: 'En emision', genres: ['Fantasia','Magia'] },
  { id: 'yozakurasan-chi-no-daisakusen-2nd-season', title: 'Yozakura-san Chi no Daisakusen 2nd Season', cover: cv(4385), synopsis: 'Segunda temporada de Yozakura-san Chi no Daisakusen.', rating: '4.4', type: 'Anime', url: `${BASE_URL}/anime/yozakurasan-chi-no-daisakusen-2nd-season`, status: 'En emision', genres: ['Accion','Comedia','Shounen'] },
  { id: 'tsue-to-tsurugi-no-wistoria-season-2', title: 'Tsue to Tsurugi no Wistoria Season 2',        cover: cv(4384), synopsis: 'Segunda temporada de Tsue to Tsurugi no Wistoria.', rating: '4.7', type: 'Anime', url: `${BASE_URL}/anime/tsue-to-tsurugi-no-wistoria-season-2`, status: 'En emision', genres: ['Accion','Fantasia'] },
  { id: 'kill-ao',                              title: 'Kill Ao',                                     cover: cv(4381), synopsis: 'Juuzou Oogami es un legendario asesino a sueldo que nunca ha fallado una mision. Un dia, es picado por una misteriosa avispa y se transforma.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/kill-ao`, status: 'En emision', genres: ['Accion','Comedia'] },
  { id: 'rezero-kara-hajimeru-isekai-seikatsu-4th-season', title: 'Re:Zero kara Hajimeru Isekai Seikatsu 4th Season', cover: cv(4371), synopsis: 'Cuarta temporada de Re:Zero kara Hajimeru Isekai Seikatsu.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/rezero-kara-hajimeru-isekai-seikatsu-4th-season`, status: 'En emision', genres: ['Drama','Fantasia','Suspenso'] },
  { id: 'otaku-ni-yasashii-gal-wa-inai',        title: 'Otaku ni Yasashii Gal wa Inai!?',             cover: cv(4372), synopsis: 'Conoce a Takuya Seo, un otaku que se sienta detras de las populares chicas de la clase. Cuando sus mundos chocan por una goma de borrar prestada, comienza una historia inesperada.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/otaku-ni-yasashii-gal-wa-inai`, status: 'En emision', genres: ['Comedia','Romance','Escolares'] },
  { id: 'marriagetoxin',                        title: 'Marriagetoxin',                               cover: cv(4365), synopsis: 'Hikaru Gero, heredero de una infame familia de Maestros del Veneno, ha vivido toda su vida perfeccionando el arte del asesinato.', rating: '4.2', type: 'Anime', url: `${BASE_URL}/anime/marriagetoxin`, status: 'En emision', genres: ['Accion','Comedia','Shounen'] },
  { id: 'tongari-boushi-no-atelier',             title: 'Tongari Boushi no Atelier',                   cover: cv(4361), synopsis: 'Un mundo donde la magia se realiza dibujando glifos, y una joven descubre un secreto que cambiara su vida.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/tongari-boushi-no-atelier`, status: 'En emision', genres: ['Aventuras','Fantasia','Magia'] },
  { id: 'liar-game',                            title: 'Liar Game',                                   cover: cv(4363), synopsis: 'Un juego psicologico donde los participantes deben enganar a otros para sobrevivir.', rating: '4.3', type: 'Anime', url: `${BASE_URL}/anime/liar-game`, status: 'En emision', genres: ['Psicologico','Drama','Suspenso'] },
  { id: 'akanebanashi',                         title: 'Akane-banashi',                                cover: cv(4354), synopsis: 'La historia de una joven que busca convertirse en la mejor narradora de rakugo.', rating: '4.4', type: 'Anime', url: `${BASE_URL}/anime/akanebanashi`, status: 'En emision', genres: ['Drama','Shounen'] },
  { id: 'one-piece-tv',                         title: 'One Piece',                                   cover: cv(7),    synopsis: 'Una historia epica de piratas donde Monkey D. Luffy busca el legendario tesoro One Piece para convertirse en el Rey de los Piratas.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/one-piece-tv`, status: 'En emision', genres: ['Accion','Aventuras','Comedia','Shounen'] },
  { id: 'needy-girl-overdose',                  title: 'Needy Girl Overdose',                          cover: cv(4353), synopsis: 'Adaptacion anime del popular juego Needy Girl Overdose.', rating: '4.0', type: 'Anime', url: `${BASE_URL}/anime/needy-girl-overdose`, status: 'En emision', genres: ['Drama','Psicologico'] },
  { id: 'kamiina-botan-yoeru-sugata-wa-yuri-no-hana', title: 'Kamiina Botan, Yoeru Sugata wa Yuri no Hana', cover: cv(4380), synopsis: 'Kamiina Botan empieza su vida universitaria y se ve envuelta en relaciones inesperadas.', rating: '4.2', type: 'Anime', url: `${BASE_URL}/anime/kamiina-botan-yoeru-sugata-wa-yuri-no-hana`, status: 'En emision', genres: ['Romance','Yuri'] },
];

function fallbackDetail(animeId: string): AnimeDetail {
  const fb = FALLBACK_ANIMES.find(a => a.id === animeId);
  const eps: { episode: number; id: number }[] = [];
  const n = 12 + Math.floor(Math.random() * 14);
  for (let i = 1; i <= n; i++) eps.push({ episode: i, id: 50000 + i });
  return {
    title: fb?.title || animeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    alternativeTitles: [], status: fb?.status || 'En emision', rating: fb?.rating || '4.5',
    type: fb?.type || 'Anime', cover: fb?.cover || svgPlaceholder(animeId),
    synopsis: fb?.synopsis || 'Sinopsis no disponible.', genres: fb?.genres || ['Accion', 'Aventura'],
    episodeList: eps, url: `${BASE_URL}/anime/${animeId}`, related: [],
  };
}

export { svgPlaceholder };

export const GENRES = [
  'Accion','Artes Marciales','Aventuras','Carreras','Ciencia Ficcion',
  'Comedia','Demencia','Demonios','Deportes','Drama','Ecchi',
  'Escolares','Espacial','Fantasia','Harem','Historico','Infantil',
  'Josei','Juegos','Magia','Mecha','Militar','Misterio','Musica',
  'Parodia','Policia','Psicologico','Recuentos de la vida','Romance',
  'Samurai','Seinen','Shoujo','Shounen','Sobrenatural','Superpoderes',
  'Suspenso','Terror','Vampiros','Yaoi','Yuri',
];
