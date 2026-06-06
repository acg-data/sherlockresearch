#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://api.tally.so";
const outputDir = path.join("outputs", "tally_generalist_question_patch");
const outputPath = path.join(outputDir, "GENERALIST_QUESTION_PATCH_SUMMARY.txt");

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

const vehicleSlugs = new Set(["auto-repair", "car-wash-and-detailing", "towing", "moving"]);
const careSlugs = new Set([
  "dental",
  "dermatology",
  "med-spa",
  "veterinary",
  "physical-therapy",
  "chiropractic",
  "senior-home-care",
  "childcare",
  "fitness-gyms",
  "private-schools-and-tutoring",
]);
const hospitalitySlugs = new Set(["restaurants", "coffee-shops", "breweries", "hotels", "event-venues"]);
const professionalSlugs = new Set([
  "property-management",
  "real-estate-brokerages",
  "mortgage-brokers",
  "insurance-agencies",
  "accounting-and-tax",
  "legal-services",
  "it-managed-services",
  "digital-marketing-agencies",
  "staffing-agencies",
]);
const hospitalityOwnerSegments = new Set(["restaurants", "coffee-shops", "breweries"]);
const autoOwnerSegments = new Set(["auto-repair", "car-wash-and-detailing", "towing", "moving", "self-storage"]);
const educationOwnerSegments = new Set(["childcare", "private-schools-and-tutoring"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) throw new Error("Set TALLY_API_KEY before running.");
  return token;
}

function serviceLabel(industryName) {
  return industryName
    .replace("Kitchen and Bath Remodeling", "kitchen or bath remodeling")
    .replace("Car Wash and Detailing", "car wash or detailing")
    .replace("Windows and Doors", "window or door")
    .replace("Accounting and Tax", "accounting or tax")
    .replace("Private Schools and Tutoring", "private education or tutoring")
    .toLowerCase();
}

function providerLabel(industryName) {
  return serviceLabel(industryName);
}

function consumerContextQuestion(industryName, slug) {
  const service = serviceLabel(industryName);
  if (vehicleSlugs.has(slug)) {
    return {
      question: `What best describes the vehicle or account tied to this ${service} need?`,
      options: ["Personal vehicle", "Family or shared vehicle", "Business or fleet vehicle", "Rented or borrowed vehicle", "Not applicable"],
    };
  }
  if (careSlugs.has(slug)) {
    return {
      question: `Who is this ${service} usually for?`,
      options: ["Myself", "Spouse or partner", "Child or dependent", "Parent or another family member", "Employer, insurer, or organization"],
    };
  }
  if (hospitalitySlugs.has(slug)) {
    return {
      question: `What best describes the occasion or buyer for this ${service} purchase?`,
      options: ["Personal or household use", "Family or social occasion", "Work or business use", "Group or event use", "Not applicable"],
    };
  }
  if (professionalSlugs.has(slug)) {
    return {
      question: `What best describes how you use ${service} services?`,
      options: ["Personal or household need", "For my own business", "For my employer", "For clients or properties I manage", "Researching or comparing options"],
    };
  }
  return {
    question: `What best describes the property tied to this ${service} need?`,
    options: ["I own the property", "I rent or lease the property", "I manage it for someone else", "It is for a business or commercial property", "Not property-related or not applicable"],
  };
}

function decisionMakerQuestion(industryName, slug) {
  const service = providerLabel(industryName);
  if (careSlugs.has(slug)) {
    return {
      question: `Who usually makes the final decision on choosing a ${service} provider?`,
      options: ["Me", "Spouse, partner, or family member", "Parent, caregiver, or guardian", "Shared decision", "Insurer, employer, or referring provider"],
    };
  }
  if (professionalSlugs.has(slug)) {
    return {
      question: `Who usually makes the final decision on hiring a ${service} provider?`,
      options: ["Me", "Business owner or executive", "Manager or team lead", "Shared committee or team", "Client, advisor, or third party"],
    };
  }
  return {
    question: `Who usually makes the final decision on hiring a ${service} provider?`,
    options: ["Me", "Spouse, partner, or family member", "Shared decision", "Employer or business partner", "Property manager, advisor, or third party"],
  };
}

function urgencyQuestion(industryName, slug) {
  const service = serviceLabel(industryName);
  if (hospitalitySlugs.has(slug)) {
    return {
      question: `How planned was your most recent ${service} purchase?`,
      options: ["Same-day or impulse", "Planned within a week", "Planned within a month", "Special occasion or event", "Browsing or comparing only"],
    };
  }
  return {
    question: `How urgent was your most recent ${service} need?`,
    options: ["Emergency or same-day", "Needed within a week", "Planned within a month", "Longer-term planning", "Browsing or comparing only"],
  };
}

function valuePreferenceQuestion(industryName) {
  return {
    question: `Which best describes your value preference when choosing a ${providerLabel(industryName)} provider?`,
    options: ["Lowest available price", "Slightly lower price", "Balanced price and quality", "Higher quality even if it costs more", "Premium provider with guarantees or standout reputation"],
  };
}

