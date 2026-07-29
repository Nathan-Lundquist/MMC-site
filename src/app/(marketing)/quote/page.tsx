"use client";

import { useState } from 'react';
import { Phone, Shield, CheckCircle, Star, DollarSign, Loader2 } from 'lucide-react';
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

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  description: string;
  contactMethod: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  serviceType: '',
  description: '',
  contactMethod: '',
};

export default function Quote() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
      setFormData(initialFormData);
    } catch {
      setSubmitError(
        `Unable to send your request. Please try again or call us at ${companyInfo.phone}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-display text-2xl tracking-tight mb-3">Quote Request Sent</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thank you! We&apos;ll review your project details and reach out within one business day with your free estimate.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 text-brand text-sm font-medium hover:underline"
                    >
                      Submit another request
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                      <span className="w-12 h-px bg-brand" />
                      Free Estimate
                    </p>
                    <h3 className="font-display text-2xl tracking-tight mb-2">Tell us about your project</h3>
                    <p className="text-sm text-muted-foreground mb-8">Fields marked * are required.</p>

                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="first-name">First Name *</Label>
                          <Input
                            id="first-name"
                            type="text"
                            placeholder="First name"
                            required
                            className={`rounded-xl ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                            value={formData.firstName}
                            onChange={e => handleChange('firstName', e.target.value)}
                          />
                          {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="last-name">Last Name *</Label>
                          <Input
                            id="last-name"
                            type="text"
                            placeholder="Last name"
                            required
                            className={`rounded-xl ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                            value={formData.lastName}
                            onChange={e => handleChange('lastName', e.target.value)}
                          />
                          {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="quote-email">Email *</Label>
                          <Input
                            id="quote-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className={`rounded-xl ${fieldErrors.email ? 'border-red-500' : ''}`}
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                          />
                          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="quote-phone">Phone *</Label>
                          <Input
                            id="quote-phone"
                            type="tel"
                            placeholder="(248) 000-0000"
                            required
                            className={`rounded-xl ${fieldErrors.phone ? 'border-red-500' : ''}`}
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                          />
                          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                        </div>
                      </div>
                      <div className="mb-5">
                        <Label htmlFor="address">Property Address *</Label>
                        <Input
                          id="address"
                          type="text"
                          placeholder="Street address, city, state, zip"
                          required
                          className={`rounded-xl ${fieldErrors.address ? 'border-red-500' : ''}`}
                          value={formData.address}
                          onChange={e => handleChange('address', e.target.value)}
                        />
                        {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                      </div>
                      <div className="mb-5">
                        <Label htmlFor="service-type">Service Type *</Label>
                        <select
                          id="service-type"
                          required
                          value={formData.serviceType}
                          onChange={e => handleChange('serviceType', e.target.value)}
                          className={`w-full h-11 px-4 border bg-background text-sm text-foreground font-sans rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-shadow ${fieldErrors.serviceType ? 'border-red-500' : 'border-input'}`}
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
                        {fieldErrors.serviceType && <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceType}</p>}
                      </div>
                      <div className="mb-5">
                        <Label htmlFor="project-desc">Project Description *</Label>
                        <Textarea
                          id="project-desc"
                          placeholder="Describe your project, goals, timeline..."
                          required
                          className={`min-h-[140px] rounded-xl ${fieldErrors.description ? 'border-red-500' : ''}`}
                          value={formData.description}
                          onChange={e => handleChange('description', e.target.value)}
                        />
                        {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
                      </div>

                      <fieldset className="mb-8">
                        <legend className="text-sm font-medium leading-none mb-3">Preferred Contact Method *</legend>
                        <div className="flex gap-6 flex-wrap">
                          {['Phone', 'Email', 'Text'].map(method => (
                            <label key={method} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                              <input
                                type="radio"
                                name="contact_method"
                                value={method.toLowerCase()}
                                required
                                className="accent-brand"
                                checked={formData.contactMethod === method.toLowerCase()}
                                onChange={e => handleChange('contactMethod', e.target.value)}
                              />
                              {method}
                            </label>
                          ))}
                        </div>
                        {fieldErrors.contactMethod && <p className="text-red-500 text-xs mt-1">{fieldErrors.contactMethod}</p>}
                      </fieldset>

                      {submitError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                          {submitError}
                        </div>
                      )}

                      <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          'Request My Free Quote'
                        )}
                      </Button>
                    </form>
                  </>
                )}
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
                  <p className="text-xs text-white/70 mb-2 uppercase tracking-wider">Prefer to talk?</p>
                  <a href={companyInfo.phoneHref} className="text-2xl font-bold text-white block mb-1">{companyInfo.phone}</a>
                  <p className="text-xs text-white/60">Mon &ndash; Fri, 9am &ndash; 4pm</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
