import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDUSTRIES, PLANS, SITE, STATUS } from "../../src/report-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");

const errors = [];
const warnings = [];

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function hasReportDeliveryAsset(industry) {
  return Boolean(industry.fullReportAsset || industry.readiness?.fullPdf === "payhip-file");
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function readRepo(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function allHtmlFiles() {
  const files = await readdir(root);
  return files.filter((file) => file.endsWith(".html")).sort();
}

function localPathForUrl(url) {
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:")) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    if (!url.startsWith(SITE.origin)) return null;
    url = url.slice(SITE.origin.length);
  }
  if (!url.startsWith("/")) return null;
  if (url.startsWith("/api/")) return null;
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return "index.html";
  if (path.extname(clean)) return clean.slice(1);
  return `${clean.slice(1)}.html`;
}

async function auditCatalog() {
  const slugs = new Set();
  let launchCount = 0;
  let pipelineCount = 0;
  for (const industry of INDUSTRIES) {
    if (slugs.has(industry.slug)) error(`Duplicate industry slug: ${industry.slug}`);
    slugs.add(industry.slug);
    if (!industry.name) error(`Missing name for ${industry.slug}`);
    if (!industry.slug) error(`Missing slug for ${industry.name}`);
    if (!STATUS[industry.status]) error(`Invalid status for ${industry.name}: ${industry.status}`);
    if (industry.stage === "launch") launchCount += 1;
    if (industry.stage === "pipeline") pipelineCount += 1;
    if (industry.stage === "launch" && (!industry.tallyUrl || !industry.tallyId)) error(`Missing Tally form for launch report ${industry.name}`);
    if (!industry.seo?.title || !industry.seo?.description) error(`Missing SEO copy for ${industry.name}`);
    if (!industry.focus) error(`Missing focus copy for ${industry.name}`);
    if (["available", "presell"].includes(industry.status) && !hasReportDeliveryAsset(industry)) warn(`Full PDF asset missing for ${industry.name}`);
  }
  if (INDUSTRIES.length !== SITE.catalogTarget) error(`Expected ${SITE.catalogTarget} industries, found ${INDUSTRIES.length}`);
  if (launchCount !== SITE.launchCohortSize) error(`Expected ${SITE.launchCohortSize} launch reports, found ${launchCount}`);
  if (pipelineCount !== SITE.catalogTarget - SITE.launchCohortSize) error(`Expected ${SITE.catalogTarget - SITE.launchCohortSize} planned pipeline reports, found ${pipelineCount}`);
  if (slugs.has("funeral-homes")) error("Funeral Homes should not be in the industry source of truth");
  if (!slugs.has("dermatology")) error("Dermatology is missing from the industry source of truth");
}

async function auditGeneratedPages() {
  const sitemap = await read("sitemap.xml");
  const catalog = await read("shared/catalog.js");
  for (const industry of INDUSTRIES) {
    if (!(await exists(industry.page))) error(`Missing generated report page: ${industry.page}`);
    if (!catalog.includes(`"${industry.slug}"`)) error(`Catalog missing ${industry.slug}`);
    const page = await read(industry.page);
    const isPlanned = industry.status === "planned";
    const inSitemap = sitemap.includes(`${SITE.origin}/${industry.slug}-report`);
    const isNoindex = page.includes('<meta name="robots" content="noindex,nofollow">');
    if (isPlanned && inSitemap) error(`Sitemap should not include planned report ${industry.slug}-report`);
    if (!isPlanned && !inSitemap) error(`Sitemap missing ${industry.slug}-report`);
    if (isPlanned && !isNoindex) error(`${industry.page} should be noindex until report content is production-ready`);
    if (!isPlanned && isNoindex) error(`${industry.page} should be indexable`);
    if (!page.includes(`data-report-slug="${industry.slug}"`)) error(`${industry.page} missing body report slug`);
    if (industry.tallyUrl && !page.includes(industry.tallyUrl)) error(`${industry.page} missing Tally URL`);
    if (!industry.tallyUrl && !page.includes("Request priority")) error(`${industry.page} missing priority CTA for planned report`);
    if (!page.includes(`/${industry.slug}-report`)) error(`${industry.page} missing clean canonical path`);
    if (!page.includes("data-checkout-plan=\"single\"")) error(`${industry.page} missing checkout CTA wiring`);
    if ((industry.status === "available" || industry.status === "presell") && !industry.checkoutUrl) warn(`${industry.name} (${industry.status}) has no live Payhip checkout link yet - CTA routes to contact`);
  }
}

async function auditPlaceholders() {
  const htmlFiles = await allHtmlFiles();
  const staleProviders = ["Re" + "send", "Send" + "Owl"];
  const staleDelivery = [
    "Instant " + "PDF",
    "instant " + "PDF",
    "instant " + "download",
    "instant-" + "download",
    "delivered " + "immediately"
  ];
  const banned = [
    ...staleProviders,
    ...staleDelivery,
    "Flippable book embeds here",
    "Customer name",
    "Add approved quote",
    "PDF download going live shortly",
    "Funeral Homes",
    "hello@" + "sherlockresearch.com",
    "support@" + "sherlockresearch.com"
  ];
  for (const file of htmlFiles) {
    const source = await read(file);
    for (const marker of banned) {
      if (source.includes(marker)) error(`${file} still contains placeholder marker: ${marker}`);
    }
  }
}

async function auditLinks() {
  const htmlFiles = await allHtmlFiles();
  const assetMissing = new Set();
  for (const file of htmlFiles) {
    const source = await read(file);
    const matches = source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi);
    for (const match of matches) {
      const local = localPathForUrl(match[1]);
      if (!local) continue;
      if (!(await exists(local))) {
        assetMissing.add(`${file} -> ${match[1]} (${local})`);
      }
    }
  }
  for (const item of assetMissing) error(`Broken local link: ${item}`);
}

