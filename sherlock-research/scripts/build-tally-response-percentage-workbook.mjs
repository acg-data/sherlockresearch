#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputRoot = process.env.TALLY_RESPONSE_INPUT_ROOT || path.join("outputs", "remaining_49_tally_forecasts_variable_n");
const outputDir = process.env.TALLY_RESPONSE_OUTPUT_DIR || path.join("outputs", "tally_response_percentages");
const outputPath = path.join(outputDir, process.env.TALLY_RESPONSE_WORKBOOK_NAME || "SHERLOCK_TALLY_RESPONSE_PERCENTAGES.xlsx");

const promptPath = path.join(outputDir, "SHERLOCK_HYPER_REALISTIC_US_POPULATION_PROMPT.md");

const promptText = `# Sherlock Tally Forecast Prompt

You are modeling realistic response distributions for Sherlock Reports Tally market-survey forms. Produce deterministic, analyst-estimated results for a broad United States respondent population, not random-looking filler and not perfect symmetry.

## Population Frame
- Assume a geographically diverse US sample with suburban overrepresentation, meaningful urban representation, and smaller rural representation.
- Include variation by region, market maturity, household income, age, property ownership, urgency, business density, labor market tightness, and local competition.
- Treat each industry as economically distinct. Do not reuse the same distribution shape across industries unless the buyer behavior is genuinely similar.
- Use a randomized completed-response count with total n greater than 500 and less than 1,000.
- Split respondents into consumers, employees, and owners/operators based on realistic industry exposure. Consumer-heavy industries should have larger consumer shares; B2B or owner-led industries can have higher owner/operator representation, but avoid extreme branch splits.

## Forecast Rules
- Shared screener and market-profile questions use total n.
- Consumer questions use consumer n only.
- Employee questions use employee n only.
- Owner/operator questions use owner/operator n only.
- Single-select answer counts must sum exactly to the correct denominator.
- Multi-select answer totals may exceed 100%; label them as "% selecting."
- Scale questions should include a predicted mean and grouped percentage bands.
- Open-text questions should be modeled as themes rather than fake individual responses.
- Raffle/email questions should be modeled as opt-in rates, never fake email addresses.

## Realism Requirements
- For "paid in the last 12 months" among qualified respondents, Yes should usually be very high, commonly 88-98%, unless the form is intentionally surveying future buyers rather than recent buyers.
- Price sensitivity should vary by ticket size, urgency, trust risk, and substitutability.
- Review importance should be higher for healthcare, home services, hospitality, and trust-heavy providers.
- Switching risk should be higher where the service is recurring, commoditized, or frustrating to schedule, and lower where relationships or high trust dominate.
- Owner/operator responses should reflect real operating constraints: labor, lead quality, pricing confidence, capacity, margins, conversion, retention, seasonality, and competition.
- Employee responses should reflect role type, tenure, wage satisfaction, benefits, training quality, schedule predictability, advancement path, and leave risk.
- Demographic and consumer-context answers should be plausible for the industry: home services skew toward homeowners and higher household income; healthcare/care can include family decision makers; hospitality includes personal, social, business, and event use.
- Avoid suspiciously round percentages, repeated answer orders, identical distributions, and over-concentration unless the behavior is genuinely dominant.

## Output Format
- For every question, provide answer label, estimated count, estimated percent, denominator, branch, and notes when interpretation matters.
- Keep percentages in decimal-ready form for charts and as readable percent labels for humans.
- State clearly that the results are modeled predictions, not collected survey results.
`;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length)) rows.push(row);
  }
  return rows;
}

function recordsFromCsv(text) {
  const rows = parseCsv(text);
  const headers = rows.shift();
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  return rows.map((row) => Object.fromEntries(headers.map((header) => [header, row[index[header]] || ""])));
}

function parseIndex(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("| ") || line.includes("---") || line.includes("Industry |")) continue;
    const cells = line.slice(2, -2).split(" | ");
    if (cells.length < 7) continue;
    const industryName = cells[0];
    const modeledN = Number(cells[1].replace(/,/g, ""));
    const publicForm = cells[3];
    const csvMatch = cells[5].match(/\(([^)]+)\)/);
    const chartsMatch = cells[6].match(/\(([^)]+)\)/);
    if (!csvMatch) continue;
    rows.push({
      industryName,
      modeledN,
      publicForm,
      csvPath: path.join(inputRoot, csvMatch[1]),
      chartWorkbook: chartsMatch ? chartsMatch[1] : "",
      slug: csvMatch[1].split("/")[0],
    });
  }
  return rows;
}

