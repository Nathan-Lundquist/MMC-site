import type { Metadata } from 'next';
import Image from 'next/image';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import AnimateOnScroll, { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';
import { Shield, Users, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn about Mike's Clean Cut Landscaping Inc — founded in 2000 by Michael Misiewicz. Over 25 years of expert landscaping in Oakland & Macomb Counties.",
};

const values = [
  { icon: Shield, title: 'Integrity', description: 'Honest work at a fair price. Transparency and trust are the foundation of every client relationship.' },
  { icon: Heart, title: 'Craftsmanship', description: 'Every stone placed, every line trimmed, every detail considered. Work that stands the test of time.' },
  { icon: Users, title: 'Community', description: 'A proud local business investing in the communities we serve. Michigan is home.' },
];

const team = [
  { name: 'Michael Misiewicz', role: 'Founder & Owner', image: '/images/My-project-112.png', description: 'With a lifelong passion for the outdoors, Mike founded the company in 2000 and leads every project with hands-on dedication.' },
  { name: 'Design Team', role: 'Landscape Designers', image: '/images/My-project-113.png', description: 'Our creative design team turns dreams into detailed plans — beautiful and functional.' },
  { name: 'Field Crew', role: 'Installation & Maintenance', image: '/images/My-project-114.png', description: 'Experienced teams that execute with precision, bringing designs to life.' },
];

export default function About() {
  return (
    <>
      <PageHero
        title="About Us"
        subtitle=""
        backgroundImage="/images/site/paver-patio.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      {/* Story */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <Image src="/images/site/outdoor-kitchen.jpg" alt="Stone outdoor kitchen built by Mike's Clean Cut Landscaping" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                  <span className="w-12 h-px bg-brand" />
                  Our Story
                </p>
                <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-6">
                  Built on <span className="text-brand italic">passion</span>, grown with purpose
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>Mike&apos;s Clean Cut Landscaping was founded in 2000 by Michael Misiewicz with a simple passion: transforming ordinary outdoor spaces into extraordinary environments.</p>
                  <p>What began as a one-man operation has grown into a full-service company with over 20 years serving residential and commercial clients across Oakland and Macomb Counties.</p>
                  <p>From that first mowed lawn to today&apos;s large-scale projects, our commitment to quality has never wavered.</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center justify-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Values
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              Dream &middot; Design &middot; Build &middot; Enjoy
            </h2>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {values.map(v => (
              <StaggerItem key={v.title}>
                <div className="flex items-start gap-4">
                  <v.icon size={20} className="text-brand flex-shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <h4 className="font-display text-lg text-foreground mb-2">{v.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { number: '25+', label: 'Years' },
              { number: '1000s', label: 'Projects' },
              { number: '2', label: 'Counties' },
              { number: '100%', label: 'Commitment' },
            ].map((stat, i) => (
              <div key={stat.label} className={`rounded-2xl p-8 text-center ${i === 0 ? 'bg-foreground text-white' : 'bg-secondary'}`}>
                <div className={`text-4xl lg:text-5xl font-bold tracking-tight leading-none ${i === 0 ? '' : 'text-foreground'}`}>
                  {stat.number}<span className="text-brand">+</span>
                </div>
                <div className={`text-xs font-semibold uppercase tracking-widest mt-3 ${i === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Team
            </p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              The people behind the work
            </h2>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {team.map(member => (
              <StaggerItem key={member.name}>
                <div className="bg-card rounded-2xl border border-border overflow-hidden group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={member.image} alt={member.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-6 lg:p-8">
                    <h4 className="font-display text-lg text-foreground">{member.name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand mt-1 mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Association */}
      <section className="py-20 bg-secondary">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <AnimateOnScroll>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Proud Member</p>
            <h3 className="font-display text-2xl lg:text-3xl tracking-tight mb-4">Michigan Green Industry Association</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm">Committed to the highest standards of professionalism, education, and environmental stewardship.</p>
            <Image src="/images/logo01.jpg" alt="MGIA member badge" width={200} height={100} className="mx-auto grayscale rounded-lg" />
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
