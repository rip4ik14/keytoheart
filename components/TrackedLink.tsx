'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { ReactNode, MouseEvent } from 'react';

// Типизация пропсов
interface TrackedLinkProps {
  href: string;
  children: ReactNode;
  ariaLabel: string;
  category: string;
  action: string;
  label: string;
  className?: string;
  target?: string; // Добавляем target для открытия ссылки в новом окне
  rel?: string; // Добавляем rel для указания отношений ссылки
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; // Добавляем onClick для пользовательских обработчиков
}

export default function TrackedLink({
  href,
  children,
  ariaLabel,
  category,
  action,
  label,
  className,
  target,
  rel,
  onClick,
}: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Отслеживаем событие
    trackEvent({ category, action, label });

    // Вызываем пользовательский onClick, если он передан
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <span className="inline-block transform transition-transform hover:scale-105">
      <Link
        href={href}
        className={`${className} focus:outline-none focus:ring-2 focus:ring-black`}
        aria-label={ariaLabel}
        target={target} // Передаём target в Link
        rel={rel} // Передаём rel в Link
        onClick={handleClick}
      >
        {children}
      </Link>
    </span>
  );
}