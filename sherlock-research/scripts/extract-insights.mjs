/**
 * extract-insights.mjs
 * ---------------------------------------------------------------------------
 * Reads the (gitignored) Tally "599 forecast" CSVs for every industry and
 * writes a COMMITTED, compact data file at src/report-insights.js that the
 * site generator consumes. Run manually whenever the forecasts change:
 *
 *     npm run extract-insights
 *
 * Because the OUTPUT is committed, `npm run build` stays reproducible on a
 * fresh clone that does not have the 12 MB outputs/ folder.
 *
 * CSV columns: section,question,denominator_n,answer,count,percent,value,notes,row_type
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDUSTRIES } from "../../src/report-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, ".."); // sherlock-research/
const repoRoot = path.resolve(root, "..");

const COL = { section: 0, question: 1, denom: 2, answer: 3, count: 4, percent: 5, value: 6, notes: 7, rowType: 8 };

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function findCsv(slug) {
  const rootFile = path.join(root, `${slug.toUpperCase().replace(/-/g, "_")}_TALLY_599_FORECAST.csv`);
  if (await exists(rootFile)) return rootFile;
  const dir = path.join(root, "outputs", "remaining_49_tally_forecasts", slug);
  try {
    const files = await readdir(dir);
    const f = files.find((n) => /_TALLY_599_FORECAST\.csv$/i.test(n) && !/CHARTS/i.test(n));
    if (f) return path.join(dir, f);
  } catch { /* no dir */ }
  return null;
}

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.length) continue;
    const cells = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

