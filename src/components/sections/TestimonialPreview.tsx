"use client";

import Link from 'next/link';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testimonials } from '@/data/testimonials';
import AnimateOnScroll, { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';

export default function TestimonialPreview() {
  const featured = testimonials.slice(0, 3);

  return (
    <section className="py-24 lg:py-36 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 lg:mb-20">
          <AnimateOnScroll>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Client Stories
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1]">
              What our clients
              <br />
              have to say
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.1}>
            <Button asChild variant="outline-brand" size="sm">
              <Link href="/testimonials">
                All Reviews
                <ArrowRight size={14} />
              </Link>
            </Button>
          </AnimateOnScroll>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {featured.map((t, i) => (
            <StaggerItem key={i}>
              <div className="bg-card rounded-2xl border border-border p-8 lg:p-10 h-full flex flex-col card-hover group relative overflow-hidden">
                {/* Subtle accent on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-brand scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                {/* Quote icon + stars */}
                <div className="flex items-center justify-between mb-8">
                  <Quote size={32} className="text-brand/10" strokeWidth={1} />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={14} className={j < t.rating ? 'text-brand fill-brand' : 'text-border'} />
                    ))}
                  </div>
                </div>

                <blockquote className="text-foreground/75 leading-relaxed mb-8 flex-1 text-[15px] italic">
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                <div className="pt-6 border-t border-border flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center text-sm font-display text-brand">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
