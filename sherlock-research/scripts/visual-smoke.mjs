/**
 * visual-smoke.mjs — browser QA layer of the test harness.
 * Loads every page type at 3 viewports in headless Chromium and asserts:
 *   - no console errors / page errors
 *   - no horizontal overflow
 *   - <title>, <h1>, and the canonical footer are present
 * Plus interaction checks on a report page (tab switch + unlock veil, checkout CTA href).
 *
 * Playwright is optional: if it isn't installed the script skips (so `npm run build`
 * never breaks). Enable with:  npm i -D playwright && npx playwright install chromium
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const pages = [
  "index.html", "pricing.html", "reports.html", "sample.html", "contact.html",
  "success.html", "faq.html", "about.html",
  "landscaping-report.html", "dental-report.html", "garage-door-report.html"
];
const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 900 }
];
// file:// noise we don't care about (absolute /asset paths, favicon) — real app assets use relative paths.
const IGNORE_CONSOLE = [/favicon/i, /net::ERR_FILE_NOT_FOUND/i, /Failed to load resource/i];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("Playwright not installed; skipping visual smoke. Enable with `npm i -D playwright && npx playwright install chromium`.");
    return;
  }

  const browser = await chromium.launch();
  const failures = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    for (const file of pages) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && !IGNORE_CONSOLE.some((r) => r.test(msg.text()))) consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));
      await page.goto(pathToFileURL(path.join(root, file)).href);
      await page.waitForLoadState("domcontentloaded");
      const title = await page.title();
      const h1 = await page.locator("h1").first().textContent().catch(() => null);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const footer = await page.locator(".foot-grid").count();
      const tag = `${file} @${viewport.name}`;
      if (!title) failures.push(`${tag}: missing <title>`);
      if (!h1 || !h1.trim()) failures.push(`${tag}: missing <h1>`);
      if (overflow) failures.push(`${tag}: horizontal overflow`);
      if (file !== "404.html" && !footer) failures.push(`${tag}: missing canonical footer (.foot-grid)`);
      if (consoleErrors.length) failures.push(`${tag}: console errors -> ${consoleErrors.slice(0, 3).join(" | ")}`);
      await page.close();
    }
    await context.close();
  }

  // Interaction checks on a report page (desktop)
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(root, "landscaping-report.html")).href);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400); // let app.js wire checkout + tabs
  try {
    await page.locator('.data-tab[data-tab="pricing"]').click();
    if (!(await page.locator('.data-panel[data-panel="pricing"]').isVisible())) failures.push("report: Pricing tab did not reveal its panel");
    if (!(await page.locator('.data-panel[data-panel="pricing"] .teaser-veil').count())) failures.push("report: locked tab missing unlock veil");
  } catch (e) {
    failures.push("report: tab interaction failed -> " + e.message);
  }
  try {
    const href = await page.locator('[data-checkout-plan="single"]').first().getAttribute("href");
    if (!href || !/^https:\/\//.test(href)) failures.push(`report: checkout CTA href is not an https checkout link (got: ${href})`);
  } catch (e) {
    failures.push("report: checkout href check failed -> " + e.message);
  }
  await context.close();
  await browser.close();

  if (failures.length) {
    for (const f of failures) console.error("VISUAL FAIL: " + f);
    console.error(`Visual smoke failed with ${failures.length} issue(s).`);
    process.exit(1);
  }
  console.log(`Visual smoke passed (${pages.length} pages x ${viewports.length} viewports + interaction checks).`);
}

main().catch((error) => { console.error(error); process.exit(1); });
