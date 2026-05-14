import { useState, useCallback } from 'react';
import type { View } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import AnimeDetailView from './views/AnimeDetailView';
import EpisodeView from './views/EpisodeView';
import DirectoryView from './views/DirectoryView';
import GenreView from './views/GenreView';

interface AppState {
  view: View;
  searchQuery: string;
  animeId: string;
  episode: number;
  genre: string;
}

const INITIAL: AppState = { view: 'home', searchQuery: '', animeId: '', episode: 1, genre: '' };

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL);
  const [, setHistory] = useState<AppState[]>([]);

  const push = useCallback((patch: Partial<AppState>) => {
    setState(prev => { setHistory(h => [...h, prev]); return { ...prev, ...patch }; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length > 0) { setState(h[h.length - 1]); return h.slice(0, -1); }
      setState(INITIAL); return [];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigate = useCallback((view: View) => push({ view, searchQuery: '', animeId: '', episode: 1, genre: '' }), [push]);
  const search = useCallback((q: string) => push({ view: 'search', searchQuery: q }), [push]);
  const openAnime = useCallback((id: string) => push({ view: 'anime', animeId: id }), [push]);
  const openEpisode = useCallback((id: string, ep: number) => push({ view: 'episode', animeId: id, episode: ep }), [push]);
  const changeEp = useCallback((ep: number) => { setState(p => ({ ...p, episode: ep })); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const openGenre = useCallback((g: string) => push({ view: 'genre', genre: g }), [push]);

  const renderView = () => {
    switch (state.view) {
      case 'home':      return <HomeView onAnimeClick={openAnime} onEpisodeClick={openEpisode} onNavigate={navigate} />;
      case 'search':    return <SearchView query={state.searchQuery} onAnimeClick={openAnime} />;
      case 'anime':     return <AnimeDetailView animeId={state.animeId} onEpisodeClick={openEpisode} onBack={goBack} onGenreClick={openGenre} />;
      case 'episode':   return <EpisodeView animeId={state.animeId} episode={state.episode} onBack={goBack} onAnimeClick={openAnime} onEpisodeChange={changeEp} />;
      case 'directory': return <DirectoryView onAnimeClick={openAnime} />;
      case 'genre':     return <GenreView initialGenre={state.genre} onAnimeClick={openAnime} />;
      default:          return null;
    }
  };

  return (
    <div className="min-h-screen text-white app-shell">
      <Header onNavigate={navigate} onSearch={search} onGenreClick={openGenre} currentView={state.view} />
      <main>{renderView()}</main>
      <Footer />
    </div>
  );
}
