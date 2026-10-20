"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe';

const ease = [0.33, 1, 0.68, 1] as const;

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
  // `useReducedMotionSafe`, not Framer Motion's `useReducedMotion` directly — see that
  // hook's doc comment: the raw hook's SSR/first-client-render disagreement would throw
  // a hydration-mismatch warning whenever the visitor has reduced motion on.
  //
  // `whileInView` is withheld (`undefined`) until `mounted` is `true`, rather than always
  // supplied with only its `transition` varying. If this element starts already inside
  // the viewport, Framer Motion's own mount effect would otherwise trigger the reveal
  // using whatever `transition` is present on the very first render — always the
  // non-reduced one, since `prefersReducedMotion` is `false` until mounted by design —
  // and changing `transition` on a later re-render does not retroactively affect an
  // animation already in flight toward the same target. Withholding `whileInView`
  // entirely means the reveal is only ever triggered once, already carrying the correct
  // (possibly zero-duration) transition.
  const { mounted, prefersReducedMotion } = useReducedMotionSafe();
  const Component = motion.create(as);
  const v = variantMap[variant];

  return (
    <Component
      className={className}
      initial={v.hidden}
      whileInView={mounted ? v.visible : undefined}
      viewport={{ once: true, margin: '80px' }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, delay, ease: ease }}
    >
      {children}
    </Component>
  );
}

export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  // `useReducedMotionSafe` — see its doc comment and the note on `AnimateOnScroll` above.
  // `whileInView` is withheld until `mounted`, for the same reason as `AnimateOnScroll`.
  // Each `StaggerItem` independently resolves its own `prefersReducedMotion` for its own
  // reveal transition (inherited "visible" trigger, not a trigger of its own) — see below.
  const { mounted, prefersReducedMotion } = useReducedMotionSafe();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView={mounted ? 'visible' : undefined}
      viewport={{ once: true, margin: '80px' }}
      variants={{
        hidden: {},
        visible: prefersReducedMotion
          ? { transition: { staggerChildren: 0, delayChildren: 0 } }
          : { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  // `StaggerContainer` zeroing its own orchestration delay only removes the *gap
  // between* items — each item's own "hidden" -> "visible" transition (inherited from
  // the container's propagated variant state, not a trigger of its own) still needs its
  // own duration zeroed here. No `mounted` gate is needed on the item itself: React runs
  // a component's own effects before its parent's within one commit, so this item's
  // `prefersReducedMotion` is already resolved by the time the container's `mounted`
  // flips and exposes "visible" to it.
  const { prefersReducedMotion } = useReducedMotionSafe();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: ease },
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
      viewport={{ once: true, margin: '80px' }}
      transition={{ duration: 1.1, ease: ease }}
    >
      {children}
    </motion.div>
  );
}