function percentDecimal(value) {
  const parsed = Number(String(value || "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed / 100 : "";
}

function branchFromSection(section) {
  if (/^Consumer/.test(section)) return "consumer";
  if (/^Employee/.test(section)) return "employee";
  if (/^Owner/.test(section)) return "owner";
  if (/^Shared/.test(section)) return "shared";
  return "notes";
}

function questionOrders(records) {
  const order = new Map();
  for (const row of records) {
    if (!row.question || order.has(row.question)) continue;
    order.set(row.question, order.size + 1);
  }
  return order;
}

function safeSheetName(name) {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 31 ? cleaned.slice(0, 31).trim() : cleaned;
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleTable(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF" } };
}

function styleSheet(sheet, widths) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  widths.forEach((width, i) => {
    const col = String.fromCharCode("A".charCodeAt(0) + i);
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = width;
  });
}

async function main() {
  const indexText = await fs.readFile(path.join(inputRoot, "INDEX.md"), "utf8");
  const indexRows = parseIndex(indexText);
  const allRows = [];
  const industryRows = new Map();

  for (const entry of indexRows) {
    const records = recordsFromCsv(await fs.readFile(entry.csvPath, "utf8"));
    const orders = questionOrders(records);
    const rows = [];
    for (const record of records) {
      if (record.row_type !== "forecast" && record.row_type !== "metric") continue;
      if (!record.answer && !record.value) continue;
      const branch = branchFromSection(record.section);
      const questionOrder = orders.get(record.question) || "";
      const out = {
        industry: entry.industryName,
        modeled_n: entry.modeledN,
        branch,
        section: record.section,
        question_order: questionOrder,
        question: record.question,
        answer: record.answer,
        count: record.count ? Number(record.count) : "",
        percent: percentDecimal(record.percent),
        percent_label: record.percent,
        value: record.value,
        notes: record.notes,
        row_type: record.row_type,
        public_form: entry.publicForm,
        chart_workbook: entry.chartWorkbook,
      };
      rows.push(out);
      allRows.push(out);
    }
    industryRows.set(entry.industryName, rows);
  }

  const headers = [
    "industry",
    "modeled_n",
    "branch",
    "section",
    "question_order",
    "question",
    "answer",
    "count",
    "percent",
    "percent_label",
    "value",
    "notes",
    "row_type",
    "public_form",
    "chart_workbook",
  ];

  const workbook = Workbook.create();
  const summary = workbook.worksheets.add("Summary");
  const summaryRows = [
    ["Metric", "Value"],
    ["Industries", indexRows.length],
    ["Minimum modeled n", Math.min(...indexRows.map((row) => row.modeledN))],
    ["Maximum modeled n", Math.max(...indexRows.map((row) => row.modeledN))],
    ["Total answer/metric rows", allRows.length],
    ["Prompt file", promptPath],
  ];
  const summaryRange = writeMatrix(summary, 0, 0, summaryRows);
  styleTable(summaryRange);
  styleSheet(summary, [210, 520]);

  const allSheet = workbook.worksheets.add("All Response Estimates");
  const allMatrix = [headers, ...allRows.map((row) => headers.map((header) => row[header]))];
  const allRange = writeMatrix(allSheet, 0, 0, allMatrix);
  styleTable(allRange);
  styleSheet(allSheet, [180, 90, 90, 210, 95, 360, 240, 85, 90, 95, 120, 360, 90, 210, 260]);
  allSheet.getRangeByIndexes(1, 8, Math.max(1, allRows.length), 1).format.numberFormat = "0.0%";

  for (const [industryName, rows] of industryRows.entries()) {
    const sheet = workbook.worksheets.add(safeSheetName(industryName));
    const matrix = [headers.slice(2, 12), ...rows.map((row) => headers.slice(2, 12).map((header) => row[header]))];
    const range = writeMatrix(sheet, 0, 0, matrix);
    styleTable(range);
    styleSheet(sheet, [90, 210, 95, 360, 240, 85, 90, 95, 120, 360]);
    sheet.getRangeByIndexes(1, 6, Math.max(1, rows.length), 1).format.numberFormat = "0.0%";
  }

  const promptSheet = workbook.worksheets.add("US Modeling Prompt");
  const promptLines = promptText.split("\n").map((line) => [line]);
  const promptRange = writeMatrix(promptSheet, 0, 0, promptLines);
  promptRange.format.wrapText = true;
  promptSheet.showGridLines = false;
  promptSheet.getRange("A:A").format.columnWidthPx = 980;

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 20 },
  });
  if (!errors.ndjson.includes("matched 0")) throw new Error(errors.ndjson);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(promptPath, promptText, "utf8");
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  console.log(`wrote ${outputPath}`);
  console.log(`wrote ${promptPath}`);
  console.log(`industries=${indexRows.length} rows=${allRows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