const pct = (s) => {
  const n = parseFloat(String(s).replace(/[%,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
};
const lc = (s) => String(s || "").toLowerCase();

// Predicates that match BOTH CSV phrasings:
// landscaping uses Title-Case summaries ("Likelihood To Purchase In Next 12 Months");
// the other 49 use raw survey questions ("How likely are you to purchase ... next 12 months?").
const P = {
  purchase: (q) => q.includes("purchase") && q.includes("next 12 months"),
  satisfaction: (q) => q.includes("satisf") && q.includes("most recent"),
  switchLikely: (q) => q.includes("switch") && q.includes("next 12 months"),
  recommend: (q) => q.includes("recommend"),
  bought: (q) => q.includes("paid for") && q.includes("last 12 months"),
  channels: (q) => q.includes("provider") && (q.includes("find") || q.includes("found")),
  price10: (q) => q.includes("10%") && (q.includes("price") || q.includes("raised")),
  spend: (q) => q.includes("spend") && (q.includes("per year") || q.includes("annual")),
  switchReason: (q) => q.includes("reason") && q.includes("switch"),
  area: (q) => q.includes("area") && !q.includes("zip"),
};
const SKIP_ANSWER = /^(other|none of these|none|prefer not|moved)/i;

function meanFor(rows, pred) {
  const r = rows.find((x) => x[COL.rowType] === "metric" && pred(lc(x[COL.question])));
  const m = r && String(r[COL.value]).match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  return m ? parseFloat(m[1]) : null;
}
function npsFor(rows) {
  const r = rows.find((x) => x[COL.rowType] === "metric" && P.recommend(lc(x[COL.question])));
  const m = r && String(r[COL.value]).match(/NPS:\s*([+-]?\d+)/i);
  if (m) return parseInt(m[1], 10);
  // Fallback: compute from the recommend distribution — promoters (9-10) minus detractors (0-6).
  const dist = rows.filter((x) => x[COL.rowType] === "forecast" && P.recommend(lc(x[COL.question])) && x[COL.answer] !== "Predicted mean");
  if (!dist.length) return null;
  let prom = 0;
  let detr = 0;
  for (const x of dist) {
    const a = lc(x[COL.answer]);
    const p = pct(x[COL.percent]) || 0;
    if (a.includes("9-10") || a.includes("promoter")) prom += p;
    else if (a.includes("0-3") || a.includes("4-6") || a.includes("0-6") || a.includes("detractor")) detr += p;
  }
  return Math.round(prom - detr);
}
// distribution rows -> [[answer, percent], ...] sorted desc, top N
function distFor(rows, pred, topN = 5, keepSkips = false) {
  const out = rows
    .filter((x) => x[COL.rowType] === "forecast" && pred(lc(x[COL.question])) && x[COL.answer] && x[COL.answer] !== "Predicted mean")
    .filter((x) => keepSkips || !SKIP_ANSWER.test(x[COL.answer]))
    .map((x) => [x[COL.answer], pct(x[COL.percent])])
    .filter((p) => p[1] != null);
  out.sort((a, b) => b[1] - a[1]);
  return out.slice(0, topN);
}
function answerPct(rows, pred, answerNeedle) {
  const r = rows.find((x) => x[COL.rowType] === "forecast" && pred(lc(x[COL.question])) && lc(x[COL.answer]).includes(answerNeedle));
  return r ? pct(r[COL.percent]) : null;
}

function extract(rows) {
  const stats = {
    purchaseIntent: meanFor(rows, P.purchase),
    boughtLastYear: answerPct(rows, P.bought, "yes"),
    satisfaction: meanFor(rows, P.satisfaction),
    switchLikelihood: meanFor(rows, P.switchLikely),
    nps: npsFor(rows),
  };
  const channels = distFor(rows, P.channels, 6);
  stats.topChannel = channels[0] ? { label: channels[0][0], percent: channels[0][1] } : null;
  const area = distFor(rows, P.area, 5, true).filter(([a]) => /^(urban|suburban|rural)$/i.test(a));
  stats.areaSplit = area.length ? area : null;

  // 5 blurred teaser questions (present in BOTH CSV formats)
  const teasers = [
    { label: "How likely customers are to buy in the next 12 months", rows: distFor(rows, P.purchase, 4, true).filter(([a]) => /^\d/.test(a)) },
    { label: "How customers find a provider", rows: distFor(rows, P.channels, 5) },
    { label: "How customers react to a 10% price increase", rows: distFor(rows, P.price10, 4, true) },
    { label: "What customers spend per year", rows: distFor(rows, P.spend, 6, true) },
    { label: "The #1 reason customers switch providers", rows: distFor(rows, P.switchReason, 5) },
  ].filter((t) => t.rows.length >= 2);
  return { stats, teasers };
}

// Reasonable fallback so the build never breaks if a forecast is missing.
const INSIGHTS_DEFAULT = {
  stats: { purchaseIntent: 6.5, boughtLastYear: 70, satisfaction: 7.1, switchLikelihood: 4.8, nps: 6, topChannel: { label: "Referral from friend/family", percent: 32 }, areaSplit: [["Suburban", 62], ["Urban", 25], ["Rural", 13]] },
  teasers: [
    { label: "What customers prioritize when choosing a provider", rows: [["Quality of work", 64], ["Reliability and timeliness", 59], ["Reputation and reviews", 52], ["Price", 49], ["Communication", 40]] },
    { label: "How likely customers are to buy in the next 12 months", rows: [["7-8", 34], ["4-6", 30], ["9-10", 21], ["0-3", 15]] },
    { label: "How customers react to a 10% price increase", rows: [["Shop around", 45], ["Switch providers", 24], ["Stay and pay", 23], ["Stop the service", 8]] },
    { label: "What customers spend per year", rows: [["$750-$1,500", 30], ["$250-$750", 27], ["$1,500-$3,000", 21], ["Under $250", 11], ["$3,000-$6,000", 8]] },
    { label: "The #1 reason customers switch providers", rows: [["Price", 28], ["Reliability/timeliness", 25], ["Quality of work", 17], ["Communication", 13], ["Availability", 10]] },
  ],
};

async function main() {
  const INSIGHTS = {};
  let ok = 0;
  let missing = [];
  for (const industry of INDUSTRIES) {
    const csv = await findCsv(industry.slug);
    if (!csv) { missing.push(industry.slug); continue; }
    try {
      const rows = parseCsv(await readFile(csv, "utf8"));
      const data = extract(rows);
      if (!data.teasers.length) { missing.push(industry.slug + " (no teasers)"); continue; }
      INSIGHTS[industry.slug] = data;
      ok++;
    } catch (err) {
      missing.push(`${industry.slug} (${err.message})`);
    }
  }

  const banner = "// AUTO-GENERATED by sherlock-research/scripts/extract-insights.mjs — do not edit by hand.\n// Source: modeled Tally 599-response forecasts. Regenerate with `npm run extract-insights`.\n";
  const body = `${banner}export const INSIGHTS_DEFAULT = ${JSON.stringify(INSIGHTS_DEFAULT, null, 2)};\n\nexport const INSIGHTS = ${JSON.stringify(INSIGHTS, null, 2)};\n\nexport function insightsFor(slug) {\n  return INSIGHTS[slug] || INSIGHTS_DEFAULT;\n}\n`;
  const outPath = path.join(repoRoot, "src", "report-insights.js");
  await writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(`Insights extracted for ${ok}/${INDUSTRIES.length} industries.`);
  if (missing.length) console.log(`Using default fallback for: ${missing.join(", ")}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
