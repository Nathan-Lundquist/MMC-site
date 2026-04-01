export interface ServiceCard {
  title: string;
  description: string;
  image?: string;
  badge?: string;
  includes?: string[];
}

export interface WhyUsItem {
  title: string;
  description: string;
}

export interface RelatedService {
  slug: string;
  title: string;
  description: string;
  image: string;
}

export interface ServiceData {
  slug: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  heroHeading: string;
  heroSubtitle: string;
  introLabel: string;
  introHeading: string;
  introText: string[];
  introImage?: string;
  servicesSectionLabel: string;
  servicesSectionHeading: string;
  servicesSectionSubtitle: string;
  serviceCards: ServiceCard[];
  maintenanceLabel?: string;
  maintenanceHeading?: string;
  maintenanceSubtitle?: string;
  maintenanceCards?: ServiceCard[];
  whyUsLabel: string;
  whyUsHeading: string;
  whyUsSubtitle: string;
  whyUsItems: WhyUsItem[];
  relatedServices: RelatedService[];
  homeImage: string;
  homeDescription: string;
}

export const servicesData: ServiceData[] = [
  {
    slug: 'hardscape',
    title: 'Hardscape Installation',
    shortTitle: 'Hardscape',
    metaTitle: 'Hardscape Installation | Patios & Pavers Rochester Hills MI',
    metaDescription: 'Expert hardscape installation in Rochester Hills, MI. Custom patios, driveways, retaining walls, outdoor kitchens, fire pits, natural stone masonry, and paver maintenance.',
    heroImage: '/images/site/paver-patio.jpg',
    heroHeading: 'Hardscape Design & Installation',
    heroSubtitle: 'Custom patios, driveways, retaining walls, and outdoor living spaces — built to last and designed to impress.',
    introLabel: "Oakland & Macomb Counties' Hardscape Experts",
    introHeading: "Build the Outdoor Space You've Always Wanted",
    introText: [
      "Your backyard has unlimited potential. Whether you're dreaming of a spacious paver patio for entertaining, a fire pit for cool Michigan evenings, or a complete outdoor kitchen, Mike's Clean Cut Landscaping turns those ideas into reality. We combine precision craftsmanship with quality materials to build hardscape features that stand up to Michigan's freeze-thaw cycles for decades.",
      'From the initial design consultation through final construction, our team manages every detail. We work with brick pavers, natural stone, decorative concrete, and premium masonry materials to create spaces that are as functional as they are beautiful.',
    ],
    introImage: '/images/site/outdoor-kitchen.jpg',
    servicesSectionLabel: 'Installation Services',
    servicesSectionHeading: 'Custom Hardscape Construction',
    servicesSectionSubtitle: 'From driveways to outdoor kitchens, we design and build hardscape features that transform how you live outdoors.',
    serviceCards: [
      { title: 'Driveways, Walkways & Courtyards', description: "Make a lasting first impression with custom paver driveways, elegant walkways, and welcoming courtyards. We design patterns and select materials that complement your home's architecture.", image: '/images/site/paver-entryway.jpg' },
      { title: 'Patios & Pool Decks', description: 'Create the perfect outdoor living and entertaining space. Our patios and pool decks are built on a proper base for long-term stability, with slip-resistant options available for poolside areas.', image: '/images/site/pool-deck.jpg' },
      { title: 'Retaining Walls, Seat Walls & Pillars', description: "Structural and decorative wall systems that manage elevation changes, define outdoor spaces, and add architectural interest. Built to withstand Michigan's demanding climate.", image: '/images/site/limestone-wall.jpg' },
      { title: 'Outdoor Living Spaces', description: 'Extend your living space outdoors with custom fireplaces, fire pits, fully equipped outdoor kitchens, and built-in grills. Designed for year-round enjoyment and entertaining.', image: '/images/site/outdoor-kitchen.jpg' },
      { title: 'Natural Stone Masonry', description: 'Timeless beauty meets expert craftsmanship. We build stunning stone steps, patios, and entryways using natural stone for a one-of-a-kind look that ages beautifully.', image: '/images/site/blue-stone.jpg' },
      { title: 'Fire Features', description: 'Outdoor fireplaces, fire bowls, and custom fire pits that become the focal point of your backyard. Perfect for gathering with family and friends on cool evenings.', image: '/images/site/fire-pit.jpg' },
    ],
    maintenanceLabel: 'Maintenance & Repair',
    maintenanceHeading: 'Protect Your Investment',
    maintenanceSubtitle: 'Keep your existing hardscape looking and performing its best with our professional maintenance services.',
    maintenanceCards: [
      { title: 'Paver Repairs & Relayment', description: 'Settling, shifting, or damaged pavers? We remove, re-level the base, and relay pavers to restore your patio or walkway to like-new condition.' },
      { title: 'Brick Paver Cleaning & Sealing', description: 'Professional cleaning removes stains, moss, and buildup. Sealing protects against UV fading, staining, and weed growth while enhancing the color of your pavers.' },
      { title: 'Decorative Concrete Cleaning & Sealing', description: 'Extend the life and beauty of stamped, stained, or exposed aggregate concrete with thorough cleaning and professional-grade sealant application.' },
      { title: 'Joint Re-Sanding', description: 'Polymeric sand between pavers breaks down over time. We clean out joints and apply fresh polymeric sand to prevent weed growth, insect intrusion, and paver shifting.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'The Hardscape Team You Can Trust',
    whyUsSubtitle: 'When it comes to your biggest outdoor investment, experience and quality matter.',
    whyUsItems: [
      { title: 'Expert Craftsmanship', description: 'Precision installation techniques and attention to detail on every project, large or small.' },
      { title: 'Premium Materials', description: "We source from top manufacturers to ensure your hardscape withstands Michigan's climate." },
      { title: 'Full-Service Design', description: 'From concept sketches to 3-D renderings, we help you visualize and refine your project.' },
      { title: 'Built to Last', description: 'Proper base preparation and drainage ensure your hardscape performs for decades.' },
    ],
    relatedServices: [
      { slug: 'outdoor-lighting', title: 'Outdoor Lighting', description: 'Showcase your new hardscape after dark with professional landscape and accent lighting.', image: '/images/site/lighting-fountain.jpg' },
      { slug: 'landscape', title: 'Landscape Design', description: 'Soften and frame your hardscape with custom plantings, mulch, and landscape design.', image: '/images/site/front-yard.jpg' },
      { slug: 'pool-spa', title: 'Pool & Spa', description: 'Pair your new patio or pool deck with professional pool and spa services.', image: '/images/site/pool-aerial.jpg' },
    ],
    homeImage: '/images/site/paver-patio.jpg',
    homeDescription: 'Patios, retaining walls, driveways, outdoor kitchens, and fire features built with premium materials and expert craftsmanship.',
  },
  {
    slug: 'landscape',
    title: 'Landscape Design & Installation',
    shortTitle: 'Landscape',
    metaTitle: 'Landscape Design & Installation | Rochester Hills MI',
    metaDescription: 'Custom landscape design and installation in Oakland & Macomb Counties. Garden beds, seasonal plantings, full property transformations designed for Michigan climate.',
    heroImage: '/images/site/front-yard.jpg',
    heroHeading: 'Landscape Design & Installation',
    heroSubtitle: 'Custom planting plans, garden beds, seasonal color programs, and full property transformations designed for Michigan.',
    introLabel: 'Full-Service Landscaping',
    introHeading: 'Bringing Your Vision to Life',
    introText: [
      "Great landscaping does more than beautify your property — it increases value, improves drainage, and creates spaces you actually want to spend time in. At Mike's Clean Cut Landscaping, we handle everything from initial design concepts with 2-D and 3-D rendered plans to the final mulch spread.",
      "Our team serves homeowners throughout Oakland and Macomb Counties with a full range of landscape services, from seasonal bed maintenance and flower planting to large-scale grading projects and water management solutions. No project is too small or too complex.",
    ],
    introImage: '/images/site/patio-garden.jpg',
    servicesSectionLabel: 'Design & Installation Services',
    servicesSectionHeading: 'Full-Service Landscape Solutions',
    servicesSectionSubtitle: 'From concept to completion, we handle every phase of your landscape project.',
    serviceCards: [
      { title: 'Shrub & Tree Pruning/Shaping', description: 'Expert pruning and shaping to maintain plant health, encourage growth, and keep your landscape looking clean and intentional.' },
      { title: 'Bed Maintenance', description: 'Seasonal weeding, deadheading, and perennial trimming to keep your planting beds vibrant and tidy throughout the growing season.' },
      { title: 'Annual & Mum Flower Planting', description: "Brighten your property with spring and fall flower installations. We select varieties that thrive in Michigan's climate for lasting seasonal color." },
      { title: 'Mulch Installation', description: 'Premium mulch application for moisture retention, weed control, and a polished appearance. We match mulch color and type to your landscape design.' },
      { title: 'Sod Installation', description: 'From small patch jobs to complete lawn replacements, we install quality sod for an instant, lush green lawn. Full installations and targeted repairs available.' },
      { title: 'Landscape Design & Construction', description: 'Our design team creates custom 2-D and 3-D rendered plans so you can visualize your new landscape before a single plant goes in the ground.' },
      { title: 'Rough & Finish Grading', description: 'Proper grading is the foundation of a healthy landscape. We ensure correct drainage slopes and smooth surfaces for lawns, patios, and garden beds.' },
      { title: 'Water Management', description: "Solve drainage problems with French drains, underground downspouts, and drainage fields. We engineer solutions that protect your home's foundation and landscape." },
      { title: 'Pressure Washing', description: 'Restore driveways, walkways, patios, and siding to like-new condition. Professional pressure washing removes years of dirt, mildew, and staining.' },
      { title: 'Holiday Lighting & Decor', description: 'Make your home shine during the holidays with professional lighting design and installation. We handle setup, takedown, and storage so you can enjoy the season stress-free.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Landscapes That Last',
    whyUsSubtitle: 'Our deep knowledge of Michigan horticulture sets us apart.',
    whyUsItems: [
      { title: 'Design Expertise', description: 'From concept to completion, our design team creates plans that balance beauty, function, and budget.' },
      { title: 'Quality Materials', description: 'We source premium plants, mulch, and sod from trusted local suppliers for results that last.' },
      { title: 'Complete Solutions', description: "Drainage issues, grading, planting, and maintenance — we handle every aspect of your landscape." },
      { title: '25+ Years Experience', description: 'Proven results backed by thousands of completed landscape projects.' },
    ],
    relatedServices: [
      { slug: 'hardscape', title: 'Hardscape Installation', description: 'Complement your plantings with patios, walkways, and retaining walls.', image: '/images/site/paver-patio.jpg' },
      { slug: 'outdoor-lighting', title: 'Outdoor Lighting', description: 'Illuminate your landscape after dark with professional lighting.', image: '/images/site/lighting-fountain.jpg' },
      { slug: 'irrigation', title: 'Irrigation', description: 'Keep your new landscape healthy with an efficient irrigation system.', image: '/images/site/front-yard.jpg' },
    ],
    homeImage: '/images/site/front-yard.jpg',
    homeDescription: 'Custom planting plans, garden beds, seasonal color programs, and full property transformations designed for Michigan\'s climate.',
  },
  {
    slug: 'turf',
    title: 'Turf Management',
    shortTitle: 'Turf',
    metaTitle: 'Turf Management & Lawn Care | Rochester Hills MI',
    metaDescription: 'Professional turf management in Oakland & Macomb Counties. Mowing, fertilization, aeration, overseeding, weed control, and complete lawn care programs.',
    heroImage: '/images/site/front-yard.jpg',
    heroHeading: 'Turf Management & Lawn Care',
    heroSubtitle: 'Thick, green, healthy lawns through expert mowing, fertilization, aeration, and year-round turf care programs.',
    introLabel: 'Expert Lawn Care',
    introHeading: 'A Healthy Lawn Starts with Professional Turf Management',
    introText: [
      "Your lawn is the first thing people notice about your property. At Mike's Clean Cut Landscaping, we provide comprehensive turf management services designed for the unique climate of Oakland and Macomb Counties. From the first spring cleanup to the final fall leaf removal, our experienced crew ensures your lawn stays lush, green, and well-maintained all year long.",
      "Whether you need weekly maintenance or targeted treatments like dethatching and over seeding, we tailor every plan to your lawn's specific needs. Our attention to detail and reliable scheduling mean you can enjoy a beautiful yard without lifting a finger.",
    ],
    introImage: '/images/site/patio-garden.jpg',
    servicesSectionLabel: 'Lawn Care Services',
    servicesSectionHeading: 'Year-Round Turf Programs',
    servicesSectionSubtitle: 'Seasonal services tailored to keep your lawn healthy through every Michigan season.',
    serviceCards: [
      { title: 'Spring Cleanup', description: 'We kick off the season with a thorough removal of leaves and debris from lawns and planting beds, giving your property a fresh start. All spring cleanups are completed by April 30th so your yard is ready to thrive.', badge: 'Spring', includes: ['Leaf and debris removal from all lawn areas', 'Planting bed cleanup and preparation', 'Completed by April 30th each year'] },
      { title: 'Lawn Maintenance', description: 'Our core lawn maintenance package keeps your property looking pristine week after week throughout the growing season. Consistent care is the foundation of a healthy lawn.', badge: 'Weekly', includes: ['Weekly mowing at the optimal height', 'Line trimming around edges and obstacles', 'Planting bed cleanup with each visit', 'Bi-monthly concrete edging for crisp borders'] },
      { title: 'Fall Cleanup', description: 'Prepare your lawn for Michigan winters with our comprehensive fall cleanup service. Proper fall care prevents disease and ensures a strong start the following spring.', badge: 'Fall', includes: ['Complete leaf removal from lawns and beds', 'Perennial plant trimming for winter protection', 'Completed by November 30th each year'] },
      { title: 'Dethatching', description: 'Thatch buildup suffocates your lawn by blocking water, air, and nutrients from reaching the soil. Our dethatching service removes this debris layer between the soil and grass blades, restoring your lawn\'s ability to breathe and grow.', badge: 'Treatment', includes: ['Removal of debris layer between soil and grass', 'Improved water and nutrient absorption', 'Healthier, thicker turf growth'] },
      { title: 'Over Seeding', description: 'Thin or bare spots in your lawn? Over seeding is the answer. We plant additional grass seed in problem areas to fill in gaps and create a dense, uniform lawn. Best results are achieved in late summer and early fall when soil temperatures are ideal for germination.', badge: 'Treatment', includes: ['Planting additional seeds in bare or thin spots', 'Best performed in late summer or early fall', 'Creates a denser, more resilient lawn'] },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'The Lawn Care Team You Can Count On',
    whyUsSubtitle: 'Reliable, consistent, and thorough — that\'s our promise.',
    whyUsItems: [
      { title: 'Reliable Scheduling', description: 'We show up on time, every time. Consistent weekly service means your lawn always looks its best.' },
      { title: 'Local Expertise', description: "We understand Michigan's climate and tailor our approach to what works best for Southeast Michigan lawns." },
      { title: 'Detail-Oriented Crew', description: 'From crisp edges to clean planting beds, our team takes pride in delivering a meticulous finish every visit.' },
      { title: 'Year-Round Service', description: 'From spring cleanups to fall aeration, we cover every season.' },
    ],
    relatedServices: [
      { slug: 'landscape', title: 'Landscape Design', description: 'Enhance your lawn with professional landscape design.', image: '/images/site/front-yard.jpg' },
      { slug: 'irrigation', title: 'Irrigation', description: 'Automated watering to keep your lawn green and healthy.', image: '/images/site/patio-garden.jpg' },
      { slug: 'snow-plowing', title: 'Snow Plowing', description: 'Year-round property care including winter snow removal.', image: '/images/site/hero.jpg' },
    ],
    homeImage: '/images/site/patio-garden.jpg',
    homeDescription: 'Mowing, fertilization, aeration, overseeding, and weed control to keep your lawn thick, green, and healthy all season long.',
  },
  {
    slug: 'outdoor-lighting',
    title: 'Outdoor Lighting',
    shortTitle: 'Lighting',
    metaTitle: 'Outdoor Lighting Design & Installation | Rochester Hills MI',
    metaDescription: 'Professional outdoor lighting in Oakland & Macomb Counties. Architectural, path, accent, and security lighting that extends outdoor living and adds curb appeal.',
    heroImage: '/images/site/lighting-fountain.jpg',
    heroHeading: 'Outdoor Lighting Design & Installation',
    heroSubtitle: 'Architectural, path, accent, and security lighting that extends your outdoor living hours and adds dramatic curb appeal.',
    introLabel: 'Illuminate Your Property',
    introHeading: 'See Your Landscape in a Whole New Light',
    introText: [
      "The right outdoor lighting transforms your property after dark — improving safety along pathways and driveways, creating warm ambiance on patios and decks, and showcasing the landscape features you've invested in. At Mike's Clean Cut Landscaping, we design and install custom lighting systems that make your home stand out in Oakland and Macomb Counties.",
      "We use energy-efficient LED fixtures, professional-grade wiring, and smart timer systems to deliver lighting that's beautiful, durable, and easy to maintain. Whether you want subtle pathway lights or a dramatic architectural lighting scheme, our team delivers results that exceed expectations.",
    ],
    introImage: '/images/site/hero-night.jpg',
    servicesSectionLabel: 'Lighting Services',
    servicesSectionHeading: 'Custom Lighting Solutions',
    servicesSectionSubtitle: 'From subtle accent lighting to dramatic architectural uplighting.',
    serviceCards: [
      { title: 'Architectural & Facade Lighting', description: 'Showcase your home\'s best features with strategically placed uplights, downlights, and wall washers.' },
      { title: 'Path & Walkway Lighting', description: 'Safe, welcoming illumination along driveways, walkways, and garden paths with low-profile LED path lights.' },
      { title: 'Landscape & Garden Lighting', description: 'Highlight specimen trees, garden beds, and water features with accent and spotlight fixtures.' },
      { title: 'Deck & Patio Lighting', description: 'Create inviting outdoor entertaining spaces with integrated deck lights, post caps, and string lighting.' },
      { title: 'Security Lighting', description: 'Motion-activated and dusk-to-dawn security lighting to protect your property and deter intrusion.' },
      { title: 'Holiday & Event Lighting', description: 'Seasonal installation and removal of professional holiday lighting for homes and businesses.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Expert Lighting Design & Installation',
    whyUsSubtitle: 'We design lighting that looks natural, performs reliably, and lasts.',
    whyUsItems: [
      { title: 'Custom Design', description: 'Every lighting plan is designed specifically for your property.' },
      { title: 'Premium LED Fixtures', description: 'Energy-efficient, long-lasting fixtures from top manufacturers.' },
      { title: 'Professional Installation', description: 'Hidden wiring, proper transformers, and clean installation.' },
      { title: 'Smart Controls', description: 'Timers, photocells, and smart home integration options.' },
    ],
    relatedServices: [
      { slug: 'hardscape', title: 'Hardscape Installation', description: 'Beautiful patios and walkways to illuminate.', image: '/images/site/paver-patio.jpg' },
      { slug: 'landscape', title: 'Landscape Design', description: 'Create the landscape that your lighting will showcase.', image: '/images/site/front-yard.jpg' },
      { slug: 'pool-spa', title: 'Pool & Spa', description: 'Add dramatic pool lighting for nighttime enjoyment.', image: '/images/site/pool-aerial.jpg' },
    ],
    homeImage: '/images/site/lighting-fountain.jpg',
    homeDescription: 'Architectural, path, accent, and security lighting that extends your outdoor living hours and adds dramatic curb appeal.',
  },
  {
    slug: 'pool-spa',
    title: 'Pool & Spa',
    shortTitle: 'Pool & Spa',
    metaTitle: 'Pool & Spa Installation | Rochester Hills MI',
    metaDescription: 'Complete pool and spa installations with surrounding hardscape, landscaping, and lighting for the ultimate backyard retreat in Oakland & Macomb Counties.',
    heroImage: '/images/site/pool-aerial.jpg',
    heroHeading: 'Pool & Spa Installation',
    heroSubtitle: 'Complete pool and spa installations with surrounding hardscape, landscaping, and lighting for the ultimate backyard retreat.',
    introLabel: 'Your Backyard Paradise',
    introHeading: 'Create Your Backyard Oasis',
    introText: [
      "At Mike's Clean Cut Landscaping, we specialize in custom pool design and installation for homeowners across Oakland and Macomb Counties. Whether you envision a sleek fiberglass pool for quick installation or a fully customized gunite pool with every luxury feature, our team brings your dream to life from concept to completion.",
      "Every project starts with a detailed consultation where we evaluate your property, discuss your vision, and design a pool or spa solution that fits your lifestyle and budget perfectly.",
    ],
    introImage: '/images/site/pool-closeup.jpg',
    servicesSectionLabel: 'Pool & Spa Services',
    servicesSectionHeading: 'Complete Pool Solutions',
    servicesSectionSubtitle: 'From design to splash, we handle every detail.',
    serviceCards: [
      { title: 'Fiberglass Pools', description: "Factory-built, one-piece shells that offer faster installation times and lower lifetime maintenance costs. Fiberglass pools are specifically designed to handle Michigan's freeze-thaw cycles, making them an excellent choice for our climate.", badge: 'Popular', includes: ['One-piece shell construction for durability', 'Faster installation timeline', 'Engineered for Michigan temperatures', 'Low maintenance smooth gel-coat finish', 'Wide variety of shapes and sizes'] },
      { title: 'Custom Gunite Pools', description: 'Gunite pools use sprayed concrete construction, giving you complete freedom in design. If you can dream it, we can build it. From freeform lagoons to geometric modern designs, gunite pools are the ultimate in customization.', badge: 'Premium', includes: ['Highly customizable shape and depth', 'Tanning shelves and sun ledges', 'Integrated custom spas', 'Built-in waterfalls and water features', 'Premium finishes and tile options'] },
      { title: 'Automation & Lighting', description: 'Automated pool controls, underwater LED lighting, and automatic pool cleaners to make pool ownership effortless.' },
      { title: 'Water Features', description: 'Vanishing and infinity edges, custom waterfalls, and integrated spas and hot tubs that add luxury and ambiance.' },
      { title: 'Outdoor Living', description: 'Custom pool decking, fire bowls and fire features, and outdoor kitchens to create the ultimate backyard entertainment area.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Your Complete Pool Partner',
    whyUsSubtitle: 'One team for pool, hardscape, landscape, and lighting.',
    whyUsItems: [
      { title: 'Full Integration', description: 'Pool, patio, landscaping, and lighting designed as one cohesive project.' },
      { title: 'Quality Construction', description: 'Engineered for Michigan climate with proper drainage and winterization.' },
      { title: 'Design Expertise', description: '3D renderings so you can visualize your backyard transformation.' },
      { title: 'Ongoing Support', description: 'Opening, closing, and maintenance guidance after installation.' },
    ],
    relatedServices: [
      { slug: 'hardscape', title: 'Hardscape Installation', description: 'Pool decks, patios, and outdoor kitchens.', image: '/images/site/pool-deck.jpg' },
      { slug: 'outdoor-lighting', title: 'Outdoor Lighting', description: 'Dramatic nighttime pool and landscape lighting.', image: '/images/site/lighting-fountain.jpg' },
      { slug: 'landscape', title: 'Landscape Design', description: 'Privacy plantings and garden design around your pool.', image: '/images/site/front-yard.jpg' },
    ],
    homeImage: '/images/site/pool-aerial.jpg',
    homeDescription: 'Complete pool and spa installations with surrounding hardscape, landscaping, and lighting for the ultimate backyard retreat.',
  },
  {
    slug: 'forestry',
    title: 'Forestry & Tree Service',
    shortTitle: 'Forestry',
    metaTitle: 'Forestry & Tree Service | Rochester Hills MI',
    metaDescription: 'Professional tree removal, trimming, stump grinding, and lot clearing in Oakland & Macomb Counties by experienced crews with professional-grade equipment.',
    heroImage: '/images/site/front-yard.jpg',
    heroHeading: 'Forestry & Tree Service',
    heroSubtitle: 'Tree removal, trimming, stump grinding, and lot clearing performed safely by experienced crews with professional-grade equipment.',
    introLabel: 'Professional Tree Care',
    introHeading: 'Professional Tree Care You Can Trust',
    introText: [
      "Healthy, well-maintained trees add tremendous value and beauty to your property. Mike's Clean Cut Landscaping provides comprehensive forestry services throughout Oakland and Macomb Counties, from careful pruning that promotes tree health to safe removal of hazardous trees.",
      "Our trained arborists use industry-best practices to protect your trees, your property, and your family. Whether you need seasonal maintenance or emergency tree work, we have the experience and equipment to get the job done right.",
    ],
    introImage: '/images/site/patio-garden.jpg',
    servicesSectionLabel: 'Tree Services',
    servicesSectionHeading: 'Complete Forestry Solutions',
    servicesSectionSubtitle: 'Expert tree care from routine pruning to safe removal.',
    serviceCards: [
      { title: 'Crown Cleaning', description: 'Pruning and removal of dead, diseased, and dying limbs from your tree canopy. Crown cleaning improves tree health, reduces the risk of falling branches, and enhances the overall appearance of your trees.' },
      { title: 'Crown Thinning', description: "Selective interior pruning that removes 10–15% of the canopy to increase air circulation and light penetration. Crown thinning reduces wind resistance and helps prevent storm damage while maintaining the tree's natural shape." },
      { title: 'Crown Elevation / Raising', description: 'Trimming lower limbs to provide clearance for structures, walkways, driveways, and sight lines. Crown raising opens up your landscape and improves accessibility beneath your trees.' },
      { title: 'Crown Reduction', description: "Careful thinning of the top of the canopy to reduce overall tree height and spread without harmful topping. Crown reduction preserves the tree's health and structural integrity while managing size." },
      { title: 'Shaping', description: 'Expert hand-shear pruning for shrubs, bushes, and ornamental trees. Shaping maintains a clean, manicured appearance and encourages dense, healthy growth throughout the season.' },
      { title: 'Tree Removal', description: 'Professional removal of dead, diseased, or hazardous trees using safe, controlled techniques. Our crews are trained and equipped to handle removals of any size, including trees near structures and power lines.' },
    ],
    maintenanceLabel: 'Stump Grinding',
    maintenanceHeading: 'Complete Stump Removal',
    maintenanceSubtitle: 'Reclaim your yard space after tree removal with professional stump grinding.',
    maintenanceCards: [
      { title: 'Professional Stump Grinding', description: 'After a tree is removed, the remaining stump can be an eyesore and a tripping hazard. Our professional stump grinding service reduces stumps below grade, allowing you to reclaim your yard space for new plantings, lawn, or hardscape.', includes: ['Grinding to below-grade level', 'Chip and debris cleanup included', 'Area prepared for new sod, seed, or landscape use', 'Available for single stumps or multi-stump projects'] },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Tree Service You Can Trust',
    whyUsSubtitle: 'Safety, expertise, and clean results — every time.',
    whyUsItems: [
      { title: 'Trained Crews', description: 'Our arborists follow ISA best practices for every pruning and removal job.' },
      { title: 'Safety First', description: 'Fully insured with rigorous safety protocols for every tree service project.' },
      { title: 'Complete Cleanup', description: 'We leave your property cleaner than we found it, every single time.' },
      { title: 'Free Estimates', description: 'On-site evaluations and transparent pricing with no hidden fees.' },
    ],
    relatedServices: [
      { slug: 'landscape', title: 'Landscape Design', description: 'Replant and redesign after tree removal.', image: '/images/site/front-yard.jpg' },
      { slug: 'turf', title: 'Turf Management', description: 'Restore lawn areas after tree work.', image: '/images/site/patio-garden.jpg' },
      { slug: 'hardscape', title: 'Hardscape Installation', description: 'Open up space for new patios and features.', image: '/images/site/paver-patio.jpg' },
    ],
    homeImage: '/images/site/patio-garden.jpg',
    homeDescription: 'Tree removal, trimming, stump grinding, and lot clearing performed safely by experienced crews with professional-grade equipment.',
  },
  {
    slug: 'irrigation',
    title: 'Irrigation Systems',
    shortTitle: 'Irrigation',
    metaTitle: 'Irrigation System Installation & Repair | Rochester Hills MI',
    metaDescription: 'Professional irrigation system design, installation, and maintenance in Oakland & Macomb Counties. Smart sprinkler systems, drip irrigation, and seasonal service.',
    heroImage: '/images/site/patio-garden.jpg',
    heroHeading: 'Irrigation System Design & Installation',
    heroSubtitle: 'Efficient watering solutions that keep your landscape healthy while conserving water and saving you time.',
    introLabel: 'Smart Watering Solutions',
    introHeading: 'Keep Your Landscape Thriving',
    introText: [
      "A properly designed irrigation system delivers the right amount of water to every zone of your landscape — automatically. No more dragging hoses or worrying about dry spots.",
      "We design, install, and maintain irrigation systems that are efficient, reliable, and tailored to your property's specific needs.",
    ],
    introImage: '/images/site/front-yard.jpg',
    servicesSectionLabel: 'Irrigation Services',
    servicesSectionHeading: 'Complete Irrigation Solutions',
    servicesSectionSubtitle: 'From design to seasonal maintenance.',
    serviceCards: [
      { title: 'New System Design & Installation', description: 'Custom-designed irrigation systems with proper zone coverage, efficient heads, and smart controllers.' },
      { title: 'System Repair & Upgrades', description: 'Fast diagnosis and repair of leaks, broken heads, valve issues, and controller problems.' },
      { title: 'Smart Controller Installation', description: 'WiFi-enabled controllers that adjust watering based on weather, soil moisture, and seasonal changes.' },
      { title: 'Drip Irrigation', description: 'Efficient drip systems for garden beds, planters, and foundation plantings that deliver water directly to roots.' },
      { title: 'Spring Activation', description: 'Professional system startup including inspection, programming, and head adjustment.' },
      { title: 'Winterization', description: 'Complete blowout and winterization to protect your system from freeze damage.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Irrigation Done Right',
    whyUsSubtitle: 'Efficient design, quality installation, reliable service.',
    whyUsItems: [
      { title: 'Custom Design', description: 'Every system is designed for your specific property and plant needs.' },
      { title: 'Water Efficiency', description: 'Smart scheduling and proper coverage to minimize waste.' },
      { title: 'Quality Components', description: 'Commercial-grade heads, valves, and controllers for reliability.' },
      { title: 'Seasonal Service', description: 'Spring activation and fall winterization to protect your investment.' },
    ],
    relatedServices: [
      { slug: 'turf', title: 'Turf Management', description: 'Complete lawn care to complement your irrigation.', image: '/images/site/patio-garden.jpg' },
      { slug: 'landscape', title: 'Landscape Design', description: 'Plant the landscape that your irrigation system will feed.', image: '/images/site/front-yard.jpg' },
      { slug: 'outdoor-lighting', title: 'Outdoor Lighting', description: 'Add lighting alongside your irrigation for a complete system.', image: '/images/site/lighting-fountain.jpg' },
    ],
    homeImage: '/images/site/patio-garden.jpg',
    homeDescription: 'Efficient watering solutions that keep your landscape healthy while conserving water and saving you time.',
  },
  {
    slug: 'snow-plowing',
    title: 'Snow Plowing & Ice Management',
    shortTitle: 'Snow Plowing',
    metaTitle: 'Snow Plowing & Ice Management | Rochester Hills MI',
    metaDescription: 'Reliable snow plowing and ice management for Oakland & Macomb Counties. Residential and commercial snow removal, salting, and sidewalk clearing.',
    heroImage: '/images/site/hero.jpg',
    heroHeading: 'Snow Plowing & Ice Management',
    heroSubtitle: 'Reliable winter services to keep your property safe and accessible throughout Michigan winters.',
    introLabel: 'Winter Property Care',
    introHeading: 'Michigan Winters Handled',
    introText: [
      "Michigan winters are serious — and so are we about keeping your property safe and accessible. Our snow plowing and ice management services ensure your driveways, walkways, and parking areas are clear when you need them.",
      "We offer reliable, prompt service with modern equipment and a commitment to keeping your property safe all winter long.",
    ],
    introImage: '/images/site/hero.jpg',
    servicesSectionLabel: 'Winter Services',
    servicesSectionHeading: 'Complete Snow & Ice Solutions',
    servicesSectionSubtitle: 'From the first snowfall to the last, we have you covered.',
    serviceCards: [
      { title: 'Residential Snow Plowing', description: 'Prompt driveway and apron plowing after every snowfall. Per-push and seasonal contract options available.' },
      { title: 'Commercial Snow Removal', description: 'Parking lot plowing, snow stacking, and hauling for businesses, HOAs, and commercial properties.' },
      { title: 'Sidewalk & Walkway Clearing', description: 'Manual and mechanical clearing of walkways, steps, and entryways for safe pedestrian access.' },
      { title: 'Salt & Ice Management', description: 'Rock salt, treated salt, and ice melt application for driveways, walkways, and parking lots.' },
      { title: 'Seasonal Contracts', description: 'Lock in your winter service with a seasonal contract for priority response and consistent pricing.' },
      { title: 'Emergency Response', description: 'Available for heavy snowfall events and ice storms when you need us most.' },
    ],
    whyUsLabel: "Why Mike's Clean Cut",
    whyUsHeading: 'Winter Service You Can Rely On',
    whyUsSubtitle: 'On time, every time — even at 4 AM.',
    whyUsItems: [
      { title: 'Prompt Response', description: 'Our crews are ready to go the moment snow starts falling.' },
      { title: 'Modern Equipment', description: 'Well-maintained plows, salt spreaders, and removal equipment.' },
      { title: 'Reliable Service', description: 'Consistent, dependable service throughout the entire winter season.' },
      { title: 'Year-Round Partner', description: 'Many clients trust us for both summer landscaping and winter snow removal.' },
    ],
    relatedServices: [
      { slug: 'turf', title: 'Turf Management', description: 'Spring lawn recovery after winter.', image: '/images/site/patio-garden.jpg' },
      { slug: 'hardscape', title: 'Hardscape Installation', description: 'Repair or upgrade surfaces after winter wear.', image: '/images/site/paver-patio.jpg' },
      { slug: 'landscape', title: 'Landscape Design', description: 'Spring planting and landscape refreshes.', image: '/images/site/front-yard.jpg' },
    ],
    homeImage: '/images/site/hero.jpg',
    homeDescription: 'Reliable winter services to keep your property safe and accessible throughout Michigan winters.',
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return servicesData.find(s => s.slug === slug);
}
