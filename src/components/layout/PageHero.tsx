"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  breadcrumbs: Breadcrumb[];
}

const spring = [0.16, 1, 0.3, 1] as const;

export default function PageHero({ title, subtitle, backgroundImage, breadcrumbs }: PageHeroProps) {
  return (
    <section className="relative bg-foreground overflow-hidden">
      {/* Background image with overlay */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/70 to-foreground/40" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 lg:pt-40 pb-16 lg:pb-24">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2 text-xs text-white/50 mb-8"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/15">/</span>}
              {crumb.to ? (
                <Link href={crumb.to} className="hover:text-white/60 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white/55">{crumb.label}</span>
              )}
            </span>
          ))}
        </motion.nav>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: spring }}
          className="font-display text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight leading-[0.9]"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: spring }}
            className="text-white/65 text-lg max-w-xl mt-6"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Brand accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: spring }}
          className="w-16 h-1 bg-brand mt-8 origin-left"
        />
      </div>
    </section>
  );
}
