#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const API_BASE = "https://api.tally.so";
const TOTAL_N = 599;
const CONSUMER_N = 419;
const EMPLOYEE_N = 90;
const OWNER_N = 90;
const outputRoot = path.join("outputs", "remaining_49_tally_forecasts");
const baselineCsvPath = "LANDSCAPING_TALLY_599_FORECAST.csv";

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

const branchInfo = {
  shared: { section: "Shared Screener And Market Profile", n: TOTAL_N },
  consumer: { section: "Consumer Forecast - n=419", n: CONSUMER_N },
  employee: { section: "Employee Forecast - n=90", n: EMPLOYEE_N },
  owner: { section: "Owner/Operator Forecast - n=90", n: OWNER_N },
};

function requireToken() {
  const token = process.env.TALLY_API_KEY;
  if (!token) throw new Error("Set TALLY_API_KEY before running.");
  return token;
}

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seedText) {
  let a = hashString(seedText);
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function toCsv(rows) {
  const headers = ["section", "question", "denominator_n", "answer", "count", "percent", "value", "notes", "row_type"];
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\r\n") + "\r\n";
}

function asNumber(value) {
  if (!value) return 0;
  const n = Number(String(value).replace(/[$,%+]/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function pct(count, n) {
  return `${(count / n * 100).toFixed(1)}%`;
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
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`GET ${pathname} failed ${response.status}: ${text}`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function parseFormGroups(form) {
  const groups = [];
  let current = null;
  let branch = "shared";
  for (const block of form.blocks || []) {
    const text = blockText(block);
    if (block.type === "TITLE" && block.groupType === "QUESTION") {
      if (/In the last 12 months/i.test(text)) branch = "consumer";
      if (/What is your role/i.test(text)) branch = "employee";
      if (/approximate annual revenue/i.test(text)) branch = "owner";
      if (/Your email/i.test(text)) branch = "final";
      current = { branch, question: text, type: "open", options: [] };
      groups.push(current);
      continue;
    }
    if (!current) continue;
    if (["MULTIPLE_CHOICE_OPTION", "DROPDOWN_OPTION", "CHECKBOX_OPTION"].includes(block.type)) {
      current.options.push(text);
      current.type = block.groupType === "CHECKBOX" ? "multi" : "single";
    } else if (block.type === "LINEAR_SCALE") {
      current.type = "scale";
    }
  }
  return groups.filter((group) => group.branch !== "final");
}

function loadBaseline() {
  const csvText = awaitableReadBaseline;
  const parsed = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const headers = parsed[0];
  const records = parsed.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] || ""])));
  const bySection = {};
  for (const record of records) {
    if (record.row_type !== "forecast" && record.row_type !== "metric") continue;
    const section = record.section;
    bySection[section] ||= [];
    let group = bySection[section].find((item) => item.question === record.question);
    if (!group) {
      group = { question: record.question, rows: [], metrics: [] };
      bySection[section].push(group);
    }
    if (record.row_type === "metric") group.metrics.push(record);
    else group.rows.push(record);
  }
  return {
    shared: bySection["Shared Screener And Market Profile"] || [],
    consumer: bySection["Consumer Forecast - n=419"] || [],
    employee: bySection["Employee Forecast - n=90"] || [],
    owner: bySection["Owner/Operator Forecast - n=90"] || [],
  };
}

let awaitableReadBaseline = "";

function fitProbs(baseRows, optionCount) {
  const source = baseRows?.length ? baseRows.map((r) => asNumber(r.count)) : [];
  let probs;
  if (source.length) {
    probs = source.map((count) => count / source.reduce((sum, x) => sum + x, 0));
  } else {
    probs = Array.from({ length: optionCount }, () => 1 / optionCount);
  }
  if (probs.length > optionCount) probs = probs.slice(0, optionCount);
  while (probs.length < optionCount) probs.push(Math.max(0.03, 1 / optionCount * 0.45));
  const total = probs.reduce((sum, x) => sum + x, 0);
  return probs.map((x) => x / total);
}

