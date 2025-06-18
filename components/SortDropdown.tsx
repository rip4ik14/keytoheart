'use client';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type SortDropdownProps = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
};

const options: { value: 'asc' | 'desc'; label: string }[] = [
  { value: 'asc', label: 'По возрастанию цены' },
  { value: 'desc', label: 'По убыванию цены' },
];

export default function SortDropdown({
  sortOrder,
  setSortOrder,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.2 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
  };

  const trackSortChange = (value: 'asc' | 'desc') => {
    window.gtag?.('event', 'sort_change', {
      event_category: 'catalog',
      sort_value: value,
    });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'sort_change', {
        sort_value: value,
      });
    }
  };

  return (
    <div className="relative w-full max-w-48">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Выберите сортировку"
      >
        <span className="text-sm">
          {options.find((opt) => opt.value === sortOrder)?.label || 'Сортировка'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            role="listbox"
            aria-label="Параметры сортировки"
          >
            {options.map((option) => (
              <li
                key={option.value}
                className={`p-2 text-sm text-black hover:bg-gray-100 cursor-pointer transition-colors duration-200 ${
                  sortOrder === option.value ? 'bg-gray-200' : ''
                }`}
                onClick={() => {
                  setSortOrder(option.value);
                  setIsOpen(false);
                  trackSortChange(option.value);
                }}
                role="option"
                aria-selected={sortOrder === option.value}
              >
                {option.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
