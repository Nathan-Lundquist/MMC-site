"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimateOnScroll, { RevealOnScroll } from '@/components/ui/AnimateOnScroll';

const areas = [
  'Rochester Hills', 'Troy', 'Shelby Twp', 'Sterling Heights',
  'Bloomfield Hills', 'Lake Orion', 'Macomb Twp', 'Auburn Hills',
  'Clarkston', 'Washington Twp',
];

export default function ServiceArea() {
  return (
    <section className="py-24 lg:py-36 bg-secondary relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-organic" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image with parallax */}
          <div className="relative">
            <RevealOnScroll direction="left">
              <div className="rounded-3xl overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/images/site/front-yard.jpg"
                    alt="Front yard landscape design in Southeast Michigan"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </RevealOnScroll>

            {/* Floating badge */}
            <AnimateOnScroll delay={0.3} variant="scale" className="absolute -bottom-4 -right-4 lg:-bottom-5 lg:-right-5 z-10">
              <div className="bg-foreground rounded-2xl p-5 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
                  <MapPin size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">SE Michigan</p>
                  <p className="text-white/60 text-xs">Oakland & Macomb</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Content */}
          <AnimateOnScroll delay={0.1} variant="slide-right">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Service Area
            </p>
            <h3 className="font-display text-3xl lg:text-4xl xl:text-5xl text-foreground mb-5 leading-[1.05]">
              Oakland &amp; Macomb Counties
            </h3>
            <p className="text-muted-foreground mb-10 leading-relaxed text-[15px] max-w-md">
              Based in Rochester Hills, our crews serve residential and commercial properties throughout Southeast Michigan.
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-12">
              {areas.map(area => (
                <div key={area} className="flex items-center gap-2.5 text-sm text-foreground group">
                  <MapPin size={13} className="text-brand flex-shrink-0 group-hover:scale-110 transition-transform" />
                  {area}
                </div>
              ))}
            </div>

            <Button asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight size={16} />
              </Link>
            </Button>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
