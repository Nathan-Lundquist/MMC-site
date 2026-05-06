"use client";

import { Shield, Award, Clock, DollarSign } from 'lucide-react';
import Image from 'next/image';
import AnimateOnScroll, { StaggerContainer, StaggerItem, RevealOnScroll } from '@/components/ui/AnimateOnScroll';

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
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <AnimateOnScroll className="mb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5 flex items-center gap-3">
            <span className="w-12 h-px bg-brand" />
            Why Choose Us
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1] max-w-2xl">
            Trusted by homeowners
            <br />
            for over 25 years
          </h2>
        </AnimateOnScroll>

        {/* Two-column: image + features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Image with overlapping accent */}
          <div className="lg:col-span-5 relative">
            <RevealOnScroll direction="left">
              <div className="rounded-3xl overflow-hidden">
                <div className="relative aspect-[3/4]">
                  <Image
                    src="/images/site/limestone-wall.jpg"
                    alt="Natural limestone retaining wall with landscaping"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              </div>
            </RevealOnScroll>

            {/* Floating accent card */}
            <AnimateOnScroll delay={0.3} variant="scale" className="absolute -bottom-6 -right-6 z-10 hidden lg:block">
              <div className="bg-brand text-white rounded-2xl p-7 shadow-2xl shadow-brand/20">
                <p className="font-display text-4xl leading-none">25+</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/75 mt-2">Years of excellence</p>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Feature list */}
          <StaggerContainer className="lg:col-span-7 flex flex-col gap-6">
            {items.map((item, i) => (
              <StaggerItem key={item.title}>
                <div className="flex gap-5 items-start group">
                  <span className="font-display text-3xl text-brand/20 leading-none pt-1 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 pb-6 border-b border-border group-last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon size={18} className="text-brand" strokeWidth={1.5} />
                      <h3 className="font-display text-lg text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
