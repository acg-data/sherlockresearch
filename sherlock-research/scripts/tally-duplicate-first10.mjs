#!/usr/bin/env node

const MASTER_FORM_ID = process.env.TALLY_MASTER_FORM_ID || "ODoVpA";
const API_BASE = "https://api.tally.so";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const existingFormIds = {
  landscaping: "lbv8qW",
  roofing: "RGkqdJ",
  dental: "Gx5OKo",
  dermatology: "ODkxl8",
  hvac: "VLDWjv",
  "pest-control": "PdkZDb",
  plumbing: "EkMo5N",
  electrical: "rjv8Bv",
  "med-spa": "44zlBO",
  "auto-repair": "jav8bE"
};

const industries = [
  {
    slug: "landscaping",
    industry: "Landscaping",
    audience: "landscaping company",
    industryService: "landscaping or lawn care services",
    services: ["Lawn maintenance", "Landscape design", "Irrigation", "Hardscaping"],
    growth: ["Fertilization", "Outdoor lighting", "Snow or seasonal service"],
    consumerQuestion: "What outdoor improvement would you most likely pay for in the next 12 months?",
    consumerOptions: ["Routine lawn care", "Landscape redesign", "Irrigation or drainage", "Patio, walkway, or hardscape"],
    employeeQuestion: "What most limits crew productivity during peak season?",
    employeeOptions: ["Labor shortages", "Equipment issues", "Scheduling or routing", "Weather delays"],
    pricingQuestion: "What job type has the best margin after labor and materials?"
  },
  {
    slug: "roofing",
    industry: "Roofing",
    audience: "roofing company",
    industryService: "roof repair or replacement services",
    services: ["Roof repair", "Roof replacement", "Storm damage work", "Inspections"],
    growth: ["Gutters", "Solar-ready roofing", "Maintenance plans"],
    consumerQuestion: "What would most likely trigger you to contact a roofer?",
    consumerOptions: ["Active leak", "Storm damage", "Roof age", "Insurance or home sale"],
    employeeQuestion: "What most affects field safety and job completion speed?",
    employeeOptions: ["Weather", "Crew experience", "Roof pitch or access", "Material availability"],
    pricingQuestion: "How much of your revenue is insurance or storm-driven versus retail replacement?"
  },
  {
    slug: "dental",
    industry: "Dental",
    audience: "dental practice",
    industryService: "dental care services",
    services: ["Preventive care", "Cosmetic dentistry", "Orthodontics", "Implants"],
    growth: ["Membership plans", "Emergency dentistry", "Clear aligners"],
    consumerQuestion: "What would make you switch dentists?",
    consumerOptions: ["Price or insurance", "Better reviews", "More convenient appointments", "Better patient experience"],
    employeeQuestion: "What staffing role is hardest to hire or retain?",
    employeeOptions: ["Hygienists", "Dental assistants", "Front desk", "Associate dentists"],
    pricingQuestion: "Which service line has the best combination of patient demand and production margin?"
  },
  {
    slug: "dermatology",
    industry: "Dermatology",
    audience: "dermatology practice",
    industryService: "dermatology or skin care services",
    services: ["Medical dermatology", "Cosmetic dermatology", "Skin cancer screening", "Acne treatment"],
    growth: ["Injectables", "Laser treatments", "Retail skin care"],
    consumerQuestion: "What would most influence your choice of a dermatology provider?",
    consumerOptions: ["Appointment availability", "Insurance acceptance", "Provider expertise", "Cosmetic treatment options"],
    employeeQuestion: "What creates the biggest clinic workflow bottleneck?",
    employeeOptions: ["Room turnover", "Prior authorizations", "Charting", "Patient scheduling"],
    pricingQuestion: "Which service mix has the strongest margin: medical visits, procedures, cosmetics, or retail?"
  },
  {
    slug: "hvac",
    industry: "HVAC",
    audience: "HVAC company",
    industryService: "heating, cooling, or indoor air services",
    services: ["Repair", "Replacement", "Maintenance", "Indoor air quality"],
    growth: ["Membership plans", "Duct cleaning", "Smart thermostats"],
    consumerQuestion: "What matters most when choosing HVAC service?",
    consumerOptions: ["Fast response", "Transparent price", "Warranty", "Financing"],
    employeeQuestion: "Which season creates the biggest staffing or scheduling strain?",
    employeeOptions: ["Summer cooling", "Winter heating", "Shoulder-season maintenance", "Year-round demand"],
    pricingQuestion: "What share of revenue comes from service agreements or maintenance plans?"
  },
  {
    slug: "pest-control",
    industry: "Pest Control",
    audience: "pest control company",
    industryService: "pest control or prevention services",
    services: ["General pest", "Termite", "Mosquito", "Rodent"],
    growth: ["Wildlife control", "Commercial accounts", "Lawn pest treatment"],
    consumerQuestion: "Which pest issue would make you switch providers fastest?",
    consumerOptions: ["Recurring insects", "Termites", "Rodents", "Poor communication"],
    employeeQuestion: "What service category requires the most training or safety oversight?",
    employeeOptions: ["Termite treatment", "Rodent exclusion", "Chemical application", "Commercial service"],
    pricingQuestion: "Which route density or account type is most profitable?"
  },
  {
    slug: "plumbing",
    industry: "Plumbing",
    audience: "plumbing company",
    industryService: "plumbing repair or installation services",
    services: ["Emergency repair", "Water heaters", "Drain cleaning", "Remodel plumbing"],
    growth: ["Sewer line work", "Leak detection", "Maintenance plans"],
    consumerQuestion: "What plumbing issue would make you pay a premium for same-day service?",
    consumerOptions: ["No hot water", "Active leak", "Clogged drain", "Sewer backup"],
    employeeQuestion: "What skill gap most slows down junior technicians?",
    employeeOptions: ["Diagnostics", "Customer communication", "Code knowledge", "Complex installs"],
    pricingQuestion: "Which service category has the strongest mix of urgency and margin?"
  },
  {
    slug: "electrical",
    industry: "Electrical",
    audience: "electrical contractor",
    industryService: "residential or commercial electrical services",
    services: ["Repairs", "Panel upgrades", "Lighting", "EV chargers"],
    growth: ["Generator installs", "Smart home", "Commercial maintenance"],
    consumerQuestion: "What electrical upgrade are you most likely to consider soon?",
    consumerOptions: ["EV charger", "Panel upgrade", "Lighting", "Generator or backup power"],
    employeeQuestion: "Which certification or licensing hurdle most affects staffing?",
    employeeOptions: ["Apprentice pipeline", "Journeyman availability", "Master license coverage", "Specialty training"],
    pricingQuestion: "Which project type has the best close rate after a quote?"
  },
  {
    slug: "med-spa",
    industry: "Med Spa",
    audience: "med spa",
    industryService: "aesthetic or wellness treatment services",
    services: ["Injectables", "Laser treatments", "Facials", "Body contouring"],
    growth: ["Memberships", "Weight loss", "Skin care retail"],
    consumerQuestion: "What would make you trust a med spa provider?",
    consumerOptions: ["Medical credentials", "Before-and-after results", "Reviews", "Consultation experience"],
    employeeQuestion: "What training or certification matters most for service quality?",
    employeeOptions: ["Injectables", "Laser safety", "Consultative selling", "Skin analysis"],
    pricingQuestion: "Which treatment line has the best margin after consumables and labor?"
  },
  {
    slug: "auto-repair",
    industry: "Auto Repair",
    audience: "auto repair shop",
    industryService: "auto repair or maintenance services",
    services: ["Oil and maintenance", "Brakes", "Diagnostics", "Transmission"],
    growth: ["Tires", "Fleet service", "Mobile repair"],
    consumerQuestion: "What would make you switch mechanics?",
    consumerOptions: ["Price transparency", "Faster turnaround", "Trust and honesty", "Better warranty"],
    employeeQuestion: "What repair category requires the most diagnostic skill?",
    employeeOptions: ["Electrical diagnostics", "Engine performance", "Transmission", "ADAS or software"],
    pricingQuestion: "Which service category produces the best repeat customer economics?"
  }
];

