"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRef } from 'react';

const springEase = [0.16, 1, 0.3, 1] as const;

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
  /** "rise" = default slide up, "slide-left", "slide-right", "scale", "blur" */
  variant?: 'rise' | 'slide-left' | 'slide-right' | 'scale' | 'blur';
}

const variantMap = {
  rise: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } },
  'slide-left': { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  'slide-right': { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: 'blur(8px)' }, visible: { opacity: 1, filter: 'blur(0px)' } },
};

export default function AnimateOnScroll({
  children,
  className,
  delay = 0,
  as = 'div',
  variant = 'rise',
}: AnimateOnScrollProps) {
  const Component = motion.create(as);
  const v = variantMap[variant];

  return (
    <Component
      className={className}
      initial={v.hidden}
      whileInView={v.visible}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: springEase }}
    >
      {children}
    </Component>
  );
}

export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.7, ease: springEase },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Parallax wrapper — children move at a slower scroll rate for depth */
export function Parallax({
  children,
  className,
  speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -80, speed * 80]);

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Reveal — clips content and slides it in for dramatic reveals */
export function RevealOnScroll({
  children,
  className,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
}) {
  const clipMap = {
    up: { hidden: 'inset(100% 0 0 0)', visible: 'inset(0 0 0 0)' },
    left: { hidden: 'inset(0 100% 0 0)', visible: 'inset(0 0 0 0)' },
    right: { hidden: 'inset(0 0 0 100%)', visible: 'inset(0 0 0 0)' },
  };
  const clip = clipMap[direction];

  return (
    <motion.div
      className={className}
      initial={{ clipPath: clip.hidden, opacity: 0 }}
      whileInView={{ clipPath: clip.visible, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1.1, ease: springEase }}
    >
      {children}
    </motion.div>
  );
}
