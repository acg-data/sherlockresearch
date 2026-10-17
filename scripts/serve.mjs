#!/usr/bin/env node
// Local preview of sherlock-research/ with the same clean URLs as production
// (/pricing serves pricing.html, unknown paths get 404.html).
//
//   node scripts/serve.mjs [port]     (default 8080)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { SITE_DIR } from '../src/lib.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain',
};

// Resolve a request path to a file in SITE_DIR, or null.
export function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath).replace(/\/+$/, '') || '/index';
  for (const candidate of [clean, `${clean}.html`]) {
    const file = path.join(SITE_DIR, candidate);
    if (file.startsWith(SITE_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

export function createServer() {
  return http.createServer((req, res) => {
    const file = resolve(new URL(req.url, 'http://x').pathname);
    const status = file ? 200 : 404;
    const target = file || path.join(SITE_DIR, '404.html');
    res.writeHead(status, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 8080;
  createServer().listen(port, () => console.log(`serving sherlock-research/ at http://localhost:${port}`));
}
