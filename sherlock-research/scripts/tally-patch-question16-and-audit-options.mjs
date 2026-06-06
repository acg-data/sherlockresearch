#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const API_BASE = "https://api.tally.so";
const outputDir = path.join("outputs", "tally_answer_option_audit");
const outputPath = path.join(outputDir, "SHERLOCK_TALLY_ANSWER_OPTION_AUDIT.xlsx");

const forms = [
  ["Landscaping", "landscaping", "lbv8qW"],
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

const q16 = {
  "landscaping": ["What best describes how you use landscaping or lawn care services?", ["Recurring lawn maintenance", "Seasonal cleanup or planting", "Design/build project", "Irrigation or hardscape work", "Occasional as-needed help"]],
  "roofing": ["What best describes your roofing service need?", ["Emergency leak or repair", "Storm damage or insurance claim", "Inspection or maintenance", "Planned roof replacement", "Quote shopping or not sure yet"]],
  "dental": ["What best describes your dental care pattern?", ["Routine preventive care", "Problem or emergency visit", "Cosmetic or orthodontic treatment", "Ongoing treatment plan", "New provider or second opinion"]],
  "dermatology": ["What best describes your dermatology care pattern?", ["Annual skin check", "Medical skin condition treatment", "Cosmetic treatment", "Acne or chronic care", "New provider or consultation"]],
  "hvac": ["What best describes your HVAC service need?", ["Emergency repair", "Seasonal tune-up", "Maintenance agreement", "System replacement", "Indoor air or comfort upgrade"]],
  "pest-control": ["What best describes your pest control service need?", ["Recurring prevention plan", "Seasonal mosquito or tick service", "Termite or specialty treatment", "One-time infestation", "Commercial or property service"]],
  "plumbing": ["What best describes your plumbing service need?", ["Emergency repair", "Fixture or water heater work", "Drain or sewer issue", "Remodel or installation", "Inspection or maintenance"]],
  "electrical": ["What best describes your electrical service need?", ["Repair or troubleshooting", "Panel or service upgrade", "Lighting project", "EV charger or generator", "Commercial or specialty work"]],
  "med-spa": ["What best describes your med spa usage?", ["Injectables or fillers", "Facials or skin care", "Laser or body treatment", "Wellness or weight-loss program", "Consultation or occasional treatment"]],
  "auto-repair": ["What best describes your auto repair usage?", ["Routine maintenance", "Repair as needed", "Diagnostics or warning light", "Tires, brakes, or alignment", "Fleet or multiple vehicles"]],
  "garage-door": ["What best describes your garage door service need?", ["Emergency spring or opener repair", "Planned door replacement", "Smart opener or access upgrade", "Maintenance or safety inspection", "Quote shopping or not sure yet"]],
  "pool-service": ["What best describes your pool service usage?", ["Weekly cleaning route", "Seasonal opening or closing", "Equipment repair", "Remodel or resurfacing", "Water chemistry help"]],
  "lawn-care": ["What best describes your lawn care usage?", ["Recurring mowing", "Fertilization or weed control", "Seasonal cleanup", "Aeration or overseeding", "Seasonal add-on service"]],
  "tree-care": ["What best describes your tree care need?", ["Pruning or trimming", "Removal or storm work", "Plant health or arborist advice", "Stump grinding or land clearing", "Inspection or quote only"]],
  "home-cleaning": ["What best describes your home cleaning usage?", ["Weekly or bi-weekly recurring cleaning", "Monthly recurring cleaning", "Deep cleaning", "Move-in or move-out cleaning", "Short-term rental turnover"]],
  "carpet-cleaning": ["What best describes your carpet cleaning need?", ["Annual or semiannual cleaning", "Stain or pet odor issue", "Move-in or move-out cleaning", "Upholstery, tile, or grout", "Commercial maintenance"]],
  "restoration": ["What best describes your restoration need?", ["Emergency water, fire, or mold event", "Insurance claim support", "Reconstruction after mitigation", "Prevention or inspection", "Not sure yet"]],
  "painting": ["What best describes your painting project?", ["Small room or touch-up", "Whole-home interior", "Exterior painting", "Cabinet or specialty finish", "Commercial or property turn"]],
  "flooring": ["What best describes your flooring project?", ["Repair or one-room replacement", "Whole-home flooring", "Tile for kitchen or bath", "Commercial or tenant turnover", "Quote shopping or material selection"]],
  "windows-and-doors": ["What best describes your window or door project?", ["Draft or energy-efficiency replacement", "Broken window or door repair", "Whole-home replacement", "Storm, security, or entry upgrade", "Quote shopping or not sure yet"]],
  "kitchen-and-bath-remodeling": ["What best describes your kitchen or bath project?", ["Cosmetic refresh", "Single kitchen or bath remodel", "Full gut remodel", "Design-build planning", "Quote shopping or not sure yet"]],
  "general-contracting": ["What best describes your contracting project?", ["Repair or small project", "Interior remodel", "Addition or major renovation", "Commercial buildout", "Planning or quote stage"]],
  "solar-installation": ["What best describes your solar buying stage?", ["Researching or quote shopping", "Ready to install solar", "Battery or storage add-on", "System maintenance or upgrade", "Not sure yet"]],
  "security-systems": ["What best describes your security system need?", ["Monitoring subscription", "New install or upgrade", "Cameras or access control", "Troubleshooting existing system", "Quote shopping or comparing options"]],
  "moving": ["What best describes your moving need?", ["Local move", "Long-distance move", "Packing or storage add-on", "Commercial or office move", "Planning or quote shopping"]],
  "self-storage": ["What best describes your self-storage need?", ["Short-term storage", "Long-term storage", "Climate-controlled unit", "Vehicle or business storage", "Comparing facilities"]],
  "junk-removal": ["What best describes your junk removal need?", ["Single-item pickup", "Move-out or estate cleanout", "Construction debris", "Recurring commercial removal", "Donation or recycling priority"]],
  "car-wash-and-detailing": ["What best describes your car wash or detailing usage?", ["Weekly or monthly wash", "Occasional detail", "Membership plan", "Seasonal deep detail", "Fleet or multiple vehicles"]],
  "towing": ["What best describes your towing or roadside need?", ["Emergency roadside assistance", "Accident or breakdown tow", "Vehicle transport", "Fleet, impound, or municipal call", "Comparing providers"]],
  "veterinary": ["What best describes your veterinary care pattern?", ["Annual wellness visit", "Urgent or sick visit", "Chronic or ongoing care", "Surgery or dental care", "New pet or specialty care"]],
  "physical-therapy": ["What best describes your physical therapy need?", ["Weekly treatment plan", "Post-surgery rehab", "Injury flare-up", "Performance or prevention", "Evaluation only"]],
  "chiropractic": ["What best describes your chiropractic care pattern?", ["Regular ongoing care", "Flare-up visits", "Package or membership plan", "Wellness or prevention", "Evaluation only"]],
  "senior-home-care": ["What best describes your senior home care need?", ["Recurring hourly care", "Long shifts or live-in care", "Post-hospital support", "Dementia or specialty care", "Evaluating options"]],
  "childcare": ["What best describes your childcare need?", ["Full-time care", "Part-time or after-school care", "Summer camp or enrichment", "Backup care", "Evaluating options"]],
  "fitness-gyms": ["What best describes your gym or fitness usage?", ["Active gym membership", "Personal training or classes", "Short-term challenge or program", "Corporate or family plan", "Evaluating options"]],
  "restaurants": ["What best describes your restaurant usage?", ["Weekly dining or takeout", "Monthly dining or takeout", "Special occasions", "Catering or private event", "Delivery-focused use"]],
  "coffee-shops": ["What best describes your coffee shop usage?", ["Daily or weekly drinks", "Occasional visits", "Food or meetings", "Beans, subscription, or retail", "Catering or office orders"]],
  "breweries": ["What best describes your brewery usage?", ["Taproom visits", "Packaged beer purchases", "Events or private parties", "Membership or mug club", "Occasional visits"]],
  "hotels": ["What best describes your hotel usage?", ["Leisure travel", "Business travel", "Extended stay", "Group or event stay", "Comparing options"]],
  "event-venues": ["What best describes your event venue need?", ["Wedding", "Corporate event", "Private party", "Community or fundraiser event", "Planning or quote shopping"]],
  "property-management": ["What best describes your property management need?", ["Rental owner using management", "Tenant or resident experience", "HOA or association management", "Short-term rental management", "Evaluating options"]],
  "real-estate-brokerages": ["What best describes your real estate brokerage need?", ["Buying or selling now", "Planning to move soon", "Investor transaction", "Valuation or referral need", "Monitoring the market"]],
  "mortgage-brokers": ["What best describes your mortgage need?", ["Active purchase or refinance", "Preapproval", "Rate shopping", "Investor or second-home loan", "Not currently active"]],
  "insurance-agencies": ["What best describes your insurance agency need?", ["Annual policy renewal", "Claim or service issue", "New policy shopping", "Business coverage", "Life, health, or benefits"]],
  "accounting-and-tax": ["What best describes your accounting or tax need?", ["Annual tax filing", "Bookkeeping or payroll", "Advisory or CFO support", "Audit, cleanup, or catch-up work", "Evaluating options"]],
  "legal-services": ["What best describes your legal service need?", ["Active legal matter", "Planning documents", "Business counsel", "Claim or dispute", "Evaluating options"]],
  "it-managed-services": ["What best describes your IT managed services need?", ["Monthly managed IT", "Project or security upgrade", "Help desk or urgent issue", "Compliance or vCIO support", "Evaluating vendors"]],
  "digital-marketing-agencies": ["What best describes your agency need?", ["Monthly retainer", "Campaign or project", "Website build", "Audit or strategy", "Evaluating agencies"]],
  "staffing-agencies": ["What best describes your staffing agency need?", ["Temporary staffing", "Temp-to-perm hiring", "Seasonal surge hiring", "Hard-to-fill role", "Evaluating vendors"]],
  "private-schools-and-tutoring": ["What best describes your private education or tutoring need?", ["K-12 tuition", "Subject tutoring", "Test prep", "Summer or enrichment program", "Evaluating options"]],
};

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) throw new Error("Set TALLY_API_KEY before running.");
  return token;
}

