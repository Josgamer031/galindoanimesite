import type { Anime, AnimeDetail, Episode, EpisodeServer } from '../types';

const BASE_URL = 'https://www4.animeflv.net';
const IMG_BASE = 'https://animeflv.net';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?url=',
];

const AD_BLOCK_PATTERNS = [
  'doubleclick.net',
  'googlesyndication.com',
  'pagead2.googlesyndication.com',
  'adservice.google.com',
  'adsystem.com',
  'adserver.',
  'adnetwork.',
  'adclick.',
  'click.',
  'redirect',
  'track',
  'utm_',
  'ads.',
  'adsense',
  'adblock',
  'advert',
  'banner',
  'sponsor',
  'outbrain',
  'taboola',
  'rubiconproject',
];

let proxyIdx = 0;
function nextProxy() { proxyIdx = (proxyIdx + 1) % CORS_PROXIES.length; }

function isAdUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return AD_BLOCK_PATTERNS.some(pattern => normalized.includes(pattern));
}

function isRedirectScriptContent(text: string): boolean {
  const normalized = text.toLowerCase();
  return /location\.(href|replace|assign)|window\.location|document\.location|top\.location|parent\.location|location\s*=|location\.assign|location\.replace|meta[^>]*http-equiv=["']refresh["']/.test(normalized);
}

function removeAdsFromHtml(html: string): string {
  const d = new DOMParser().parseFromString(html, 'text/html');

  const shouldRemove = (el: Element): boolean => {
    const src = (el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('href') || '').toLowerCase();
    const cls = (el.getAttribute('class') || '').toLowerCase();
    if (src && isAdUrl(src)) return true;
    if (cls && /\b(ad|ads|advert|sponsor|doubleclick|googlesyndication|adunit|adsense|adslot)\b/.test(cls)) return true;
    if (el.tagName === 'INS' || el.tagName === 'ASIDE' || el.tagName === 'META') return true;
    return false;
  };

  d.querySelectorAll('script,iframe,ins,link,div,aside,meta').forEach(el => {
    if (shouldRemove(el)) {
      el.remove();
      return;
    }
    if (el.tagName === 'SCRIPT' && isRedirectScriptContent(el.textContent || '')) {
      el.remove();
    }
  });

  return d.documentElement.outerHTML;
}

function fetchTimeout(url: string, ms = 8000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal }).finally(() => clearTimeout(t));
}

async function fetchProxy(url: string): Promise<string> {
  if (isAdUrl(url)) throw new Error('Blocked ad request');

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const res = await fetchTimeout(CORS_PROXIES[proxyIdx] + encodeURIComponent(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      if (txt.length < 200) throw new Error('Short response');
      return removeAdsFromHtml(txt);
    } catch {
      nextProxy();
    }
  }
  throw new Error('All proxies failed');
}

function doc(html: string) { return new DOMParser().parseFromString(html, 'text/html'); }

function isPlayableUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|m3u8|mpd)(?:\?.*)?$/i.test(url);
}

