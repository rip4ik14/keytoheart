'use client';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={() => document.getElementById('main-content')?.focus()}
      className="sr-only focus:not-sr-only absolute left-2 top-2 z-50 bg-white text-black p-2"
    >
      Перейти к основному содержимому
    </a>
  );
}
