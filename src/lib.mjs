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

export const industryIcon = (slug, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${industryIcons[slug]}</svg>`;
