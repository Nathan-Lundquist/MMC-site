"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Stat {
  target: number;
  suffix: string;
  label: string;
  detail: string;
}

const stats: Stat[] = [
  { target: 25, suffix: '+', label: 'Years', detail: 'of trusted service' },
  { target: 1000, suffix: '+', label: 'Projects', detail: 'completed with care' },
  { target: 250, suffix: '+', label: 'Clients', detail: 'across SE Michigan' },
  { target: 8, suffix: '', label: 'Services', detail: 'under one roof' },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const duration = 2200;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  return (
    <div ref={ref} className="font-display tabular-nums">
      <span className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-none">
        {count.toLocaleString()}
      </span>
      {suffix && <span className="text-brand text-5xl sm:text-6xl lg:text-7xl">{suffix}</span>}
    </div>
  );
}

export default function StatsBar() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="relative"
            >
              <AnimatedNumber target={stat.target} suffix={stat.suffix} />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground mt-3">
                {stat.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.detail}</p>
              <div className="mt-6 w-12 h-px bg-brand/25" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
