import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface ReducedMotionSafeState {
  /** `true` once this component has mounted on the client. Always `false` during SSR and
   *  the client's first (hydration) render. */
  mounted: boolean;
  /** The real `prefers-reduced-motion` preference, but only once `mounted` is `true`.
   *  Always `false` before that, regardless of the visitor's actual OS preference. */
  prefersReducedMotion: boolean;
}

/**
 * SSR/hydration-safe wrapper around Framer Motion's `useReducedMotion()`.
 *
 * Framer Motion's own hook resolves `window.matchMedia('(prefers-reduced-motion: reduce)')
 * synchronously the first time it's called on the client — including the client's very
 * first (hydration) render, before any effect has run. On the server there's no `window`,
 * so that same first call always resolves to a falsy value there. If a component feeds
 * that value straight into Framer Motion's `initial`/`animate`/`transition` props, the
 * server-rendered markup and the client's first render disagree whenever the visitor has
 * reduced motion enabled, producing a React hydration-mismatch warning on every page load.
 *
 * This hook reports `mounted: false` for that first render — on both server and client —
 * so a component can render identically everywhere up front, then flips `mounted` to
 * `true` (with the real `prefersReducedMotion`) on a client-only re-render once mounted.
 *
 * Mount-triggered `motion.*` elements (ones with their own `initial`/`animate`, as opposed
 * to scroll-triggered `whileInView`) MUST gate their `animate` prop on `mounted` — i.e.
 * pass `animate={mounted ? {...target, transition} : undefined}` — rather than always
 * supplying `animate` and only varying its `transition`. Framer Motion's own mount effect
 * (nested inside the `motion.*` component) fires and locks in whatever transition is
 * present on the FIRST render, before this hook's own `mounted`-flipping effect has had a
 * chance to run; changing `transition` on a later re-render does not retroactively affect
 * an animation that's already in flight toward the same target. Withholding `animate`
 * entirely until `mounted` is `true` means the entrance animation is only ever triggered
 * once, by which point the correct (possibly zero-duration) transition is already known.
 */
export function useReducedMotionSafe(): ReducedMotionSafeState {
  const prefersReducedMotionRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return { mounted, prefersReducedMotion: mounted ? Boolean(prefersReducedMotionRaw) : false };
}
