import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import AnimateOnScroll, { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';
import { getServiceBySlug, servicesData } from '@/data/services';
import { companyInfo } from '@/data/navigation';

/* ---------- FAQ data for hardscape service ---------- */
const hardscapeFAQs = [
  {
    question: 'How long does a typical hardscape installation take?',
    answer:
      'Most residential hardscape projects take 1 to 3 weeks depending on scope. A simple patio may be completed in a week, while a full outdoor living space with kitchen, fireplace, and retaining walls can take 2 to 4 weeks. We provide a detailed timeline during your design consultation.',
  },
  {
    question: 'What materials do you use for patios and driveways?',
    answer:
      'We work with brick pavers, natural stone, travertine, bluestone, and decorative concrete. We source from top manufacturers like Unilock, Belgard, and Techo-Bloc to ensure durability through Michigan freeze-thaw cycles.',
  },
  {
    question: 'Do you offer warranties on hardscape work?',
    answer:
      'Yes. Our workmanship is backed by a comprehensive warranty, and the paver and stone products we install carry their own manufacturer warranties, often 25 years or lifetime. We will review all warranty details during your consultation.',
  },
  {
    question: 'Can you work with my existing landscape?',
    answer:
      'Absolutely. We regularly integrate new hardscape features into existing landscapes, protecting mature plantings and working around established irrigation systems. Our design team plans around what you already have.',
  },
  {
    question: 'How much does a paver patio cost in Michigan?',
    answer:
      'Paver patio costs in Oakland and Macomb Counties typically range from $25 to $50 per square foot installed, depending on the material, pattern complexity, and site preparation required. We provide free on-site estimates with exact pricing.',
  },
];

function buildServiceJsonLd(service: { title: string; metaDescription: string; slug: string; heroImage: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.metaDescription,
    url: `${companyInfo.url}/services/${service.slug}`,
    image: `${companyInfo.url}${service.heroImage}`,
    provider: {
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
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Oakland County, MI' },
      { '@type': 'AdministrativeArea', name: 'Macomb County, MI' },
    ],
  };
}

function buildFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return servicesData.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.metaTitle,
    description: service.metaDescription,
  };
}

export default async function ServiceDetail({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) notFound();

  const serviceJsonLd = buildServiceJsonLd(service);
  const showFAQ = service.slug === 'hardscape';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      {showFAQ && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQJsonLd(hardscapeFAQs)) }}
        />
      )}
      <PageHero
        title={service.shortTitle}
        subtitle={service.heroSubtitle}
        backgroundImage={service.heroImage}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Services' },
          { label: service.shortTitle },
        ]}
      />

      {/* Intro */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                  <span className="w-12 h-px bg-brand" />
                  {service.introLabel}
                </p>
                <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-6">
                  {service.introHeading}
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed mb-10">
                  {service.introText.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button asChild>
                    <Link href="/quote">
                      Get a Free Estimate
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button asChild variant="outline-brand">
                    <a href={companyInfo.phoneHref}>Call {companyInfo.phone}</a>
                  </Button>
                </div>
              </div>
              {service.introImage && (
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  <Image src={service.introImage} alt={service.shortTitle} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-24 lg:py-32 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              {service.servicesSectionLabel}
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-4">
              {service.servicesSectionHeading}
            </h2>
            <p className="text-muted-foreground max-w-lg">{service.servicesSectionSubtitle}</p>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.serviceCards.map(card => (
              <StaggerItem key={card.title}>
                <div className="bg-card rounded-2xl border border-border overflow-hidden h-full">
                  {card.image && (
                    <div className="relative aspect-[16/10]">
                      <Image src={card.image} alt={card.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                  )}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg text-foreground">{card.title}</h3>
                      {card.badge && (
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider rounded-full">{card.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    {card.includes && card.includes.length > 0 && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {card.includes.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-foreground/70">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <CTABanner
        heading="Transform your outdoor space"
        subtitle="Schedule a free design consultation."
        primaryLabel="Request Consultation"
      />

      {/* Maintenance */}
      {service.maintenanceCards && (
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <AnimateOnScroll className="mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                <span className="w-12 h-px bg-brand" />
                {service.maintenanceLabel}
              </p>
              <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-4">{service.maintenanceHeading}</h2>
              <p className="text-muted-foreground max-w-lg">{service.maintenanceSubtitle}</p>
            </AnimateOnScroll>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.maintenanceCards.map(card => (
                <StaggerItem key={card.title}>
                  <div className="bg-card rounded-2xl border border-border p-8 lg:p-10 h-full">
                    <h3 className="font-display text-lg text-foreground mb-3">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    {card.includes && card.includes.length > 0 && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {card.includes.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-foreground/70">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Why Us */}
      <section className="py-24 lg:py-32 bg-foreground text-white">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              {service.whyUsLabel}
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">{service.whyUsHeading}</h2>
            <p className="text-white/60 max-w-md mt-4">{service.whyUsSubtitle}</p>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {service.whyUsItems.map(item => (
              <StaggerItem key={item.title}>
                <div className="bg-white/5 rounded-2xl p-8 h-full">
                  <h4 className="font-display text-lg text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <CTABanner
        heading="Ready to get started?"
        subtitle={`Free estimate for your ${service.shortTitle.toLowerCase()} project.`}
        secondaryLabel="Call Now"
      />

      {/* FAQ Section — hardscape only */}
      {showFAQ && (
        <section className="py-24 lg:py-32 bg-secondary">
          <div className="mx-auto max-w-7xl px-6">
            <AnimateOnScroll className="mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                <span className="w-12 h-px bg-brand" />
                FAQ
              </p>
              <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
                Frequently Asked <span className="text-brand italic">Questions</span>
              </h2>
            </AnimateOnScroll>

            <StaggerContainer className="flex flex-col gap-4 max-w-3xl">
              {hardscapeFAQs.map((faq) => (
                <StaggerItem key={faq.question}>
                  <div className="bg-card rounded-2xl border border-border p-8">
                    <h3 className="font-display text-lg text-foreground mb-3">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Related Services */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Explore
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              Related <span className="text-brand italic">services</span>
            </h2>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {service.relatedServices.map(rel => (
              <StaggerItem key={rel.slug}>
                <Link
                  href={`/services/${rel.slug}`}
                  className="group block bg-card rounded-2xl border border-border overflow-hidden hover:border-brand/30 transition-colors"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={rel.image} alt={rel.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg text-foreground mb-1">{rel.title}</h3>
                    <p className="text-sm text-muted-foreground">{rel.description}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
