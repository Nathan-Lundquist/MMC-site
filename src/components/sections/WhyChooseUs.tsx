"use client";

import { Shield, Award, Clock, DollarSign } from 'lucide-react';
import Image from 'next/image';
import AnimateOnScroll, { StaggerContainer, StaggerItem, RevealOnScroll, Parallax } from '@/components/ui/AnimateOnScroll';

const items = [
  {
    icon: Shield,
    title: 'Quality Materials',
    description: 'Premium, weather-resistant materials built to last through decades of Michigan seasons.',
  },
  {
    icon: Award,
    title: 'Certified Team',
    description: 'Trained professionals with deep expertise in every aspect of landscape construction.',
  },
  {
    icon: Clock,
    title: 'On-Time Delivery',
    description: 'Clear timelines, honest communication, and projects completed when promised.',
  },
  {
    icon: DollarSign,
    title: 'Honest Pricing',
    description: 'Detailed proposals with transparent pricing. No hidden costs, no surprises.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-24 lg:py-36 overflow-hidden relative">
      {/* Decorative gradient blob */}
      <div className="absolute -top-60 right-0 w-[500px] h-[500px] rounded-full bg-brand/[0.03] blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <AnimateOnScroll className="mb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5 flex items-center gap-3">
            <span className="w-12 h-px bg-brand" />
            Why Choose Us
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1] max-w-2xl">
            Trusted by homeowners for
            <span className="text-brand italic"> over 25 years</span>
          </h2>
        </AnimateOnScroll>

        {/* Two-column: image + features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Image with overlapping accent */}
          <div className="lg:col-span-5 relative">
            <RevealOnScroll direction="left">
              <Parallax speed={0.15} className="rounded-3xl overflow-hidden">
                <div className="relative aspect-[3/4]">
                  <Image
                    src="/images/site/limestone-wall.jpg"
                    alt="Natural limestone retaining wall with landscaping"
                    fill
                    className="object-cover scale-110"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              </Parallax>
            </RevealOnScroll>

            {/* Floating accent card */}
            <AnimateOnScroll delay={0.3} variant="scale" className="absolute -bottom-6 -right-6 z-10 hidden lg:block">
              <div className="bg-brand text-white rounded-2xl p-7 shadow-2xl shadow-brand/20">
                <p className="font-display text-4xl leading-none">25+</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 mt-2">Years of excellence</p>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Feature cards */}
          <StaggerContainer className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {items.map(item => (
              <StaggerItem key={item.title}>
                <div className="bg-secondary rounded-2xl p-8 h-full card-hover border border-transparent hover:border-border hover:bg-card group">
                  <div className="w-12 h-12 rounded-xl bg-brand/8 flex items-center justify-center mb-6 group-hover:bg-brand/12 transition-colors duration-500">
                    <item.icon size={22} className="text-brand" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