function jitterProbs(baseProbs, seedText, maxDelta = 0.12) {
  const random = rng(seedText);
  const jittered = baseProbs.map((p) => {
    const factor = 1 + (random() * 2 - 1) * maxDelta;
    const additive = (random() * 2 - 1) * 0.012;
    return Math.max(0.015, p * factor + additive);
  });
  const total = jittered.reduce((sum, x) => sum + x, 0);
  return jittered.map((x) => x / total);
}

function countsFromProbs(probs, n) {
  const raw = probs.map((p) => p * n);
  const floors = raw.map(Math.floor);
  let remaining = n - floors.reduce((sum, x) => sum + x, 0);
  const order = raw.map((value, i) => ({ i, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac);
  for (let j = 0; j < remaining; j += 1) floors[order[j % order.length].i] += 1;
  return floors;
}

function addRow(rows, section, question, denominator, answer = "", count = "", percent = "", value = "", notes = "", rowType = "forecast") {
  rows.push({
    section,
    question,
    denominator_n: denominator,
    answer,
    count,
    percent,
    value,
    notes,
    row_type: rowType,
  });
}

function metricFromScaleCounts(counts) {
  const mids = [1.8, 5.2, 7.5, 9.4];
  const n = counts.reduce((sum, x) => sum + x, 0);
  const mean = counts.reduce((sum, count, i) => sum + count * mids[i], 0) / n;
  return `${mean.toFixed(1)} / 10`;
}

function buildForecast(formMeta, formGroups, baseline, industryName, slug) {
  const rows = [];
  const groupsByBranch = {
    shared: formGroups.filter((g) => g.branch === "shared"),
    consumer: formGroups.filter((g) => g.branch === "consumer"),
    employee: formGroups.filter((g) => g.branch === "employee"),
    owner: formGroups.filter((g) => g.branch === "owner"),
  };

  addRow(rows, "Assumptions", "Respondent mix", TOTAL_N, "Consumers", CONSUMER_N, pct(CONSUMER_N, TOTAL_N));
  addRow(rows, "Assumptions", "Respondent mix", TOTAL_N, "Employees", EMPLOYEE_N, pct(EMPLOYEE_N, TOTAL_N));
  addRow(rows, "Assumptions", "Respondent mix", TOTAL_N, "Owners/operators", OWNER_N, pct(OWNER_N, TOTAL_N));
  addRow(rows, "Assumptions", "Respondent mix", TOTAL_N, "Total completed responses", TOTAL_N, "100.0%");

  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", `Modeled prediction for ${formMeta.url}; this is not collected survey data.`, "note");
  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", "A deterministic bounded random delta is applied per industry and question so each forecast varies without drifting far from the baseline.", "note");
  addRow(rows, "Form Review", "Form Review", "", "", "", "", "", "Checkbox questions show % selecting, so totals can exceed 100%.", "note");

  const sharedRespondent = groupsByBranch.shared.find((g) => /consumer, employee/i.test(g.question));
  if (sharedRespondent) addRespondentMixForecast(rows, sharedRespondent);
  addRow(rows, branchInfo.shared.section, "ZIP code market profile", TOTAL_N, "Suburban and exurban ZIP codes", 371, "61.9%", "", "ZIP codes are not individually forecast.", "forecast");
  addRow(rows, branchInfo.shared.section, "ZIP code market profile", TOTAL_N, "Urban ZIP codes", 151, "25.2%", "", "ZIP codes are not individually forecast.", "forecast");
  addRow(rows, branchInfo.shared.section, "ZIP code market profile", TOTAL_N, "Rural ZIP codes", 77, "12.9%", "", "ZIP codes are not individually forecast.", "forecast");
  const areaGroup = groupsByBranch.shared.find((g) => /describe that area/i.test(g.question));
  if (areaGroup) addOptionForecast(rows, "shared", areaGroup, TOTAL_N, baseline.shared[1], slug, 0.055);
  addOptionForecast(rows, "shared", { question: "Optional Email / Raffle Opt-In", options: ["Leaves email", "Does not leave email"], type: "single" }, TOTAL_N, baseline.shared[2], slug, 0.08);

  for (const branch of ["consumer", "employee", "owner"]) {
    const n = branchInfo[branch].n;
    let templateIndex = 0;
    for (const group of groupsByBranch[branch]) {
      const template = baseline[branch][templateIndex];
      if (/ZIP code/i.test(group.question)) continue;
      if (group.type === "scale") {
        addScaleForecast(rows, branch, group, n, template, slug, templateIndex);
      } else if (group.options.length >= 2) {
        addOptionForecast(rows, branch, group, n, template, slug, 0.11, templateIndex);
      } else if (/made you switch/i.test(group.question)) {
        const switchTemplate = baseline.consumer.find((item) => /What Made Switchers/i.test(item.question));
        addOptionForecast(rows, branch, {
          question: `${group.question} - Themes`,
          options: switchTemplate.rows.map((r) => r.answer),
          type: "single",
        }, 151, switchTemplate, slug, 0.10, templateIndex);
      }
      templateIndex += 1;
    }
  }

  addNarrative(rows, industryName, slug);
  return rows;
}

function addRespondentMixForecast(rows, group) {
  const counts = group.options.map((answer) => {
    if (/consumer/i.test(answer)) return CONSUMER_N;
    if (/employee/i.test(answer)) return EMPLOYEE_N;
    if (/owner|executive/i.test(answer)) return OWNER_N;
    return 0;
  });
  const missing = TOTAL_N - counts.reduce((sum, value) => sum + value, 0);
  if (missing !== 0 && counts.length) counts[counts.length - 1] += missing;
  group.options.forEach((answer, i) => {
    addRow(rows, branchInfo.shared.section, group.question, TOTAL_N, answer, counts[i], pct(counts[i], TOTAL_N));
  });
}

function addOptionForecast(rows, branch, group, n, template, slug, jitter = 0.10, index = 0) {
  const section = branchInfo[branch].section;
  const options = group.options;
  const baseProbs = fitProbs(template?.rows, options.length);
  const probs = jitterProbs(baseProbs, `${slug}:${branch}:${index}:${group.question}`, jitter);
  if (group.type === "multi") {
    const baselineRates = fitProbs(template?.rows, options.length).map((p) => Math.min(0.88, Math.max(0.08, p * options.length * 0.45)));
    const random = rng(`${slug}:multi:${group.question}`);
    options.forEach((answer, i) => {
      const rate = Math.min(0.88, Math.max(0.06, baselineRates[i] + (random() * 2 - 1) * 0.055));
      const count = Math.round(rate * n);
      addRow(rows, section, `${group.question} - Multi-Select`, n, answer, count, pct(count, n));
    });
    return;
  }
  const counts = countsFromProbs(probs, n);
  options.forEach((answer, i) => addRow(rows, section, group.question, n, answer, counts[i], pct(counts[i], n)));
}

function addScaleForecast(rows, branch, group, n, template, slug, index) {
  const section = branchInfo[branch].section;
  const bands = ["0-3", "4-6", "7-8", "9-10"];
  const baseRows = template?.rows?.length === 4 ? template.rows : bands.map((answer) => ({ answer, count: 1 }));
  const probs = jitterProbs(fitProbs(baseRows, 4), `${slug}:scale:${branch}:${index}:${group.question}`, 0.10);
  const counts = countsFromProbs(probs, n);
  addRow(rows, section, group.question, n, "Predicted mean", "", "", metricFromScaleCounts(counts), "", "metric");
  bands.forEach((answer, i) => addRow(rows, section, group.question, n, answer, counts[i], pct(counts[i], n)));
}

function addNarrative(rows, industryName, slug) {
  const random = rng(`${slug}:narrative`);
  const pressure = random() > 0.5 ? "pricing discipline" : "service reliability";
  addRow(rows, "Likely Sherlock Report Narrative", "Demand signal", "", "", "", "", "", `${industryName} demand should look healthy but selective, with consumers rewarding providers that are easy to find, responsive, and trusted locally.`, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Pricing power", "", "", "", "", "", `The forecast should show some pricing power, but increases need to be paired with ${pressure}, clearer packaging, and strong communication.`, "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Labor risk", "", "", "", "", "", "Employee and owner responses should point to labor availability, retention, training, and scheduling as meaningful growth constraints.", "narrative");
  addRow(rows, "Likely Sherlock Report Narrative", "Operator actions", "", "", "", "", "", "Prioritize local search, referrals, review generation, recurring revenue, and employee retention before pushing broad price increases.", "narrative");
}

function validateRows(rows, industryName) {
  const groups = new Map();
  for (const row of rows) {
    if (row.row_type !== "forecast") continue;
    if (row.section === "Assumptions") continue;
    if (row.question.includes(" - Multi-Select")) continue;
    if (!row.denominator_n || !row.count) continue;
    if (row.answer === "Total completed responses") continue;
    const key = `${row.section}|||${row.question}|||${row.denominator_n}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const issues = [];
  for (const [key, groupRows] of groups.entries()) {
    if (groupRows.length < 2) continue;
    const denominator = Number(groupRows[0].denominator_n);
    const sum = groupRows.reduce((total, row) => total + Number(row.count), 0);
    if (Number.isFinite(denominator) && sum !== denominator) {
      const [, question] = key.split("|||");
      issues.push(`${industryName}: ${question} sums to ${sum}, expected ${denominator}`);
    }
  }
  return issues;
}

function markdownTable(records) {
  if (!records.length) return "";
  return [
    "| Answer | Count | Share | Value | Notes |",
    "|---|---:|---:|---|---|",
    ...records.map((r) => `| ${r.answer || ""} | ${r.count || ""} | ${r.percent || ""} | ${r.value || ""} | ${r.notes || ""} |`),
  ].join("\n");
}

function writeMarkdown(industryName, formId, rows) {
  const sections = [...new Set(rows.map((r) => r.section))];
  const lines = [
    `# ${industryName} Tally Forecast - 599 Modeled Responses`,
    "",
    `This is a modeled prediction, not collected survey data. It forecasts likely responses for the live ${industryName} form at \`https://tally.so/r/${formId}\`.`,
    "",
  ];
  for (const section of sections) {
    lines.push(`## ${section}`, "");
    const sectionRows = rows.filter((r) => r.section === section);
    const questions = [...new Set(sectionRows.map((r) => r.question))];
    for (const question of questions) {
      const qRows = sectionRows.filter((r) => r.question === question);
      if (sectionRows.length > 1 || question !== section) lines.push(`### ${question}`, "");
      if (qRows.every((r) => r.row_type === "note" || r.row_type === "narrative")) {
        qRows.forEach((r) => lines.push(`- ${r.notes}`));
      } else {
        lines.push(markdownTable(qRows), "");
      }
      lines.push("");
    }
  }
  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function safeSheetName(name) {
  return name.slice(0, 31).replace(/[\\/?*[\]:]/g, " ");
}

function chartSection(section) {
  if (section.startsWith("Shared")) return "Shared Charts";
  if (section.startsWith("Consumer")) return "Consumer Charts";
  if (section.startsWith("Employee")) return "Employee Charts";
  if (section.startsWith("Owner")) return "Owner Charts";
  return "Other Charts";
}

function addTitle(sheet, title, subtitle = "") {
  sheet.getRange("A1:M1").merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 } };
  sheet.getRange("A2:M2").merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = { fill: "#EAF2F8", font: { color: "#17324D", italic: true } };
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleTable(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = { fill: "#D9EAF7", font: { bold: true, color: "#102A43" } };
}

function chartBlocks(rows) {
  const byQuestion = new Map();
  const metrics = new Map();
  for (const row of rows) {
    const key = `${row.section}|||${row.question}`;
    if (row.row_type === "metric") {
      metrics.set(key, `${row.answer}: ${row.value}`);
      continue;
    }
    if (row.row_type !== "forecast" || !row.count || row.answer === "Total completed responses") continue;
    if (!byQuestion.has(key)) byQuestion.set(key, { section: row.section, question: row.question, rows: [] });
    byQuestion.get(key).rows.push(row);
  }
  return [...byQuestion.entries()].map(([key, block]) => ({ ...block, metric: metrics.get(key) || "" })).filter((b) => b.rows.length >= 2);
}

function addQuestionChart(sheet, block, startRow, chartRow) {
  const title = `${block.question.slice(0, 75)}${block.metric ? ` (${block.metric})` : ""}`;
  const source = writeMatrix(sheet, startRow, 0, [["Answer", "Count"], ...block.rows.map((r) => [r.answer, Number(r.count)])]);
  styleTable(source);
  sheet.getRangeByIndexes(startRow, 0, block.rows.length + 1, 1).format.columnWidthPx = 220;
  const chart = sheet.charts.add("bar", source);
  chart.title = title;
  chart.hasLegend = false;
  chart.xAxis = { axisType: "textAxis" };
  chart.yAxis = { numberFormatCode: "#,##0" };
  chart.setPosition(`D${chartRow}`, `M${chartRow + 15}`);
}

async function writeWorkbook(industryName, rows, outDir, slug, renderPreview = false) {
  const workbook = Workbook.create();
  const blocks = chartBlocks(rows);

  const dashboard = workbook.worksheets.add("Dashboard");
  dashboard.showGridLines = false;
  addTitle(dashboard, `${industryName} Forecast Charts`, "Modeled results for 599 responses with bounded industry-specific random deltas.");
  const kpis = [["Metric", "Value"], ["Total responses", TOTAL_N], ["Consumers", CONSUMER_N], ["Employees", EMPLOYEE_N], ["Owners/operators", OWNER_N]];
  const kpiRange = writeMatrix(dashboard, 4, 0, kpis);
  styleTable(kpiRange);
  dashboard.getRange("A:B").format.columnWidthPx = 185;
  let helperRow = 12;
  const featured = blocks.filter((b) => ["Respondent Type", "Area Type"].includes(b.question) || /Purchase|Price Increase|Challenge|Raise Prices/i.test(b.question)).slice(0, 6);
  featured.forEach((block, i) => {
    const source = writeMatrix(dashboard, helperRow, 0, [["Answer", "Count"], ...block.rows.map((r) => [r.answer, Number(r.count)])]);
    styleTable(source);
    const chart = dashboard.charts.add("bar", source);
    chart.title = block.question.slice(0, 70);
    chart.hasLegend = false;
    chart.xAxis = { axisType: "textAxis" };
    chart.yAxis = { numberFormatCode: "#,##0" };
    const left = i % 2 === 0 ? "E" : "J";
    const right = i % 2 === 0 ? "I" : "N";
    const row = i < 2 ? 4 : i < 4 ? 22 : 40;
    chart.setPosition(`${left}${row}`, `${right}${row + 14}`);
    helperRow += Math.max(block.rows.length + 2, 7);
  });

  const data = workbook.worksheets.add("Forecast Data");
  data.showGridLines = false;
  const headers = ["section", "question", "denominator_n", "answer", "count", "percent", "value", "notes", "row_type"];
  const sourceRange = writeMatrix(data, 0, 0, [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]);
  styleTable(sourceRange);
  data.freezePanes.freezeRows(1);
  data.getRange("A:I").format.columnWidthPx = 145;
  data.getRange("B:B").format.columnWidthPx = 260;
  data.getRange("D:D").format.columnWidthPx = 220;
  data.getRange("H:H").format.columnWidthPx = 360;

  const grouped = new Map();
  blocks.forEach((block) => {
    const sheetName = chartSection(block.section);
    if (!grouped.has(sheetName)) grouped.set(sheetName, []);
    grouped.get(sheetName).push(block);
  });
  for (const [sheetName, sheetBlocks] of grouped.entries()) {
    const sheet = workbook.worksheets.add(safeSheetName(sheetName));
    sheet.showGridLines = false;
    addTitle(sheet, sheetName, "Each chart plots modeled respondent counts; source mini-tables are shown at left.");
    let startRow = 4;
    for (const block of sheetBlocks) {
      addQuestionChart(sheet, block, startRow, startRow + 1);
      startRow += Math.max(18, block.rows.length + 4);
    }
    sheet.getRange("A:B").format.columnWidthPx = 220;
  }

  const notes = workbook.worksheets.add("Notes");
  notes.showGridLines = false;
  addTitle(notes, "Notes", "Forecast interpretation notes.");
  const noteRows = rows.filter((r) => r.row_type === "note" || r.row_type === "narrative").map((r) => [r.section, r.question, r.notes]);
  const notesRange = writeMatrix(notes, 4, 0, [["Section", "Topic", "Note"], ...noteRows]);
  styleTable(notesRange);
  notes.getRange("A:A").format.columnWidthPx = 210;
  notes.getRange("B:B").format.columnWidthPx = 220;
  notes.getRange("C:C").format.columnWidthPx = 620;

  const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 20 } });
  if (!errors.ndjson.includes("matched 0")) console.log(errors.ndjson);

  if (renderPreview) {
    for (const sheetName of ["Dashboard", "Consumer Charts", "Owner Charts"]) {
      const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
      await fs.writeFile(path.join(outDir, `${slug}_${sheetName.replaceAll(" ", "_")}.png`), new Uint8Array(await preview.arrayBuffer()));
    }
  }

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outDir, `${slug.toUpperCase()}_TALLY_599_FORECAST_CHARTS.xlsx`));
}

