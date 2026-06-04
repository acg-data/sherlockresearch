import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const pages = [
  "index.html",
  "pricing.html",
  "reports.html",
  "sample.html",
  "contact.html",
  "success.html",
  "landscaping-report.html",
  "dental-report.html",
  "garage-door-report.html"
];

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 900 }
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("Playwright is not installed; skipping visual smoke. Run `npm i -D playwright` if screenshot QA is needed.");
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const file of pages) {
      const url = pathToFileURL(path.join(root, file)).href;
      await page.goto(url);
      await page.waitForLoadState("domcontentloaded");
      const title = await page.title();
      const h1 = await page.locator("h1").first().textContent();
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (!title || !h1) throw new Error(`${file} failed visual smoke title/h1 check`);
      if (horizontalOverflow) throw new Error(`${file} has horizontal overflow at ${viewport.name}`);
      console.log(`Visual smoke ok (${viewport.name}): ${file} - ${title}`);
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
