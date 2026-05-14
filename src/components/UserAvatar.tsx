import { useState, useEffect, useRef } from 'react';
import { Check, Palette, Crown } from 'lucide-react';

function mkAv(h:string,s:string,b:string,e:string,a:string,x=''):string{
  return`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><defs><radialGradient id="bg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="${b}"/><stop offset="100%" stop-color="#0f0f1a"/></radialGradient></defs><rect width="100" height="100" fill="url(#bg)"/><ellipse cx="50" cy="90" rx="30" ry="18" fill="${a}" opacity=".6"/><circle cx="50" cy="52" r="22" fill="${s}"/><ellipse cx="50" cy="35" rx="26" ry="20" fill="${h}"/><ellipse cx="50" cy="28" rx="24" ry="16" fill="${h}"/><ellipse cx="38" cy="52" rx="4" ry="5" fill="white"/><ellipse cx="62" cy="52" rx="4" ry="5" fill="white"/><circle cx="39" cy="52" r="2.5" fill="${e}"/><circle cx="63" cy="52" r="2.5" fill="${e}"/><circle cx="40" cy="51" r="1" fill="white" opacity=".9"/><circle cx="64" cy="51" r="1" fill="white" opacity=".9"/><path d="M44 64 Q50 69 56 64" fill="none" stroke="#e8857a" stroke-width="1.2" stroke-linecap="round"/>${x}</svg>`)}`;
}
const AVS=[
  mkAv('#7c3aed','#fcd5c0','#4c1d95','#8b5cf6','#6d28d9','<ellipse cx="50" cy="24" rx="28" ry="14" fill="#7c3aed"/><rect x="22" y="30" width="8" height="30" rx="4" fill="#7c3aed"/><rect x="70" y="30" width="8" height="30" rx="4" fill="#7c3aed"/>'),
  mkAv('#dc2626','#f0c8a0','#7f1d1d','#1e293b','#991b1b','<polygon points="30,28 38,10 42,28" fill="#dc2626"/><polygon points="45,25 50,5 55,25" fill="#ef4444"/><polygon points="58,28 64,12 68,28" fill="#dc2626"/>'),
  mkAv('#cbd5e1','#fce4d6','#312e81','#8b5cf6','#475569','<ellipse cx="50" cy="22" rx="28" ry="12" fill="#e2e8f0"/><rect x="20" y="28" width="10" height="35" rx="5" fill="#cbd5e1"/><rect x="70" y="28" width="10" height="35" rx="5" fill="#cbd5e1"/>'),
  mkAv('#f472b6','#fde8d8','#831843','#22c55e','#be185d','<ellipse cx="36" cy="22" rx="8" ry="12" fill="#f472b6"/><ellipse cx="64" cy="22" rx="8" ry="12" fill="#f472b6"/><ellipse cx="36" cy="24" rx="5" ry="8" fill="#fbb4d4"/><ellipse cx="64" cy="24" rx="5" ry="8" fill="#fbb4d4"/>'),
  mkAv('#1e293b','#e8c8a0','#0f172a','#64748b','#334155','<rect x="30" y="47" width="40" height="12" rx="6" fill="none" stroke="#94a3b8" stroke-width="1.5"/>'),
  mkAv('#f97316','#fcd5c0','#7c2d12','#eab308','#c2410c','<ellipse cx="50" cy="22" rx="26" ry="13" fill="#fb923c"/><rect x="24" y="30" width="7" height="20" rx="3.5" fill="#f97316"/><rect x="69" y="30" width="7" height="20" rx="3.5" fill="#f97316"/>'),
  mkAv('#3b82f6','#f0c8a8','#1e3a5f','#1d4ed8','#1e40af','<polygon points="28,30 35,12 40,30" fill="#3b82f6"/><polygon points="48,26 52,8 56,26" fill="#60a5fa"/><polygon points="60,30 67,14 72,30" fill="#3b82f6"/>'),
  mkAv('#10b981','#fce4d6','#064e3b','#f59e0b','#047857','<ellipse cx="50" cy="22" rx="27" ry="14" fill="#10b981"/><rect x="20" y="28" width="9" height="28" rx="4.5" fill="#10b981"/><rect x="71" y="28" width="9" height="28" rx="4.5" fill="#10b981"/>'),
];

export default function UserAvatar() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(() => {
    try { return parseInt(localStorage.getItem('ga_av') || '0') || 0; } catch { return 0; }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (i: number) => {
    setIdx(i);
    localStorage.setItem('ga_av', String(i));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 group">
        <div className="relative">
          <img src={AVS[idx]} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#F47521]/40 group-hover:ring-[#F47521] transition-all shadow-lg shadow-black/30" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-[2px] border-[#141519]" />
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#F47521]/70 font-semibold">
          <Crown className="w-3 h-3" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[240px] bg-[#1A1B20] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/60 p-4 animate-scale-in z-[100]">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-400" />
            <h4 className="text-[13px] font-bold text-white">Tu avatar</h4>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AVS.map((av, i) => (
              <button key={i} onClick={() => pick(i)}
                className={`relative rounded-xl overflow-hidden aspect-square transition-all ${
                  idx === i ? 'ring-2 ring-[#F47521] ring-offset-2 ring-offset-[#1A1B20] scale-105' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-white/20'
                }`}>
                <img src={av} alt="" className="w-full h-full object-cover" />
                {idx === i && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#F47521] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" strokeWidth={3} /></span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
