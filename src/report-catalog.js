export const SITE = {
  origin: "https://sherlockreports.com",
  supportEmail: "hello@sherlockreports.com",
  supportFrom: "Sherlock Research <hello@sherlockreports.com>",
  quarter: "Q2",
  year: 2026,
  samplePdf: "/assets/sample-landscaping-report.pdf",
  turnstileSiteKey: "0x4AAAAAADhCnAEBfXHA5xvV",
  launchCohortSize: 50,
  catalogTarget: 100
};

export const PLANS = {
  single: {
    name: "Standard Report",
    price: "$497",
    unit: "",
    cadence: "one-time",
    checkoutUrl: "",
    paymentProvider: "payhip",
    description: "Full national industry report, recommendations, and email confirmation."
  },
  quarterly: {
    name: "Quarterly + Coaching",
    price: "$2,000",
    unit: "/yr",
    cadence: "annual",
    checkoutUrl: "",
    paymentProvider: "payhip",
    description: "Four quarterly updates plus four one-on-one coaching calls."
  },
  all: {
    name: "All-Access Pass",
    price: "$2,997",
    unit: "",
    cadence: "one-time",
    checkoutUrl: "",
    paymentProvider: "payhip",
    description: "Every Sherlock industry report, current and future releases."
  }
};

const focus = {
  landscaping: "demand, pricing, crew productivity, route density, service mix, and local competition",
  roofing: "storm demand, retail replacement, insurance mix, lead sources, labor safety, and margin pressure",
  dental: "patient acquisition, cosmetic demand, payer mix, staffing, capacity, and service-line economics",
  dermatology: "patient access, cosmetic dermatology, payer mix, procedure demand, provider capacity, and competitive positioning",
  hvac: "seasonality, service agreements, replacement demand, financing, technician capacity, and local competition",
  "pest-control": "recurring revenue, termite and mosquito demand, churn, route density, training, and account profitability",
  plumbing: "emergency demand, water heaters, drain services, technician skill gaps, urgency pricing, and repeat/referral mix",
  electrical: "panel upgrades, EV chargers, generators, licensing capacity, quote conversion, and project profitability",
  "med-spa": "injectables, memberships, laser services, provider trust, certification, and treatment-line margin",
  "auto-repair": "diagnostics, maintenance demand, repeat customers, technician skill mix, service bays, and pricing power"
};

const serviceLabels = {
  landscaping: "landscaping and lawn care services",
  roofing: "roof repair and replacement services",
  dental: "dental care services",
  dermatology: "dermatology and skin care services",
  hvac: "heating, cooling, and indoor air services",
  "pest-control": "pest control and prevention services",
  plumbing: "plumbing repair and installation services",
  electrical: "residential and commercial electrical services",
  "med-spa": "aesthetic and wellness treatments",
  "auto-repair": "auto repair and maintenance services"
};

const tally = {
  landscaping: "lbv8qW",
  roofing: "RGkqdJ",
  dental: "Gx5OKo",
  dermatology: "ODkxl8",
  hvac: "VLDWjv",
  "pest-control": "PdkZDb",
  plumbing: "EkMo5N",
  electrical: "rjv8Bv",
  "med-spa": "44zlBO",
  "auto-repair": "jav8bE",
  "garage-door": "WO1a8J",
  "pool-service": "aQvp29",
  "lawn-care": "68M6Ze",
  "tree-care": "7RM7NL",
  "home-cleaning": "b5v1We",
  "carpet-cleaning": "A7yMBB",
  restoration: "Bz0Jx7",
  painting: "kdv8N6",
  flooring: "vGK8PA",
  "windows-and-doors": "KYkrVM",
  "kitchen-and-bath-remodeling": "LZk4PG",
  "general-contracting": "pbvYDV",
  "solar-installation": "1A6Q9M",
  "security-systems": "MeMjEY",
  moving: "J9MEOJ",
  "self-storage": "gDv89N",
  "junk-removal": "yPz8J0",
  "car-wash-and-detailing": "Xxz64O",
  towing: "81MbZA",
  veterinary: "0QaqeZ",
  "physical-therapy": "zxL871",
  chiropractic: "5BMaZM",
  "senior-home-care": "dWvJ9z",
  childcare: "Y5k74q",
  "fitness-gyms": "D4MR7b",
  restaurants: "lbv865",
  "coffee-shops": "RGkqDl",
  breweries: "obv821",
  hotels: "Gx5ORj",
  "event-venues": "ODkx7K",
  "property-management": "VLDWza",
  "real-estate-brokerages": "PdkZzQ",
  "mortgage-brokers": "EkMoxo",
  "insurance-agencies": "rjv8oM",
  "accounting-and-tax": "44zlKb",
  "legal-services": "jav8lR",
  "it-managed-services": "2E79Kp",
  "digital-marketing-agencies": "xXv8JG",
  "staffing-agencies": "RGkqDp",
  "private-schools-and-tutoring": "obv82X"
};

