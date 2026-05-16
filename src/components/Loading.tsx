import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#F47521] animate-pulse"
            style={{
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative aspect-[2/3] rounded-lg bg-[#1F2027] mb-2.5" />
      <div className="h-3 bg-[#1F2027] rounded w-3/4 mb-1.5" />
      <div className="h-2 bg-[#1F2027] rounded w-1/2" />
    </div>
  );
}
