#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputCsv = "LANDSCAPING_TALLY_599_FORECAST.csv";
const outputDir = path.join("outputs", "landscaping_tally_forecast_charts");
const outputXlsx = path.join(outputDir, "LANDSCAPING_TALLY_599_FORECAST_CHARTS.xlsx");

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

function asNumber(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[$,%+]/g, "").trim();
  if (!cleaned || Number.isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

function safeSheetName(name) {
  return name.slice(0, 31).replace(/[\\/?*[\]:]/g, " ");
}

function sectionSheetName(section) {
  if (section.startsWith("Shared")) return "Shared Charts";
  if (section.startsWith("Consumer")) return "Consumer Charts";
  if (section.startsWith("Employee")) return "Employee Charts";
  if (section.startsWith("Owner")) return "Owner Charts";
  return "Other Charts";
}

function shortTitle(question) {
  return question
    .replace("Landscaping", "landscaping")
    .replace("landscaping or lawn care services", "services")
    .replace("Most Recent Provider", "Provider")
    .slice(0, 86);
}

function numericCount(value) {
  const n = asNumber(value);
  return n === null ? 0 : n;
}

function addTitle(sheet, title, subtitle = "") {
  sheet.getRange("A1:M1").merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = {
    fill: "#17324D",
    font: { bold: true, color: "#FFFFFF", size: 16 },
  };
  sheet.getRange("A2:M2").merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = {
    fill: "#EAF2F8",
    font: { color: "#17324D", italic: true },
  };
}

function writeMatrix(sheet, startRow, startCol, matrix) {
  const range = sheet.getRangeByIndexes(startRow, startCol, matrix.length, matrix[0].length);
  range.values = matrix;
  return range;
}

function styleTable(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2EC" };
  range.format.wrapText = true;
  range.getRow(0).format = {
    fill: "#D9EAF7",
    font: { bold: true, color: "#102A43" },
  };
}

function addQuestionChart(sheet, block, startRow, chartRow) {
  const { question, rows, metric } = block;
  const table = [["Answer", "Count"]];
  for (const row of rows) table.push([row.answer, numericCount(row.count)]);
  const sourceRange = writeMatrix(sheet, startRow, 0, table);
  styleTable(sourceRange);
  sheet.getRangeByIndexes(startRow, 0, table.length, 1).format.columnWidthPx = 210;
  sheet.getRangeByIndexes(startRow, 1, table.length, 1).format.columnWidthPx = 70;

  const chart = sheet.charts.add("bar", sourceRange);
  chart.title = `${shortTitle(question)}${metric ? ` (${metric})` : ""}`;
  chart.hasLegend = false;
  chart.xAxis = { axisType: "textAxis" };
  chart.yAxis = { numberFormatCode: "#,##0" };
  chart.setPosition(`D${chartRow}`, `M${chartRow + 15}`);
}

function collectChartBlocks(records) {
  const byQuestion = new Map();
  const metrics = new Map();
  for (const record of records) {
    const key = `${record.section}|||${record.question}`;
    if (record.row_type === "metric") {
      const label = record.answer ? `${record.answer}: ${record.value}` : record.value;
      metrics.set(key, label);
      continue;
    }
    if (record.row_type !== "forecast") continue;
    if (!record.count) continue;
    if (record.answer === "Total completed responses") continue;
    const count = numericCount(record.count);
    if (!count) continue;
    if (!byQuestion.has(key)) {
      byQuestion.set(key, {
        section: record.section,
        question: record.question,
        denominator: record.denominator_n,
        rows: [],
      });
    }
    byQuestion.get(key).rows.push(record);
  }

  return [...byQuestion.entries()]
    .map(([key, block]) => ({ ...block, metric: metrics.get(key) || "" }))
    .filter((block) => block.rows.length >= 2);
}

function addDashboard(workbook, chartBlocks) {
  const sheet = workbook.worksheets.add("Dashboard");
  sheet.showGridLines = false;
  addTitle(sheet, "Landscaping Forecast Charts", "Modeled results for 599 responses across consumer, employee, and owner/operator branches.");

  const kpis = [
    ["Total responses", 599],
    ["Consumers", 419],
    ["Employees", 90],
    ["Owners/operators", 90],
    ["Consumer high intent (7-10)", 230],
    ["Owners planning price increase", 57],
  ];
  const kpiRange = writeMatrix(sheet, 4, 0, [["Metric", "Value"], ...kpis]);
  styleTable(kpiRange);
  sheet.getRange("A:B").format.columnWidthPx = 185;

  const featured = [
    "Respondent Type",
    "Area Type",
    "Likelihood To Purchase In Next 12 Months",
    "Reaction To 10% Price Increase",
    "Biggest Business Challenge",
    "Plan To Raise Prices In Next 12 Months",
  ];
  let helperRow = 13;
  let chartIndex = 0;
  for (const name of featured) {
    const block = chartBlocks.find((item) => item.question === name);
    if (!block) continue;
    const col = chartIndex % 2 === 0 ? 4 : 9;
    const row = chartIndex < 2 ? 4 : chartIndex < 4 ? 22 : 40;
    const table = [["Answer", "Count"], ...block.rows.map((r) => [r.answer, numericCount(r.count)])];
    const source = writeMatrix(sheet, helperRow, 0, table);
    styleTable(source);
    const chart = sheet.charts.add("bar", source);
    chart.title = shortTitle(block.question);
    chart.hasLegend = false;
    chart.xAxis = { axisType: "textAxis" };
    chart.yAxis = { numberFormatCode: "#,##0" };
    const startColLetter = col === 4 ? "E" : "J";
    const endColLetter = col === 4 ? "I" : "N";
    chart.setPosition(`${startColLetter}${row}`, `${endColLetter}${row + 14}`);
    helperRow += Math.max(table.length + 2, 7);
    chartIndex += 1;
  }
}

async function main() {
  const csvText = await fs.readFile(inputCsv, "utf8");
  const parsed = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const headers = parsed[0];
  const records = parsed.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])));
  const chartBlocks = collectChartBlocks(records);

  const workbook = Workbook.create();
  addDashboard(workbook, chartBlocks);

  const dataSheet = workbook.worksheets.add("Forecast Data");
  dataSheet.showGridLines = false;
  const sourceMatrix = [headers, ...records.map((record) => headers.map((header) => record[header]))];
  const sourceRange = writeMatrix(dataSheet, 0, 0, sourceMatrix);
  styleTable(sourceRange);
  dataSheet.freezePanes.freezeRows(1);
  dataSheet.getRange("A:I").format.columnWidthPx = 145;
  dataSheet.getRange("B:B").format.columnWidthPx = 255;
  dataSheet.getRange("D:D").format.columnWidthPx = 210;
  dataSheet.getRange("H:H").format.columnWidthPx = 360;

  const grouped = new Map();
  for (const block of chartBlocks) {
    const sheetName = sectionSheetName(block.section);
    if (!grouped.has(sheetName)) grouped.set(sheetName, []);
    grouped.get(sheetName).push(block);
  }

  for (const [sheetName, blocks] of grouped.entries()) {
    const sheet = workbook.worksheets.add(safeSheetName(sheetName));
    sheet.showGridLines = false;
    addTitle(sheet, sheetName, "Each chart plots modeled respondent counts; source mini-tables are shown at left.");
    let startRow = 4;
    for (const block of blocks) {
      addQuestionChart(sheet, block, startRow, startRow + 1);
      startRow += Math.max(18, block.rows.length + 4);
    }
    sheet.getRange("A:B").format.columnWidthPx = 210;
  }

  const notesSheet = workbook.worksheets.add("Notes");
  notesSheet.showGridLines = false;
  addTitle(notesSheet, "Notes", "Interpretation notes from the forecast CSV.");
  const noteRows = records
    .filter((record) => record.row_type === "note" || record.row_type === "narrative")
    .map((record) => [record.section, record.question, record.notes]);
  const notesRange = writeMatrix(notesSheet, 4, 0, [["Section", "Topic", "Note"], ...noteRows]);
  styleTable(notesRange);
  notesSheet.getRange("A:A").format.columnWidthPx = 210;
  notesSheet.getRange("B:B").format.columnWidthPx = 220;
  notesSheet.getRange("C:C").format.columnWidthPx = 620;
  notesSheet.getRange("C:C").format.wrapText = true;

  await fs.mkdir(outputDir, { recursive: true });

  for (const sheetName of ["Dashboard", "Forecast Data", "Shared Charts", "Consumer Charts", "Employee Charts", "Owner Charts", "Notes"]) {
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join(outputDir, `${sheetName.replaceAll(" ", "_")}.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const errorScan = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 50 },
  });
  console.log(errorScan.ndjson);

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputXlsx);
  console.log(`saved ${outputXlsx}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
