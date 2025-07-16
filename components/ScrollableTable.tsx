'use client';

import React, { useRef, useEffect } from 'react';

interface ScrollableTableProps {
  children: React.ReactNode;
  tableMinWidth?: number; // px (по умолчанию 1800)
}

export default function ScrollableTable({
  children,
  tableMinWidth = 1800,
}: ScrollableTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  // Синхронизация скролла
  useEffect(() => {
    const container = containerRef.current;
    const topScroll = topScrollRef.current;
    if (!container || !topScroll) return;

    // Синхронизировать скролл
    const handleTopScroll = () => {
      container.scrollLeft = topScroll.scrollLeft;
    };
    const handleContainerScroll = () => {
      topScroll.scrollLeft = container.scrollLeft;
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    container.addEventListener('scroll', handleContainerScroll);

    // Актуализируем ширину top-скролла под таблицу (или minWidth)
    const updateTopScrollWidth = () => {
      const table = container.querySelector('table');
      if (table && topScroll.firstChild) {
        (topScroll.firstChild as HTMLElement).style.width =
          Math.max(table.offsetWidth, tableMinWidth) + 'px';
      }
    };

    updateTopScrollWidth();

    // Обновлять при ресайзе окна (чтобы ширина всегда совпадала)
    window.addEventListener('resize', updateTopScrollWidth);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      container.removeEventListener('scroll', handleContainerScroll);
      window.removeEventListener('resize', updateTopScrollWidth);
    };
  }, [tableMinWidth]);

  return (
    <div className="relative w-full">
      {/* Верхний скроллбар (sticky) */}
      <div
        ref={topScrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{
          height: 16,
          marginBottom: -16,
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 30,
        }}
        tabIndex={-1}
        aria-hidden
      >
        <div style={{ width: tableMinWidth, height: 1 }} />
      </div>
      {/* Основной скролл с таблицей */}
      <div
        ref={containerRef}
        className="overflow-x-auto"
        style={{ width: '100%' }}
      >
        {children}
      </div>
    </div>
  );
}
