import type { Env } from './env';

export interface Industry { id: number; slug: string; name: string; template_key: string; }
export interface Location { id: number; slug: string; city: string; state: string; population: number | null; meta: string | null; }
export interface Question { id: number; industry_id: number | null; section_key: string; token_key: string; prompt: string; answer_type: string; required: number; sort_order: number; }
export interface Survey { id: number; industry_id: number; location_id: number; period: string; created_at: number; notes: string | null; }
export interface SurveyResponse { id: number; survey_id: number; question_id: number; answer: string; }
export interface Report { id: number; industry_id: number; location_id: number; survey_id: number; version: number; status: string; r2_key: string | null; payhip_url: string | null; generated_at: number | null; error: string | null; }

export async function listIndustries(env: Env): Promise<Industry[]> {
  const { results } = await env.DB.prepare('SELECT * FROM industries ORDER BY name').all<Industry>();
  return results;
}

export async function getIndustryBySlug(env: Env, slug: string): Promise<Industry | null> {
  return (await env.DB.prepare('SELECT * FROM industries WHERE slug = ?').bind(slug).first<Industry>()) ?? null;
}

export async function getIndustry(env: Env, id: number): Promise<Industry | null> {
  return (await env.DB.prepare('SELECT * FROM industries WHERE id = ?').bind(id).first<Industry>()) ?? null;
}

export async function listLocations(env: Env): Promise<Location[]> {
  const { results } = await env.DB.prepare('SELECT * FROM locations ORDER BY state, city').all<Location>();
  return results;
}

export async function getLocation(env: Env, id: number): Promise<Location | null> {
  return (await env.DB.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first<Location>()) ?? null;
}

export async function questionsForIndustry(env: Env, industryId: number): Promise<Question[]> {
  const { results } = await env.DB
    .prepare('SELECT * FROM questions WHERE industry_id = ? OR industry_id IS NULL ORDER BY sort_order, id')
    .bind(industryId)
    .all<Question>();
  return results;
}

export async function createSurvey(env: Env, industryId: number, locationId: number, period: string, notes: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const res = await env.DB
    .prepare('INSERT INTO surveys (industry_id, location_id, period, created_at, notes) VALUES (?, ?, ?, ?, ?)')
    .bind(industryId, locationId, period, now, notes || null)
    .run();
  return res.meta.last_row_id as number;
}

export async function saveResponses(env: Env, surveyId: number, answers: Map<number, string>): Promise<void> {
  if (answers.size === 0) return;
  const stmts = [...answers.entries()].map(([qid, ans]) =>
    env.DB.prepare(
      'INSERT INTO survey_responses (survey_id, question_id, answer) VALUES (?, ?, ?) ON CONFLICT(survey_id, question_id) DO UPDATE SET answer = excluded.answer'
    ).bind(surveyId, qid, ans)
  );
  await env.DB.batch(stmts);
}

export async function getSurvey(env: Env, id: number): Promise<Survey | null> {
  return (await env.DB.prepare('SELECT * FROM surveys WHERE id = ?').bind(id).first<Survey>()) ?? null;
}

export async function getSurveyByKey(env: Env, industryId: number, locationId: number, period: string): Promise<Survey | null> {
  return (await env.DB
    .prepare('SELECT * FROM surveys WHERE industry_id = ? AND location_id = ? AND period = ?')
    .bind(industryId, locationId, period)
    .first<Survey>()) ?? null;
}

export async function listSurveys(env: Env): Promise<(Survey & { industry_name: string; location_label: string })[]> {
  const { results } = await env.DB.prepare(`
    SELECT s.*, i.name AS industry_name, (l.city || ', ' || l.state) AS location_label
    FROM surveys s
    JOIN industries i ON i.id = s.industry_id
    JOIN locations  l ON l.id = s.location_id
    ORDER BY s.created_at DESC
  `).all<Survey & { industry_name: string; location_label: string }>();
  return results;
}

export async function responsesForSurvey(env: Env, surveyId: number): Promise<Map<string, string>> {
  const { results } = await env.DB.prepare(`
    SELECT q.token_key, r.answer
    FROM survey_responses r
    JOIN questions q ON q.id = r.question_id
    WHERE r.survey_id = ?
  `).bind(surveyId).all<{ token_key: string; answer: string }>();
  return new Map(results.map(r => [r.token_key, r.answer]));
}

export async function nextReportVersion(env: Env, industryId: number, locationId: number): Promise<number> {
  const row = await env.DB
    .prepare('SELECT COALESCE(MAX(version), 0) AS v FROM reports WHERE industry_id = ? AND location_id = ?')
    .bind(industryId, locationId)
    .first<{ v: number }>();
  return (row?.v ?? 0) + 1;
}

export async function createReport(env: Env, industryId: number, locationId: number, surveyId: number, version: number): Promise<number> {
  const res = await env.DB
    .prepare("INSERT INTO reports (industry_id, location_id, survey_id, version, status) VALUES (?, ?, ?, ?, 'queued')")
    .bind(industryId, locationId, surveyId, version)
    .run();
  return res.meta.last_row_id as number;
}

export async function updateReportStatus(env: Env, reportId: number, status: string, fields: Partial<Pick<Report, 'r2_key' | 'payhip_url' | 'generated_at' | 'error'>> = {}): Promise<void> {
  const cols = ['status = ?'];
  const vals: unknown[] = [status];
  for (const [k, v] of Object.entries(fields)) {
    cols.push(`${k} = ?`);
    vals.push(v);
  }
  vals.push(reportId);
  await env.DB.prepare(`UPDATE reports SET ${cols.join(', ')} WHERE id = ?`).bind(...vals).run();
}

export async function getReport(env: Env, id: number): Promise<Report | null> {
  return (await env.DB.prepare('SELECT * FROM reports WHERE id = ?').bind(id).first<Report>()) ?? null;
}

export async function listReports(env: Env): Promise<(Report & { industry_name: string; location_label: string })[]> {
  const { results } = await env.DB.prepare(`
    SELECT r.*, i.name AS industry_name, (l.city || ', ' || l.state) AS location_label
    FROM reports r
    JOIN industries i ON i.id = r.industry_id
    JOIN locations  l ON l.id = r.location_id
    ORDER BY r.id DESC
  `).all<Report & { industry_name: string; location_label: string }>();
  return results;
}

export async function logRunStart(env: Env, reportId: number, workflowId: string): Promise<number> {
  const res = await env.DB
    .prepare("INSERT INTO report_runs (report_id, workflow_id, started_at, status) VALUES (?, ?, ?, 'running')")
    .bind(reportId, workflowId, Math.floor(Date.now() / 1000))
    .run();
  return res.meta.last_row_id as number;
}

export async function logRunFinish(env: Env, runId: number, status: string, log: unknown): Promise<void> {
  await env.DB
    .prepare("UPDATE report_runs SET status = ?, finished_at = ?, log = ? WHERE id = ?")
    .bind(status, Math.floor(Date.now() / 1000), JSON.stringify(log), runId)
    .run();
}
