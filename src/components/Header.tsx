import { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import type { View } from '../types';
import { GENRES } from '../services/animeflv';
import UserAvatar from './UserAvatar';

interface HeaderProps {
  onNavigate: (view: View) => void;
  onSearch: (query: string) => void;
  onGenreClick: (genre: string) => void;
  currentView: View;
}

export default function Header({ onNavigate, onSearch, onGenreClick, currentView }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [genreDropdown, setGenreDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { if (searchOpen && inputRef.current) inputRef.current.focus(); }, [searchOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (genreRef.current && !genreRef.current.contains(e.target as Node)) setGenreDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { onSearch(query.trim()); setSearchOpen(false); setMenuOpen(false); }
  };

  const NAV = [
    { view: 'home' as View, label: 'Inicio' },
    { view: 'directory' as View, label: 'Explorar' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#090A0E]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_18px_60px_rgba(0,0,0,0.40)]'
        : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F47521] to-[#FF9257] rounded-2xl rotate-12 group-hover:rotate-6 transition-transform duration-300 shadow-xl shadow-[#F47521]/20" />
              <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[13px]">G</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-white">
                Galindo<span className="text-[#F47521]"> Anime</span>
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-8">
            {NAV.map(({ view, label }) => (
              <button key={view} onClick={() => onNavigate(view)}
                className={`relative px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                  currentView === view ? 'text-[#F47521]' : 'text-white/70 hover:text-white'
                }`}>
                {label}
                {currentView === view && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#F47521] rounded-full" />}
              </button>
            ))}

            {/* Genre dropdown */}
            <div ref={genreRef} className="relative">
              <button onClick={() => setGenreDropdown(!genreDropdown)}
                className={`flex items-center gap-1 px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                  currentView === 'genre' ? 'text-[#F47521]' : 'text-white/70 hover:text-white'
                }`}>
                Géneros
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${genreDropdown ? 'rotate-180' : ''}`} />
              </button>
              {genreDropdown && (
                <div className="absolute top-full left-0 mt-2 w-[480px] bg-[#1A1B20] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 p-4 animate-scale-in z-50">
                  <div className="grid grid-cols-3 gap-1">
                    {GENRES.map(genre => (
                      <button key={genre} onClick={() => { onGenreClick(genre); setGenreDropdown(false); }}
                        className="text-left px-3 py-2 text-[13px] text-white/70 hover:text-[#F47521] hover:bg-white/[0.04] rounded-lg transition-colors">
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center animate-fade-in">
                <div className="relative">
                  <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar anime..."
                    className="w-44 sm:w-64 bg-white/[0.10] border border-white/[0.14] rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F47521]/70 focus:bg-white/[0.12] focus:shadow-lg focus:shadow-[#F47521]/10 transition-all" />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                </div>
                <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 p-1.5 text-white/50 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] rounded-full transition-all active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-white/60 hover:text-[#F47521] rounded-full hover:bg-white/[0.06] transition-all active:scale-90" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
            )}

            <UserAvatar />

            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-white/60 hover:text-white rounded-lg">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="lg:hidden bg-[#1A1B20] border-t border-white/[0.04] animate-fade-in">
          <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-1">
            {[...NAV, { view: 'genre' as View, label: 'Géneros' }].map(({ view, label }) => (
              <button key={view} onClick={() => { onNavigate(view); setMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view ? 'text-[#F47521] bg-[#F47521]/[0.08]' : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                }`}>{label}</button>
            ))}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar anime..."
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F47521]/50" />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
