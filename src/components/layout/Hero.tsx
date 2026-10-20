"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

const ease = [0.33, 1, 0.68, 1] as const;

export interface HeroBreadcrumb {
  label: string;
  to?: string;
}

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

/**
 * Hero always renders over a dark background — either a full-bleed photo with a
 * dark gradient/scrim on top, or the solid `bg-foreground` fallback when no photo
 * is supplied. Button's plain "outline" variant is a dark-border/dark-text treatment
 * meant for light backgrounds, so it would be low/no-contrast (or invisible) here.
 * "outline" is excluded from the type on purpose — use "outline-white" (or
 * "outline-brand", "white", "default", etc.) for any CTA rendered inside Hero.
 */
export type HeroCtaVariant = Exclude<ButtonVariant, "outline">;

export interface HeroCta {
  label: string;
  href: string;
  variant: HeroCtaVariant;
}

interface HeroProps {
  title: string;
  subtitle?: string;
  /** Short uppercase label rendered above the title, e.g. the homepage's "Est. 2000 · Rochester Hills" line. */
  eyebrow?: string;
  /**
   * Optional background photo. Left optional (not required) because at least one
   * caller (`blog/[slug]`) sources this from unvalidated MDX frontmatter that could
   * be missing — Hero degrades to a solid `bg-foreground` section instead of crashing
   * or requesting a broken image.
   */
  backgroundImage?: string;
  breadcrumbs?: HeroBreadcrumb[];
  /**
   * "reduced" drops breadcrumbs and the CTA pair entirely (not just visually — they
   * are not rendered) to save vertical space for a page's own content, e.g. the
   * quote/contact forms that need to stay above the fold.
   */
  height?: "full" | "reduced";
  ctas?: HeroCta[];
}

export default function Hero({
  title,
  subtitle,
  eyebrow,
  backgroundImage,
  breadcrumbs,
  height = "full",
  ctas,
}: HeroProps) {
  // `useReducedMotionSafe` (not Framer Motion's `useReducedMotion` directly) is required
  // here: the raw hook resolves the media query synchronously on the client's very first
  // render, which differs from the server's render and throws a hydration-mismatch
  // warning whenever reduced motion is on. See the hook's own doc comment for details —
  // in short, `animate` must stay withheld (`undefined`) until `mounted` is `true`, so
  // the entrance animation is only ever triggered once, already carrying the correct
  // (possibly zero-duration) transition, per R10.
  const { mounted, prefersReducedMotion } = useReducedMotionSafe();
  const isReduced = height === "reduced";

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 30 } as const,
    animate: mounted
      ? {
          opacity: 1,
          y: 0,
          transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.9, delay, ease },
        }
      : undefined,
  });

  return (
    <section
      className={cn(
        "relative flex flex-col justify-end overflow-hidden bg-foreground",
        isReduced ? "min-h-[50dvh]" : "min-h-[100dvh]"
      )}
    >
      {backgroundImage && (
        <>
          {/* Full-bleed photo. The wrapping div carries the same dark `bg-foreground`
              tone the overlay settles toward, so there's no flash of a mismatched
              (e.g. white) placeholder color while the image streams in — Next.js can't
              auto-derive a blurDataURL here since the photo is a string path, not a
              static import. */}
          <div className="absolute inset-0 bg-foreground">
            <Image
              src={backgroundImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/*
              Contrast tuning (WCAG AA: 4.5:1 normal text, 3:1 large text, measured
              against white headline/subtitle/breadcrumb text):

              This full-bleed gradient and the dedicated text scrim below it stack as
              two independent black layers. Alpha-stacked black layers multiply their
              remaining-light fraction: two layers at opacity p1/p2 leave
              (1-p1)*(1-p2) of the background's luminance showing through.

              Worst case assumed: a light-toned photo at ~0.9 relative luminance.
              - At the bottom of the hero (where breadcrumbs/subtitle sit, both
                "normal" 4.5:1 text): gradient leaves ~20% (from-black/80) and the
                scrim leaves ~30% (from-black/70) there, combined ~6% of 0.9 ≈ 0.054
                luminance → contrast vs. white ≈ 9.6:1. Comfortably clears 4.5:1.
              - Higher up, around the headline (large text, 3:1 threshold): the
                gradient/scrim midpoints (via-black/55, via-black/40) leave more
                light through, combined worst case ≈ (1-0.55)*(1-0.40)=0.27 of 0.9
                ≈ 0.243 luminance → contrast vs. white ≈ 3.5:1. Clears 3:1.

              If a future assigned photo still fails a measured check, tighten the
              gradient's `via`/`to` stops and the scrim's stops together rather than
              only one of the two layers — they're tuned as a pair.
            */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
          </div>

          {/* Dedicated scrim directly behind the text block, independent of the
              gradient above — a fixed safety margin for photos where gradient tuning
              alone can't reach AA without crushing the image unrecognizably dark.
              Always rendered: there's no per-photo luminance detection to gate it on. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        </>
      )}

      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-7xl px-6",
          isReduced ? "pt-28 pb-12 lg:pb-16" : "pt-32 pb-16 lg:pt-40 lg:pb-24"
        )}
      >
        {!isReduced && breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav aria-label="Breadcrumb" {...fadeUp(0.1)} className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-white/70">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-white/15" aria-hidden="true">
                      /
                    </span>
                  )}
                  {crumb.to ? (
                    <Link href={crumb.to} className="transition-colors hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white/70" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </motion.nav>
        )}

        {eyebrow && (
          <motion.div {...fadeUp(0.2)} className="mb-6 flex items-center gap-3 md:mb-8">
            <span className="h-px w-10 bg-brand" />
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">
              {eyebrow}
            </span>
          </motion.div>
        )}

        <motion.h1
          {...fadeUp(0.3)}
          className="font-display text-5xl leading-[0.9] tracking-tight text-white break-words sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p {...fadeUp(0.45)} className="mt-6 max-w-2xl text-lg text-white/65 lg:text-xl">
            {subtitle}
          </motion.p>
        )}

        <motion.div
          initial={{ scaleX: 0 }}
          animate={mounted ? { scaleX: 1 } : undefined}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.55, ease }}
          className="mt-8 h-1 w-16 origin-left bg-brand"
        />

        {!isReduced && ctas && ctas.length > 0 && (
          <motion.div {...fadeUp(0.65)} className="mt-8 flex flex-wrap items-center gap-3">
            {ctas.map((cta) => (
              <Button key={`${cta.href}-${cta.label}`} asChild variant={cta.variant} size="lg" className="rounded-lg">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
