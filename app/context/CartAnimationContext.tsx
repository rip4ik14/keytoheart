'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface AnimationState {
  startX: number;
  startY: number;
  imageUrl: string;
  isAnimating: boolean;
}

interface CartAnimationContextType {
  triggerCartAnimation: (startX: number, startY: number, imageUrl: string) => void;
  setCartIconPosition: (position: { x: number; y: number }) => void;
  animationState: AnimationState;
  setAnimationState: Dispatch<SetStateAction<AnimationState>>;
  cartIconPosition: { x: number; y: number };
}

const CartAnimationContext = createContext<CartAnimationContextType | undefined>(undefined);

export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    startX: 0,
    startY: 0,
    imageUrl: '',
    isAnimating: false,
  });

  const [cartIconPosition, setCartIconPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const triggerCartAnimation = (startX: number, startY: number, imageUrl: string) => {
    setAnimationState({ startX, startY, imageUrl, isAnimating: true });
  };

  return (
    <CartAnimationContext.Provider
      value={{ triggerCartAnimation, setCartIconPosition, animationState, setAnimationState, cartIconPosition }}
    >
      {children}
    </CartAnimationContext.Provider>
  );
}

export function useCartAnimation(): CartAnimationContextType {
  const context = useContext(CartAnimationContext);
  if (!context) {
    throw new Error('useCartAnimation must be used within a CartAnimationProvider');
  }
  return context;
}