const launchIndustries = [
  ["Landscaping", "landscaping", "home-services", "available"],
  ["Roofing", "roofing", "home-services", "available"],
  ["Dental", "dental", "healthcare", "presell"],
  ["Dermatology", "dermatology", "healthcare", "presell"],
  ["HVAC", "hvac", "home-services", "available"],
  ["Pest Control", "pest-control", "home-services", "available"],
  ["Plumbing", "plumbing", "home-services", "presell"],
  ["Electrical", "electrical", "home-services", "presell"],
  ["Med Spa", "med-spa", "healthcare", "presell"],
  ["Auto Repair", "auto-repair", "automotive", "presell"],
  ["Garage Door", "garage-door", "home-services", "available"],
  ["Pool Service", "pool-service", "home-services", "available"],
  ["Lawn Care", "lawn-care", "home-services", "available"],
  ["Tree Care", "tree-care", "home-services", "available"],
  ["Home Cleaning", "home-cleaning", "home-services", "available"],
  ["Carpet Cleaning", "carpet-cleaning", "home-services", "available"],
  ["Restoration", "restoration", "home-services", "available"],
  ["Painting", "painting", "home-services", "available"],
  ["Flooring", "flooring", "home-services", "available"],
  ["Windows and Doors", "windows-and-doors", "home-services", "available"],
  ["Kitchen and Bath Remodeling", "kitchen-and-bath-remodeling", "home-services", "available"],
  ["General Contracting", "general-contracting", "home-services", "available"],
  ["Solar Installation", "solar-installation", "home-services", "available"],
  ["Security Systems", "security-systems", "home-services", "available"],
  ["Moving", "moving", "home-services", "available"],
  ["Self Storage", "self-storage", "local-services", "available"],
  ["Junk Removal", "junk-removal", "home-services", "available"],
  ["Car Wash and Detailing", "car-wash-and-detailing", "automotive", "available"],
  ["Towing", "towing", "automotive", "available"],
  ["Veterinary", "veterinary", "healthcare", "available"],
  ["Physical Therapy", "physical-therapy", "healthcare", "available"],
  ["Chiropractic", "chiropractic", "healthcare", "available"],
  ["Senior Home Care", "senior-home-care", "healthcare", "available"],
  ["Childcare", "childcare", "education", "available"],
  ["Fitness Gyms", "fitness-gyms", "local-services", "available"],
  ["Restaurants", "restaurants", "hospitality", "available"],
  ["Coffee Shops", "coffee-shops", "hospitality", "available"],
  ["Breweries", "breweries", "hospitality", "available"],
  ["Hotels", "hotels", "hospitality", "available"],
  ["Event Venues", "event-venues", "hospitality", "available"],
  ["Property Management", "property-management", "real-estate-finance", "available"],
  ["Real Estate Brokerages", "real-estate-brokerages", "real-estate-finance", "available"],
  ["Mortgage Brokers", "mortgage-brokers", "real-estate-finance", "available"],
  ["Insurance Agencies", "insurance-agencies", "professional-services", "available"],
  ["Accounting and Tax", "accounting-and-tax", "professional-services", "available"],
  ["Legal Services", "legal-services", "professional-services", "available"],
  ["IT Managed Services", "it-managed-services", "professional-services", "available"],
  ["Digital Marketing Agencies", "digital-marketing-agencies", "professional-services", "available"],
  ["Staffing Agencies", "staffing-agencies", "professional-services", "available"],
  ["Private Schools and Tutoring", "private-schools-and-tutoring", "education", "available"]
];

