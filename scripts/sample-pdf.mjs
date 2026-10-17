#!/usr/bin/env node
// Renders the free sample PDF and its preview images from src/templates/sample-pdf.mjs.
//
//   node scripts/sample-pdf.mjs    (needs Playwright; run again whenever the Landscaping data changes)
//
// Writes sherlock-research/assets/sherlock-landscaping-sample.pdf and
// sherlock-research/assets/sample-page-1.jpg / sample-page-2.jpg.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SITE_DIR, DATA_DIR, readJSON } from '../src/lib.mjs';
import { render } from '../src/templates/sample-pdf.mjs';

const site = readJSON(path.join(DATA_DIR, 'site.json'));
const report = readJSON(path.join(DATA_DIR, 'reports', 'landscaping.json'));

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error('sample-pdf: Playwright is required (npm i -D playwright, or set NODE_PATH to a global install).');
  process.exit(1);
}

const html = render(report, site);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const pdfPath = path.join(SITE_DIR, 'assets', 'sherlock-landscaping-sample.pdf');
  await page.pdf({ path: pdfPath, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  console.log(`sample-pdf: wrote ${path.relative(process.cwd(), pdfPath)} (${Math.round(fs.statSync(pdfPath).size / 1024)} KB)`);

  // Preview images for the sample page: ~735px wide JPEGs (2x the largest thumbnail size).
  const shots = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 0.9 });
  await shots.setContent(html, { waitUntil: 'networkidle' });
  await shots.evaluate(() => document.fonts.ready);
  const pages = await shots.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const out = path.join(SITE_DIR, 'assets', `sample-page-${i + 1}.jpg`);
    await pages[i].screenshot({ path: out, type: 'jpeg', quality: 85 });
    console.log(`sample-pdf: wrote ${path.relative(process.cwd(), out)}`);
  }
} finally {
  await browser.close();
}
