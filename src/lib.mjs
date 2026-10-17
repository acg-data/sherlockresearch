// Small helpers shared by the partials and page templates.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_DIR = path.join(ROOT, 'sherlock-research');
export const DATA_DIR = path.join(ROOT, 'src', 'data');

export const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// Escape text for HTML element content and attribute values.
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// JSON for <script> blocks: keep "</script>" and HTML comments from closing the tag.
export const scriptJSON = (value, indent = 2) =>
  JSON.stringify(value, null, indent).replace(/</g, '\\u003c');

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Pages are served without the .html extension (Cloudflare serves /pricing from pricing.html).
export const pageUrl = (file) => (file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, ''));

export const formatPrice = (plan) => '$' + plan.price.toLocaleString('en-US') + (plan.unit || '');

// Content hash for cache-busting asset URLs (stable across builds).
const hashes = new Map();
export function assetVersion(rel) {
  if (!hashes.has(rel)) {
    const buf = fs.readFileSync(path.join(SITE_DIR, rel));
    hashes.set(rel, crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8));
  }
  return hashes.get(rel);
}

export const billions = (v) => '$' + v.toFixed(1) + 'B';

// Actual years from the data file plus projected years at the stated CAGR,
// so the chart can never contradict the headline growth rate.
export function marketSeries(market) {
  const years = Object.keys(market.actual).map(Number).sort((a, b) => a - b);
  const last = years[years.length - 1];
  const series = years.map((y) => ({ year: String(y), value: market.actual[y], kind: 'actual' }));
  let value = market.actual[last];
  for (let y = last + 1; y <= market.projectThrough; y++) {
    value *= 1 + market.cagr / 100;
    series.push({ year: y + 'E', value: Math.round(value * 10) / 10, kind: 'projected' });
  }
  series[years.length - 1].kind = 'latest';
  return { series, latestYear: last, latestValue: market.actual[last], firstProjected: last + 1 };
}

export const icons = {
  check: (size = 14, width = 2.5) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  dash: (size = 14) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  foxMark: () =>
    `<svg viewBox="0 0 32 32" fill="white" aria-hidden="true"><path d="M16 4 L8 10 L6 8 L4 14 L8 16 L8 22 Q16 28 24 22 L24 16 L28 14 L26 8 L24 10 Z M12 14 Q14 13 14 16 Q12 17 12 14 Z M18 14 Q20 13 20 16 Q18 17 18 14 Z M14 19 Q16 21 18 19 Z"/></svg>`,
  caret: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
  shield: (size = 34) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
};

// One line-icon per industry (Lucide-style, 24px grid), used on every page that lists reports.
export const industryIcons = {
  landscaping: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  roofing: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  hvac: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
  'pest-control': '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
};

Object.assign(industryIcons, {
  plumbing: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  electrical: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'med-spa': '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
});

// Fallback icon per catalog category.
export const categoryIcons = {
  'home-services': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  healthcare: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  automotive: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  hospitality: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'real-estate-finance': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  'professional-services': '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  education: '<path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  'local-services': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
};

export const svgIcon = (paths, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

// `r` is a report from loadCatalog() (or a category slug for the category icon).
export const industryIcon = (r, size = 22) =>
  svgIcon(typeof r === 'string' ? categoryIcons[r] : industryIcons[r.slug] || categoryIcons[r.category], size);

// ---------------------------------------------------------------------------
// Catalog: src/data/catalog.json lists every published report; the featured ones also have
// src/data/reports/<slug>.json with richer page content (lead, insights, market figures, reviews).
const DEFAULT_FOCUS = 'demand, pricing, local competition, hiring pressure, customer switching, channel mix, and operator economics';
const COVER = {
  'home-services': ['#34495e', '#1c2833'],
  healthcare: ['#1f4e5f', '#12303a'],
  automotive: ['#3b3f46', '#1f2226'],
  hospitality: ['#5a3a2e', '#2e1d17'],
  'real-estate-finance': ['#2c3e66', '#18233b'],
  'professional-services': ['#3a3657', '#1f1d30'],
  education: ['#2f5249', '#1a2e29'],
  'local-services': ['#4b3a5a', '#271e30'],
};
const lowerName = (name) => name.split(' ').map((w) => (w === w.toUpperCase() ? w : w.toLowerCase())).join(' ');

export function loadCatalog(site) {
  const catalog = readJSON(path.join(DATA_DIR, 'catalog.json'));
  const categoryName = Object.fromEntries(catalog.categories.map((c) => [c.slug, c.name]));
  const reports = catalog.industries.map((entry) => {
    const richFile = path.join(DATA_DIR, 'reports', `${entry.slug}.json`);
    const rich = fs.existsSync(richFile) ? readJSON(richFile) : {};
    const nameLower = rich.nameLower || lowerName(entry.name);
    const serviceLabel = entry.serviceLabel || `${nameLower} services`;
    const focus = entry.focus || DEFAULT_FOCUS;
    if (!categoryName[entry.category]) throw new Error(`catalog: ${entry.slug} has unknown category "${entry.category}"`);
    return {
      ...rich,
      ...entry,
      nameLower,
      serviceLabel,
      focus,
      categoryName: categoryName[entry.category],
      presell: entry.status === 'presell',
      featured: site.featured.includes(entry.slug),
      summary: rich.summary || `Demand, pricing, competition, and growth opportunities for U.S. ${serviceLabel} businesses.`,
      heroDescription: rich.heroDescription || `A clear read on ${focus}, written for owners and operators of ${serviceLabel} businesses.`,
      metaDescription: rich.metaDescription || `The ${site.edition} ${entry.name} Industry Report from Sherlock Research: ${focus}, with recommended next moves for U.S. operators.`,
      ogDescription: rich.ogDescription || `${entry.name} market intelligence for operators: ${focus}. PDF report from Sherlock Research.`,
      coverGradient: rich.coverGradient || COVER[entry.category],
    };
  });
  for (const slug of site.featured) {
    if (!reports.find((r) => r.slug === slug && r.lead)) throw new Error(`site.json featured "${slug}" needs src/data/reports/${slug}.json`);
  }
  return { categories: catalog.categories, reports, pipeline: catalog.pipeline };
}
