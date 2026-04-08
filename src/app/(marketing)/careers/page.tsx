import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, DollarSign, Sun, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import AnimateOnScroll, { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';

export const metadata: Metadata = {
  title: 'Careers',
  description: "Join Mike's Clean Cut Landscaping team. Hiring landscape crew, hardscape installers, and technicians in Rochester Hills, MI.",
};

const jobs = [
  {
    title: 'Landscape Crew Member',
    type: 'Full-Time, Seasonal',
    location: 'Rochester Hills, MI',
    description: "Join our landscape installation team. You'll assist with planting, grading, mulching, and general landscape construction.",
    requirements: [
      'Landscape installation including plantings, beds, grading',
      'Operate basic equipment (training provided)',
      'Lift 50+ lbs, work outdoors in various conditions',
      'Valid driver\'s license preferred',
    ],
  },
  {
    title: 'Hardscape Installer',
    type: 'Full-Time',
    location: 'Rochester Hills, MI',
    description: "Experienced hardscape installer for paver patios, retaining walls, outdoor kitchens, and fire pits.",
    requirements: [
      'Install pavers, natural stone, retaining walls',
      'Read and interpret project plans',
      '1\u20133 years hardscape/masonry experience preferred',
      'Valid driver\'s license required',
    ],
  },
  {
    title: 'Lawn Maintenance Technician',
    type: 'Full-Time, Seasonal',
    location: 'Rochester Hills, MI',
    description: "Handle mowing, trimming, edging, blowing, and property upkeep on a recurring schedule.",
    requirements: [
      'Weekly mowing, trimming, edging, blowing',
      'Maintain equipment and quality standards',
      'Work independently or as part of a crew',
      'No experience necessary \u2014 we train',
    ],
  },
];

const benefits = [
  { icon: DollarSign, title: 'Competitive Pay', description: 'Above-market wages with overtime and performance bonuses.' },
  { icon: Sun, title: 'Outdoor Work', description: 'Skip the cubicle. Create beautiful landscapes every day.' },
  { icon: TrendingUp, title: 'Growth', description: 'Training and clear paths to crew leader and foreman roles.' },
  { icon: Users, title: 'Team Culture', description: 'Supportive crew, team events, and camaraderie.' },
];

export default function Careers() {
  return (
    <>
      <PageHero
        title="Careers"
        subtitle=""
        backgroundImage="/images/site/outdoor-kitchen-2.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Careers' }]}
      />

      {/* Culture */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                  <span className="w-12 h-px bg-brand" />
                  Why Work With Us
                </p>
                <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-6">
                  25+ years of <span className="text-brand italic">excellence</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;re more than a landscaping company — we&apos;re a team that takes pride in transforming outdoor spaces. Since our founding, we&apos;ve built a reputation for quality, reliability, and treating team members like family.
                </p>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image src="/images/site/outdoor-kitchen-2.jpg" alt="Team building an outdoor kitchen" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            </div>
          </AnimateOnScroll>

          {/* Benefits */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {benefits.map(b => (
              <StaggerItem key={b.title}>
                <div className="bg-secondary rounded-2xl p-8 h-full">
                  <div className="w-14 h-14 rounded-full border-2 border-brand/20 flex items-center justify-center mb-6">
                    <b.icon size={22} className="text-brand" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-24 lg:py-32 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Open Positions
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              Current <span className="text-brand italic">opportunities</span>
            </h2>
          </AnimateOnScroll>

          <StaggerContainer className="flex flex-col gap-4 max-w-3xl">
            {jobs.map(job => (
              <StaggerItem key={job.title}>
                <div className="bg-card rounded-2xl border border-border p-8 lg:p-10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-display text-xl text-foreground">{job.title}</h3>
                    <Button asChild variant="outline-brand" size="sm" className="hidden sm:inline-flex">
                      <Link href="/contact">
                        Apply <ArrowRight size={12} />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-xs font-semibold bg-brand/10 text-brand px-3 py-1 rounded-full">{job.type}</span>
                    <span className="text-xs font-semibold bg-secondary text-muted-foreground px-3 py-1 rounded-full">{job.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{job.description}</p>
                  <ul className="flex flex-col gap-2">
                    {job.requirements.map(req => (
                      <li key={req} className="flex items-start gap-2 text-sm text-foreground/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="sm" className="mt-6 sm:hidden">
                    <Link href="/contact">Apply Now</Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <CTABanner heading="Ready to apply?" subtitle="Contact our office to learn more about joining the team." primaryLabel="Contact Us" primaryTo="/contact" secondaryHref={undefined} />
    </>
  );
}
