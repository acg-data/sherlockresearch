#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const API_BASE = "https://api.tally.so";
const outputDir = path.join("outputs", "tally_question_matrix");
const outputPath = path.join(outputDir, "SHERLOCK_TALLY_QUESTION_MATRIX.xlsx");

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

async function tally(pathname, token) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${pathname}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "tally-version": "2025-01-15",
        },
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
        throw new Error(`GET ${pathname} failed ${response.status}: ${text}`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 3500));
    }
  }
  throw lastError;
}

function parseQuestions(form) {
  const questions = [];
  let current = null;
  let branch = "shared";
  for (const block of form.blocks || []) {
    const text = blockText(block);
    if (block.type === "TITLE" && block.groupType === "QUESTION") {
      if (/In the last 12 months/i.test(text) && /paid for/i.test(text)) branch = "consumer";
      if (/What is your role/i.test(text)) branch = "employee";
      if (/approximate annual revenue/i.test(text)) branch = "owner";
      if (/Your email/i.test(text)) branch = "final";
      current = {
        branch,
        text,
        question_type: "open",
        optionCount: 0,
      };
      questions.push(current);
      continue;
    }
    if (!current) continue;
    if (block.type === "LINEAR_SCALE") {
      current.question_type = "scale";
    } else if (["MULTIPLE_CHOICE_OPTION", "DROPDOWN_OPTION", "CHECKBOX_OPTION"].includes(block.type)) {
      current.optionCount += 1;
      current.question_type = block.groupType === "CHECKBOX" ? "multi" : "single";
    }
  }
  return questions.map((question, i) => ({ ...question, order: i + 1 }));
}

function collectTextPlaceholders(form) {
  const placeholders = [];
  const inspect = (value) => {
    if (typeof value === "string") {
      const tags = value.match(/\{[A-Za-z0-9_-]+\}/g) || [];
      placeholders.push(...tags);
    } else if (Array.isArray(value)) {
      value.forEach(inspect);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(inspect);
    }
  };
  inspect(form.blocks || []);
  return placeholders;
}

function buildRows(questionSets) {
  const canonical = questionSets.get("landscaping");
  const maxLen = Math.max(...[...questionSets.values()].map((questions) => questions.length));
  const rows = [];

  for (let i = 0; i < maxLen; i += 1) {
    const canonicalQuestion = canonical[i] || [...questionSets.values()].find((questions) => questions[i])?.[i];
    rows.push([
      canonicalQuestion?.branch || "",
      i + 1,
      canonicalQuestion?.question_type || "",
      canonicalQuestion?.text || "",
      ...forms.map(([, slug]) => questionSets.get(slug)?.[i]?.text || ""),
    ]);
  }
  return rows;
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleMatrix(sheet, range, rowCount) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF" } };
  sheet.freezePanes.freezeRows(1);
  sheet.freezePanes.freezeColumns(4);
  sheet.getRange("A:A").format.columnWidthPx = 90;
  sheet.getRange("B:B").format.columnWidthPx = 80;
  sheet.getRange("C:C").format.columnWidthPx = 95;
  sheet.getRange("D:D").format.columnWidthPx = 330;
  sheet.getRange("E:BB").format.columnWidthPx = 270;
  sheet.getRangeByIndexes(1, 0, Math.max(1, rowCount - 1), 3).format.fill = "#F8FBFD";
}

async function main() {
  const token = requireToken();
  const questionSets = new Map();
  const placeholders = [];

  for (const [industryName, slug, formId] of forms) {
    const form = await tally(`/forms/${formId}`, token);
    const questions = parseQuestions(form);
    questionSets.set(slug, questions);
    const tags = collectTextPlaceholders(form);
    tags.forEach((tag) => placeholders.push(`${industryName}: ${tag}`));
    console.log(`${industryName}: ${questions.length} questions`);
  }

  if (placeholders.length) {
    throw new Error(`Found placeholder tags:\n${placeholders.slice(0, 20).join("\n")}`);
  }

  const headers = ["branch", "question_order", "question_type", "canonical_question", ...forms.map(([industryName]) => industryName)];
  const rows = buildRows(questionSets);

  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Question Matrix");
  sheet.showGridLines = false;
  const range = writeMatrix(sheet, 0, 0, [headers, ...rows]);
  styleMatrix(sheet, range, rows.length + 1);

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 20 },
  });
  if (!errors.ndjson.includes("matched 0")) throw new Error(errors.ndjson);

  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  console.log(`wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