function employeeQuestions(industryName) {
  return [
    {
      question: "How satisfied are you with your pay relative to the work?",
      options: ["Very dissatisfied", "Somewhat dissatisfied", "Neutral", "Somewhat satisfied", "Very satisfied"],
    },
    {
      question: "How predictable is your schedule?",
      options: ["Very unpredictable", "Somewhat unpredictable", "Mixed", "Somewhat predictable", "Very predictable"],
    },
    {
      question: "Do you see a realistic path to higher pay or promotion?",
      options: ["No realistic path", "Limited path", "Some path", "Clear path", "Already on track"],
    },
    {
      question: `How likely are you to stay in the ${industryName} industry for the next 2 years?`,
      options: ["Very unlikely", "Somewhat unlikely", "Not sure", "Somewhat likely", "Very likely"],
    },
  ];
}

function profitableSegmentQuestion(slug) {
  if (hospitalityOwnerSegments.has(slug)) {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Regular local guests", "High-ticket dine-in or taproom visits", "Catering, events, or groups", "Delivery or takeout customers", "Retail, wholesale, or membership customers"],
    };
  }
  if (slug === "hotels") {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Leisure travelers", "Corporate travelers", "Extended-stay guests", "Groups or events", "Direct-booking repeat guests"],
    };
  }
  if (slug === "event-venues") {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Weddings", "Corporate events", "Private parties", "Community or nonprofit events", "Repeat planners or partners"],
    };
  }
  if (careSlugs.has(slug)) {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Established recurring patients or clients", "New patients or initial evaluations", "Cash-pay or elective services", "Insurance-based visits", "Specialty or complex cases"],
    };
  }
  if (educationOwnerSegments.has(slug)) {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Full-time families or students", "Part-time or after-school users", "Summer or enrichment programs", "Specialty support or test prep", "Multi-child or long-term families"],
    };
  }
  if (autoOwnerSegments.has(slug)) {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Repeat local customers", "Fleet or commercial accounts", "Membership or contract customers", "Emergency or high-urgency jobs", "Premium or specialty services"],
    };
  }
  if (professionalSlugs.has(slug)) {
    return {
      question: "Which customer segment is most profitable for you?",
      options: ["Small business clients", "Mid-market or larger clients", "High-income households or complex cases", "Recurring retainer or contract clients", "Referral or partner-sourced clients"],
    };
  }
  return {
    question: "Which customer segment is most profitable for you?",
    options: ["Residential homeowners", "Commercial clients", "Property managers or HOAs", "Insurance, warranty, or partner referrals", "Recurring maintenance or contract customers"],
  };
}

function ownerQuestions(slug) {
  return [
    {
      question: "How many years has your business been operating?",
      options: ["Under 1 year", "1-3 years", "4-7 years", "8-15 years", "16+ years"],
    },
    {
      question: "What is your current capacity?",
      options: ["Too slow", "Some open capacity", "About right", "Slightly overbooked", "Severely overbooked"],
    },
    {
      question: "How confident are you in your pricing?",
      options: ["Not confident", "Somewhat confident", "Neutral", "Confident", "Very confident"],
    },
    {
      question: "How often do you review or adjust prices?",
      options: ["Rarely", "Annually", "Twice a year", "Quarterly", "Monthly or as needed"],
    },
    {
      question: "What percentage of qualified leads become paying customers?",
      options: ["Under 10%", "10-24%", "25-49%", "50-74%", "75%+"],
    },
    profitableSegmentQuestion(slug),
  ];
}

