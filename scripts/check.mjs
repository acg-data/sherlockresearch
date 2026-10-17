#!/usr/bin/env node
// Static checks for the built site in sherlock-research/.
//
//   node scripts/check.mjs            links, anchors, JSON-LD, headings, metadata, industry copy
//   node scripts/check.mjs --browser  also loads every page in Chromium (Playwright) at 375px and
//                                     1440px and fails on console errors, failed requests or
//                                     horizontal scrolling
//
// Exits non-zero when anything fails.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { SITE_DIR, DATA_DIR, readJSON } from '../src/lib.mjs';

const site = readJSON(path.join(DATA_DIR, 'site.json'));
const reports = site.industries.map((s) => readJSON(path.join(DATA_DIR, 'reports', `${s}.json`)));
const pages = fs.readdirSync(SITE_DIR).filter((f) => f.endsWith('.html')).sort();
const html = Object.fromEntries(pages.map((p) => [p, fs.readFileSync(path.join(SITE_DIR, p), 'utf8')]));
const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

const idsOf = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const ids = Object.fromEntries(pages.map((p) => [p, idsOf(html[p])]));
const stripScripts = (src) => src.replace(/<script[\s\S]*?<\/script>/g, '');

for (const page of pages) {
  const src = html[page];
  const body = stripScripts(src);

  // ---- Links and anchors ----
  for (const [, attr, raw] of body.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const url = raw.replace(/&amp;/g, '&');
    if (url === '#' || url === '') { fail(page, `empty or placeholder ${attr}="${raw}"`); continue; }
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const [pathPart, hash] = url.split('#');
    const file = pathPart.split('?')[0];
    let target = page;
    if (file) {
      const resolved = file.startsWith('/') ? file.slice(1) || 'index.html' : file;
      if (!fs.existsSync(path.join(SITE_DIR, resolved))) { fail(page, `broken ${attr}: ${raw}`); continue; }
      target = resolved;
    }
    if (hash && target.endsWith('.html') && !ids[target]?.has(hash)) fail(page, `missing anchor #${hash} in ${target} (${raw})`);
  }

  // ---- JSON-LD ----
  for (const [, json] of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { fail(page, `invalid JSON-LD: ${e.message}`); }
  }

  // ---- Document basics ----
  if (!/<html lang="en">/.test(src)) fail(page, 'missing <html lang="en">');
  if (!/<title>[^<]+<\/title>/.test(src)) fail(page, 'missing <title>');
  if (!/<main id="main">/.test(src)) fail(page, 'missing <main id="main"> landmark');
  if (page !== '404.html') {
    if (!/<meta name="description" content="[^"]{50,}"/.test(src)) fail(page, 'missing or very short meta description');
    const canonical = src.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const expected = `${site.url}/${page === 'index.html' ? '' : page}`;
    if (canonical !== expected) fail(page, `canonical is ${canonical}, expected ${expected}`);
  }
  const ids2 = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids2.filter((id, i) => ids2.indexOf(id) !== i);
  if (dupes.length) fail(page, `duplicate ids: ${[...new Set(dupes)].join(', ')}`);

  // ---- Headings: one h1, no skipped levels inside <main> ----
  const main = body.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1] || '';
  const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  if (levels.filter((l) => l === 1).length !== 1) fail(page, `expected exactly one <h1>, found ${levels.filter((l) => l === 1).length}`);
  levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) fail(page, `heading jumps from h${levels[i - 1]} to h${l}`); });

  // ---- Images need alt text and dimensions ----
  for (const [tag] of body.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(tag)) fail(page, `<img> without alt: ${tag.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) fail(page, `<img> without width/height: ${tag.slice(0, 80)}`);
  }

  // ---- Copy guard: a report page names no other industry (outside nav, footer and marked blocks) ----
  const report = reports.find((r) => page === `${r.slug}-report.html`);
  if (report) {
    const text = main
      .replace(/<[^>]*data-lint-skip[^>]*>[\s\S]*?<!-- \/lint-skip -->/g, '')
      .replace(/<select[\s\S]*?<\/select>/g, '')
      .replace(/<[^>]+>/g, ' ');
    for (const other of reports.filter((r) => r !== report)) {
      const re = new RegExp(`\\b${other.name}\\b`, 'i');
      const hit = text.match(re);
      if (hit) fail(page, `mentions "${hit[0]}" (copy-paste from the ${other.name} report?)`);
    }
  }
}

// ---- Sitemap matches the files ----
const sitemap = fs.readFileSync(path.join(SITE_DIR, 'sitemap.xml'), 'utf8');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const file = loc.replace(`${site.url}/`, '') || 'index.html';
  if (!fs.existsSync(path.join(SITE_DIR, file))) fail('sitemap.xml', `lists missing page ${file}`);
}
for (const page of pages.filter((p) => p !== '404.html')) {
  if (!sitemap.includes(`${site.url}/${page === 'index.html' ? '' : page}<`)) fail('sitemap.xml', `does not list ${page}`);
}

// ---- Optional browser pass ----
if (process.argv.includes('--browser')) await browserPass();

if (failures.length) {
  console.error(`check: ${failures.length} problem(s)\n  ` + failures.join('\n  '));
  process.exit(1);
}
console.log(`check: ${pages.length} pages OK`);

async function browserPass() {
  let chromium;
  try {
    ({ chromium } = createRequire(import.meta.url)('playwright'));
  } catch {
    console.warn('check: Playwright not found, skipping the browser pass (npm i -D playwright, or set NODE_PATH to a global install).');
    return;
  }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml' };
  const server = http.createServer((req, res) => {
    const file = path.join(SITE_DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(SITE_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  try {
    for (const width of [375, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      for (const page of pages) {
        const tab = await context.newPage();
        const problems = [];
        tab.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
        tab.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
        tab.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) problems.push(`request failed: ${r.url()}`); });
        tab.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
        await tab.goto(base + page, { waitUntil: 'load' });
        const [sw, cw] = await tab.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        if (sw > cw) problems.push(`scrolls horizontally at ${width}px (${sw}px wide)`);
        problems.forEach((p) => fail(`${page} @${width}`, p));
        await tab.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}