async function auditAccessibilityBasics() {
  for (const file of await allHtmlFiles()) {
    if (file === "404.html") continue;
    const source = await read(file);
    const h1Count = (source.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) error(`${file} has ${h1Count} h1 elements (expected 1)`);

    const seenIds = new Set();
    for (const match of source.matchAll(/\sid=["']([^"']+)["']/gi)) {
      const id = match[1];
      if (seenIds.has(id)) error(`${file} has duplicate id="${id}"`);
      seenIds.add(id);
    }

    for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      if (!/\salt\s*=/.test(tag)) error(`${file} has image without alt attribute: ${tag.slice(0, 120)}`);
    }

    for (const match of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
      const tag = match[0];
      if (!/rel=["'][^"']*\bnoopener\b/i.test(tag)) error(`${file} opens a new tab without rel="noopener": ${tag.slice(0, 120)}`);
    }

    for (const match of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
      const attrs = match[1];
      const label = match[2]
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      if (!label && !/\baria-label=/.test(attrs)) error(`${file} has button without visible text or aria-label`);
    }
  }
}

async function auditTallyPlaybook() {
  // Gitignored internal doc - absent on a clean clone / CI. Skip gracefully.
  if (!(await exists("TALLY_MASTER_INDUSTRY_PLAYBOOK.md"))) {
    warn("TALLY_MASTER_INDUSTRY_PLAYBOOK.md not present (gitignored) - skipping playbook checks");
    return;
  }
  const playbook = await read("TALLY_MASTER_INDUSTRY_PLAYBOOK.md");
  if (playbook.includes("Funeral Homes")) error("TALLY_MASTER_INDUSTRY_PLAYBOOK.md still references Funeral Homes");
  if (!playbook.includes("Dermatology")) error("TALLY_MASTER_INDUSTRY_PLAYBOOK.md is missing Dermatology");
}

async function auditCheckout() {
  for (const [key, plan] of Object.entries(PLANS)) {
    const url = plan.checkoutUrl || "";
    if (/REPLACE|PLACEHOLDER|test_/i.test(url)) warn(`Plan "${key}" checkout link is still a placeholder: ${url}`);
  }
}

const CANONICAL_TAGLINE = "See the Market. Stay Ahead.";

// Footer must be identical everywhere; nav should reach /reports.
async function auditConsistency() {
  for (const file of await allHtmlFiles()) {
    if (file === "404.html") continue;
    const source = await read(file);
    if (!source.includes("foot-grid")) error(`${file} missing canonical footer (.foot-grid)`);
    if (/class="(footer-links|footer-grid|footer-col)"/.test(source)) error(`${file} uses old/divergent footer markup`);
    if (!source.includes(CANONICAL_TAGLINE)) warn(`${file} missing footer tagline "${CANONICAL_TAGLINE}"`);
    if (!/href="\/reports(#[a-z-]+)?"/.test(source)) warn(`${file} nav/footer does not link to /reports`);
  }
}

// No stale numbers or the old domain anywhere.
async function auditClaims() {
  const stale = ["2,600", "25,000", "42-page", "42 page", "sherlockresearch.com"];
  for (const file of await allHtmlFiles()) {
    const source = await read(file);
    for (const s of stale) if (source.includes(s)) error(`${file} contains stale claim/domain: "${s}"`);
  }
}

// Dev/ops jargon must not leak into customer-visible text.
async function auditJargon() {
  const jargon = ["webhook", "Stripe", "Cloudflare Email", "fulfillment", "PDF asset", "metadata"];
  for (const file of await allHtmlFiles()) {
    const source = await read(file);
    const text = source
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    for (const word of jargon) if (text.includes(word)) warn(`${file} customer text contains dev-jargon: "${word}"`);
  }
}

async function auditLaunchCopy() {
  const waitlistCount = INDUSTRIES.filter((industry) => industry.status === "waitlist").length;
  if (waitlistCount === 0) {
    const visibleFiles = ["reports.html", "faq.html", "contact.html"];
    for (const file of visibleFiles) {
      const source = await read(file);
      const text = source
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ");
      if (/\bwaitlist\b/i.test(text)) error(`${file} contains visible waitlist copy even though no reports are waitlist`);
    }
  }

  const success = await read("success.html");
  if (!/Payhip receipt|Payhip sends/i.test(success)) error("success.html must direct buyers to the Payhip receipt/download path");

  const catalog = await read("shared/catalog.js");
  if (/tallyEditUrl|\/forms\/[^"']+\/edit/.test(catalog)) error("shared/catalog.js exposes Tally edit URLs");
  if (/waitlistEvent|purchaseEvent|emailDelivery|fullReportAsset/.test(catalog)) error("shared/catalog.js exposes internal fulfillment or automation metadata");
  if (waitlistCount === 0 && /Join the waitlist|\"waitlist\"\s*:/.test(catalog)) error("shared/catalog.js exposes waitlist metadata even though no reports are waitlist");
}

async function auditDocs() {
  const launchRunbook = await readRepo("docs/LAUNCH_RUNBOOK.md");
  const payhipFulfillment = await readRepo("docs/PAYHIP_FULFILLMENT.md");
  const requiredSecrets = launchRunbook.match(/Confirm Cloudflare secrets exist:[\s\S]*?Confirm public form abuse posture:/)?.[0] || "";
  if (/- `PAYHIP_API_KEY`/.test(requiredSecrets)) error("docs/LAUNCH_RUNBOOK.md lists PAYHIP_API_KEY as a launch-required secret");
  if (/Sherlock confirmation email arrives/.test(payhipFulfillment)) error("docs/PAYHIP_FULFILLMENT.md still requires Sherlock confirmation email for launch");
}

async function auditPageWeights() {
  const budgets = new Map([
    ["index.html", 125 * 1024],
    ["reports.html", 135 * 1024]
  ]);
  for (const file of await allHtmlFiles()) {
    const source = await read(file);
    const budget = budgets.get(file) || (file.endsWith("-report.html") ? 65 * 1024 : 90 * 1024);
    if (Buffer.byteLength(source, "utf8") > budget) warn(`${file} exceeds page weight budget (${Buffer.byteLength(source, "utf8")} > ${budget})`);
  }
}

// Every report page must keep its key redesigned components.
async function auditReportStructure() {
  const required = [
    ["report-statbar", "stat bar"],
    ["data-tablist", "tabbed explorer"],
    ["growth-panel", "market growth panel"],
    ["area-chart", "revenue area chart"],
    ["report-final-cta", "final CTA"]
  ];
  for (const industry of INDUSTRIES) {
    const page = await read(industry.page);
    for (const [marker, label] of required) {
      if (!page.includes(marker)) error(`${industry.page} missing ${label} (${marker})`);
    }
    const panels = (page.match(/data-panel=/g) || []).length;
    if (panels < 5) error(`${industry.page} has ${panels} data panels (expected >= 5)`);
  }
}

async function main() {
  await auditCatalog();
  await auditGeneratedPages();
  await auditPlaceholders();
  await auditLinks();
  await auditAccessibilityBasics();
  await auditTallyPlaybook();
  await auditCheckout();
  await auditConsistency();
  await auditClaims();
  await auditJargon();
  await auditLaunchCopy();
  await auditDocs();
  await auditPageWeights();
  await auditReportStructure();

  for (const warning of warnings) console.warn(`WARN: ${warning}`);
  if (errors.length) {
    for (const message of errors) console.error(`ERROR: ${message}`);
    console.error(`Audit failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`Audit passed with ${warnings.length} warning(s).`);
}

main().catch((auditError) => {
  console.error(auditError);
  process.exit(1);
});
