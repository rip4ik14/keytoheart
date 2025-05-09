import React from 'react';

interface PaginationProps {
  current: number;
  total: number;
}

export default function SimplePagination({ current, total }: PaginationProps) {
  return (
    <div
      className="absolute bottom-5 left-0 right-0 flex justify-center z-10"
      role="navigation"
      aria-label="Пагинация"
    >
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`block w-2 h-2 rounded-full transition-all ${
              i === current ? 'bg-black' : 'bg-gray-400'
            }`}
            aria-current={i === current ? 'page' : undefined}
            aria-label={`Страница ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}