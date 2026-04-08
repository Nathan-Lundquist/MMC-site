import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';
import { testimonials } from '@/data/testimonials';
import { companyInfo } from '@/data/navigation';

export const metadata: Metadata = {
  title: 'Testimonials',
  description: "Read reviews from homeowners across Oakland & Macomb Counties. See why Mike's Clean Cut Landscaping is SE Michigan's trusted partner.",
};

const avgRating =
  testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

const reviewJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LandscapingBusiness',
  name: companyInfo.name,
  url: companyInfo.url,
  telephone: companyInfo.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '2632 S. Rochester Rd #70858',
    addressLocality: 'Rochester Hills',
    addressRegion: 'MI',
    postalCode: '48307',
    addressCountry: 'US',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: avgRating.toFixed(1),
    bestRating: '5',
    worstRating: '1',
    reviewCount: testimonials.length,
  },
  review: testimonials.map((t) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: t.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: t.rating,
      bestRating: 5,
    },
    reviewBody: t.text,
  })),
};

export default function Testimonials() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <PageHero
        title="Reviews"
        subtitle=""
        backgroundImage="/images/site/limestone-wall.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Testimonials' }]}
      />

      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <StaggerItem key={i}>
                <div className="bg-card rounded-2xl border border-border p-8 lg:p-12 h-full flex flex-col">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={16} className={j < t.rating ? 'text-brand fill-brand' : 'text-border'} />
                    ))}
                  </div>

                  <blockquote className="text-lg leading-relaxed text-foreground mb-8 flex-1">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>

                  <div className="pt-6 border-t border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold text-foreground">
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

      <CTABanner heading="Join our happy clients" subtitle="Get your free consultation today and see why homeowners trust us." />
    </>
  );
}
