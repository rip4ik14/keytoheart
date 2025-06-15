// components/PromoGrid.tsx
'use client';

import React from 'react';

interface PromoBlock {
  id: number;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  order_index: number;
}

interface PromoGridProps {
  promoBlocks: PromoBlock[];
}

export default function PromoGrid({ promoBlocks }: PromoGridProps) {
  return (
    <section aria-label="Промо-блоки">
      {promoBlocks.map((block) => (
        <div key={block.id}>
          <img src={block.image_url} alt={block.title} />
          <h2>{block.title}</h2>
          {/* Дополнительная логика рендеринга */}
        </div>
      ))}
    </section>
  );
}