function flatTextFromSchema(schema) {
  if (!Array.isArray(schema)) return "";
  const out = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === "string" && Array.isArray(value[1])) out.push(value[0]);
      else value.forEach(walk);
    } else if (typeof value === "string" && !value.includes("font-weight")) {
      out.push(value);
    }
  };
  walk(schema);
  return out.join("").replace(/\s+/g, " ").trim();
}

function blockText(block) {
  return block.payload?.text || flatTextFromSchema(block.payload?.safeHTMLSchema);
}

function setBlockText(block, text) {
  if (!block.payload) block.payload = {};
  if ("text" in block.payload) block.payload.text = text;
  if ("title" in block.payload) block.payload.title = text;
  if ("safeHTMLSchema" in block.payload) block.payload.safeHTMLSchema = [[text]];
}

async function tally(pathname, { method = "GET", body, token }) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${pathname}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "tally-version": "2025-01-15",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      if (!response.ok) {
        const retryAfter = Number(response.headers.get("retry-after") || "0");
        if ((response.status === 429 || /too many requests/i.test(text)) && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, attempt * 7000)));
          continue;
        }
        throw new Error(`${method} ${pathname} failed ${response.status}: ${text}`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 3500));
    }
  }
  throw lastError;
}

function parseQuestionGroups(blocks) {
  const groups = [];
  let current = null;
  let branch = "shared";
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const text = blockText(block);
    if (block.type === "TITLE" && block.groupType === "QUESTION") {
      if (/In the last 12 months/i.test(text) && /paid for/i.test(text)) branch = "consumer";
      if (/What is your role/i.test(text)) branch = "employee";
      if (/annual revenue|approximate annual revenue/i.test(text)) branch = "owner";
      if (/Your email/i.test(text)) branch = "final";
      current = {
        branch,
        questionIndex: groups.length + 1,
        questionBlockIndex: i,
        questionText: text,
        questionType: "open",
        options: [],
      };
      groups.push(current);
      continue;
    }
    if (!current) continue;
    if (block.type === "LINEAR_SCALE") {
      current.questionType = "scale";
    } else if (["MULTIPLE_CHOICE_OPTION", "DROPDOWN_OPTION", "CHECKBOX_OPTION"].includes(block.type)) {
      current.questionType = block.groupType === "CHECKBOX" ? "multi" : "single";
      current.options.push({
        blockIndex: i,
        optionIndex: current.options.length + 1,
        text,
      });
    }
  }
  return groups;
}

