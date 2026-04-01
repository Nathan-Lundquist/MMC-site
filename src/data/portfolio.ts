export interface PortfolioItem {
  image: string;
  title: string;
  category: string;
  alt: string;
}

export const portfolioCategories = ['all', 'hardscape', 'landscape', 'turf', 'lighting', 'pool'] as const;
export const portfolioCategoryLabels: Record<string, string> = {
  all: 'All',
  hardscape: 'Hardscape',
  landscape: 'Landscape',
  turf: 'Turf',
  lighting: 'Outdoor Lighting',
  pool: 'Pool & Spa',
};

export const portfolioItems: PortfolioItem[] = [
  { image: '/images/site/paver-patio.jpg', title: 'Custom Paver Patio - Shelby Township', category: 'hardscape', alt: 'Custom paver patio installation in Shelby Township' },
  { image: '/images/site/paver-entryway.jpg', title: 'Stone Walkway & Patio - Auburn Hills', category: 'hardscape', alt: 'Hardscape project with stone walkway in Auburn Hills' },
  { image: '/images/site/outdoor-kitchen.jpg', title: 'Outdoor Kitchen & Grill Station - Lake Orion', category: 'hardscape', alt: 'Outdoor kitchen and grill station in Lake Orion' },
  { image: '/images/site/fire-pit.jpg', title: 'Custom Fire Pit & Seating - Orion Township', category: 'hardscape', alt: 'Custom fire pit and seating area in Orion Township' },
  { image: '/images/site/limestone-wall.jpg', title: 'Natural Stone Retaining Wall - Auburn Hills', category: 'hardscape', alt: 'Natural limestone retaining wall installation' },
  { image: '/images/site/blue-stone.jpg', title: 'Blue Stone Patio - Rochester Hills', category: 'hardscape', alt: 'Distinctive blue stone patio installation' },
  { image: '/images/site/front-yard.jpg', title: 'Front Yard Landscape Design - Troy', category: 'landscape', alt: 'Professional front yard landscaping with plantings' },
  { image: '/images/site/patio-garden.jpg', title: 'Garden & Patio Integration - Washington Township', category: 'landscape', alt: 'Patio with garden bed integration' },
  { image: '/images/site/outdoor-kitchen-2.jpg', title: 'Outdoor Living Space - Sterling Heights', category: 'landscape', alt: 'Complete outdoor living landscape design' },
  { image: '/images/site/hero.jpg', title: 'Full Property Renovation - Rochester Hills', category: 'landscape', alt: 'Full property landscape renovation' },
  { image: '/images/site/lighting-fountain.jpg', title: 'LED Path & Fountain Lighting - Oakland Township', category: 'lighting', alt: 'LED path lighting with illuminated fountain' },
  { image: '/images/site/hero-night.jpg', title: 'Architectural Accent Lighting - Bloomfield Hills', category: 'lighting', alt: 'Architectural accent lighting on stone steps at twilight' },
  { image: '/images/site/pool-aerial.jpg', title: 'Pool & Patio Integration - Macomb', category: 'pool', alt: 'Aerial view of pool and patio integration' },
  { image: '/images/site/pool-deck.jpg', title: 'Custom Pool Deck - Clarkston', category: 'pool', alt: 'Custom paver pool deck with hot tub' },
  { image: '/images/site/pool-closeup.jpg', title: 'Pool Stone Detail - Lake Orion', category: 'pool', alt: 'Pool stone detail and coping' },
  { image: '/images/site/pool-stone.jpg', title: 'Pool Surround - Troy', category: 'pool', alt: 'Natural stone pool surround' },
];