const next40Industries = [
  {
    slug: "garage-door",
    industry: "Garage Door",
    audience: "garage door company",
    industryService: "garage door repair or replacement services",
    services: ["Spring repair", "Opener repair", "New doors", "Maintenance"],
    growth: ["Smart openers", "Commercial doors", "Insulation upgrades"],
    consumerQuestion: "What would make you replace rather than repair a garage door?",
    consumerOptions: ["Repair cost", "Door appearance", "Safety concerns", "Smart opener upgrade"],
    employeeQuestion: "What job type creates the most callbacks or warranty issues?",
    employeeOptions: ["Spring repair", "Opener installation", "Door replacement", "Track or sensor issues"],
    pricingQuestion: "What share of jobs are emergency repair versus planned replacement?"
  },
  {
    slug: "pool-service",
    industry: "Pool Service",
    audience: "pool service company",
    industryService: "pool cleaning, repair, or maintenance services",
    services: ["Cleaning", "Openings and closings", "Equipment repair", "Remodeling"],
    growth: ["Automation", "Leak detection", "Resurfacing"],
    consumerQuestion: "What would make you switch pool service providers?",
    consumerOptions: ["Water quality", "Reliability", "Price", "Equipment expertise"],
    employeeQuestion: "What task causes the most seasonal burnout or turnover?",
    employeeOptions: ["Route volume", "Heavy repairs", "Chemical issues", "Customer complaints"],
    pricingQuestion: "How do route density and seasonality affect gross margin?"
  },
  {
    slug: "lawn-care",
    industry: "Lawn Care",
    audience: "lawn care company",
    industryService: "lawn treatment or mowing services",
    services: ["Mowing", "Fertilization", "Weed control", "Aeration"],
    growth: ["Pest treatment", "Irrigation", "Holiday lighting"],
    consumerQuestion: "Which lawn outcome matters most when choosing a provider?",
    consumerOptions: ["Greener color", "Fewer weeds", "Lower price", "Reliable visits"],
    employeeQuestion: "What most affects route completion on busy days?",
    employeeOptions: ["Weather", "Equipment downtime", "Route layout", "Labor shortages"],
    pricingQuestion: "What service bundle produces the best retention?"
  },
  {
    slug: "tree-care",
    industry: "Tree Care",
    audience: "tree care company",
    industryService: "tree trimming, removal, or plant health services",
    services: ["Trimming", "Removal", "Stump grinding", "Plant health"],
    growth: ["Emergency storm work", "Land clearing", "Cabling and bracing"],
    consumerQuestion: "What would make you pay more for a tree care company?",
    consumerOptions: ["Safety and insurance", "Fast scheduling", "Certified arborist", "Cleanup quality"],
    employeeQuestion: "What safety or equipment issue most limits job capacity?",
    employeeOptions: ["Climbing risk", "Crane access", "Chainsaw safety", "Traffic or site access"],
    pricingQuestion: "Which service line has the highest risk-adjusted margin?"
  },
  {
    slug: "home-cleaning",
    industry: "Home Cleaning",
    audience: "home cleaning company",
    industryService: "residential cleaning services",
    services: ["Standard cleaning", "Deep cleaning", "Move-out cleaning", "Recurring service"],
    growth: ["Office cleaning", "Airbnb turns", "Add-on laundry"],
    consumerQuestion: "What would make you trust a cleaner in your home?",
    consumerOptions: ["Background checks", "Reviews", "Referral", "Clear pricing"],
    employeeQuestion: "What most affects cleaner retention?",
    employeeOptions: ["Pay", "Schedule", "Travel time", "Client behavior"],
    pricingQuestion: "Which customer segment has the best retention and lowest churn?"
  },
  {
    slug: "carpet-cleaning",
    industry: "Carpet Cleaning",
    audience: "carpet cleaning company",
    industryService: "carpet, upholstery, or floor cleaning services",
    services: ["Carpet cleaning", "Upholstery cleaning", "Tile and grout", "Pet odor treatment"],
    growth: ["Commercial contracts", "Air duct cleaning", "Water extraction"],
    consumerQuestion: "What problem most often drives a cleaning purchase?",
    consumerOptions: ["Stains", "Pet odor", "Move-in or move-out", "Allergies or health"],
    employeeQuestion: "Which job conditions most affect service quality?",
    employeeOptions: ["Soil level", "Access and stairs", "Drying conditions", "Equipment reliability"],
    pricingQuestion: "Which add-on creates the most profit per visit?"
  },
  {
    slug: "restoration",
    industry: "Restoration",
    audience: "restoration company",
    industryService: "water, fire, or mold restoration services",
    services: ["Water damage", "Fire damage", "Mold remediation", "Reconstruction"],
    growth: ["Contents cleaning", "Commercial mitigation", "Roofing tie-ins"],
    consumerQuestion: "What would influence your choice in an emergency restoration provider?",
    consumerOptions: ["Response time", "Insurance coordination", "Reviews", "Clear communication"],
    employeeQuestion: "What part of restoration work creates the most burnout or training burden?",
    employeeOptions: ["Emergency hours", "Documentation", "Mold safety", "Customer stress"],
    pricingQuestion: "What percentage of jobs are insurance-paid versus customer-paid?"
  },
  {
    slug: "painting",
    industry: "Painting",
    audience: "painting company",
    industryService: "interior or exterior painting services",
    services: ["Interior painting", "Exterior painting", "Cabinet painting", "Commercial painting"],
    growth: ["Drywall repair", "Staining", "Color consulting"],
    consumerQuestion: "What matters most in choosing a painter?",
    consumerOptions: ["Price", "Cleanliness", "Timeline", "Reviews or warranty"],
    employeeQuestion: "What job condition most affects crew speed and quality?",
    employeeOptions: ["Prep work", "Weather", "Access", "Surface condition"],
    pricingQuestion: "Which project size produces the best margin after prep time?"
  },
  {
    slug: "flooring",
    industry: "Flooring",
    audience: "flooring company",
    industryService: "flooring installation or repair services",
    services: ["Hardwood", "Vinyl or LVP", "Tile", "Carpet"],
    growth: ["Refinishing", "Commercial flooring", "Stairs"],
    consumerQuestion: "What flooring type are you most likely to buy next?",
    consumerOptions: ["Hardwood", "LVP", "Tile", "Carpet"],
    employeeQuestion: "What installation issue causes the most rework?",
    employeeOptions: ["Subfloor prep", "Material defects", "Measurement errors", "Transitions and stairs"],
    pricingQuestion: "Which material category is most profitable after labor and waste?"
  },
  {
    slug: "windows-doors",
    industry: "Windows and Doors",
    audience: "window and door company",
    industryService: "window or door replacement services",
    services: ["Windows", "Exterior doors", "Patio doors", "Repairs"],
    growth: ["Energy audits", "Siding", "Storm protection"],
    consumerQuestion: "What would motivate replacement?",
    consumerOptions: ["Energy cost", "Appearance", "Damage", "Noise or comfort"],
    employeeQuestion: "What installation task creates the most scheduling or quality risk?",
    employeeOptions: ["Measurement", "Weatherproofing", "Trim work", "Product delivery"],
    pricingQuestion: "How important is financing to closing replacement projects?"
  },
  {
    slug: "kitchen-bath-remodeling",
    industry: "Kitchen and Bath Remodeling",
    audience: "kitchen and bath remodeling company",
    industryService: "kitchen or bathroom remodeling services",
    services: ["Kitchen remodeling", "Bathroom remodeling", "Cabinets", "Countertops"],
    growth: ["Aging-in-place", "Design services", "Flooring"],
    consumerQuestion: "What would stop you from starting a remodel?",
    consumerOptions: ["Budget", "Timeline disruption", "Trust", "Design uncertainty"],
    employeeQuestion: "What trade handoff causes the most delays?",
    employeeOptions: ["Plumbing", "Electrical", "Cabinets", "Countertops"],
    pricingQuestion: "Which project scope has the best margin and lowest schedule risk?"
  },
  {
    slug: "general-contracting",
    industry: "General Contracting",
    audience: "general contracting company",
    industryService: "home improvement or construction services",
    services: ["Additions", "Remodels", "Repairs", "Commercial buildouts"],
    growth: ["Design-build", "Maintenance contracts", "Insurance repair"],
    consumerQuestion: "What trust signal matters most before hiring a contractor?",
    consumerOptions: ["References", "License and insurance", "Portfolio", "Clear estimate"],
    employeeQuestion: "Which trade shortage most affects project timelines?",
    employeeOptions: ["Carpentry", "Electrical", "Plumbing", "Project management"],
    pricingQuestion: "Which project type is most vulnerable to scope creep?"
  },
  {
    slug: "solar-installation",
    industry: "Solar Installation",
    audience: "solar installation company",
    industryService: "solar panel or energy storage services",
    services: ["Solar panels", "Batteries", "EV chargers", "Maintenance"],
    growth: ["Roofing partnerships", "Energy audits", "Commercial solar"],
    consumerQuestion: "What would make you seriously consider solar?",
    consumerOptions: ["Bill savings", "Incentives", "Backup power", "Environmental impact"],
    employeeQuestion: "What training or safety issue most affects installation quality?",
    employeeOptions: ["Roof safety", "Electrical work", "Battery systems", "Permitting knowledge"],
    pricingQuestion: "What is the biggest barrier to closing more projects?"
  },
  {
    slug: "security-systems",
    industry: "Security Systems",
    audience: "security systems company",
    industryService: "home or business security services",
    services: ["Alarm systems", "Cameras", "Access control", "Monitoring"],
    growth: ["Smart home", "Fire monitoring", "Cybersecurity"],
    consumerQuestion: "What security concern would trigger a purchase?",
    consumerOptions: ["Break-in risk", "Package theft", "Employee access", "Remote monitoring"],
    employeeQuestion: "Which product or system creates the most support burden?",
    employeeOptions: ["Cameras", "Access control", "Alarm panels", "Mobile apps"],
    pricingQuestion: "What share of revenue is recurring monitoring versus installation?"
  },
  {
    slug: "moving",
    industry: "Moving",
    audience: "moving company",
    industryService: "local or long-distance moving services",
    services: ["Local moves", "Long-distance moves", "Packing", "Storage"],
    growth: ["Junk removal", "Commercial moves", "Specialty items"],
    consumerQuestion: "What is your biggest fear when hiring movers?",
    consumerOptions: ["Damage", "Hidden fees", "Late arrival", "Poor communication"],
    employeeQuestion: "What causes the most job-day delays or claims?",
    employeeOptions: ["Underestimated inventory", "Access issues", "Crew size", "Customer readiness"],
    pricingQuestion: "Which move type has the best margin after labor, fuel, and claims?"
  },
  {
    slug: "self-storage",
    industry: "Self Storage",
    audience: "self-storage facility",
    industryService: "self-storage rental services",
    services: ["Standard units", "Climate-controlled units", "Vehicle storage", "Business storage"],
    growth: ["Moving supplies", "Pickup services", "Portable storage"],
    consumerQuestion: "What would make you choose one storage facility over another?",
    consumerOptions: ["Price", "Location", "Security", "Climate control"],
    employeeQuestion: "What customer issue creates the most front-desk workload?",
    employeeOptions: ["Billing", "Access problems", "Move-in questions", "Late payments"],
    pricingQuestion: "Which unit type has the strongest occupancy and pricing power?"
  },
  {
    slug: "junk-removal",
    industry: "Junk Removal",
    audience: "junk removal company",
    industryService: "junk removal or hauling services",
    services: ["Furniture removal", "Construction debris", "Cleanouts", "Yard waste"],
    growth: ["Dumpster rental", "Moving help", "Recycling"],
    consumerQuestion: "What would make you book junk removal instead of handling it yourself?",
    consumerOptions: ["Convenience", "Heavy items", "Time pressure", "Disposal uncertainty"],
    employeeQuestion: "What job type creates the most physical strain or damage risk?",
    employeeOptions: ["Appliances", "Construction debris", "Estate cleanouts", "Stairs or tight access"],
    pricingQuestion: "Which disposal stream most affects margin?"
  },
  {
    slug: "car-wash-detailing",
    industry: "Car Wash and Detailing",
    audience: "car wash or detailing company",
    industryService: "car wash or detailing services",
    services: ["Express wash", "Full-service wash", "Detailing", "Memberships"],
    growth: ["Ceramic coating", "Mobile detailing", "Fleet plans"],
    consumerQuestion: "What would make you buy a monthly wash plan?",
    consumerOptions: ["Convenience", "Unlimited washes", "Interior cleaning", "Price savings"],
    employeeQuestion: "What task most affects throughput or customer wait time?",
    employeeOptions: ["Vacuuming", "Detailing", "Payment flow", "Drying and finishing"],
    pricingQuestion: "What membership churn pattern matters most for profitability?"
  },
  {
    slug: "towing",
    industry: "Towing",
    audience: "towing company",
    industryService: "towing or roadside assistance services",
    services: ["Towing", "Jump starts", "Lockouts", "Tire changes"],
    growth: ["Impound contracts", "Fleet roadside", "Accident recovery"],
    consumerQuestion: "What matters most in roadside service?",
    consumerOptions: ["Arrival time", "Price", "Trust", "Insurance coverage"],
    employeeQuestion: "What creates the most safety risk on calls?",
    employeeOptions: ["Roadside traffic", "Night calls", "Accident scenes", "Vehicle condition"],
    pricingQuestion: "Which call source has the best margin?"
  },
  {
    slug: "veterinary",
    industry: "Veterinary",
    audience: "veterinary clinic",
    industryService: "veterinary care services",
    services: ["Wellness care", "Urgent care", "Surgery", "Dental"],
    growth: ["Grooming", "Boarding", "Subscriptions"],
    consumerQuestion: "What would make you choose a new vet clinic?",
    consumerOptions: ["Availability", "Compassion", "Price transparency", "Range of services"],
    employeeQuestion: "What workload issue most affects staff retention?",
    employeeOptions: ["Emergency cases", "Client stress", "Understaffing", "Administrative work"],
    pricingQuestion: "Which appointment type creates the best revenue per clinical hour?"
  },
  {
    slug: "physical-therapy",
    industry: "Physical Therapy",
    audience: "physical therapy clinic",
    industryService: "physical therapy services",
    services: ["Orthopedic PT", "Sports rehab", "Post-surgical rehab", "Chronic pain"],
    growth: ["Pelvic health", "Telehealth", "Employer programs"],
    consumerQuestion: "What would make you choose one PT clinic over another?",
    consumerOptions: ["Referral", "Availability", "Specialty expertise", "Insurance acceptance"],
    employeeQuestion: "What most affects therapist caseload quality?",
    employeeOptions: ["Visit volume", "Documentation", "Support staff", "Patient complexity"],
    pricingQuestion: "What payer mix or referral source is most profitable?"
  },
  {
    slug: "chiropractic",
    industry: "Chiropractic",
    audience: "chiropractic clinic",
    industryService: "chiropractic or spinal care services",
    services: ["Adjustments", "Rehab", "Massage", "Wellness plans"],
    growth: ["Sports care", "Decompression", "Corporate wellness"],
    consumerQuestion: "What would make you try or stop chiropractic care?",
    consumerOptions: ["Pain relief", "Cost", "Trust in provider", "Convenient plan"],
    employeeQuestion: "What patient volume level affects service quality?",
    employeeOptions: ["Too many walk-ins", "Back-to-back adjustments", "Rehab supervision", "Front desk load"],
    pricingQuestion: "Which plan or visit model produces the best retention?"
  },
  {
    slug: "senior-home-care",
    industry: "Senior Home Care",
    audience: "senior home care agency",
    industryService: "non-medical senior care services",
    services: ["Companion care", "Personal care", "Respite care", "Transportation"],
    growth: ["Dementia care", "Live-in care", "Care coordination"],
    consumerQuestion: "What factor would matter most when choosing care for a family member?",
    consumerOptions: ["Trust", "Caregiver consistency", "Price", "Specialized experience"],
    employeeQuestion: "What causes caregiver turnover most often?",
    employeeOptions: ["Pay", "Schedule", "Client fit", "Travel time"],
    pricingQuestion: "Which shift length or care type has the strongest margin and retention?"
  },
  {
    slug: "childcare",
    industry: "Childcare",
    audience: "childcare center",
    industryService: "childcare or early education services",
    services: ["Infant care", "Toddler care", "Preschool", "After-school"],
    growth: ["Summer camp", "Tutoring", "Enrichment"],
    consumerQuestion: "What would make you join or leave a childcare provider?",
    consumerOptions: ["Teacher quality", "Safety", "Schedule fit", "Price"],
    employeeQuestion: "What staffing issue most affects classroom quality?",
    employeeOptions: ["Ratios", "Teacher turnover", "Training", "Substitute coverage"],
    pricingQuestion: "Which age group or program has the strongest occupancy economics?"
  },
  {
    slug: "fitness-gyms",
    industry: "Fitness Gyms",
    audience: "fitness gym",
    industryService: "gym or fitness membership services",
    services: ["Open gym", "Group classes", "Personal training", "Wellness"],
    growth: ["Nutrition coaching", "Recovery", "Corporate plans"],
    consumerQuestion: "What would make you keep or cancel a gym membership?",
    consumerOptions: ["Price", "Convenience", "Class quality", "Cleanliness"],
    employeeQuestion: "What class or service is hardest to staff consistently?",
    employeeOptions: ["Early classes", "Personal training", "Group fitness", "Front desk"],
    pricingQuestion: "Which membership type produces the best lifetime value?"
  },
  {
    slug: "restaurants",
    industry: "Restaurants",
    audience: "restaurant",
    industryService: "restaurant dining or takeout services",
    services: ["Dine-in", "Takeout", "Delivery", "Catering"],
    growth: ["Private events", "Meal kits", "Loyalty programs"],
    consumerQuestion: "What would make you try a new local restaurant?",
    consumerOptions: ["Reviews", "Menu", "Price", "Recommendation"],
    employeeQuestion: "What role is hardest to staff without hurting service?",
    employeeOptions: ["Kitchen", "Servers", "Hosts", "Management"],
    pricingQuestion: "Which revenue channel has the best margin after labor and third-party fees?"
  },
  {
    slug: "coffee-shops",
    industry: "Coffee Shops",
    audience: "coffee shop",
    industryService: "coffee, cafe, or quick-service beverage purchases",
    services: ["Coffee", "Tea", "Food", "Catering"],
    growth: ["Subscriptions", "Wholesale", "Mobile cart"],
    consumerQuestion: "What makes a coffee shop part of your routine?",
    consumerOptions: ["Location", "Drink quality", "Speed", "Atmosphere"],
    employeeQuestion: "What shift or task creates the most operational stress?",
    employeeOptions: ["Morning rush", "Mobile orders", "Food prep", "Closing tasks"],
    pricingQuestion: "Which product mix produces the best margin and repeat visits?"
  },
  {
    slug: "breweries",
    industry: "Breweries",
    audience: "brewery",
    industryService: "brewery taproom or packaged beer purchases",
    services: ["Taproom", "Packaged beer", "Events", "Food"],
    growth: ["Distribution", "Memberships", "Private events"],
    consumerQuestion: "What would make you visit a brewery more often?",
    consumerOptions: ["Beer quality", "Events", "Food", "Atmosphere"],
    employeeQuestion: "What role or shift is hardest to cover?",
    employeeOptions: ["Taproom", "Production", "Events", "Kitchen"],
    pricingQuestion: "Which revenue channel is most profitable?"
  },
  {
    slug: "hotels",
    industry: "Hotels",
    audience: "hotel",
    industryService: "hotel or lodging services",
    services: ["Rooms", "Events", "Food and beverage", "Extended stay"],
    growth: ["Corporate accounts", "Packages", "Meeting space"],
    consumerQuestion: "What matters most when booking a local hotel?",
    consumerOptions: ["Price", "Location", "Cleanliness", "Reviews"],
    employeeQuestion: "What department is most understaffed during peak occupancy?",
    employeeOptions: ["Housekeeping", "Front desk", "Maintenance", "Food and beverage"],
    pricingQuestion: "Which guest segment has the best ADR and repeat potential?"
  },
  {
    slug: "event-venues",
    industry: "Event Venues",
    audience: "event venue",
    industryService: "event venue rental services",
    services: ["Weddings", "Corporate events", "Private parties", "Community events"],
    growth: ["Catering", "Planning", "Audiovisual"],
    consumerQuestion: "What would make you choose one venue over another?",
    consumerOptions: ["Price", "Availability", "Look and feel", "Included services"],
    employeeQuestion: "What event-day issue causes the most staff strain?",
    employeeOptions: ["Setup timing", "Vendor coordination", "Guest issues", "Cleanup"],
    pricingQuestion: "Which event type has the best margin after staffing and vendor costs?"
  },
  {
    slug: "property-management",
    industry: "Property Management",
    audience: "property management company",
    industryService: "residential property management services",
    services: ["Leasing", "Maintenance", "Rent collection", "HOA management"],
    growth: ["Short-term rentals", "Investor reporting", "Brokerage"],
    consumerQuestion: "What would make a landlord switch property managers?",
    consumerOptions: ["Vacancy", "Maintenance quality", "Fees", "Communication"],
    employeeQuestion: "What maintenance or tenant issue creates the most workload?",
    employeeOptions: ["Emergency repairs", "Turnovers", "Delinquency", "Tenant complaints"],
    pricingQuestion: "Which property type has the best management fee economics?"
  },
  {
    slug: "real-estate-brokerages",
    industry: "Real Estate Brokerages",
    audience: "real estate brokerage",
    industryService: "real estate agent or brokerage services",
    services: ["Buyer representation", "Listing", "Relocation", "Investment"],
    growth: ["Property management", "Mortgage partnerships", "Lead programs"],
    consumerQuestion: "What would make you choose one agent over another?",
    consumerOptions: ["Local expertise", "Marketing plan", "Commission", "Referral"],
    employeeQuestion: "What support gap most affects agent productivity?",
    employeeOptions: ["Lead generation", "Training", "Transaction support", "Marketing"],
    pricingQuestion: "Which lead source produces the highest close rate and commission ROI?"
  },
  {
    slug: "mortgage-brokers",
    industry: "Mortgage Brokers",
    audience: "mortgage brokerage",
    industryService: "mortgage or refinancing services",
    services: ["Purchase loans", "Refinance", "HELOC", "Jumbo loans"],
    growth: ["Realtor partnerships", "Investor loans", "Credit repair referrals"],
    consumerQuestion: "What would make you trust a mortgage advisor?",
    consumerOptions: ["Rate transparency", "Speed", "Referral", "Clear communication"],
    employeeQuestion: "What process step creates the most customer friction?",
    employeeOptions: ["Document collection", "Underwriting", "Rate locks", "Closing coordination"],
    pricingQuestion: "Which borrower segment has the strongest pull-through rate?"
  },
  {
    slug: "insurance-agencies",
    industry: "Insurance Agencies",
    audience: "insurance agency",
    industryService: "personal or business insurance services",
    services: ["Auto insurance", "Home insurance", "Business insurance", "Life insurance"],
    growth: ["Benefits", "Cyber coverage", "Specialty coverage"],
    consumerQuestion: "What would make you switch insurance agencies?",
    consumerOptions: ["Price", "Coverage advice", "Claims help", "Bundling"],
    employeeQuestion: "What carrier or process issue most affects service quality?",
    employeeOptions: ["Quote turnaround", "Claims support", "Renewals", "Underwriting"],
    pricingQuestion: "Which line has the best retention and cross-sell economics?"
  },
  {
    slug: "accounting-tax",
    industry: "Accounting and Tax",
    audience: "accounting or tax firm",
    industryService: "accounting, bookkeeping, or tax services",
    services: ["Tax prep", "Bookkeeping", "Payroll", "Advisory"],
    growth: ["CFO services", "Audit support", "Industry niches"],
    consumerQuestion: "What would make you switch accountants?",
    consumerOptions: ["Responsiveness", "Better advice", "Price", "Industry knowledge"],
    employeeQuestion: "What season or task creates the worst capacity crunch?",
    employeeOptions: ["Tax season", "Month-end close", "Payroll deadlines", "Client cleanup"],
    pricingQuestion: "Which client segment has the best recurring advisory potential?"
  },
  {
    slug: "legal-services",
    industry: "Legal Services",
    audience: "law firm",
    industryService: "legal consultation or representation services",
    services: ["Family law", "Estate planning", "Business law", "Personal injury"],
    growth: ["Subscription plans", "Mediation", "Compliance packages"],
    consumerQuestion: "What would make you contact a lawyer sooner rather than wait?",
    consumerOptions: ["Clear pricing", "Urgency", "Referral", "Free consultation"],
    employeeQuestion: "What workflow causes the most staff or attorney bottlenecks?",
    employeeOptions: ["Intake", "Document drafting", "Court deadlines", "Client follow-up"],
    pricingQuestion: "Which matter type has the best balance of demand, margin, and collection risk?"
  },
  {
    slug: "it-managed-services",
    industry: "IT Managed Services",
    audience: "managed IT services provider",
    industryService: "outsourced IT support services",
    services: ["Help desk", "Cybersecurity", "Cloud", "Network management"],
    growth: ["Compliance", "vCIO", "Backup and disaster recovery"],
    consumerQuestion: "What IT issue would make you switch providers?",
    consumerOptions: ["Slow response", "Security concern", "Downtime", "Poor communication"],
    employeeQuestion: "What ticket type consumes the most support capacity?",
    employeeOptions: ["Password/access", "Network issues", "Security alerts", "Device support"],
    pricingQuestion: "Which service bundle produces the best recurring gross margin?"
  },
  {
    slug: "digital-marketing-agencies",
    industry: "Digital Marketing Agencies",
    audience: "digital marketing agency",
    industryService: "marketing or advertising services",
    services: ["SEO", "Paid ads", "Web design", "Social media"],
    growth: ["Analytics", "AI automation", "Content production"],
    consumerQuestion: "What result would make you hire or fire a marketing agency?",
    consumerOptions: ["Leads", "Revenue", "Reporting clarity", "Strategic advice"],
    employeeQuestion: "What delivery role is hardest to staff profitably?",
    employeeOptions: ["Paid media", "SEO", "Creative", "Account management"],
    pricingQuestion: "Which service line has the best margin after labor and software costs?"
  },
  {
    slug: "staffing-agencies",
    industry: "Staffing Agencies",
    audience: "staffing agency",
    industryService: "staffing or recruiting services",
    services: ["Temporary staffing", "Direct hire", "Temp-to-perm", "Executive search"],
    growth: ["RPO", "Payroll services", "Niche verticals"],
    consumerQuestion: "What would make a company switch staffing partners?",
    consumerOptions: ["Candidate quality", "Fill speed", "Price", "Communication"],
    employeeQuestion: "What part of recruiting creates the most candidate drop-off?",
    employeeOptions: ["Screening", "Scheduling", "Offer process", "Onboarding"],
    pricingQuestion: "Which placement type has the best margin and fill-rate combination?"
  },
  {
    slug: "private-schools-tutoring",
    industry: "Private Schools and Tutoring",
    audience: "private school or tutoring company",
    industryService: "private education or tutoring services",
    services: ["K-12 school", "Test prep", "Tutoring", "Enrichment"],
    growth: ["Online programs", "Summer camps", "College counseling"],
    consumerQuestion: "What would make you pay a premium for education support?",
    consumerOptions: ["Teacher quality", "Results", "Personalization", "Schedule fit"],
    employeeQuestion: "What teaching role or subject is hardest to staff?",
    employeeOptions: ["STEM", "Test prep", "Early childhood", "Special needs"],
    pricingQuestion: "Which program has the strongest retention and referral economics?"
  }
];

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) {
    throw new Error("Set TALLY_API_KEY before running. Example: $env:TALLY_API_KEY='...'; node scripts/tally-duplicate-first10.mjs");
  }
  return token;
}

