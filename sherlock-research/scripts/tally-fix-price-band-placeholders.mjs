#!/usr/bin/env node

const API_BASE = "https://api.tally.so";

const forms = [
  ["Landscaping", "lbv8qW", ["Maintenance routes", "Design/build projects", "Irrigation work", "Hardscaping"]],
  ["Roofing", "RGkqdJ", ["Mostly insurance/storm-driven", "Balanced mix", "Mostly retail replacement", "Not sure"]],
  ["Dental", "Gx5OKo", ["Preventive care", "Cosmetic dentistry", "Orthodontics", "Implants"]],
  ["Dermatology", "ODkxl8", ["Medical visits", "Procedures", "Cosmetic treatments", "Retail skin care"]],
  ["HVAC", "VLDWjv", ["Under 10%", "10-25%", "25-50%", "50%+"]],
  ["Pest Control", "PdkZDb", ["Dense residential routes", "Commercial accounts", "Termite/specialty work", "Mosquito/seasonal routes"]],
  ["Plumbing", "EkMo5N", ["Emergency repair", "Water heaters", "Drain/sewer", "Remodel/installation"]],
  ["Electrical", "rjv8Bv", ["Repairs", "Panel upgrades", "Lighting", "EV/generator projects"]],
  ["Med Spa", "44zlBO", ["Injectables", "Laser treatments", "Facials/memberships", "Body contouring"]],
  ["Auto Repair", "jav8bE", ["Maintenance", "Brakes/tires", "Diagnostics/engine", "Transmission/major repair"]],
  ["Garage Door", "WO1a8J", ["Mostly emergency repair", "Balanced mix", "Mostly planned replacement", "Not sure"]],
  ["Pool Service", "aQvp29", ["Dense routes improve margin", "Seasonality compresses margin", "Equipment repairs drive margin", "Not sure"]],
  ["Lawn Care", "68M6Ze", ["Mowing only", "Mowing + treatment", "Full lawn program", "Seasonal add-ons"]],
  ["Tree Care", "7RM7NL", ["Trimming", "Removal", "Plant health", "Storm/emergency work"]],
  ["Home Cleaning", "b5v1We", ["Recurring residential", "Deep cleans", "Move-out cleans", "Airbnb/short-term rental"]],
  ["Carpet Cleaning", "A7yMBB", ["Upholstery", "Tile/grout", "Pet odor treatment", "Commercial maintenance"]],
  ["Restoration", "Bz0Jx7", ["Mostly insurance-paid", "Balanced mix", "Mostly customer-paid", "Not sure"]],
  ["Painting", "kdv8N6", ["Small interior jobs", "Whole-home interior", "Exterior projects", "Commercial jobs"]],
  ["Flooring", "vGK8PA", ["Hardwood", "LVP/vinyl", "Tile", "Carpet"]],
  ["Windows and Doors", "KYkrVM", ["Critical to closing", "Helpful but not required", "Rarely matters", "Not sure"]],
  ["Kitchen and Bath Remodeling", "LZk4PG", ["Cosmetic refresh", "Mid-range remodel", "Full gut remodel", "Design-build package"]],
  ["General Contracting", "pbvYDV", ["Additions", "Remodels", "Repairs", "Commercial buildouts"]],
  ["Solar Installation", "1A6Q9M", ["Financing", "Permitting/utility approval", "Customer trust", "Lead quality"]],
  ["Security Systems", "MeMjEY", ["Mostly installation", "Balanced mix", "Mostly recurring monitoring", "Not sure"]],
  ["Moving", "J9MEOJ", ["Local moves", "Long-distance moves", "Packing add-ons", "Commercial moves"]],
  ["Self Storage", "gDv89N", ["Standard units", "Climate-controlled", "Vehicle storage", "Business storage"]],
  ["Junk Removal", "yPz8J0", ["Dump fees", "Labor", "Fuel/truck time", "Resale/recycling"]],
  ["Car Wash and Detailing", "Xxz64O", ["First-month churn", "Seasonal churn", "Price-driven churn", "Low churn/stable base"]],
  ["Towing", "81MbZA", ["Police/municipal", "Insurance/roadside", "Retail calls", "Fleet accounts"]],
  ["Veterinary", "0QaqeZ", ["Wellness visits", "Urgent/sick visits", "Surgery", "Dental"]],
  ["Physical Therapy", "zxL871", ["Commercial insurance", "Cash-pay", "Workers' comp", "Physician referrals"]],
  ["Chiropractic", "5BMaZM", ["Single visits", "Package plans", "Memberships", "Insurance-based care"]],
  ["Senior Home Care", "dWvJ9z", ["Short hourly shifts", "Long hourly shifts", "Live-in care", "Specialized dementia care"]],
  ["Childcare", "Y5k74q", ["Infant care", "Toddler care", "Preschool", "After-school/summer"]],
  ["Fitness Gyms", "D4MR7b", ["Basic membership", "Premium membership", "Personal training", "Corporate/group plans"]],
  ["Restaurants", "lbv865", ["Dine-in", "Takeout", "Delivery", "Catering/private events"]],
  ["Coffee Shops", "RGkqDl", ["Coffee drinks", "Food add-ons", "Subscriptions", "Catering/wholesale"]],
  ["Breweries", "obv821", ["Taproom", "Distribution", "Events", "Food"]],
  ["Hotels", "Gx5ORj", ["Leisure travelers", "Corporate travelers", "Extended stay", "Events/groups"]],
  ["Event Venues", "ODkx7K", ["Weddings", "Corporate events", "Private parties", "Community events"]],
  ["Property Management", "VLDWza", ["Single-family rentals", "Small multifamily", "HOA/associations", "Short-term rentals"]],
  ["Real Estate Brokerages", "PdkZzQ", ["Referrals", "Online leads", "Open houses", "Agent sphere"]],
  ["Mortgage Brokers", "EkMoxo", ["First-time buyers", "Move-up buyers", "Refinance", "Investors"]],
  ["Insurance Agencies", "rjv8oM", ["Auto", "Home", "Business", "Life/benefits"]],
  ["Accounting and Tax", "44zlKb", ["Individuals", "Small businesses", "High-income households", "Advisory/CFO clients"]],
  ["Legal Services", "jav8lR", ["Family law", "Estate planning", "Business law", "Personal injury"]],
  ["IT Managed Services", "2E79Kp", ["Help desk only", "Security bundle", "Full managed IT", "Compliance/vCIO"]],
  ["Digital Marketing Agencies", "xXv8JG", ["SEO", "Paid ads", "Web design", "Content/social"]],
  ["Staffing Agencies", "RGkqDp", ["Temporary staffing", "Temp-to-perm", "Direct hire", "Executive search"]],
  ["Private Schools and Tutoring", "obv82X", ["K-12 tuition", "Test prep", "Tutoring", "Summer/enrichment"]]
];

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) throw new Error("Set TALLY_API_KEY before running.");
  return token;
}

async function tally(path, { method = "GET", body, token }) {
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
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`${method} ${path} failed ${response.status}: ${text}`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function patchBlocks(blocks, options) {
  let replacements = 0;
  const markers = ["{price_band_1}", "{price_band_2}", "{price_band_3}", "{price_band_4}"];
  for (const block of blocks) {
    if (!block.payload || typeof block.payload.text !== "string") continue;
    const index = markers.indexOf(block.payload.text);
    if (index === -1) continue;
    block.payload.text = options[index];
    replacements += 1;
  }
  return replacements;
}

async function main() {
  const token = requireToken();
  let total = 0;
  for (const [industry, id, options] of forms) {
    const form = await tally(`/forms/${id}`, { token });
    const replacements = patchBlocks(form.blocks, options);
    if (replacements) {
      await tally(`/forms/${id}`, {
        method: "PATCH",
        token,
        body: {
          name: form.name,
          status: "PUBLISHED",
          settings: form.settings,
          blocks: form.blocks
        }
      });
    }
    total += replacements;
    console.log(`${industry}: replaced ${replacements}`);
  }
  console.log(`TOTAL_REPLACED=${total}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
