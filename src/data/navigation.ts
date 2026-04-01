export const services = [
  { label: 'Turf Management', slug: 'turf' },
  { label: 'Landscape Design', slug: 'landscape' },
  { label: 'Hardscape Installation', slug: 'hardscape' },
  { label: 'Outdoor Lighting', slug: 'outdoor-lighting' },
  { label: 'Pool & Spa', slug: 'pool-spa' },
  { label: 'Forestry', slug: 'forestry' },
  { label: 'Irrigation', slug: 'irrigation' },
  { label: 'Snow Plowing', slug: 'snow-plowing' },
] as const;

export const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Testimonials', to: '/testimonials' },
  { label: 'Free Quote', to: '/quote' },
  { label: 'Contact', to: '/contact' },
  { label: 'Blog', to: '/blog' },
  { label: 'Resources', to: '/resources' },
  { label: 'Careers', to: '/careers' },
] as const;

export const companyInfo = {
  name: "Mike's Clean Cut Landscaping Inc.",
  phone: '(248) 879-4504',
  phoneHref: 'tel:2488794504',
  fax: '(248) 879-1419',
  email: 'office@mikescleancut.com',
  address: '2632 S. Rochester Rd #70858',
  city: 'Rochester Hills, MI 48307',
  hours: 'Mon – Fri: 9:00 AM – 4:00 PM',
  facebook: 'https://facebook.com/MikesCleanCutLandscapingInc/',
  instagram: 'https://instagram.com/mikescleancut/',
  tagline: 'Dream · Design · Build · Enjoy',
  founded: 2000,
  url: 'https://mikescleancut.com',
};