function patchQuestion16(blocks, slug) {
  const config = q16[slug];
  if (!config) throw new Error(`Missing q16 config for ${slug}`);
  const groups = parseQuestionGroups(blocks);
  const group = groups.find((item) => item.questionIndex === 16);
  if (!group) throw new Error(`${slug}: missing question 16`);
  const [questionText, options] = config;
  if (group.options.length !== options.length) {
    throw new Error(`${slug}: question 16 has ${group.options.length} options; expected ${options.length}`);
  }
  setBlockText(blocks[group.questionBlockIndex], questionText);
  group.options.forEach((option, i) => setBlockText(blocks[option.blockIndex], options[i]));
  return { before: group.questionText, after: questionText, optionCount: options.length };
}

function optionStatus(group, option, wasUpdated) {
  if (!option.text?.trim()) return ["Needs Fix", "Empty option text."];
  if (/\{[A-Za-z0-9_-]+\}/.test(option.text)) return ["Needs Fix", "Contains placeholder tag."];
  if (wasUpdated) return ["Updated", "Question 16 was rewritten with industry-specific wording and options."];
  if (/^Other$/i.test(option.text)) return ["OK", "Generic fallback option; normal for survey completion."];
  if (/^Not sure$/i.test(option.text)) return ["OK", "Uncertainty option; normal for business/price questions."];
  return ["OK", "Reviewed against current form wording."];
}

