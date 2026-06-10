import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { INDUSTRIES, SITE } from "../src/report-catalog.js";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "artifacts");
const strict = process.env.STRICT_LAUNCH === "1";
const allowFormsWithoutTurnstile = process.env.ALLOW_FORMS_WITHOUT_TURNSTILE === "1";
const previewPasswordConfigured = Boolean(process.env.PREVIEW_PASSWORD);

async function exists(relativePath) {
  try {
    await access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

function status(label, ok, severity = "review") {
  if (ok) return `PASS - ${label}`;
  return severity === "blocker" ? `BLOCKER - ${label}` : `REVIEW - ${label}`;
}

function hasReportDeliveryAsset(report) {
  return Boolean(report.fullReportAsset || report.readiness?.fullPdf === "payhip-file");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

function summarizeReports() {
  const launch = INDUSTRIES.filter((report) => report.stage === "launch");
  const pipeline = INDUSTRIES.filter((report) => report.stage === "pipeline");
  const available = INDUSTRIES.filter((report) => report.status === "available");
  const presell = INDUSTRIES.filter((report) => report.status === "presell");
  const waitlist = INDUSTRIES.filter((report) => report.status === "waitlist");
  const planned = INDUSTRIES.filter((report) => report.status === "planned");
  const missingCheckout = INDUSTRIES.filter((report) => ["available", "presell"].includes(report.status) && !report.checkoutUrl);
  const missingFullPdf = INDUSTRIES.filter((report) => ["available", "presell"].includes(report.status) && !hasReportDeliveryAsset(report));
  const availableMissingCheckout = available.filter((report) => !report.checkoutUrl);
  const presellMissingCheckout = presell.filter((report) => !report.checkoutUrl);
  const availableMissingFullPdf = available.filter((report) => !hasReportDeliveryAsset(report));
  const presellMissingFullPdf = presell.filter((report) => !hasReportDeliveryAsset(report));
  const missingTally = launch.filter((report) => !report.tallyUrl || !report.tallyId);
  const payhipCheckoutCount = INDUSTRIES.filter((report) => report.checkoutUrl).length;

  return {
    total: INDUSTRIES.length,
    launch: launch.length,
    pipeline: pipeline.length,
    available: available.length,
    presell: presell.length,
    waitlist: waitlist.length,
    planned: planned.length,
    payhipCheckoutCount,
    missingCheckout: missingCheckout.map((report) => report.name),
    missingFullPdf: missingFullPdf.map((report) => report.name),
    availableMissingCheckout: availableMissingCheckout.map((report) => report.name),
    presellMissingCheckout: presellMissingCheckout.map((report) => report.name),
    availableMissingFullPdf: availableMissingFullPdf.map((report) => report.name),
    presellMissingFullPdf: presellMissingFullPdf.map((report) => report.name),
    missingTally: missingTally.map((report) => report.name)
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const wrangler = await readJson("wrangler.jsonc");
  const reports = summarizeReports();
  const generatedPagesOk = await Promise.all(INDUSTRIES.map((report) => exists(path.join("sherlock-research", report.page))));
  const generatedMissing = INDUSTRIES.filter((_, index) => !generatedPagesOk[index]).map((report) => report.page);
  const publicOpsDashboard = await exists(path.join("dist", "ops-launch-dashboard.html"));
  const distCatalog = await exists(path.join("dist", "shared", "catalog.js"))
    ? await readFile(path.join(repoRoot, "dist", "shared", "catalog.js"), "utf8")
    : "";
  const distCatalogHasPrivateData = /tallyEditUrl|\/forms\/[^"']+\/edit|waitlistEvent|purchaseEvent|emailDelivery|fullReportAsset/.test(distCatalog);

  const checks = [
    { key: "catalog-count", ok: reports.total === SITE.catalogTarget, label: `${reports.total}/${SITE.catalogTarget} reports in catalog` },
    { key: "launch-cohort", ok: reports.launch === SITE.launchCohortSize, label: `${reports.launch}/${SITE.launchCohortSize} launch reports` },
    { key: "pipeline-count", ok: reports.pipeline === SITE.catalogTarget - SITE.launchCohortSize, label: `${reports.pipeline} planned pipeline reports` },
    { key: "generated-pages", ok: generatedMissing.length === 0, label: "generated report pages present" },
    { key: "private-ops-not-public", ok: !publicOpsDashboard, label: "internal ops dashboard excluded from public dist assets" },
    { key: "public-catalog-private-data", ok: !distCatalogHasPrivateData, label: "public catalog excludes Tally edit URLs and automation event names" },
    { key: "worker-main", ok: wrangler.main === "src/worker.js", label: "Worker entrypoint configured" },
    { key: "assets-binding", ok: wrangler.assets?.binding === "ASSETS" && wrangler.assets?.directory === "dist", label: "static assets binding configured" },
    { key: "kv-binding", ok: Boolean(wrangler.kv_namespaces?.some((item) => item.binding === "FULFILLMENTS")), label: "FULFILLMENTS KV binding configured" },
    { key: "email-binding", ok: Boolean(wrangler.send_email?.some((item) => item.name === "EMAIL")), label: "Cloudflare EMAIL binding configured" },
    { key: "observability", ok: Boolean(wrangler.observability?.enabled), label: "Cloudflare observability enabled" },
    { key: "preview-auth-disabled", ok: !previewPasswordConfigured, label: "PREVIEW_PASSWORD not configured for public production launch" },
    { key: "payhip-webhook-secret", ok: reports.payhipCheckoutCount === 0 || Boolean(process.env.PAYHIP_API_KEY), label: `PAYHIP_API_KEY configured for optional Payhip webhook automation across ${reports.payhipCheckoutCount} checkout link(s)` },
    { key: "turnstile", ok: allowFormsWithoutTurnstile || (Boolean(process.env.TURNSTILE_SECRET_KEY) && Boolean(SITE.turnstileSiteKey)), label: "Turnstile secret and public site key configured, or ALLOW_FORMS_WITHOUT_TURNSTILE=1 acknowledged" },
    { key: "available-checkout-links", ok: reports.availableMissingCheckout.length === 0, label: `${reports.availableMissingCheckout.length} active reports missing Payhip URLs` },
    { key: "presell-checkout-links", ok: reports.presellMissingCheckout.length === 0, label: `${reports.presellMissingCheckout.length} presell reports missing Payhip URLs` },
    { key: "available-full-pdfs", ok: reports.availableMissingFullPdf.length === 0, label: `${reports.availableMissingFullPdf.length} active reports missing full PDF assets` },
    { key: "presell-full-pdfs", ok: reports.presellMissingFullPdf.length === 0, label: `${reports.presellMissingFullPdf.length} presell reports missing full PDF assets` },
    { key: "launch-tally", ok: reports.missingTally.length === 0, label: `${reports.missingTally.length} launch reports missing Tally forms` }
  ];

  const blockerKeys = new Set([
    "catalog-count",
    "launch-cohort",
    "pipeline-count",
    "generated-pages",
    "private-ops-not-public",
    "public-catalog-private-data",
    "worker-main",
    "assets-binding",
    "kv-binding",
    "email-binding",
    "observability",
    "preview-auth-disabled",
    "turnstile",
    "available-checkout-links",
    "available-full-pdfs",
    "launch-tally"
  ]);
  const blockers = checks.filter((check) => !check.ok && blockerKeys.has(check.key));
  const review = checks.filter((check) => !check.ok && !blockers.includes(check));
  const result = {
    generatedAt: new Date().toISOString(),
    strict,
    allowFormsWithoutTurnstile,
    site: SITE.origin,
    reports,
    checks,
    blockers: blockers.map((check) => check.label),
    review: review.map((check) => check.label),
    generatedMissing
  };

  const markdown = [
    "# Sherlock Launch Readiness",
    "",
    `Generated: ${result.generatedAt}`,
    `Site: ${SITE.origin}`,
    "",
    "## Report Coverage",
    "",
    `- Total catalog reports: ${reports.total}`,
    `- Launch cohort: ${reports.launch}`,
    `- Planned pipeline: ${reports.pipeline}`,
    `- Active/presell/waitlist/planned: ${reports.available}/${reports.presell}/${reports.waitlist}/${reports.planned}`,
    "",
    "## Checks",
    "",
    ...checks.map((check) => `- ${status(check.label, check.ok, blockerKeys.has(check.key) ? "blocker" : "review")}`),
    "",
    "## Review Items",
    "",
    ...(review.length ? review.map((check) => `- ${check.label}`) : ["- None"]),
    "",
    "## Blockers",
    "",
    ...(blockers.length ? blockers.map((check) => `- ${check.label}`) : ["- None"]),
    "",
    "## Pending Payhip URLs",
    "",
    ...(reports.missingCheckout.length ? reports.missingCheckout.map((name) => `- ${name}`) : ["- None"]),
    "",
    "## Active Payhip URL Blockers",
    "",
    ...(reports.availableMissingCheckout.length ? reports.availableMissingCheckout.map((name) => `- ${name}`) : ["- None"]),
    "",
    "## Presell Payhip URL Review",
    "",
    ...(reports.presellMissingCheckout.length ? reports.presellMissingCheckout.map((name) => `- ${name}`) : ["- None"]),
    "",
    "## Pending Full PDF Assets",
    "",
    ...(reports.missingFullPdf.length ? reports.missingFullPdf.map((name) => `- ${name}`) : ["- None"]),
    "",
    "## Active Full PDF Blockers",
    "",
    ...(reports.availableMissingFullPdf.length ? reports.availableMissingFullPdf.map((name) => `- ${name}`) : ["- None"]),
    "",
    "## Presell Full PDF Review",
    "",
    ...(reports.presellMissingFullPdf.length ? reports.presellMissingFullPdf.map((name) => `- ${name}`) : ["- None"]),
    ""
  ].join("\n");

  await writeFile(path.join(outDir, "launch-readiness.json"), JSON.stringify(result, null, 2), "utf8");
  await writeFile(path.join(outDir, "LAUNCH_READINESS.md"), markdown, "utf8");

  console.log(`Launch readiness written to ${path.join(outDir, "LAUNCH_READINESS.md")}`);
  console.log(`${blockers.length} blocker(s), ${review.length} review item(s).`);
  if (strict && blockers.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
