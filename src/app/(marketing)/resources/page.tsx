import type { Metadata } from 'next';
import { Gift, CreditCard, BadgeDollarSign, HelpCircle } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimateOnScroll';

export const metadata: Metadata = {
  title: 'Resources',
  description: "Resources for Mike's Clean Cut Landscaping clients — referral program, bill pay, financing, and FAQ.",
};

const resources = [
  {
    icon: Gift,
    title: 'Referral Program',
    description: "Love our work? Refer a friend and you'll both benefit. Ask about our referral rewards during your next appointment.",
  },
  {
    icon: CreditCard,
    title: 'Online Bill Pay',
    description: 'Pay invoices conveniently online. Contact our office for account details and payment portal access.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Financing Options',
    description: "Big projects don't have to wait. We offer financing to make your dream landscape a reality.",
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Have questions? Browse our FAQ or contact our office — we\'re happy to help.',
  },
];

export default function Resources() {
  return (
    <>
      <PageHero
        title="Resources"
        subtitle=""
        backgroundImage="/images/site/lighting-fountain.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Resources' }]}
      />

      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(r => (
              <StaggerItem key={r.title}>
                <div className="bg-card rounded-2xl border border-border p-8 lg:p-12 h-full">
                  <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center mb-6">
                    <r.icon size={22} className="text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-3">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <CTABanner heading="Questions? We're here to help." subtitle="Contact our office for assistance." primaryLabel="Contact Us" primaryTo="/contact" />
    </>
  );
}
