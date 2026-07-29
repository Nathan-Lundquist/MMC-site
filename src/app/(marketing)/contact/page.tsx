"use client";

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Printer, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { companyInfo } from '@/data/navigation';

const contactPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: `Contact ${companyInfo.name}`,
  description: `Get in touch with ${companyInfo.name}. Call us at ${companyInfo.phone} or visit our office in Rochester Hills, MI.`,
  url: `${companyInfo.url}/contact`,
  mainEntity: {
    '@type': 'LandscapingBusiness',
    name: companyInfo.name,
    telephone: companyInfo.phone,
    faxNumber: companyInfo.fax,
    email: companyInfo.email,
    url: companyInfo.url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2632 S. Rochester Rd #70858',
      addressLocality: 'Rochester Hills',
      addressRegion: 'MI',
      postalCode: '48307',
      addressCountry: 'US',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '16:00',
      },
    ],
  },
};

const contactInfo = [
  { icon: Phone, label: 'Phone', value: companyInfo.phone, href: companyInfo.phoneHref },
  { icon: Printer, label: 'Fax', value: companyInfo.fax },
  { icon: Mail, label: 'Email', value: companyInfo.email, href: `mailto:${companyInfo.email}` },
  { icon: MapPin, label: 'Address', value: `${companyInfo.address}, ${companyInfo.city}` },
  { icon: Clock, label: 'Hours', value: companyInfo.hours },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function Contact() {
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
      const res = await fetch('/api/contact', {
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
        `Unable to send your message. Please try again or call us at ${companyInfo.phone}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
      />
      <PageHero
        title="Contact"
        subtitle=""
        backgroundImage="/images/site/front-yard.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
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
                    <h3 className="font-display text-2xl tracking-tight mb-3">Message Sent</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thank you for reaching out. We&apos;ll get back to you within one business day.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 text-brand text-sm font-medium hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
                      <span className="w-12 h-px bg-brand" />
                      Message
                    </p>
                    <h3 className="font-display text-2xl tracking-tight mb-2">Send us a message</h3>
                    <p className="text-sm text-muted-foreground mb-8">We&apos;ll get back to you within one business day.</p>

                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="full-name">Full Name *</Label>
                          <Input
                            id="full-name"
                            type="text"
                            placeholder="Your full name"
                            required
                            className={`rounded-xl ${fieldErrors.name ? 'border-red-500' : ''}`}
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                          />
                          {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className={`rounded-xl ${fieldErrors.email ? 'border-red-500' : ''}`}
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                          />
                          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(248) 000-0000"
                            className={`rounded-xl ${fieldErrors.phone ? 'border-red-500' : ''}`}
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                          />
                          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            type="text"
                            placeholder="How can we help?"
                            required
                            className={`rounded-xl ${fieldErrors.subject ? 'border-red-500' : ''}`}
                            value={formData.subject}
                            onChange={e => handleChange('subject', e.target.value)}
                          />
                          {fieldErrors.subject && <p className="text-red-500 text-xs mt-1">{fieldErrors.subject}</p>}
                        </div>
                      </div>
                      <div className="mb-8">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your project..."
                          required
                          className={`min-h-[160px] rounded-xl ${fieldErrors.message ? 'border-red-500' : ''}`}
                          value={formData.message}
                          onChange={e => handleChange('message', e.target.value)}
                        />
                        {fieldErrors.message && <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>}
                      </div>

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
                          'Send Message'
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </AnimateOnScroll>

            {/* Contact info */}
            <AnimateOnScroll delay={0.1} className="lg:col-span-4 lg:col-start-9">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-3">
                <span className="w-12 h-px bg-brand" />
                Contact Info
              </p>

              <div className="flex flex-col gap-6">
                {contactInfo.map(item => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium text-foreground hover:text-brand transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-sm text-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Follow Us</p>
                <div className="flex gap-3">
                  <a href={companyInfo.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-foreground hover:bg-brand flex items-center justify-center transition-colors text-white text-xs font-bold">f</a>
                  <a href={companyInfo.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-foreground hover:bg-brand flex items-center justify-center transition-colors text-white text-xs font-bold">ig</a>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Map */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-12">
          <div className="rounded-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2937.5!2d-83.1338!3d42.6584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8824e9c1f2d3b4e5%3A0x0!2s2632+S+Rochester+Rd%2C+Rochester+Hills%2C+MI+48307!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
              width="100%"
              height="400"
              className="border-0 block w-full h-[300px] sm:h-[400px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mike's Clean Cut Landscaping office in Rochester Hills, MI"
            />
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