function additionsForForm(industryName, slug) {
  return {
    consumer: [
      consumerContextQuestion(industryName, slug),
      decisionMakerQuestion(industryName, slug),
      urgencyQuestion(industryName, slug),
      valuePreferenceQuestion(industryName),
    ],
    employee: employeeQuestions(industryName),
    owner: ownerQuestions(slug),
  };
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
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`${method} ${pathname} failed ${response.status}: ${text}`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
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
      if (current) current.endIndex = i - 1;
      if (/In the last 12 months/i.test(text) && /paid for/i.test(text)) branch = "consumer";
      if (/What is your role/i.test(text)) branch = "employee";
      if (/annual revenue|approximate annual revenue/i.test(text)) branch = "owner";
      if (/Your email/i.test(text)) branch = "final";
      current = {
        branch,
        questionIndex: groups.length + 1,
        questionBlockIndex: i,
        endIndex: blocks.length - 1,
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

function cloneBlocksWithNewUuids(blocks) {
  const cloned = structuredClone(blocks);
  const uuidMap = new Map([...collectUuids(cloned)].map((uuid) => [uuid, crypto.randomUUID()]));
  return deepTransform(cloned, (value) => {
    if (typeof value === "string" && uuidMap.has(value)) return uuidMap.get(value);
    return value;
  });
}

function managedQuestionSet(additions) {
  return new Set(["consumer", "employee", "owner"].flatMap((branch) => additions[branch].map((item) => item.question)));
}

function removeExistingAdditions(blocks, additions) {
  const managed = managedQuestionSet(additions);
  const groups = parseQuestionGroups(blocks);
  const removals = groups
    .filter((group) => managed.has(group.questionText))
    .sort((a, b) => b.questionBlockIndex - a.questionBlockIndex);
  for (const group of removals) {
    blocks.splice(group.questionBlockIndex, group.endIndex - group.questionBlockIndex + 1);
  }
  return removals.length;
}

function findTemplateGroup(blocks) {
  const groups = parseQuestionGroups(blocks);
  return groups.find((group) => group.questionType === "single" && group.options.length === 5 && /best describes/i.test(group.questionText))
    || groups.find((group) => group.questionType === "single" && group.options.length === 5);
}

function makeQuestionBlocks(templateGroupBlocks, addition) {
  const blocks = cloneBlocksWithNewUuids(templateGroupBlocks);
  const title = blocks.find((block) => block.type === "TITLE" && block.groupType === "QUESTION");
  if (!title) throw new Error(`Template group has no question title block for "${addition.question}"`);
  setBlockText(title, addition.question);
  const options = blocks.filter((block) => ["MULTIPLE_CHOICE_OPTION", "DROPDOWN_OPTION", "CHECKBOX_OPTION"].includes(block.type));
  if (options.length !== addition.options.length) {
    throw new Error(`Template option count ${options.length} does not match ${addition.options.length} for "${addition.question}"`);
  }
  options.forEach((block, i) => setBlockText(block, addition.options[i]));
  return blocks;
}

function findInsertions(blocks) {
  const groups = parseQuestionGroups(blocks);
  return {
    consumer: groups.find((group) => /age range/i.test(group.questionText)) || groups.find((group) => /household income/i.test(group.questionText)),
    employee: groups.find((group) => /hourly wage|wage range/i.test(group.questionText)),
    owner: groups.find((group) => /how many employees/i.test(group.questionText)),
  };
}

function insertAdditions(blocks, templateGroup, additions) {
  const templateGroupBlocks = blocks.slice(templateGroup.questionBlockIndex, templateGroup.endIndex + 1);
  const insertionGroups = findInsertions(blocks);
  for (const branch of ["consumer", "employee", "owner"]) {
    if (!insertionGroups[branch]) throw new Error(`Missing ${branch} insertion point.`);
  }

  const insertions = [
    { branch: "owner", afterIndex: insertionGroups.owner.endIndex, questions: additions.owner },
    { branch: "employee", afterIndex: insertionGroups.employee.endIndex, questions: additions.employee },
    { branch: "consumer", afterIndex: insertionGroups.consumer.endIndex, questions: additions.consumer },
  ];

  for (const insertion of insertions) {
    const newBlocks = insertion.questions.flatMap((question) => makeQuestionBlocks(templateGroupBlocks, question));
    blocks.splice(insertion.afterIndex + 1, 0, ...newBlocks);
  }
}

function validateOptions(industryName, groups) {
  const issues = [];
  for (const group of groups) {
    for (const option of group.options) {
      if (!option.text?.trim()) issues.push(`${industryName} q${group.questionIndex}: empty option`);
      if (/\{[A-Za-z0-9_-]+\}/.test(option.text)) issues.push(`${industryName} q${group.questionIndex}: placeholder ${option.text}`);
      if (/\bundefined\b|\bnull\b/i.test(option.text)) issues.push(`${industryName} q${group.questionIndex}: bad token ${option.text}`);
    }
  }
  return issues;
}

async function main() {
  const token = requireToken();
  const applyUpdates = process.env.APPLY_TALLY_UPDATES !== "0";
  const summaries = [];
  const issues = [];

  for (const [industryName, slug, formId] of forms) {
    const form = await tally(`/forms/${formId}`, { token });
    if (!Array.isArray(form.blocks) || !form.blocks.length) throw new Error(`${industryName}: form has no blocks.`);

    const additions = additionsForForm(industryName, slug);
    const removed = removeExistingAdditions(form.blocks, additions);
    const templateGroup = findTemplateGroup(form.blocks);
    if (!templateGroup) throw new Error(`${industryName}: missing 5-option single-select template group.`);

    insertAdditions(form.blocks, templateGroup, additions);

    const groups = parseQuestionGroups(form.blocks);
    issues.push(...validateOptions(industryName, groups));
    const expectedNew = additions.consumer.length + additions.employee.length + additions.owner.length;
    summaries.push(`${industryName}: removed ${removed}, inserted ${expectedNew}, total questions ${groups.length}`);

    if (applyUpdates) {
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
    console.log(summaries.at(-1));
  }

  if (issues.length) {
    throw new Error(`Answer option validation failed:\n${issues.slice(0, 30).join("\n")}`);
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, `${summaries.join("\n")}\n`, "utf8");
  console.log(`${applyUpdates ? "updated" : "dry-run"} ${forms.length} forms`);
  console.log(`wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
