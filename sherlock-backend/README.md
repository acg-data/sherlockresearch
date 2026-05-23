# Sherlock Backend

Report generation backend for Sherlock Research. Runs entirely on Cloudflare (Workers + D1 + R2 + Workflows + Browser Rendering).

## What it does

1. Justin loads survey/research inputs via the admin UI (one record per industry × location × period)
2. Clicking "Generate" runs a Workflow that merges the data into the industry template, calls Claude for narrative sections, renders HTML→PDF, stores in R2
3. Quarterly Cron Trigger automatically regenerates each report on a fresh data vintage
4. Justin downloads the finished PDF from the report detail page and uploads it to Payhip for distribution

## First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Log into Cloudflare
npx wrangler login

# 3. Create the D1 database (returns a database_id — paste it into wrangler.toml)
npx wrangler d1 create sherlock-research

# 4. Create the R2 bucket
npx wrangler r2 bucket create sherlock-reports

# 5. Apply schema migrations to the remote DB
npm run migrate:remote

# 6. Set secrets
npx wrangler secret put ANTHROPIC_API_KEY   # paste your Claude API key when prompted
npx wrangler secret put ADMIN_TOKEN         # pick any random string — this gates /admin

# 7. Deploy
npm run deploy
```

After deploy, the Worker is live at `https://sherlock-backend.<your-account>.workers.dev`. Hit `/admin` with header `Authorization: Bearer <ADMIN_TOKEN>` (or paste the token into the login form at `/admin/login`).

## Local development

```bash
npm run migrate:local   # apply schema to local D1
npm run dev             # starts wrangler dev on :8787
```

Local dev uses a SQLite file under `.wrangler/state/` for D1 and a local mock for R2.

## Architecture

```
Request → src/index.ts (router)
            ├─ /admin/*    → src/routes/admin.ts
            └─ scheduled   → cron handler (quarterly refresh)

Generate report → REPORT_WORKFLOW.create()
                  ↓
                  src/workflows/generate-report.ts
                    loadInputs (D1)
                    computeDerived (pure)
                    renderBase (template.ts)
                    narrateSection × N (anthropic.ts)
                    renderPdf (pdf.ts → Browser Rendering)
                    upload (r2.ts)
                    finalize (D1)
```

See `..\.claude\plans\wobbly-purring-conway.md` for the full design doc.
