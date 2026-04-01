"use client";

import { ChevronUp } from 'lucide-react';
import { useScrollPosition } from '@/hooks/useScrollPosition';

export default function BackToTop() {
  const scrollY = useScrollPosition();
  const visible = scrollY > 500;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-brand text-white shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-brand/90 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
}