function findPlayableUrl(text: string): string {
  if (!text) return '';
  const urlExpr = /["'`]((?:(?:https?:)?\/\/[^"'`\s]+|\/[^"'`\s]+|[^"'`\s]+?\/(?:[^"'`\s]+))\.(?:mp4|webm|ogg|m3u8|mpd)(?:\?[^"'`\s]*)?)["'`]/gi;
  let match: RegExpExecArray | null;
  while ((match = urlExpr.exec(text)) !== null) {
    if (match[1]) return match[1];
  }

  const genericExpr = /(?:file|src|url)\s*[:=]\s*["'`]((?:(?:https?:)?\/\/[^"'`\s]+|\/[^"'`\s]+|[^"'`\s]+?\/(?:[^"'`\s]+)))["'`]/i;
  const generic = text.match(genericExpr);
  if (generic?.[1] && isPlayableUrl(generic[1])) return generic[1];

  return '';
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

export async function resolvePlayableMedia(url: string, base?: string): Promise<string> {
  const candidate = normalizeUrl(url, base);
  if (!candidate) return '';
  if (isPlayableUrl(candidate)) return candidate;

  try {
    const html = await fetchProxy(candidate);
    const mediaInPage = findPlayableUrl(html);
    if (mediaInPage) return normalizeUrl(mediaInPage, candidate);

    const d = doc(html);
    const videoEl = d.querySelector('video');
    if (videoEl) {
      const direct = videoEl.getAttribute('src') || videoEl.querySelector('source')?.getAttribute('src');
      if (direct && isPlayableUrl(direct)) return normalizeUrl(direct, candidate);
    }
    const sourceEl = d.querySelector('source');
    if (sourceEl) {
      const direct = sourceEl.getAttribute('src');
      if (direct && isPlayableUrl(direct)) return normalizeUrl(direct, candidate);
    }

    const iframe = d.querySelector('iframe');
    const frameSrc = iframe?.getAttribute('src') || iframe?.src || '';
    if (frameSrc) {
      const nested = normalizeUrl(frameSrc, candidate);
      if (isPlayableUrl(nested)) return nested;
      const resolved = await resolvePlayableMedia(nested, candidate);
      if (resolved) return resolved;
    }
  } catch {
    // ignore fetch failures
  }

  return '';
}

function extractMediaUrl(url?: string, code?: string): string {
  const normalizedUrl = url ? normalizeUrl(url) : '';
  if (normalizedUrl && isPlayableUrl(normalizedUrl)) return normalizedUrl;
  const fromCode = findPlayableUrl(code || '');
  if (fromCode) return normalizeUrl(fromCode, normalizedUrl);

  if (!code) return '';
  const parsed = new DOMParser().parseFromString(code, 'text/html');
  const videoEl = parsed.querySelector('video');
  if (videoEl) {
    const direct = videoEl.getAttribute('src') || videoEl.querySelector('source')?.getAttribute('src');
    if (direct && isPlayableUrl(direct)) return direct;
  }
  const sourceEl = parsed.querySelector('source');
  if (sourceEl) {
    const direct = sourceEl.getAttribute('src');
    if (direct && isPlayableUrl(direct)) return direct;
  }
  const iframe = parsed.querySelector('iframe');
  const frameSrc = iframe?.getAttribute('src') || iframe?.src;
  if (frameSrc && isPlayableUrl(frameSrc)) return frameSrc;

  return '';
}

// Image URL helpers — AnimeFLV uses /uploads/animes/covers/{id}.jpg and /uploads/animes/thumbs/{id}.jpg
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

function epIdFromUrl(url: string): string {
  const m = url.match(/\/ver\/(.+)-\d+$/);
  return m ? m[1] : '';
}

// ==================== PUBLIC API ====================

export async function getLatestEpisodes(): Promise<Episode[]> {
  try {
    const html = await fetchProxy(BASE_URL);
    const d = doc(html);
    const eps: Episode[] = [];
    // From the homepage HTML: <ul> with <li> containing <a href="/ver/...">
    d.querySelectorAll('ul li a[href*="/ver/"]').forEach(a => {
      const href = a.getAttribute('href') || '';
      const chapMatch = href.match(/-(\d+)$/);
      if (!chapMatch) return;
      const img = a.querySelector('img');
      const strong = a.querySelector('strong');
      eps.push({
        title: strong?.textContent?.trim() || '',
        chapter: parseInt(chapMatch[1]),
        cover: fixImg(img?.getAttribute('src') || ''),
        url: href.startsWith('/') ? BASE_URL + href : href,
        animeId: epIdFromUrl(href),
      });
    });
    return eps.length > 0 ? eps : FALLBACK_EPISODES;
  } catch {
    return FALLBACK_EPISODES;
  }
}

export async function getOnAirAnimes(): Promise<Anime[]> {
  try {
    const html = await fetchProxy(BASE_URL);
    const d = doc(html);
    const animes: Anime[] = [];
    // Anime list from homepage: <article> elements with covers
    d.querySelectorAll('article').forEach(art => {
      const a = art.querySelector('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.includes('/anime/')) return;
      const id = href.replace(/.*\/anime\//, '');
      const img = art.querySelector('figure img');
      const h3 = art.querySelector('h3');
      const spans = art.querySelectorAll('div > p > span');
      const type = spans[0]?.textContent?.trim() || 'Anime';
      const rating = spans[1]?.textContent?.trim() || '';
      const synopsis = art.querySelectorAll('div > p');
      const synText = synopsis.length >= 3 ? synopsis[2]?.textContent?.trim() : '';
      animes.push({
        id,
        title: h3?.textContent?.trim() || '',
        cover: fixImg(img?.getAttribute('src') || ''),
        synopsis: synText || '',
        rating,
        type,
        url: href.startsWith('/') ? BASE_URL + href : href,
        status: art.querySelector('span span')?.textContent?.includes('ESTRENO') ? 'En emisión' : '',
      });
    });
    return animes.length > 0 ? animes : FALLBACK_ANIMES;
  } catch {
    return FALLBACK_ANIMES;
  }
}

export async function searchAnime(query: string): Promise<Anime[]> {
  try {
    const r = await parseAnimeBrowse(`${BASE_URL}/browse?q=${encodeURIComponent(query)}`);
    if (r.length > 0) return r;
    const q = query.toLowerCase();
    return FALLBACK_ANIMES.filter(a => a.title.toLowerCase().includes(q) || a.synopsis.toLowerCase().includes(q));
  } catch {
    const q = query.toLowerCase();
    return FALLBACK_ANIMES.filter(a => a.title.toLowerCase().includes(q) || a.synopsis.toLowerCase().includes(q));
  }
}

export async function getAnimesByGenre(genre: string, page = 1): Promise<Anime[]> {
  try {
    const r = await parseAnimeBrowse(`${BASE_URL}/browse?genre%5B%5D=${encodeURIComponent(genre)}&order=rating&page=${page}`);
    return r.length > 0 ? r : FALLBACK_ANIMES.filter(a => a.genres?.some(g => g.toLowerCase() === genre.toLowerCase()));
  } catch {
    return FALLBACK_ANIMES.filter(a => a.genres?.some(g => g.toLowerCase() === genre.toLowerCase()));
  }
}

export async function getDirectoryAnimes(page = 1, order = 'rating'): Promise<Anime[]> {
  try {
    const r = await parseAnimeBrowse(`${BASE_URL}/browse?order=${order}&page=${page}`);
    return r.length > 0 ? r : FALLBACK_ANIMES;
  } catch {
    return FALLBACK_ANIMES;
  }
}

export async function getAnimeDetail(animeId: string): Promise<AnimeDetail | null> {
  // Step 1: Try direct AnimeFLV fetch
  const directResult = await tryAnimeFlvDetail(animeId);
  if (directResult) return directResult;

  // Step 2: Search AnimeFLV by title derived from slug
  try {
    const query = animeId.replace(/-/g, ' ').replace(/\b(tv|season|2nd|3rd|4th)\b/gi, '').trim();
    const searchResults = await searchAnime(query);
    if (searchResults.length > 0) {
      const best = searchResults[0];
      if (best.id !== animeId) {
        const found = await tryAnimeFlvDetail(best.id);
        if (found) return found;
      }
    }
  } catch { /**/ }

  return fallbackDetail(animeId);
}

// Direct AnimeFLV page fetch
async function tryAnimeFlvDetail(animeId: string): Promise<AnimeDetail | null> {
  try {
    const html = await fetchProxy(`${BASE_URL}/anime/${animeId}`);
    const d = doc(html);
    const title = d.querySelector('h1.Title, .Ficha h1, h1')?.textContent?.trim() || '';
    if (!title) return null;
    const synopsis = d.querySelector('.Description p, .Synopsis p, .Description')?.textContent?.trim() || '';
    const cover = fixImg(d.querySelector('.AnimeCover img, .Image img, figure img')?.getAttribute('src') || '');
    const rating = d.querySelector('.Vts, .vtprmd')?.textContent?.trim() || '4.5';
    const status = d.querySelector('.AnmStts span, .status')?.textContent?.trim() || 'En emisión';
    const type = d.querySelector('.Type')?.textContent?.trim() || 'Anime';
    const genres: string[] = [];
    d.querySelectorAll('.Nvgnrs a, nav a[href*="genre"]').forEach(el => { const t = el.textContent?.trim(); if (t) genres.push(t); });
    const altTitles: string[] = [];
    d.querySelectorAll('.TxtAlt, span.TxtAlt').forEach(el => { const t = el.textContent?.trim(); if (t) altTitles.push(t); });
    const episodeList: { episode: number; id: number }[] = [];
    d.querySelectorAll('script').forEach(s => {
      const c = s.textContent || '';
      const m = c.match(/var\s+episodes\s*=\s*(\[.*?\]);/s);
      if (m) try { JSON.parse(m[1]).forEach((ep: number[]) => episodeList.push({ episode: ep[0], id: ep[1] })); } catch { /**/ }
    });
    if (episodeList.length === 0) {
      d.querySelectorAll('a[href*="/ver/"]').forEach(el => {
        const href = el.getAttribute('href') || '';
        const m = href.match(/-(\d+)$/);
        if (m && href.includes(animeId)) {
          const n = parseInt(m[1]);
          if (!episodeList.find(e => e.episode === n)) episodeList.push({ episode: n, id: 0 });
        }
      });
    }
    episodeList.sort((a, b) => a.episode - b.episode);
    return { title, alternativeTitles: altTitles, status, rating, type, cover, synopsis, genres: genres.length > 0 ? genres : ['Acción','Aventura'], episodeList, url: `${BASE_URL}/anime/${animeId}`, related: [] };
  } catch {
    return null;
  }
}

export async function getEpisodeServers(animeId: string, episode: number): Promise<EpisodeServer[]> {
  try {
    const html = await fetchProxy(`${BASE_URL}/ver/${animeId}-${episode}`);
    const d = doc(html);
    const servers: EpisodeServer[] = [];
    d.querySelectorAll('script').forEach(s => {
      const c = s.textContent || '';
      const m = c.match(/var\s+videos\s*=\s*(\{.*?\});/s);
      if (m) try {
        const p = JSON.parse(m[1]);
        if (p.SUB) p.SUB.forEach((v: { server: string; title: string; url?: string; code?: string }) => {
          const url = v.url || v.code || '';
          if (!isAdUrl(url)) {
            servers.push({
              server: v.server || '',
              title: v.title || v.server || '',
              url: v.url || '',
              code: v.code || '',
              mediaUrl: extractMediaUrl(v.url, v.code),
            });
          }
        });
      } catch { /**/ }
    });
    if (!servers.length) d.querySelectorAll('iframe').forEach(f => {
      const src = f.getAttribute('src') || f.getAttribute('data-src') || '';
      if (src && !isAdUrl(src)) servers.push({
        server: 'default',
        title: 'Reproductor',
        url: src,
        code: src,
        mediaUrl: extractMediaUrl(src, src),
      });
    });

    const resolvedServers = await Promise.all(servers.map(async server => {
      if (server.mediaUrl) return server;
      const candidate = server.url || server.code || '';
      const resolved = candidate ? await resolvePlayableMedia(candidate, `${BASE_URL}/ver/${animeId}-${episode}`) : '';
      return { ...server, mediaUrl: resolved || server.mediaUrl };
    }));

    return resolvedServers;
  } catch {
    return [];
  }
}

// ==================== HELPERS ====================

async function parseAnimeBrowse(url: string): Promise<Anime[]> {
  const html = await fetchProxy(url);
  const d = doc(html);
  const animes: Anime[] = [];
  // Browse pages use <article> inside <ul class="ListAnimes"> 
  d.querySelectorAll('article').forEach(art => {
    const a = art.querySelector('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.includes('/anime/')) return;
    const id = href.replace(/.*\/anime\//, '');
    const img = art.querySelector('figure img');
    const h3 = art.querySelector('h3');
    const spans = art.querySelectorAll('div > p > span');
    const type = spans[0]?.textContent?.trim() || 'Anime';
    const rating = spans[1]?.textContent?.trim() || '';
    const pars = art.querySelectorAll('div > p');
    const synText = pars.length >= 3 ? pars[2]?.textContent?.trim() : '';
    animes.push({
      id, title: h3?.textContent?.trim() || '',
      cover: fixImg(img?.getAttribute('src') || ''),
      synopsis: synText || '', rating, type,
      url: href.startsWith('/') ? BASE_URL + href : href,
    });
  });
  return animes;
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
  { id: 'aishiteru-game-wo-owarasetai',        title: 'Aishiteru Game wo Owarasetai',                cover: cv(4387), synopsis: 'En sexto grado, los amigos de la infancia Yukiya y Miku crearon un juego con el objetivo de avergonzar al otro al turno de decir "te quiero". Cuatro años después, siguen intentando ganar.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/aishiteru-game-wo-owarasetai`, status: 'En emisión', genres: ['Romance','Escolares','Comedia'] },
  { id: 'kuroneko-to-majo-no-kyoushitsu',       title: 'Kuroneko to Majo no Kyoushitsu',              cover: cv(4386), synopsis: 'La Academia Real Diana es una prestigiosa institución que acepta a individuos con excepcionales habilidades mágicas.', rating: '4.0', type: 'Anime', url: `${BASE_URL}/anime/kuroneko-to-majo-no-kyoushitsu`, status: 'En emisión', genres: ['Fantasía','Magia'] },
  { id: 'yozakurasan-chi-no-daisakusen-2nd-season', title: 'Yozakura-san Chi no Daisakusen 2nd Season', cover: cv(4385), synopsis: 'Segunda temporada de Yozakura-san Chi no Daisakusen.', rating: '4.4', type: 'Anime', url: `${BASE_URL}/anime/yozakurasan-chi-no-daisakusen-2nd-season`, status: 'En emisión', genres: ['Acción','Comedia','Shounen'] },
  { id: 'tsue-to-tsurugi-no-wistoria-season-2', title: 'Tsue to Tsurugi no Wistoria Season 2',        cover: cv(4384), synopsis: 'Segunda temporada de Tsue to Tsurugi no Wistoria.', rating: '4.7', type: 'Anime', url: `${BASE_URL}/anime/tsue-to-tsurugi-no-wistoria-season-2`, status: 'En emisión', genres: ['Acción','Fantasía'] },
  { id: 'kill-ao',                              title: 'Kill Ao',                                     cover: cv(4381), synopsis: 'Juuzou Oogami es un legendario asesino a sueldo que nunca ha fallado una misión. Un día, es picado por una misteriosa avispa y se transforma.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/kill-ao`, status: 'En emisión', genres: ['Acción','Comedia'] },
  { id: 'rezero-kara-hajimeru-isekai-seikatsu-4th-season', title: 'Re:Zero kara Hajimeru Isekai Seikatsu 4th Season', cover: cv(4371), synopsis: 'Cuarta temporada de Re:Zero kara Hajimeru Isekai Seikatsu.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/rezero-kara-hajimeru-isekai-seikatsu-4th-season`, status: 'En emisión', genres: ['Drama','Fantasía','Suspenso'] },
  { id: 'otaku-ni-yasashii-gal-wa-inai',        title: 'Otaku ni Yasashii Gal wa Inai!?',             cover: cv(4372), synopsis: 'Conoce a Takuya Seo, un otaku que se sienta detrás de las populares chicas de la clase. Cuando sus mundos chocan por una goma de borrar prestada, comienza una historia inesperada.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/otaku-ni-yasashii-gal-wa-inai`, status: 'En emisión', genres: ['Comedia','Romance','Escolares'] },
  { id: 'marriagetoxin',                        title: 'Marriagetoxin',                               cover: cv(4365), synopsis: 'Hikaru Gero, heredero de una infame familia de Maestros del Veneno, ha vivido toda su vida perfeccionando el arte del asesinato.', rating: '4.2', type: 'Anime', url: `${BASE_URL}/anime/marriagetoxin`, status: 'En emisión', genres: ['Acción','Comedia','Shounen'] },
  { id: 'tongari-boushi-no-atelier',             title: 'Tongari Boushi no Atelier',                   cover: cv(4361), synopsis: 'Un mundo donde la magia se realiza dibujando glifos, y una joven descubre un secreto que cambiará su vida.', rating: '4.5', type: 'Anime', url: `${BASE_URL}/anime/tongari-boushi-no-atelier`, status: 'En emisión', genres: ['Aventuras','Fantasía','Magia'] },
  { id: 'liar-game',                            title: 'Liar Game',                                   cover: cv(4363), synopsis: 'Un juego psicológico donde los participantes deben engañar a otros para sobrevivir.', rating: '4.3', type: 'Anime', url: `${BASE_URL}/anime/liar-game`, status: 'En emisión', genres: ['Psicológico','Drama','Suspenso'] },
  { id: 'akanebanashi',                         title: 'Akane-banashi',                                cover: cv(4354), synopsis: 'La historia de una joven que busca convertirse en la mejor narradora de rakugo.', rating: '4.4', type: 'Anime', url: `${BASE_URL}/anime/akanebanashi`, status: 'En emisión', genres: ['Drama','Shounen'] },
  { id: 'one-piece-tv',                         title: 'One Piece',                                   cover: cv(7),    synopsis: 'Una historia épica de piratas donde Monkey D. Luffy busca el legendario tesoro One Piece para convertirse en el Rey de los Piratas.', rating: '4.6', type: 'Anime', url: `${BASE_URL}/anime/one-piece-tv`, status: 'En emisión', genres: ['Acción','Aventuras','Comedia','Shounen'] },
  { id: 'needy-girl-overdose',                  title: 'Needy Girl Overdose',                          cover: cv(4353), synopsis: 'Adaptación anime del popular juego Needy Girl Overdose.', rating: '4.0', type: 'Anime', url: `${BASE_URL}/anime/needy-girl-overdose`, status: 'En emisión', genres: ['Drama','Psicológico'] },
  { id: 'kamiina-botan-yoeru-sugata-wa-yuri-no-hana', title: 'Kamiina Botan, Yoeru Sugata wa Yuri no Hana', cover: cv(4380), synopsis: 'Kamiina Botan empieza su vida universitaria y se ve envuelta en relaciones inesperadas.', rating: '4.2', type: 'Anime', url: `${BASE_URL}/anime/kamiina-botan-yoeru-sugata-wa-yuri-no-hana`, status: 'En emisión', genres: ['Romance','Yuri'] },
];

function fallbackDetail(animeId: string): AnimeDetail {
  const fb = FALLBACK_ANIMES.find(a => a.id === animeId);
  const eps: { episode: number; id: number }[] = [];
  const n = 12 + Math.floor(Math.random() * 14);
  for (let i = 1; i <= n; i++) eps.push({ episode: i, id: 50000 + i });
  return {
    title: fb?.title || animeId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    alternativeTitles: [], status: fb?.status || 'En emisión', rating: fb?.rating || '4.5',
    type: fb?.type || 'Anime', cover: fb?.cover || svgPlaceholder(animeId),
    synopsis: fb?.synopsis || 'Sinopsis no disponible.', genres: fb?.genres || ['Acción', 'Aventura'],
    episodeList: eps, url: `${BASE_URL}/anime/${animeId}`, related: [],
  };
}

export { svgPlaceholder };

export const GENRES = [
  'Acción','Artes Marciales','Aventuras','Carreras','Ciencia Ficción',
  'Comedia','Demencia','Demonios','Deportes','Drama','Ecchi',
  'Escolares','Espacial','Fantasía','Harem','Histórico','Infantil',
  'Josei','Juegos','Magia','Mecha','Militar','Misterio','Música',
  'Parodia','Policía','Psicológico','Recuentos de la vida','Romance',
  'Samurai','Seinen','Shoujo','Shounen','Sobrenatural','Superpoderes',
  'Suspenso','Terror','Vampiros','Yaoi','Yuri',
];
