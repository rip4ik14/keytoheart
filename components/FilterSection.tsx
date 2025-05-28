'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';

// Типы для фильтров
type FilterSectionProps = {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSubcategory: number | '';
  setSelectedSubcategory: (subcategory: number | '') => void;
  categories: { label: string; slug: string }[];
  subcategories: { label: string; slug: string; id: number }[];
};

export default function FilterSection({
  priceRange,
  setPriceRange,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  categories,
  subcategories,
}: FilterSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Проверяем, мобильное ли устройство
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Анимации для модального окна на мобильных устройствах
  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: '100%', transition: { duration: 0.3 } },
  };

  // Обработчики событий для аналитики
  const trackFilterChange = (filterType: string, value: string | number) => {
    window.gtag?.('event', 'filter_change', {
      event_category: 'catalog',
      filter_type: filterType,
      filter_value: value,
    });
    window.ym?.(96644553, 'reachGoal', 'filter_change', {
      filter_type: filterType,
      filter_value: value,
    });
  };

  return (
    <>
      {/* Кнопка открытия фильтров на мобильных устройствах */}
      {isMobile && (
        <button
          onClick={() => setIsFilterOpen(true)}
          className="md:hidden fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-lg z-50 flex items-center gap-2"
          aria-label="Открыть фильтры"
        >
          <Filter className="w-5 h-5" />
          <span>Фильтры</span>
        </button>
      )}

      {/* Фильтры */}
      <AnimatePresence>
        {(!isMobile || isFilterOpen) && (
          <motion.div
            className={`${
              isMobile
                ? 'fixed inset-0 bg-white z-50 p-6 overflow-y-auto'
                : 'w-64 bg-white p-6 border-r border-gray-200'
            }`}
            initial={isMobile ? 'hidden' : undefined}
            animate={isMobile ? 'visible' : undefined}
            exit={isMobile ? 'exit' : undefined}
            variants={modalVariants}
            role="dialog"
            aria-labelledby="filter-title"
            aria-modal={isMobile ? 'true' : undefined}
          >
            {/* Заголовок и кнопка закрытия на мобильных */}
            {isMobile && (
              <div className="flex justify-between items-center mb-6">
                <h2 id="filter-title" className="text-xl font-bold text-black">
                  Фильтры
                </h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-black focus:outline-none focus:ring-2 focus:ring-black rounded"
                  aria-label="Закрыть фильтры"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Фильтр по цене */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2" htmlFor="price-min">
                Цена
              </label>
              <div className="flex gap-2">
                <input
                  id="price-min"
                  type="number"
                  min="0"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setPriceRange([newValue, priceRange[1]]);
                    trackFilterChange('price_min', newValue);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="От"
                  aria-label="Минимальная цена"
                />
                <input
                  id="price-max"
                  type="number"
                  min="0"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setPriceRange([priceRange[0], newValue]);
                    trackFilterChange('price_max', newValue);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="До"
                  aria-label="Максимальная цена"
                />
              </div>
            </div>

            {/* Фильтр по категории */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2" htmlFor="category-select">
                Категория
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCategory(value);
                  setSelectedSubcategory(''); // Сбрасываем подкатегорию
                  trackFilterChange('category', value);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none"
                aria-label="Выберите категорию"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтр по подкатегории */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2" htmlFor="subcategory-select">
                  Подкатегория
                </label>
                <select
                  id="subcategory-select"
                  value={selectedSubcategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    const subcategoryValue = value === '' ? '' : parseInt(value, 10);
                    setSelectedSubcategory(subcategoryValue);
                    trackFilterChange('subcategory', value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none"
                  aria-label="Выберите подкатегорию"
                >
                  <option value="">Все подкатегории</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Оверлей для мобильного модального окна */}
      {isMobile && isFilterOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsFilterOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}