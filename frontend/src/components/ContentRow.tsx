import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  seeAllAction?: () => void;
}

export default function ContentRow({ title, subtitle, icon, children, seeAllAction }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 lg:px-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-[12px] text-white/40 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {seeAllAction && (
          <button
            onClick={seeAllAction}
            className="text-[12px] font-semibold text-cr-orange hover:text-cr-orange-light uppercase tracking-wide transition-colors flex items-center gap-1"
          >
            Ver todo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-8 w-12 z-10 bg-gradient-to-r from-[#141519] to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-cr-orange/80 transition-colors active:scale-90">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-8 w-12 z-10 bg-gradient-to-l from-[#141519] to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-cr-orange/80 transition-colors active:scale-90">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar px-4 lg:px-8 scroll-smooth"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