async function main() {
  const token = requireToken();
  awaitableReadBaseline = await fs.readFile(baselineCsvPath, "utf8");
  const baseline = loadBaseline();
  const start = Number(process.env.BATCH_START || "0");
  const limit = Number(process.env.BATCH_LIMIT || String(forms.length));
  const selected = forms.slice(start, start + limit);
  await fs.mkdir(outputRoot, { recursive: true });
  const indexRows = [];

  for (let i = 0; i < selected.length; i += 1) {
    const [industryName, slug, formId] = selected[i];
    const form = await tally(`/forms/${formId}`, token);
    const groups = parseFormGroups(form);
    const rows = buildForecast({ url: `https://tally.so/r/${formId}` }, groups, baseline, industryName, slug);
    const validationIssues = validateRows(rows, industryName);
    if (validationIssues.length) throw new Error(validationIssues.slice(0, 8).join("\n"));
    const outDir = path.join(outputRoot, slug);
    await fs.mkdir(outDir, { recursive: true });
    const mdPath = path.join(outDir, `${slug.toUpperCase()}_TALLY_599_FORECAST.md`);
    const csvPath = path.join(outDir, `${slug.toUpperCase()}_TALLY_599_FORECAST.csv`);
    await fs.writeFile(mdPath, writeMarkdown(industryName, formId, rows), "utf8");
    await fs.writeFile(csvPath, toCsv(rows), "utf8");
    await writeWorkbook(industryName, rows, outDir, slug, i === 0 && start === 0);
    indexRows.push({ industryName, slug, formId, outDir });
    console.log(`${start + i + 1}/${forms.length} ${industryName}: forecast, csv, charts`);
  }

  const indexPath = path.join(outputRoot, `INDEX_${start}_${start + selected.length - 1}.md`);
  const index = [
    "# Remaining Tally Forecast Batch",
    "",
    "| Industry | Public form | Output folder |",
    "|---|---|---|",
    ...indexRows.map((r) => `| ${r.industryName} | https://tally.so/r/${r.formId} | ${r.outDir.replaceAll("\\", "/")} |`),
    "",
  ].join("\n");
  await fs.writeFile(indexPath, index, "utf8");
  console.log(`wrote ${indexPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
