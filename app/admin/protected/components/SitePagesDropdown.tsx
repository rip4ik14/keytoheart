'use client';

import { useQuery } from '@tanstack/react-query';

interface SitePage {
  label: string;
  href: string;
}

interface SitePagesDropdownProps {
  selected: string;
  onSelect: (href: string) => void;
}

export default function SitePagesDropdown({
  selected,
  onSelect,
}: SitePagesDropdownProps) {
  const { data: pages, isLoading, error } = useQuery<SitePage[]>({
    queryKey: ['site-pages'],
    queryFn: async () => {
      const response = await fetch('/api/site-pages');
      if (!response.ok) throw new Error('Failed to fetch site pages');
      return response.json();
    },
  });

  if (isLoading) return <div className="text-gray-500 text-sm">Загрузка...</div>;
  if (error || !pages)
    return <div className="text-red-500 text-sm">Ошибка загрузки страниц</div>;

  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 w-full md:w-64"
    >
      <option value="">Все страницы</option>
      {pages.map((page) => (
        <option key={page.href} value={page.href}>
          {page.label}
        </option>
      ))}
    </select>
  );
}