function auditRows(industryName, formId, groups, updatedQuestionIndex) {
  const rows = [];
  for (const group of groups) {
    if (!group.options.length) {
      rows.push([
        industryName,
        formId,
        group.branch,
        group.questionIndex,
        group.questionType,
        group.questionText,
        "",
        "",
        "No Options",
        "Open text or scale question; no answer options to review.",
      ]);
      continue;
    }
    for (const option of group.options) {
      const [status, note] = optionStatus(group, option, group.questionIndex === updatedQuestionIndex);
      rows.push([
        industryName,
        formId,
        group.branch,
        group.questionIndex,
        group.questionType,
        group.questionText,
        option.optionIndex,
        option.text,
        status,
        note,
      ]);
    }
  }
  return rows;
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleSheet(sheet, range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF" } };
  sheet.freezePanes.freezeRows(1);
  sheet.getRange("A:A").format.columnWidthPx = 185;
  sheet.getRange("B:B").format.columnWidthPx = 85;
  sheet.getRange("C:C").format.columnWidthPx = 90;
  sheet.getRange("D:D").format.columnWidthPx = 80;
  sheet.getRange("E:E").format.columnWidthPx = 95;
  sheet.getRange("F:F").format.columnWidthPx = 390;
  sheet.getRange("G:G").format.columnWidthPx = 80;
  sheet.getRange("H:H").format.columnWidthPx = 260;
  sheet.getRange("I:I").format.columnWidthPx = 95;
  sheet.getRange("J:J").format.columnWidthPx = 330;
}

async function main() {
  const token = requireToken();
  const applyUpdates = process.env.APPLY_TALLY_UPDATES !== "0";
  const allRows = [];
  const patchSummary = [];

  for (const [industryName, slug, formId] of forms) {
    const form = await tally(`/forms/${formId}`, { token });
    let summary = { before: "", after: "", optionCount: 0 };
    if (applyUpdates) {
      summary = patchQuestion16(form.blocks, slug);
      await tally(`/forms/${formId}`, {
        method: "PATCH",
        token,
        body: {
          name: form.name,
          status: "PUBLISHED",
          settings: form.settings,
          blocks: form.blocks,
        },
      });
    }
    const groups = parseQuestionGroups(form.blocks);
    if (!applyUpdates) {
      const currentQ16 = groups.find((item) => item.questionIndex === 16);
      summary = {
        before: currentQ16?.questionText || "",
        after: currentQ16?.questionText || "",
        optionCount: currentQ16?.options.length || 0,
      };
    }
    allRows.push(...auditRows(industryName, formId, groups, applyUpdates ? 16 : -1));
    patchSummary.push(`${industryName}: ${applyUpdates ? "updated" : "reviewed"} q16 (${summary.optionCount || 0} options)`);
    console.log(patchSummary.at(-1));
  }

  const headers = [
    "industry",
    "form_id",
    "branch",
    "question_order",
    "question_type",
    "question_text",
    "option_order",
    "option_text",
    "status",
    "review_note",
  ];

  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Answer Option Audit");
  sheet.showGridLines = false;
  const range = writeMatrix(sheet, 0, 0, [headers, ...allRows]);
  styleSheet(sheet, range);
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 20 },
  });
  if (!errors.ndjson.includes("matched 0")) throw new Error(errors.ndjson);

  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  await fs.writeFile(path.join(outputDir, "QUESTION16_PATCH_SUMMARY.txt"), `${patchSummary.join("\n")}\n`, "utf8");
  console.log(`wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
