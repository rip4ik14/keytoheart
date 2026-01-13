'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';

type Tab = 'personal' | 'orders' | 'dates';

interface TabsHeaderProps {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

const tabs: { key: Tab; label: string; hint: string }[] = [
  { key: 'personal', label: 'Данные', hint: 'Профиль и бонусы' },
  { key: 'orders', label: 'Заказы', hint: 'История и повтор' },
  { key: 'dates', label: 'Даты', hint: 'Напоминания' },
];

export default function TabsHeader({ activeTab, setActiveTab }: TabsHeaderProps) {
  return (
    <motion.nav
      className="
        rounded-3xl border border-black/10 bg-white
        p-2 sm:p-3
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
      "
      aria-label="Навигация по вкладкам личного кабинета"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);

                window.gtag?.('event', 'switch_tab', {
                  event_category: 'account',
                  event_label: tab.label,
                  tab: tab.key,
                });

                if (YM_ID !== undefined) {
                  callYm(YM_ID, 'reachGoal', 'switch_tab', { tab: tab.key, label: tab.label });
                }
              }}
              className={`
                rounded-2xl px-3 py-3 sm:py-3.5
                border transition
                text-left
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                ${isActive ? 'bg-black text-white border-black' : 'bg-white text-black border-black/10 hover:border-black/20 hover:bg-black/[0.02]'}
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Перейти на вкладку ${tab.label}`}
              type="button"
            >
              <div className="text-sm sm:text-base font-semibold tracking-tight">{tab.label}</div>
              <div className={`text-[11px] sm:text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-black/50'}`}>
                {tab.hint}
              </div>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
