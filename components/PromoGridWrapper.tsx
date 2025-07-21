'use client';

import { useState, useEffect } from 'react';
import PromoGridClient from './PromoGridClient';
import { PromoBlock } from '@/types/promo';

export default function PromoGridWrapper({
  banners = [],
  cards = [],
}: {
  banners?: PromoBlock[];
  cards?: PromoBlock[];
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return <PromoGridClient banners={banners} cards={cards} />;
}
