import HeroSection from '@/components/sections/HeroSection';
import StatsBar from '@/components/sections/StatsBar';
import ServiceGrid from '@/components/sections/ServiceGrid';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import CTABanner from '@/components/sections/CTABanner';
import TestimonialPreview from '@/components/sections/TestimonialPreview';
import ServiceArea from '@/components/sections/ServiceArea';
import { companyInfo } from '@/data/navigation';
import { services } from '@/data/navigation';

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LandscapingBusiness',
  name: companyInfo.name,
  image: `${companyInfo.url}/images/logo.png`,
  '@id': companyInfo.url,
  url: companyInfo.url,
  telephone: companyInfo.phone,
  email: companyInfo.email,
  faxNumber: companyInfo.fax,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '2632 S. Rochester Rd #70858',
    addressLocality: 'Rochester Hills',
    addressRegion: 'MI',
    postalCode: '48307',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 42.6584,
    longitude: -83.1338,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '16:00',
    },
  ],
  foundingDate: '2000',
  slogan: companyInfo.tagline,
  description:
    "Southeast Michigan's trusted landscaping partner since 2000. Full-service landscape design, hardscaping, outdoor lighting, pools, and year-round property care.",
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Landscaping Services',
    itemListElement: services.map((s) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s.label,
        url: `${companyInfo.url}/services/${s.slug}`,
      },
    })),
  },
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Oakland County',
      address: { '@type': 'PostalAddress', addressRegion: 'MI', addressCountry: 'US' },
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Macomb County',
      address: { '@type': 'PostalAddress', addressRegion: 'MI', addressCountry: 'US' },
    },
  ],
  sameAs: [companyInfo.facebook, companyInfo.instagram],
  priceRange: '$$',
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <HeroSection />
      <StatsBar />
      <ServiceGrid />
      <WhyChooseUs />
      <CTABanner />
      <TestimonialPreview />
      <ServiceArea />
      <CTABanner
        heading="Your Dream Landscape Starts Here"
        subtitle="Schedule your free consultation with Mike's Clean Cut Landscaping today."
        primaryLabel="Request a Quote"
        secondaryLabel={companyInfo.phone}
      />
    </>
  );
}