async function tally(path, { method = "GET", body, token } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "tally-version": "2025-01-15"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      if (!response.ok) {
        throw new Error(`${method} ${path} failed ${response.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function collectUuids(value, set = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectUuids(item, set));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectUuids(item, set));
  } else if (typeof value === "string" && UUID_RE.test(value)) {
    set.add(value);
  }
  return set;
}

function deepTransform(value, fn) {
  if (Array.isArray(value)) return value.map((item) => deepTransform(item, fn));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepTransform(item, fn)]));
  }
  return fn(value);
}

function replaceTokens(text, config) {
  if (typeof text !== "string") return text;
  return text
    .replaceAll("Template Form {Sherlock}", `Sherlock Research: ${config.industry} Market Survey`)
    .replaceAll("{industry_service}", config.industryService)
    .replaceAll("{industry}", config.industry)
    .replaceAll("executive/owner of a " + config.industry + " company", `executive/owner of a ${config.audience}`)
    .replaceAll("{service_option_1}", config.services[0])
    .replaceAll("{service_option_2}", config.services[1])
    .replaceAll("{service_option_3}", config.services[2])
    .replaceAll("{service_option_4}", config.services[3])
    .replaceAll("{growth_option_1}", config.growth[0])
    .replaceAll("{growth_option_2}", config.growth[1])
    .replaceAll("{growth_option_3}", config.growth[2])
    .replaceAll("monthly gift-card raffle", "monthly $100 Amazon gift-card raffle")
    .replaceAll("Owners & managers:", "Employees, owners, and managers:")
    .replaceAll("OWNER25", "INSIDER25");
}

function patchIndustrySpecificBlocks(blocks, marker, question, options) {
  const index = blocks.findIndex((block) => JSON.stringify(block).includes(marker));
  if (index === -1) throw new Error(`Could not find marker ${marker}`);
  blocks[index] = deepTransform(blocks[index], (value) => {
    if (typeof value === "string") return value.replaceAll(marker, question);
    return value;
  });

  let optionIndex = 0;
  for (let i = index + 1; i < blocks.length && optionIndex < options.length && i < index + 12; i += 1) {
    const markerValue = `{opt_${String.fromCharCode(97 + optionIndex)}}`;
    if (JSON.stringify(blocks[i]).includes(markerValue)) {
      blocks[i] = deepTransform(blocks[i], (value) => {
        if (typeof value === "string") return value.replaceAll(markerValue, options[optionIndex]);
        return value;
      });
      optionIndex += 1;
    }
  }
}

function buildBlocks(masterBlocks, config) {
  const uuidMap = new Map([...collectUuids(masterBlocks)].map((uuid) => [uuid, crypto.randomUUID()]));
  const blocks = deepTransform(masterBlocks, (value) => {
    if (typeof value === "string" && uuidMap.has(value)) return uuidMap.get(value);
    return value;
  });

  patchIndustrySpecificBlocks(
    blocks,
    "{industry_specific_consumer_question}",
    config.consumerQuestion,
    config.consumerOptions
  );
  patchIndustrySpecificBlocks(
    blocks,
    "{industry_specific_employee_question}",
    config.employeeQuestion,
    config.employeeOptions
  );

  const pricingBlockIndex = blocks.findIndex((block) => JSON.stringify(block).includes("{industry_specific_pricing_question}"));
  const pricingBlock = blocks[pricingBlockIndex];
  if (!pricingBlock) throw new Error("Could not find pricing question marker");
  blocks[pricingBlockIndex] = deepTransform(pricingBlock, (value) => {
    if (typeof value === "string") return value.replaceAll("{industry_specific_pricing_question}", config.pricingQuestion);
    return value;
  });

  const transformedBlocks = deepTransform(blocks, (value) => replaceTokens(value, config));

  const title = transformedBlocks.find((block) => block.type === "FORM_TITLE");
  if (title) {
    title.payload = {
      ...title.payload,
      title: `Sherlock Research: ${config.industry} Market Survey`,
      safeHTMLSchema: [[`Sherlock Research: ${config.industry} Market Survey`]]
    };
  }

  return transformedBlocks;
}

async function main() {
  const token = requireToken();
  const master = await tally(`/forms/${MASTER_FORM_ID}`, { token });
  if (!master.blocks?.length) throw new Error(`Master form ${MASTER_FORM_ID} has no blocks`);

  const created = [];
  const selectedIndustries = process.env.TALLY_BATCH === "next40" ? next40Industries : industries;
  for (const config of selectedIndustries) {
    const name = `Sherlock Research: ${config.industry} Market Survey`;
    const blocks = buildBlocks(master.blocks, config);
    const existingId = process.env.TALLY_UPDATE_EXISTING === "1" ? existingFormIds[config.slug] : null;
    const result = existingId
      ? await tally(`/forms/${existingId}`, {
          method: "PATCH",
          token,
          body: {
            name,
            status: "PUBLISHED",
            settings: master.settings,
            blocks
          }
        })
      : await tally("/forms", {
          method: "POST",
          token,
          body: {
            status: "PUBLISHED",
            workspaceId: master.workspaceId,
            settings: master.settings,
            blocks
          }
        });
    const formId = existingId || result.id;
    created.push({
      industry: config.industry,
      id: formId,
      name,
      editUrl: `https://tally.so/forms/${formId}/edit`,
      shareUrl: `https://tally.so/r/${formId}`
    });
    console.log(`${config.industry}: https://tally.so/r/${formId}`);
  }

  console.log(JSON.stringify(created, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
