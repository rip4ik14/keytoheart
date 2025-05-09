'use client';

import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';

type Tab = 'personal' | 'orders' | 'dates';

interface TabsHeaderProps {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

export default function TabsHeader({ activeTab, setActiveTab }: TabsHeaderProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'personal', label: 'Личные данные' },
    { key: 'orders', label: 'Мои заказы' },
    { key: 'dates', label: 'Важные даты' },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.nav
      className="flex flex-wrap justify-start sm:justify-center gap-6 border-b border-gray-200 text-sm"
      aria-label="Навигация по вкладкам личного кабинета"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.key}
          onClick={() => {
            setActiveTab(tab.key);
            window.gtag?.('event', 'switch_tab', {
              event_category: 'account',
              tab: tab.key,
            });
            window.ym?.(12345678, 'reachGoal', 'switch_tab', { tab: tab.key });
          }}
          className={`py-2 px-1 border-b-2 transition-all duration-300 font-medium ${
            activeTab === tab.key
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-current={activeTab === tab.key ? 'page' : undefined}
          aria-label={`Перейти на вкладку ${tab.label}`}
          variants={tabVariants}
        >
          {tab.label}
        </motion.button>
      ))}
    </motion.nav>
  );
}