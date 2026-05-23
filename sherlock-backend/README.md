# Sherlock Backend

Data + admin backend for Sherlock Research. Currently runs the **manual report-writing flow**: Justin enters survey data, exports a markdown blob for Claude.ai, lays out the report in his design tool, uploads the finished PDF back, and hands it to Payhip for distribution.

Designed so the **v2 automation** (Workflows + Browser Rendering + Anthropic API) drops in as an addition rather than a rewrite — the D1 schema, reports table, R2 layout, and admin already model the full automated flow.

## Stack (today)

- **Cloudflare Workers** (free tier) — admin UI + API
- **Cloudflare D1** (free tier) — relational store for questions, surveys, reports
- **Cloudflare R2** (free tier) — storage for finished PDFs
- **Cookie + bearer auth** — single shared admin token

No Workers Paid plan required. No external APIs called from the Worker.

## What the v1 flow looks like

1. Pick an industry + location + period, create a survey
2. Fill in survey responses (one input per question)
3. Click **Export for Claude** — copies a clean markdown blob with all the structured data + a prompt
4. Paste into a Claude.ai conversation, attach 1–2 sample report PDFs, let Claude write the draft
5. Lay out the report in your design tool (Canva / Docs / InDesign), export as PDF
6. Click **Upload PDF** on the same survey — stores it in R2 as v(N+1)
7. Download from the report detail page → upload to Payhip → paste Payhip URL back into the admin

## First-time setup

```bash
# 1. Install
npm install

# 2. Log into Cloudflare (browser opens)
npx wrangler login

# 3. Create the D1 database (returns a database_id — paste it into wrangler.toml)
npx wrangler d1 create sherlock-research

# 4. Create the R2 bucket
npx wrangler r2 bucket create sherlock-reports

# 5. Apply schema migrations to the remote DB
npm run migrate:remote

# 6. Set admin token (any random string — this gates /admin)
npx wrangler secret put ADMIN_TOKEN

# 7. Deploy
npm run deploy
```

After deploy, the Worker is live at `https://sherlock-backend.<account>.workers.dev`. Sign in at `/admin/login`.

## Local development

```bash
npm run migrate:local
npm run dev   # wrangler dev on :8787
```

Local dev uses a SQLite file under `.wrangler/state/` and a local mock for R2.

## v2 plan (in ~4–5 weeks)

When ready to automate report generation:

- Upgrade to **Workers Paid** ($5/mo) for Browser Rendering + Workflows
- Re-add `src/workflows/generate-report.ts` (Workflow with: load → narrate via Claude → render HTML→PDF → upload to R2 → mark ready)
- Re-add `src/templates/<industry>/report.html` + `sections.ts`
- Re-add `src/lib/anthropic.ts` + `src/lib/pdf.ts`
- Re-add `[[workflows]]`, `[browser]`, `[triggers] crons = ["0 9 1 */3 *"]` to `wrangler.toml`
- Re-add a "Generate report" button on the survey row that calls `REPORT_WORKFLOW.create({ params: { reportId } })`
- The existing schema and admin UI already support both flows side-by-side

See `..\.claude\plans\wobbly-purring-conway.md` for the full design.
