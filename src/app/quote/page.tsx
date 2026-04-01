"use client";

import { Phone, Shield, CheckCircle, Star, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageHero from '@/components/layout/PageHero';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { companyInfo } from '@/data/navigation';

const trustSignals = [
  { icon: Shield, text: '25+ years trusted since 2000' },
  { icon: DollarSign, text: 'Free estimates, no obligation' },
  { icon: CheckCircle, text: 'Licensed & fully insured' },
  { icon: Star, text: 'Satisfaction guaranteed' },
];

export default function Quote() {
  return (
    <>
      <PageHero
        title="Free Quote"
        subtitle=""
        backgroundImage="/images/site/patio-garden.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Free Quote' }]}
      />

      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Form */}
            <AnimateOnScroll className="lg:col-span-7">
              <div className="bg-card rounded-2xl border border-border p-8 lg:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                  <span className="w-12 h-px bg-brand" />
                  Free Estimate
                </p>
                <h3 className="font-display text-2xl tracking-tight mb-2">Tell us about your project</h3>
                <p className="text-sm text-muted-foreground mb-8">Fields marked * are required.</p>

                <form onSubmit={e => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div><Label>First Name *</Label><Input type="text" placeholder="First name" required className="rounded-xl" /></div>
                    <div><Label>Last Name *</Label><Input type="text" placeholder="Last name" required className="rounded-xl" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div><Label>Email *</Label><Input type="email" placeholder="you@example.com" required className="rounded-xl" /></div>
                    <div><Label>Phone *</Label><Input type="tel" placeholder="(248) 000-0000" required className="rounded-xl" /></div>
                  </div>
                  <div className="mb-5">
                    <Label>Property Address *</Label>
                    <Input type="text" placeholder="Street address, city, state, zip" required className="rounded-xl" />
                  </div>
                  <div className="mb-5">
                    <Label>Service Type *</Label>
                    <select
                      required
                      defaultValue=""
                      className="w-full h-11 px-4 border border-input bg-background text-sm text-foreground font-sans rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    >
                      <option value="" disabled>Select a service...</option>
                      <option value="turf-management">Turf Management</option>
                      <option value="landscape-design">Landscape Design</option>
                      <option value="hardscape-installation">Hardscape Installation</option>
                      <option value="outdoor-lighting">Outdoor Lighting</option>
                      <option value="pool-spa">Pool & Spa</option>
                      <option value="forestry">Forestry</option>
                      <option value="irrigation">Irrigation</option>
                      <option value="snow-plowing">Snow Plowing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-5">
                    <Label>Project Description *</Label>
                    <Textarea placeholder="Describe your project, goals, timeline..." required className="min-h-[140px] rounded-xl" />
                  </div>

                  <div className="mb-8">
                    <Label>Preferred Contact Method *</Label>
                    <div className="flex gap-6 flex-wrap mt-3">
                      {['Phone', 'Email', 'Text'].map(method => (
                        <label key={method} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input type="radio" name="contact_method" value={method.toLowerCase()} required className="accent-brand" />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" size="lg">
                    Request My Free Quote
                  </Button>
                </form>
              </div>
            </AnimateOnScroll>

            {/* Sidebar */}
            <AnimateOnScroll delay={0.1} className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-24">
              <div className="space-y-6">
                {/* Trust signals */}
                <div className="bg-card rounded-2xl border border-border p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">Why Choose Us</p>
                  <div className="flex flex-col gap-4">
                    {trustSignals.map(s => (
                      <div key={s.text} className="flex items-center gap-3 text-sm text-foreground">
                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                          <s.icon size={14} className="text-brand" />
                        </div>
                        {s.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phone CTA */}
                <div className="bg-foreground rounded-2xl p-8">
                  <Phone size={24} className="text-brand mb-4" />
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Prefer to talk?</p>
                  <a href={companyInfo.phoneHref} className="text-2xl font-bold text-white block mb-1">{companyInfo.phone}</a>
                  <p className="text-xs text-white/30">Mon &ndash; Fri, 9am &ndash; 4pm</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
