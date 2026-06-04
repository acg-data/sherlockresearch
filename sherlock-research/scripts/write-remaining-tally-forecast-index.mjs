#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const outputRoot = path.join("outputs", "remaining_49_tally_forecasts");

const forms = [
  ["Roofing", "roofing", "RGkqdJ"],
  ["Dental", "dental", "Gx5OKo"],
  ["Dermatology", "dermatology", "ODkxl8"],
  ["HVAC", "hvac", "VLDWjv"],
  ["Pest Control", "pest-control", "PdkZDb"],
  ["Plumbing", "plumbing", "EkMo5N"],
  ["Electrical", "electrical", "rjv8Bv"],
  ["Med Spa", "med-spa", "44zlBO"],
  ["Auto Repair", "auto-repair", "jav8bE"],
  ["Garage Door", "garage-door", "WO1a8J"],
  ["Pool Service", "pool-service", "aQvp29"],
  ["Lawn Care", "lawn-care", "68M6Ze"],
  ["Tree Care", "tree-care", "7RM7NL"],
  ["Home Cleaning", "home-cleaning", "b5v1We"],
  ["Carpet Cleaning", "carpet-cleaning", "A7yMBB"],
  ["Restoration", "restoration", "Bz0Jx7"],
  ["Painting", "painting", "kdv8N6"],
  ["Flooring", "flooring", "vGK8PA"],
  ["Windows and Doors", "windows-and-doors", "KYkrVM"],
  ["Kitchen and Bath Remodeling", "kitchen-and-bath-remodeling", "LZk4PG"],
  ["General Contracting", "general-contracting", "pbvYDV"],
  ["Solar Installation", "solar-installation", "1A6Q9M"],
  ["Security Systems", "security-systems", "MeMjEY"],
  ["Moving", "moving", "J9MEOJ"],
  ["Self Storage", "self-storage", "gDv89N"],
  ["Junk Removal", "junk-removal", "yPz8J0"],
  ["Car Wash and Detailing", "car-wash-and-detailing", "Xxz64O"],
  ["Towing", "towing", "81MbZA"],
  ["Veterinary", "veterinary", "0QaqeZ"],
  ["Physical Therapy", "physical-therapy", "zxL871"],
  ["Chiropractic", "chiropractic", "5BMaZM"],
  ["Senior Home Care", "senior-home-care", "dWvJ9z"],
  ["Childcare", "childcare", "Y5k74q"],
  ["Fitness Gyms", "fitness-gyms", "D4MR7b"],
  ["Restaurants", "restaurants", "lbv865"],
  ["Coffee Shops", "coffee-shops", "RGkqDl"],
  ["Breweries", "breweries", "obv821"],
  ["Hotels", "hotels", "Gx5ORj"],
  ["Event Venues", "event-venues", "ODkx7K"],
  ["Property Management", "property-management", "VLDWza"],
  ["Real Estate Brokerages", "real-estate-brokerages", "PdkZzQ"],
  ["Mortgage Brokers", "mortgage-brokers", "EkMoxo"],
  ["Insurance Agencies", "insurance-agencies", "rjv8oM"],
  ["Accounting and Tax", "accounting-and-tax", "44zlKb"],
  ["Legal Services", "legal-services", "jav8lR"],
  ["IT Managed Services", "it-managed-services", "2E79Kp"],
  ["Digital Marketing Agencies", "digital-marketing-agencies", "xXv8JG"],
  ["Staffing Agencies", "staffing-agencies", "RGkqDp"],
  ["Private Schools and Tutoring", "private-schools-and-tutoring", "obv82X"],
];

function relLink(...parts) {
  return parts.join("/").replaceAll("\\", "/");
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];
  const tableRows = [];

  for (const [industryName, slug, formId] of forms) {
    const mdName = `${slug.toUpperCase()}_TALLY_599_FORECAST.md`;
    const csvName = `${slug.toUpperCase()}_TALLY_599_FORECAST.csv`;
    const xlsxName = `${slug.toUpperCase()}_TALLY_599_FORECAST_CHARTS.xlsx`;
    const outDir = path.join(outputRoot, slug);
    const files = [mdName, csvName, xlsxName];
    for (const file of files) {
      if (!(await exists(path.join(outDir, file)))) missing.push(path.join(outDir, file));
    }
    tableRows.push(
      `| ${industryName} | https://tally.so/r/${formId} | [Markdown](${relLink(slug, mdName)}) | [CSV](${relLink(slug, csvName)}) | [Charts XLSX](${relLink(slug, xlsxName)}) |`,
    );
  }

  if (missing.length) {
    throw new Error(`Missing expected outputs:\n${missing.join("\n")}`);
  }

  const index = [
    "# Remaining 49 Tally Forecast Reports",
    "",
    "Each report models 599 completed responses with the same branch denominator structure used for Landscaping: 419 consumers, 90 employees, and 90 owners/operators. Substantive answer distributions include deterministic, bounded industry-specific deltas so each report varies without swinging too far from the baseline.",
    "",
    "| Industry | Public form | Report | Data | Charts |",
    "|---|---|---|---|---|",
    ...tableRows,
    "",
  ].join("\n");

  await fs.writeFile(path.join(outputRoot, "INDEX.md"), index, "utf8");
  console.log(`wrote ${path.join(outputRoot, "INDEX.md")}`);
  console.log(`verified ${forms.length} report folders with Markdown, CSV, and XLSX outputs`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
