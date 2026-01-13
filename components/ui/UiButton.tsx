// ✅ Путь: components/ui/UiButton.tsx
'use client';

import React from 'react';

type Variant = 'brand' | 'brandOutline' | 'cartRed';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  asChild?: boolean;
  children: React.ReactNode;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

const base =
  'inline-flex items-center justify-center text-center ' +
  // ✅ важно: наследуем тот же шрифт, что и в PromoFooterBlock (который идёт от body)
  'font-[inherit] ' +
  'border rounded-[10px] ' +
  'px-4 sm:px-6 py-2 sm:py-3 ' +
  'font-bold text-xs sm:text-sm uppercase tracking-tight ' +
  'transition-all duration-200 shadow-sm ' +
  'active:scale-[.96] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]';

const variants: Record<Variant, string> = {
  brand: 'border-[#bdbdbd] bg-[#535353] text-white hover:bg-[#222]',
  brandOutline:
    'border-[#bdbdbd] bg-white text-[#535353] hover:bg-[#535353] hover:text-white',
  cartRed:
    'border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 ' +
    'shadow-[0_10px_25px_rgba(225,29,72,0.20)]',
};

export default function UiButton({
  variant = 'brandOutline',
  className,
  asChild = false,
  children,
  ...props
}: Props) {
  const classes = cn(base, variants[variant], className);

  // ✅ asChild: позволяет использовать UiButton как обёртку над Link/a
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...props,
      className: cn(classes, child.props?.className),
    });
  }

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}