const pipelineIndustries = [
  ["Appliance Repair", "appliance-repair", "home-services", "planned"],
  ["Home Inspection", "home-inspection", "real-estate-finance", "planned"],
  ["Fencing", "fencing", "home-services", "planned"],
  ["Deck and Patio", "deck-and-patio", "home-services", "planned"],
  ["Concrete", "concrete", "home-services", "planned"],
  ["Masonry", "masonry", "home-services", "planned"],
  ["Gutter Services", "gutter-services", "home-services", "planned"],
  ["Pressure Washing", "pressure-washing", "home-services", "planned"],
  ["Septic Services", "septic-services", "home-services", "planned"],
  ["Locksmiths", "locksmiths", "local-services", "planned"],
  ["Fire Protection", "fire-protection", "home-services", "planned"],
  ["Window Cleaning", "window-cleaning", "home-services", "planned"],
  ["Handyman Services", "handyman-services", "home-services", "planned"],
  ["Wildlife Removal", "wildlife-removal", "home-services", "planned"],
  ["Irrigation", "irrigation", "home-services", "planned"],
  ["Pool Construction", "pool-construction", "home-services", "planned"],
  ["Duct Cleaning", "duct-cleaning", "home-services", "planned"],
  ["Chimney Services", "chimney-services", "home-services", "planned"],
  ["Optometry", "optometry", "healthcare", "planned"],
  ["Urgent Care", "urgent-care", "healthcare", "planned"],
  ["Mental Health Clinics", "mental-health-clinics", "healthcare", "planned"],
  ["Orthodontics", "orthodontics", "healthcare", "planned"],
  ["Emergency Veterinary", "emergency-veterinary", "healthcare", "planned"],
  ["Home Health Medical", "home-health-medical", "healthcare", "planned"],
  ["Nutrition Clinics", "nutrition-clinics", "healthcare", "planned"],
  ["Bookkeeping", "bookkeeping", "professional-services", "planned"],
  ["Payroll Services", "payroll-services", "professional-services", "planned"],
  ["HR Consulting", "hr-consulting", "professional-services", "planned"],
  ["Business Coaching", "business-coaching", "professional-services", "planned"],
  ["Architecture Firms", "architecture-firms", "professional-services", "planned"],
  ["Engineering Firms", "engineering-firms", "professional-services", "planned"],
  ["Bakeries", "bakeries", "hospitality", "planned"],
  ["Food Trucks", "food-trucks", "hospitality", "planned"],
  ["Catering", "catering", "hospitality", "planned"],
  ["Salons", "salons", "local-services", "planned"],
  ["Barber Shops", "barber-shops", "local-services", "planned"],
  ["Nail Salons", "nail-salons", "local-services", "planned"],
  ["Tattoo Studios", "tattoo-studios", "local-services", "planned"],
  ["Pet Grooming", "pet-grooming", "local-services", "planned"],
  ["Pet Boarding", "pet-boarding", "local-services", "planned"],
  ["Martial Arts Studios", "martial-arts-studios", "local-services", "planned"],
  ["Yoga Studios", "yoga-studios", "local-services", "planned"],
  ["Dance Studios", "dance-studios", "local-services", "planned"],
  ["Title Companies", "title-companies", "real-estate-finance", "planned"],
  ["Appraisal Firms", "appraisal-firms", "real-estate-finance", "planned"],
  ["Music Schools", "music-schools", "education", "planned"],
  ["Test Prep", "test-prep", "education", "planned"],
  ["Driving Schools", "driving-schools", "education", "planned"],
  ["Tire Shops", "tire-shops", "automotive", "planned"],
  ["Auto Body Repair", "auto-body-repair", "automotive", "planned"]
];

