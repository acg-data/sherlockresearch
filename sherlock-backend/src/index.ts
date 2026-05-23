import type { Env } from './lib/env';
import { handleAdmin } from './routes/admin';
import { html } from './lib/html';

export { GenerateReportWorkflow } from './workflows/generate-report';

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return html(`<h1>Sherlock backend</h1><p>Admin: <a href="/admin">/admin</a></p>`);
    }
    if (url.pathname === '/health') {
      return new Response('ok', { status: 200 });
    }
    if (url.pathname.startsWith('/admin')) {
      return handleAdmin(req, env, url);
    }
    return new Response('Not found', { status: 404 });
  },

  // Quarterly refresh: scan latest report per (industry, location); enqueue v(N+1) if the
  // most recent generated report is older than ~80 days (gives a small buffer around the
  // exact 90-day mark since cron only fires on the 1st of every 3rd month).
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const cutoff = Math.floor(Date.now() / 1000) - 80 * 24 * 3600;
    const stale = await env.DB.prepare(`
      WITH latest AS (
        SELECT industry_id, location_id, MAX(version) AS v
        FROM reports
        GROUP BY industry_id, location_id
      )
      SELECT r.id AS report_id, r.industry_id, r.location_id, r.survey_id, r.version
      FROM reports r
      JOIN latest l
        ON l.industry_id = r.industry_id
       AND l.location_id = r.location_id
       AND l.v = r.version
      WHERE r.generated_at IS NOT NULL
        AND r.generated_at < ?
        AND r.status IN ('ready', 'sent_to_payhip')
    `).bind(cutoff).all<{ report_id: number; industry_id: number; location_id: number; survey_id: number; version: number }>();

    for (const row of stale.results) {
      const nextVersion = row.version + 1;
      const insert = await env.DB
        .prepare("INSERT INTO reports (industry_id, location_id, survey_id, version, status) VALUES (?, ?, ?, ?, 'queued')")
        .bind(row.industry_id, row.location_id, row.survey_id, nextVersion)
        .run();
      const newReportId = insert.meta.last_row_id as number;
      await env.REPORT_WORKFLOW.create({ params: { reportId: newReportId } });
    }
  },
};
