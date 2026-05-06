"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Flower2, Blocks, Lightbulb, Waves, TreePine, Sun } from 'lucide-react';
import { servicesData } from '@/data/services';
import { Button } from '@/components/ui/button';
import AnimateOnScroll, { StaggerContainer, StaggerItem, RevealOnScroll } from '@/components/ui/AnimateOnScroll';

const featured = ['hardscape', 'landscape', 'turf', 'outdoor-lighting', 'pool-spa', 'forestry'];

const serviceIcons: Record<string, typeof Flower2> = {
  hardscape: Blocks,
  landscape: Flower2,
  turf: Sun,
  'outdoor-lighting': Lightbulb,
  'pool-spa': Waves,
  forestry: TreePine,
};

export default function ServiceGrid() {
  const displayServices = servicesData.filter(s => featured.includes(s.slug));

  return (
    <section className="py-24 lg:py-36 bg-secondary relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-organic" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <AnimateOnScroll className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Our Services
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1]">
              Crafted services for
              <br />
              every outdoor need
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.15} className="lg:col-span-4 lg:col-start-9 flex items-end">
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              From initial design through installation and ongoing care — one experienced team for your complete landscape transformation.
            </p>
          </AnimateOnScroll>
        </div>

        {/* Service cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayServices.map(service => {
            const Icon = serviceIcons[service.slug] || Flower2;
            return (
              <StaggerItem key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group block bg-card rounded-2xl p-8 lg:p-10 h-full border border-border card-hover relative overflow-hidden"
                >
                  <div className="relative">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-brand/8 flex items-center justify-center group-hover:bg-brand transition-all duration-500">
                        <Icon size={24} className="text-brand group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <ArrowUpRight size={18} className="text-border group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 mt-1" />
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-3">{service.shortTitle}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.homeDescription}</p>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* View all */}
        <AnimateOnScroll className="mt-14 text-center">
          <Button asChild variant="outline-brand">
            <Link href="/services/hardscape">
              Explore All Services
              <ArrowRight size={16} />
            </Link>
          </Button>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