// Per-report checkout links (Payhip product per report). Empty -> CTA routes to contact.
const payhipLinks = {
  landscaping: "https://payhip.com/b/b6AXM",
  roofing: "https://payhip.com/b/KHINR",
  dental: "https://payhip.com/b/ag3Or",
  dermatology: "https://payhip.com/b/HzqAx",
  hvac: "https://payhip.com/b/iL1d4",
  "pest-control": "https://payhip.com/b/mrXjz",
  plumbing: "https://payhip.com/b/ln1cC",
  electrical: "https://payhip.com/b/MI7bB",
  "med-spa": "https://payhip.com/b/h4QEO",
  "auto-repair": "https://payhip.com/b/MFpBc",
  "garage-door": "https://payhip.com/b/4Jm8I",
  "pool-service": "https://payhip.com/b/FoOQl",
  "lawn-care": "https://payhip.com/b/eTHL3",
  "tree-care": "https://payhip.com/b/nL1RC",
  "home-cleaning": "https://payhip.com/b/2QdjP",
  "carpet-cleaning": "https://payhip.com/b/dPSG0",
  restoration: "https://payhip.com/b/f7H6i",
  painting: "https://payhip.com/b/O2rD7",
  flooring: "https://payhip.com/b/GVK8Y",
  "windows-and-doors": "https://payhip.com/b/dvAbt",
  "kitchen-and-bath-remodeling": "https://payhip.com/b/DNjb7",
  "general-contracting": "https://payhip.com/b/mMC5h",
  "solar-installation": "https://payhip.com/b/COc9r",
  "security-systems": "https://payhip.com/b/Z7r54",
  moving: "https://payhip.com/b/V9Xyb",
  "self-storage": "https://payhip.com/b/IcU0H",
  "junk-removal": "https://payhip.com/b/Q2r9f",
  "car-wash-and-detailing": "https://payhip.com/b/d3nLh",
  towing: "https://payhip.com/b/KPdLN",
  veterinary: "https://payhip.com/b/Uh4Gs",
  "physical-therapy": "https://payhip.com/b/5LiQg",
  chiropractic: "https://payhip.com/b/tYjHG",
  "senior-home-care": "https://payhip.com/b/VNPjx",
  childcare: "https://payhip.com/b/brpy1",
  "fitness-gyms": "https://payhip.com/b/YTosz",
  restaurants: "https://payhip.com/b/Ca01I",
  "coffee-shops": "https://payhip.com/b/3DC6Z",
  breweries: "https://payhip.com/b/OzGVQ",
  hotels: "https://payhip.com/b/esnhF",
  "event-venues": "https://payhip.com/b/UWoi8",
  "property-management": "https://payhip.com/b/8GT2k",
  "real-estate-brokerages": "https://payhip.com/b/bBPSh",
  "mortgage-brokers": "https://payhip.com/b/lzAbO",
  "insurance-agencies": "https://payhip.com/b/kgm1O",
  "accounting-and-tax": "https://payhip.com/b/QcdJY",
  "legal-services": "https://payhip.com/b/oLr4Y",
  "it-managed-services": "https://payhip.com/b/BY6tl",
  "digital-marketing-agencies": "https://payhip.com/b/ZgVKf",
  "staffing-agencies": "https://payhip.com/b/iK7r0",
  "private-schools-and-tutoring": "https://payhip.com/b/3qUbN"
};

export const INDUSTRIES = [...launchIndustries, ...pipelineIndustries].map(([name, slug, category, status], index) => {
  const tallyId = tally[slug] || "";
  const checkoutUrl = payhipLinks[slug] || "";
  const stage = index < SITE.launchCohortSize ? "launch" : "pipeline";
  const payhipProductKey = checkoutUrl.match(/payhip\.com\/b\/([A-Za-z0-9]+)/)?.[1] || "";
  return ({
  id: index + 1,
  name,
  slug,
  category,
  stage,
  status,
  page: `${slug}-report.html`,
  reportPath: `/${slug}-report`,
  title: `${name} Industry Report`,
  edition: `${SITE.year} ${SITE.quarter}`,
  serviceLabel: serviceLabels[slug] || `${name.toLowerCase()} services`,
  focus: focus[slug] || "demand, pricing, local competition, hiring pressure, customer switching, channel mix, and operator economics",
  tallyId,
  tallyUrl: tallyId ? `https://tally.so/r/${tallyId}` : "",
  tallyEditUrl: tallyId ? `https://tally.so/forms/${tallyId}/edit` : "",
  sampleAsset: SITE.samplePdf,
  fullReportAsset: "",
  checkoutUrl,
  paymentProvider: checkoutUrl ? "payhip" : "",
  payhipProductKey,
  payhipProductId: "",
  readiness: {
    samplePdf: "ready",
    fullPdf: checkoutUrl ? "payhip-file" : "missing",
    checkout: status === "waitlist" || status === "planned" ? status : (checkoutUrl ? "payhip-live" : "payhip-needed"),
    emailDelivery: "cloudflare-email",
    audit: stage === "launch" ? "template-passed" : "pipeline-planned"
  },
  email: {
    purchaseEvent: `sherlock.report.purchase.${slug}`,
    waitlistEvent: `sherlock.report.waitlist.${slug}`,
    tags: [`industry:${slug}`, `category:${category}`]
  },
  seo: {
    title: `${name} Industry Report ${SITE.year} — Sherlock Research`,
    description: `${name} market research for ${SITE.year}: market size, demand drivers, local competition, pricing benchmarks, and clear recommendations for operators and investors.`
  }
  });
});

