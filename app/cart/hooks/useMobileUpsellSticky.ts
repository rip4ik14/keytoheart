// app/cart/hooks/useMobileUpsellSticky.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Step = 1 | 2 | 3 | 4 | 5;

export function useMobileUpsellSticky(step: Step) {
  const isMobileRef = useRef(false);
  const upsellOuterRef = useRef<HTMLDivElement | null>(null);
  const upsellInnerRef = useRef<HTMLDivElement | null>(null);
  const [upsellShift, setUpsellShift] = useState<number>(0);

  const MOBILE_HEADER_OFFSET = 72;
  const MOBILE_SCROLL_GAP = 16;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const smartScrollToActiveStepIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!isMobileRef.current) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          const stepEl = document.getElementById(`order-step-${step}-card`);
          if (!stepEl) return;

          const upsellEl = upsellOuterRef.current;
          const upsellH = upsellEl ? upsellEl.offsetHeight : 0;

          const topBound = MOBILE_HEADER_OFFSET + upsellH + MOBILE_SCROLL_GAP;

          const elTop = (stepEl as HTMLElement).offsetTop;
          const targetTop = elTop - topBound;

          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth',
          });
        }, 120);
      });
    });
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobileRef.current) return;

    let raf = 0;

    const calc = () => {
      raf = 0;

      const outer = upsellOuterRef.current;
      const inner = upsellInnerRef.current;
      const activeEl = document.getElementById(`order-step-${step}-card`);

      if (!outer || !inner || !activeEl) {
        if (upsellShift !== 0) setUpsellShift(0);
        return;
      }

      const outerRect = outer.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const stickyTop = MOBILE_HEADER_OFFSET;
      const isStuck = Math.abs(outerRect.top - stickyTop) < 2;

      if (!isStuck) {
        if (upsellShift !== 0) setUpsellShift(0);
        return;
      }

      const desiredBottom = stickyTop + innerRect.height + MOBILE_SCROLL_GAP;
      const overlap = desiredBottom - activeRect.top;

      const newShift = overlap > 0 ? -overlap : 0;
      const clamped = Math.max(newShift, -innerRect.height - 24);

      if (Math.abs(clamped - upsellShift) > 0.5) {
        setUpsellShift(clamped);
      }
    };

    const onScroll = () => {
      if (!isMobileRef.current) return;
      if (raf) return;
      raf = window.requestAnimationFrame(calc);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    calc();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [step, upsellShift]);

  useEffect(() => {
    smartScrollToActiveStepIfNeeded();
  }, [step, smartScrollToActiveStepIfNeeded]);

  return {
    upsellOuterRef,
    upsellInnerRef,
    upsellShift,
    MOBILE_HEADER_OFFSET,
  };
}
