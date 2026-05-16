import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0C11] border-t border-white/[0.05] mt-8">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
        <div className="p-6 rounded-[32px] glass-card border-white/[0.06]">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F47521] to-[#FF6B35] rounded-md rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[11px]">G</span>
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white">
                Galindo<span className="text-[#F47521]"> Anime</span>
              </span>
            </div>
            <p className="text-[11px] text-white/25 leading-relaxed">
              Tu plataforma favorita para ver anime online en español. 
              Los datos provienen de AnimeFLV. Proyecto educativo.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Navegación</h4>
              <ul className="space-y-1.5">
                {['Inicio', 'Explorar', 'Géneros'].map(item => (
                  <li key={item}><span className="text-xs text-white/30 hover:text-[#F47521] cursor-pointer transition-colors">{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Fuente</h4>
              <ul className="space-y-1.5">
                <li>
                  <a href="https://www3.animeflv.net" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-[#F47521] transition-colors">
                    <span>AnimeFLV</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

        <div className="border-t border-white/[0.03] mt-8 pt-5 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] text-white/30">© {new Date().getFullYear()} Galindo Anime • Proyecto educativo</p>
          <p className="text-[10px] text-white/30">Hecho con ❤️ para los fans del anime</p>
        </div>
      </div>
    </footer>
  );
}
