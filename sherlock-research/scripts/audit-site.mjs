import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDUSTRIES, SITE, STATUS } from "../../src/report-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const errors = [];
const warnings = [];

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
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
  for (const industry of INDUSTRIES) {
    if (slugs.has(industry.slug)) error(`Duplicate industry slug: ${industry.slug}`);
    slugs.add(industry.slug);
    if (!industry.name) error(`Missing name for ${industry.slug}`);
    if (!industry.slug) error(`Missing slug for ${industry.name}`);
    if (!STATUS[industry.status]) error(`Invalid status for ${industry.name}: ${industry.status}`);
    if (!industry.tallyUrl || !industry.tallyId) error(`Missing Tally form for ${industry.name}`);
    if (!industry.seo?.title || !industry.seo?.description) error(`Missing SEO copy for ${industry.name}`);
    if (!industry.focus) error(`Missing focus copy for ${industry.name}`);
    if (!industry.fullReportAsset) warn(`Full PDF asset missing for ${industry.name}`);
  }
  if (INDUSTRIES.length !== 50) error(`Expected 50 industries, found ${INDUSTRIES.length}`);
  if (slugs.has("funeral-homes")) error("Funeral Homes should not be in the 50-industry source of truth");
  if (!slugs.has("dermatology")) error("Dermatology is missing from the 50-industry source of truth");
}

async function auditGeneratedPages() {
  const sitemap = await read("sitemap.xml");
  const catalog = await read("shared/catalog.js");
  for (const industry of INDUSTRIES) {
    if (!(await exists(industry.page))) error(`Missing generated report page: ${industry.page}`);
    if (!sitemap.includes(`${SITE.origin}/${industry.slug}-report`)) error(`Sitemap missing ${industry.slug}-report`);
    if (!catalog.includes(`"${industry.slug}"`)) error(`Catalog missing ${industry.slug}`);
    const page = await read(industry.page);
    if (!page.includes(`data-report-slug="${industry.slug}"`)) error(`${industry.page} missing body report slug`);
    if (!page.includes(industry.tallyUrl)) error(`${industry.page} missing Tally URL`);
    if (!page.includes(`/${industry.slug}-report`)) error(`${industry.page} missing clean canonical path`);
    if (!page.includes("data-checkout-plan=\"single\"")) error(`${industry.page} missing checkout CTA wiring`);
    if (industry.status === "waitlist" && page.includes("/api/checkout")) error(`${industry.page} should not offer dynamic checkout while waitlist-only`);
    if (industry.status !== "waitlist" && !page.includes("/api/checkout")) error(`${industry.page} missing dynamic Stripe checkout link`);
  }
}

async function auditPlaceholders() {
  const htmlFiles = await allHtmlFiles();
  const staleProviders = ["Re" + "send", "Pay" + "hip", "Send" + "Owl"];
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

async function auditTallyPlaybook() {
  const playbook = await read("TALLY_MASTER_INDUSTRY_PLAYBOOK.md");
  if (playbook.includes("Funeral Homes")) error("TALLY_MASTER_INDUSTRY_PLAYBOOK.md still references Funeral Homes");
  if (!playbook.includes("Dermatology")) error("TALLY_MASTER_INDUSTRY_PLAYBOOK.md is missing Dermatology");
}

async function main() {
  await auditCatalog();
  await auditGeneratedPages();
  await auditPlaceholders();
  await auditLinks();
  await auditTallyPlaybook();

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
