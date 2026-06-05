export const SITE = {
  origin: "https://sherlockreports.com",
  supportEmail: "hello@sherlockreports.com",
  supportFrom: "Sherlock Research <hello@sherlockreports.com>",
  quarter: "Q2",
  year: 2026,
  samplePdf: "/assets/sample-landscaping-report.pdf"
};

export const PLANS = {
  single: {
    name: "Standard Report",
    price: "$497",
    unit: "",
    cadence: "one-time",
    checkoutUrl: "",
    description: "Full national industry report, recommendations, and email confirmation."
  },
  quarterly: {
    name: "Quarterly + Coaching",
    price: "$2,000",
    unit: "/yr",
    cadence: "annual",
    checkoutUrl: "",
    description: "Four quarterly updates plus four one-on-one coaching calls."
  },
  all: {
    name: "All-Access Pass",
    price: "$2,997",
    unit: "",
    cadence: "one-time",
    checkoutUrl: "",
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

const industries = [
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
  ["Garage Door", "garage-door", "home-services", "waitlist"],
  ["Pool Service", "pool-service", "home-services", "waitlist"],
  ["Lawn Care", "lawn-care", "home-services", "waitlist"],
  ["Tree Care", "tree-care", "home-services", "waitlist"],
  ["Home Cleaning", "home-cleaning", "home-services", "waitlist"],
  ["Carpet Cleaning", "carpet-cleaning", "home-services", "waitlist"],
  ["Restoration", "restoration", "home-services", "waitlist"],
  ["Painting", "painting", "home-services", "waitlist"],
  ["Flooring", "flooring", "home-services", "waitlist"],
  ["Windows and Doors", "windows-and-doors", "home-services", "waitlist"],
  ["Kitchen and Bath Remodeling", "kitchen-and-bath-remodeling", "home-services", "waitlist"],
  ["General Contracting", "general-contracting", "home-services", "waitlist"],
  ["Solar Installation", "solar-installation", "home-services", "waitlist"],
  ["Security Systems", "security-systems", "home-services", "waitlist"],
  ["Moving", "moving", "home-services", "waitlist"],
  ["Self Storage", "self-storage", "local-services", "waitlist"],
  ["Junk Removal", "junk-removal", "home-services", "waitlist"],
  ["Car Wash and Detailing", "car-wash-and-detailing", "automotive", "waitlist"],
  ["Towing", "towing", "automotive", "waitlist"],
  ["Veterinary", "veterinary", "healthcare", "waitlist"],
  ["Physical Therapy", "physical-therapy", "healthcare", "waitlist"],
  ["Chiropractic", "chiropractic", "healthcare", "waitlist"],
  ["Senior Home Care", "senior-home-care", "healthcare", "waitlist"],
  ["Childcare", "childcare", "education", "waitlist"],
  ["Fitness Gyms", "fitness-gyms", "local-services", "waitlist"],
  ["Restaurants", "restaurants", "hospitality", "waitlist"],
  ["Coffee Shops", "coffee-shops", "hospitality", "waitlist"],
  ["Breweries", "breweries", "hospitality", "waitlist"],
  ["Hotels", "hotels", "hospitality", "waitlist"],
  ["Event Venues", "event-venues", "hospitality", "waitlist"],
  ["Property Management", "property-management", "real-estate-finance", "waitlist"],
  ["Real Estate Brokerages", "real-estate-brokerages", "real-estate-finance", "waitlist"],
  ["Mortgage Brokers", "mortgage-brokers", "real-estate-finance", "waitlist"],
  ["Insurance Agencies", "insurance-agencies", "professional-services", "waitlist"],
  ["Accounting and Tax", "accounting-and-tax", "professional-services", "waitlist"],
  ["Legal Services", "legal-services", "professional-services", "waitlist"],
  ["IT Managed Services", "it-managed-services", "professional-services", "waitlist"],
  ["Digital Marketing Agencies", "digital-marketing-agencies", "professional-services", "waitlist"],
  ["Staffing Agencies", "staffing-agencies", "professional-services", "waitlist"],
  ["Private Schools and Tutoring", "private-schools-and-tutoring", "education", "waitlist"]
];

// Per-report checkout links (Payhip product per report). Empty -> CTA routes to contact.
const paymentLinks = {
  landscaping: "https://payhip.com/b/zPJah"
};

export const INDUSTRIES = industries.map(([name, slug, category, status], index) => ({
  id: index + 1,
  name,
  slug,
  category,
  status,
  page: `${slug}-report.html`,
  reportPath: `/${slug}-report`,
  title: `${name} Industry Report`,
  edition: `${SITE.year} ${SITE.quarter}`,
  serviceLabel: serviceLabels[slug] || `${name.toLowerCase()} services`,
  focus: focus[slug] || "demand, pricing, local competition, hiring pressure, customer switching, channel mix, and operator economics",
  tallyId: tally[slug],
  tallyUrl: `https://tally.so/r/${tally[slug]}`,
  tallyEditUrl: `https://tally.so/forms/${tally[slug]}/edit`,
  sampleAsset: SITE.samplePdf,
  fullReportAsset: "",
  stripePaymentLink: paymentLinks[slug] || "",
  stripeProductId: "",
  stripePriceId: "",
  readiness: {
    samplePdf: "ready",
    fullPdf: "missing",
    checkout: status === "waitlist" ? "waitlist" : "dynamic",
    emailDelivery: "cloudflare-email",
    audit: "template-passed"
  },
  email: {
    purchaseEvent: `sherlock.report.purchase.${slug}`,
    waitlistEvent: `sherlock.report.waitlist.${slug}`,
    tags: [`industry:${slug}`, `category:${category}`]
  },
  seo: {
    title: `${name} Industry Report - Sherlock Research`,
    description: `Sherlock Research ${name} industry intelligence: market context, local demand signals, operator interviews, pricing pressure, and recommendations for ${name.toLowerCase()} operators, investors, and agencies.`
  }
}));

export const STATUS = {
  available: {
    label: "Available now",
    libraryLabel: "Active",
    cta: "Get the report",
    checkoutCta: "Get the report",
    schemaAvailability: "https://schema.org/InStock",
    buyerNote: "You'll get an email confirmation right after checkout. If the full report is still being finalized, we'll tell you exactly when to expect it."
  },
  presell: {
    label: "Presell",
    libraryLabel: "Presell",
    cta: "Reserve the report",
    checkoutCta: "Reserve the report",
    schemaAvailability: "https://schema.org/PreOrder",
    buyerNote: "Reserve now and you'll get an email confirmation today, plus your full report the moment it's published."
  },
  waitlist: {
    label: "Waitlist",
    libraryLabel: "Waitlist",
    cta: "Join the waitlist",
    checkoutCta: "Join the waitlist",
    schemaAvailability: "https://schema.org/PreOrder",
    buyerNote: "Join the waitlist to help prioritize this report and get the launch notice."
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
      fullReportAsset: industry.fullReportAsset,
      readiness: industry.readiness,
      email: industry.email,
      stripe: {
        paymentLink: industry.stripePaymentLink,
        productId: industry.stripeProductId,
        priceId: industry.stripePriceId
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
          checkoutUrl: industry.stripePaymentLink,
          stripeProductId: industry.stripeProductId,
          stripePriceId: industry.stripePriceId
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
        single: industry.stripePaymentLink,
        quarterly: ""
      }
    }
  ]));
}
