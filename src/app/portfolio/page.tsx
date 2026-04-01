"use client";

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { portfolioItems, portfolioCategories, portfolioCategoryLabels } from '@/data/portfolio';

export default function Portfolio() {
  const [filter, setFilter] = useState('all');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const filtered = filter === 'all' ? portfolioItems : portfolioItems.filter(item => item.category === filter);

  return (
    <>
      <PageHero
        title="Our Work"
        subtitle=""
        backgroundImage="/images/site/pool-deck.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Portfolio' }]}
      />

      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          {/* Filter pills */}
          <AnimateOnScroll className="flex flex-wrap gap-2 mb-16 justify-center">
            {portfolioCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full border-2 transition-all duration-150 cursor-pointer ${
                  filter === cat
                    ? 'bg-brand text-white border-brand'
                    : 'bg-transparent text-muted-foreground border-border hover:border-brand hover:text-brand'
                }`}
              >
                {portfolioCategoryLabels[cat]}
              </button>
            ))}
          </AnimateOnScroll>

          {/* Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, i) => (
              <div
                key={item.image + i}
                className="group relative overflow-hidden cursor-pointer rounded-2xl"
                onClick={() => setLightboxSrc(item.image)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 flex items-end p-6 transition-all duration-300 rounded-2xl">
                  <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-sm font-semibold">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={!!lightboxSrc} onOpenChange={(open) => { if (!open) setLightboxSrc(null); }}>
        <DialogContent className="bg-transparent max-w-[90vw] shadow-none p-0">
          <DialogClose
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 w-10 h-10 bg-foreground/50 flex items-center justify-center backdrop-blur-sm rounded-full"
          >
            <X size={20} />
          </DialogClose>
          {lightboxSrc && (
            <Image src={lightboxSrc} alt="Portfolio" width={1200} height={800} className="max-h-[85vh] w-auto mx-auto rounded-2xl" />
          )}
        </DialogContent>
      </Dialog>

      <CTABanner heading="Ready to start your project?" subtitle="Let us bring your vision to life." />
    </>
  );
}
