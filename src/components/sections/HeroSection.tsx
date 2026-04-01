"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo } from '@/data/navigation';
import { useRef } from 'react';

const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.9, delay, ease: spring } },
});

const scaleIn = (delay: number) => ({
  initial: { opacity: 0, scale: 1.08 },
  animate: { opacity: 1, scale: 1, transition: { duration: 1.2, delay, ease: spring } },
});

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -90]);

  return (
    <section ref={heroRef} className="relative min-h-[100dvh] bg-background overflow-hidden">
      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 min-h-[100dvh] flex flex-col">
        {/* Main content area — two columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-24 lg:pt-0">
          {/* Left — Typography + CTAs */}
          <div className="order-2 lg:order-1 pb-8 lg:pb-0">
            {/* Eyebrow */}
            <motion.div
              {...fadeUp(0.1)}
              className="flex items-center gap-3 mb-8"
            >
              <span className="w-10 h-px bg-brand" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">Est. 2000 &middot; Rochester Hills</span>
            </motion.div>

            {/* Headline — editorial style */}
            <motion.h1
              {...fadeUp(0.25)}
              className="font-display text-foreground text-[2.75rem] sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl leading-[0.92] tracking-tight"
            >
              Hardscaping &
              <br />
              landscapes
              <br />
              <span className="text-brand italic">built to last</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              {...fadeUp(0.4)}
              className="mt-7 text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md"
            >
              Full-service design, construction, and year-round care.
              Serving Oakland &amp; Macomb counties with premium craftsmanship.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.5)}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg">
                <Link href="/quote">
                  Free Estimate
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={companyInfo.phoneHref}>
                  <Phone size={15} />
                  {companyInfo.phone}
                </a>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              {...fadeUp(0.6)}
              className="mt-12 flex items-center gap-8"
            >
              {[
                { value: '25+', label: 'Years' },
                { value: '1K+', label: 'Projects' },
                { value: '5.0', label: 'Rating' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-foreground">{s.value}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">{s.label}</span>
                  {i < 2 && <span className="ml-6 w-px h-5 bg-border" />}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Asymmetric image grid */}
          <div className="order-1 lg:order-2 relative h-[50vh] lg:h-auto lg:self-stretch flex items-center">
            <div className="relative w-full h-full lg:h-[85vh] max-h-[700px] lg:max-h-none">
              {/* Main image — large */}
              <motion.div
                {...scaleIn(0.2)}
                style={{ y: y1 }}
                className="absolute inset-x-0 top-0 lg:right-0 lg:left-auto lg:w-[75%] h-[70%] rounded-2xl overflow-hidden shadow-2xl shadow-foreground/10"
              >
                <Image
                  src="/images/site/hero-night.jpg"
                  alt="Illuminated stone steps and landscaping at twilight"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                  quality={85}
                />
              </motion.div>

              {/* Secondary image — overlapping bottom-left */}
              <motion.div
                {...scaleIn(0.4)}
                style={{ y: y2 }}
                className="absolute bottom-0 left-0 w-[55%] lg:w-[50%] h-[45%] rounded-2xl overflow-hidden shadow-2xl shadow-foreground/10 border-2 border-background"
              >
                <Image
                  src="/images/site/pool-deck.jpg"
                  alt="Custom paver pool deck with hot tub"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  priority
                />
              </motion.div>

              {/* Small accent image — floating */}
              <motion.div
                {...scaleIn(0.55)}
                style={{ y: y3 }}
                className="absolute bottom-[15%] right-0 w-[35%] lg:w-[30%] h-[30%] rounded-xl overflow-hidden shadow-xl shadow-foreground/10 border-2 border-background hidden sm:block"
              >
                <Image
                  src="/images/site/fire-pit.jpg"
                  alt="Fire pit patio with Adirondack chairs"
                  fill
                  className="object-cover"
                  sizes="20vw"
                />
              </motion.div>

              {/* Decorative brand accent */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full border border-brand/20 hidden lg:block" />
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-brand/10 hidden lg:block" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand z-10" />
    </section>
  );
}
