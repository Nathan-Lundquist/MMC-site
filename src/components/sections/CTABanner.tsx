"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { companyInfo } from '@/data/navigation';

interface CTABannerProps {
  heading?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function CTABanner({
  heading = "Let's build something beautiful.",
  subtitle = "Get expert landscaping solutions you can trust. Contact us today for a free consultation tailored to your property.",
  primaryLabel = 'Get a Free Estimate',
  primaryTo = '/quote',
  secondaryLabel = 'Call Us Now',
  secondaryHref = companyInfo.phoneHref,
}: CTABannerProps) {
  return (
    <section className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-foreground rounded-3xl overflow-hidden"
        >
          {/* Decorative gradient wash */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.464_0.161_26.2/0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,oklch(0.42_0.09_145/0.06),transparent_50%)]" />

          <div className="grid grid-cols-1 lg:grid-cols-2 relative">
            {/* Content */}
            <div className="p-10 lg:p-16 xl:p-20 flex flex-col justify-center">
              <h2 className="font-display text-3xl lg:text-4xl xl:text-5xl text-white leading-[1.05] mb-5">
                {heading}
              </h2>
              <p className="text-white/60 leading-relaxed mb-10 max-w-md text-[15px]">
                {subtitle}
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button asChild size="lg">
                  <Link href={primaryTo}>
                    {primaryLabel}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
                {secondaryHref && (
                  <Button asChild variant="outline-white" size="lg">
                    <a href={secondaryHref}>
                      <Phone size={16} />
                      {secondaryLabel}
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Image with blended edge */}
            <div className="relative hidden lg:block min-h-[380px]">
              <Image
                src="/images/site/pool-aerial.jpg"
                alt="Pool deck with paver surround aerial view"
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-foreground to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-foreground to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