export const STATUS = {
  available: {
    label: "Available now",
    libraryLabel: "Active",
    cta: "Get the report",
    checkoutCta: "Get the report",
    schemaAvailability: "https://schema.org/InStock",
    buyerNote: "Payhip delivers the report file after checkout. Keep the receipt email for your download link and contact Sherlock if you need help."
  },
  presell: {
    label: "Presell",
    libraryLabel: "Presell",
    cta: "Reserve the report",
    checkoutCta: "Reserve the report",
    schemaAvailability: "https://schema.org/PreOrder",
    buyerNote: "Reserve now through Payhip. Your receipt confirms the order, and the report page explains the expected release status."
  },
  waitlist: {
    label: "Waitlist",
    libraryLabel: "Waitlist",
    cta: "Join the waitlist",
    checkoutCta: "Join the waitlist",
    schemaAvailability: "https://schema.org/PreOrder",
    buyerNote: "Join the waitlist to help prioritize this report and get the launch notice."
  },
  planned: {
    label: "Planned",
    libraryLabel: "Planned",
    cta: "Request priority",
    checkoutCta: "Request priority",
    schemaAvailability: "https://schema.org/PreOrder",
    buyerNote: "This report is in the research pipeline. Request priority to help move it up the release calendar."
  }
};

export function industryBySlug(slug) {
  return INDUSTRIES.find((industry) => industry.slug === slug);
}

export function catalogReports() {
  return Object.fromEntries(INDUSTRIES.map((industry) => [
    industry.slug,
    {
      name: industry.name,
      status: industry.status,
      category: industry.category,
      page: industry.page,
      samplePage: "sample.html",
      tallyUrl: industry.tallyUrl,
      sampleAsset: industry.sampleAsset,
      payment: {
        provider: industry.paymentProvider,
        checkoutUrl: industry.checkoutUrl,
        payhipProductKey: industry.payhipProductKey,
        payhipProductId: industry.payhipProductId
      },
      products: [
        {
          key: `${industry.slug}-${SITE.year}-${SITE.quarter.toLowerCase()}-full-national`,
          plan: "single",
          industry: industry.name,
          quarter: SITE.quarter,
          year: SITE.year,
          access: "full",
          cityInclusion: "national",
          title: `${industry.name} Industry Report, ${SITE.quarter} ${SITE.year}, Full National PDF`,
          checkoutUrl: industry.checkoutUrl,
          paymentProvider: industry.paymentProvider,
          payhipProductKey: industry.payhipProductKey,
          payhipProductId: industry.payhipProductId
        },
        {
          key: `${industry.slug}-${SITE.year}-${SITE.quarter.toLowerCase()}-full-quarterly`,
          plan: "quarterly",
          industry: industry.name,
          quarter: SITE.quarter,
          year: SITE.year,
          access: "full",
          cityInclusion: "national",
          title: `${industry.name} Quarterly Intelligence, ${SITE.quarter} ${SITE.year}`,
          checkoutUrl: ""
        }
      ],
      checkout: {
        single: industry.checkoutUrl,
        quarterly: ""
      }
    }
  ]));
}
