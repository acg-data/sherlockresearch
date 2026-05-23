import type { Env } from '../lib/env';
import { isAuthed, setAuthCookie, clearAuthCookie } from '../lib/auth';
import { html, redirect, escape, layout } from '../lib/html';
import {
  listIndustries, getIndustryBySlug, getIndustry,
  listLocations, getLocation,
  questionsForIndustry,
  createSurvey, saveResponses, listSurveys, getSurvey, getSurveyByKey, responsesForSurvey,
  createReport, nextReportVersion, listReports, getReport, updateReportStatus,
} from '../lib/d1';
import { uploadPdf, fetchPdf } from '../lib/r2';
import { buildClaudeExport } from '../lib/export';

export async function handleAdmin(req: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;

  if (path === '/admin/login' && req.method === 'GET') return loginForm();
  if (path === '/admin/login' && req.method === 'POST') return loginSubmit(req, env);
  if (path === '/admin/logout' && req.method === 'POST') return logout();

  if (!isAuthed(req, env)) return redirect('/admin/login');

  if (path === '/admin' || path === '/admin/') return dashboard(env);
  if (path === '/admin/surveys' && req.method === 'POST') return createSurveyHandler(req, env);
  if (path === '/admin/surveys/new') return newSurveyPicker(env, url);
  if (path === '/admin/surveys/edit') return editSurveyForm(env, url);

  const surveyExport = path.match(/^\/admin\/surveys\/(\d+)\/export$/);
  if (surveyExport) return surveyExportPage(env, parseInt(surveyExport[1], 10));

  const surveyExportRaw = path.match(/^\/admin\/surveys\/(\d+)\/export\.md$/);
  if (surveyExportRaw) return surveyExportRawHandler(env, parseInt(surveyExportRaw[1], 10));

  const surveyUploadPage = path.match(/^\/admin\/surveys\/(\d+)\/upload$/);
  if (surveyUploadPage && req.method === 'GET') return uploadPdfForm(env, parseInt(surveyUploadPage[1], 10));
  if (surveyUploadPage && req.method === 'POST') return uploadPdfHandler(req, env, parseInt(surveyUploadPage[1], 10));

  if (path === '/admin/reports' && req.method === 'GET') return reportsList(env);

  const reportDetail = path.match(/^\/admin\/reports\/(\d+)$/);
  if (reportDetail) return reportDetailPage(env, parseInt(reportDetail[1], 10));

  const reportPdf = path.match(/^\/admin\/reports\/(\d+)\/pdf$/);
  if (reportPdf) return reportPdfHandler(env, parseInt(reportPdf[1], 10));

  const reportPayhip = path.match(/^\/admin\/reports\/(\d+)\/payhip$/);
  if (reportPayhip && req.method === 'POST') return reportPayhipUpdate(req, env, parseInt(reportPayhip[1], 10));

  return new Response('Not found', { status: 404 });
}

// ----------------------- login -----------------------

function loginForm(error = ''): Response {
  return html(`<!doctype html><html><head><meta charset=utf-8><title>Sign in — Sherlock Admin</title>
<style>body{font-family:system-ui;background:#0E1B2B;color:#fff;min-height:100vh;display:grid;place-items:center;margin:0}
form{background:#15263A;padding:32px;border-radius:12px;display:flex;flex-direction:column;gap:14px;width:320px;border:1px solid rgba(255,255,255,.1)}
h1{margin:0;font-size:1.3rem}input{padding:11px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:#0a1521;color:#fff;font:inherit}
button{background:#E26C2C;color:#fff;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;font:inherit}
.err{color:#ff8b6a;font-size:.85rem}</style></head>
<body><form method="post" action="/admin/login">
<h1>Sherlock Admin</h1>
<input name="token" type="password" placeholder="Admin token" autofocus required>
<button type="submit">Sign in</button>
${error ? `<div class="err">${escape(error)}</div>` : ''}
</form></body></html>`);
}

async function loginSubmit(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const token = String(form.get('token') ?? '');
  if (token !== env.ADMIN_TOKEN) return loginForm('Wrong token');
  return redirect('/admin', { 'Set-Cookie': setAuthCookie(token) });
}

function logout(): Response {
  return redirect('/admin/login', { 'Set-Cookie': clearAuthCookie() });
}

// ----------------------- dashboard -----------------------

async function dashboard(env: Env): Promise<Response> {
  const [industries, locations, surveys, reports] = await Promise.all([
    listIndustries(env),
    listLocations(env),
    listSurveys(env),
    listReports(env),
  ]);

  const surveyRows = surveys.length === 0
    ? `<div class="empty">No surveys yet. Pick an industry and location below to create one.</div>`
    : `<table><thead><tr><th>Industry</th><th>Location</th><th>Period</th><th>Created</th><th></th></tr></thead><tbody>${
        surveys.map(s => `<tr>
          <td>${escape(s.industry_name)}</td>
          <td>${escape(s.location_label)}</td>
          <td><b>${escape(s.period)}</b></td>
          <td class="muted">${new Date(s.created_at * 1000).toLocaleDateString()}</td>
          <td class="row-actions">
            <a class="btn ghost" href="/admin/surveys/edit?id=${s.id}">Edit</a>
            <a class="btn ghost" href="/admin/surveys/${s.id}/export">Export for Claude</a>
            <a class="btn" href="/admin/surveys/${s.id}/upload">Upload PDF</a>
          </td>
        </tr>`).join('')
      }</tbody></table>`;

  const recentReports = reports.slice(0, 8);
  const reportRows = recentReports.length === 0
    ? `<div class="empty">No PDFs uploaded yet.</div>`
    : `<table><thead><tr><th>Report</th><th>Industry × Location</th><th>v</th><th>Status</th><th></th></tr></thead><tbody>${
        recentReports.map(r => `<tr>
          <td>#${r.id}</td>
          <td>${escape(r.industry_name)} · ${escape(r.location_label)}</td>
          <td>v${r.version}</td>
          <td><span class="badge ${r.status}">${escape(r.status.replace(/_/g, ' '))}</span></td>
          <td><a class="btn ghost" href="/admin/reports/${r.id}">Open</a></td>
        </tr>`).join('')
      }</tbody></table>`;

  const newSurveyForm = `
    <form class="stack" method="get" action="/admin/surveys/new" style="max-width:420px">
      <h2 style="margin:0">New survey</h2>
      <label>Industry
        <select name="industry" required>${industries.map(i => `<option value="${escape(i.slug)}">${escape(i.name)}</option>`).join('')}</select>
      </label>
      <label>Location
        <select name="location" required>${locations.map(l => `<option value="${escape(l.slug)}">${escape(l.city)}, ${escape(l.state)}</option>`).join('')}</select>
      </label>
      <label>Period (e.g. Q2-2026)
        <input name="period" required placeholder="Q2-2026">
      </label>
      <button class="btn" type="submit">Continue →</button>
    </form>`;

  const body = `
    <h1>Dashboard</h1>
    <p class="muted">${industries.length} ${industries.length === 1 ? 'industry' : 'industries'} · ${locations.length} locations · ${surveys.length} surveys · ${reports.length} reports</p>
    <h2>Workflow</h2>
    <p class="muted" style="max-width:60em">For each survey: <b>1.</b> Enter responses · <b>2.</b> "Export for Claude" copies a markdown blob with everything Claude needs — paste it into a Claude.ai conversation along with sample report PDFs · <b>3.</b> Lay out the report in your design tool, export as PDF · <b>4.</b> "Upload PDF" stores the finished report and gives you a download link for Payhip.</p>
    <h2>Surveys</h2>
    ${surveyRows}
    <h2>Recent reports</h2>
    ${reportRows}
    <h2>Start a new survey</h2>
    ${newSurveyForm}`;

  return html(layout('Dashboard', body, { activeNav: '/admin' }));
}

// ----------------------- survey form -----------------------

async function newSurveyPicker(env: Env, url: URL): Promise<Response> {
  const industrySlug = url.searchParams.get('industry');
  const locationSlug = url.searchParams.get('location');
  const period = url.searchParams.get('period');
  if (!industrySlug || !locationSlug || !period) return redirect('/admin');

  const industry = await getIndustryBySlug(env, industrySlug);
  if (!industry) return new Response('Industry not found', { status: 404 });
  const location = (await listLocations(env)).find(l => l.slug === locationSlug);
  if (!location) return new Response('Location not found', { status: 404 });

  const existing = await getSurveyByKey(env, industry.id, location.id, period);
  if (existing) return redirect(`/admin/surveys/edit?id=${existing.id}`);

  return surveyFormResponse(env, industry.id, location.id, period, null, new Map());
}

async function editSurveyForm(env: Env, url: URL): Promise<Response> {
  const id = parseInt(url.searchParams.get('id') ?? '', 10);
  if (!id) return redirect('/admin');
  const survey = await getSurvey(env, id);
  if (!survey) return new Response('Survey not found', { status: 404 });
  const responses = await responsesForSurvey(env, id);
  return surveyFormResponse(env, survey.industry_id, survey.location_id, survey.period, survey.id, responses);
}

async function surveyFormResponse(
  env: Env,
  industryId: number,
  locationId: number,
  period: string,
  surveyId: number | null,
  responses: Map<string, string>,
): Promise<Response> {
  const [industry, location, questions] = await Promise.all([
    getIndustry(env, industryId),
    getLocation(env, locationId),
    questionsForIndustry(env, industryId),
  ]);
  if (!industry || !location) return new Response('Not found', { status: 404 });

  const groups = new Map<string, typeof questions>();
  for (const q of questions) {
    if (!groups.has(q.section_key)) groups.set(q.section_key, []);
    groups.get(q.section_key)!.push(q);
  }

  const inputFor = (q: typeof questions[number], val: string) => {
    if (q.answer_type === 'json' || q.prompt.length > 80) {
      return `<textarea name="q_${q.id}" rows="3" ${q.required ? 'required' : ''}>${escape(val)}</textarea>`;
    }
    return `<input type="text" name="q_${q.id}" value="${escape(val)}" ${q.required ? 'required' : ''}>`;
  };

  const sections = [...groups.entries()].map(([sectionKey, qs]) => `
    <h2 style="margin-top:28px">${escape(sectionKey.replace(/_/g, ' '))}</h2>
    ${qs.map(q => `
      <label>
        <span><b>${escape(q.prompt)}</b> <span class="muted" style="font-weight:400">(${escape(q.answer_type)} · {{${escape(q.token_key)}}})</span></span>
        ${inputFor(q, responses.get(q.token_key) ?? '')}
      </label>
    `).join('')}`).join('');

  const afterSaveActions = surveyId
    ? `<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
        <button class="btn" type="submit">Save survey</button>
        <a class="btn ghost" href="/admin/surveys/${surveyId}/export">Export for Claude</a>
        <a class="btn ghost" href="/admin/surveys/${surveyId}/upload">Upload PDF</a>
        <a class="btn ghost" href="/admin">Back</a>
      </div>`
    : `<div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn" type="submit">Save survey</button>
        <a class="btn ghost" href="/admin">Cancel</a>
      </div>`;

  const body = `
    <h1>${escape(industry.name)} survey — ${escape(location.city)}, ${escape(location.state)}</h1>
    <p class="muted">Period: <b>${escape(period)}</b>${surveyId ? ` · editing survey #${surveyId}` : ' · new survey'}</p>
    <form class="stack" method="post" action="/admin/surveys" style="max-width:760px;margin-top:20px">
      <input type="hidden" name="industry_id" value="${industry.id}">
      <input type="hidden" name="location_id" value="${location.id}">
      <input type="hidden" name="period" value="${escape(period)}">
      ${surveyId ? `<input type="hidden" name="survey_id" value="${surveyId}">` : ''}
      <label>Notes (optional)
        <textarea name="notes" rows="2"></textarea>
      </label>
      ${sections}
      ${afterSaveActions}
    </form>`;

  return html(layout('Survey', body));
}

async function createSurveyHandler(req: Request, env: Env): Promise<Response> {
  const form = await req.formData();
  const industryId = parseInt(String(form.get('industry_id')), 10);
  const locationId = parseInt(String(form.get('location_id')), 10);
  const period = String(form.get('period') ?? '');
  const notes = String(form.get('notes') ?? '');
  const existingId = form.get('survey_id') ? parseInt(String(form.get('survey_id')), 10) : null;

  if (!industryId || !locationId || !period) return new Response('Missing fields', { status: 400 });

  const surveyId = existingId ?? await createSurvey(env, industryId, locationId, period, notes);

  const questions = await questionsForIndustry(env, industryId);
  const answers = new Map<number, string>();
  for (const q of questions) {
    const v = form.get(`q_${q.id}`);
    if (v != null && String(v).trim() !== '') answers.set(q.id, String(v));
  }
  await saveResponses(env, surveyId, answers);

  return redirect(`/admin/surveys/edit?id=${surveyId}`);
}

// ----------------------- export for Claude -----------------------

async function surveyExportPage(env: Env, surveyId: number): Promise<Response> {
  const survey = await getSurvey(env, surveyId);
  if (!survey) return new Response('Survey not found', { status: 404 });
  const markdown = await buildClaudeExport(env, surveyId);

  const body = `
    <h1>Export for Claude — Survey #${survey.id}</h1>
    <p class="muted" style="max-width:60em">Copy the markdown block below and paste it into a fresh Claude.ai conversation. Then attach 1–2 sample Sherlock report PDFs so Claude can match the structure and tone. The output will be a complete report draft you can paste into your design tool for layout.</p>
    <div style="display:flex;gap:10px;margin:14px 0">
      <button class="btn" type="button" onclick="navigator.clipboard.writeText(document.getElementById('exp').value).then(()=>this.textContent='Copied ✓')">Copy to clipboard</button>
      <a class="btn ghost" href="/admin/surveys/${survey.id}/export.md" download="survey-${survey.id}-export.md">Download .md</a>
      <a class="btn ghost" href="/admin/surveys/edit?id=${survey.id}">Back to survey</a>
    </div>
    <textarea id="exp" style="width:100%;min-height:60vh;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.82rem;line-height:1.55;padding:18px;border:1px solid #E6DECF;border-radius:8px;background:#fff" readonly>${escape(markdown)}</textarea>`;

  return html(layout(`Export #${survey.id}`, body));
}

async function surveyExportRawHandler(env: Env, surveyId: number): Promise<Response> {
  const survey = await getSurvey(env, surveyId);
  if (!survey) return new Response('Not found', { status: 404 });
  const markdown = await buildClaudeExport(env, surveyId);
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="survey-${surveyId}-export.md"`,
    },
  });
}

// ----------------------- upload finished PDF -----------------------

async function uploadPdfForm(env: Env, surveyId: number): Promise<Response> {
  const survey = await getSurvey(env, surveyId);
  if (!survey) return new Response('Survey not found', { status: 404 });
  const [industry, location] = await Promise.all([
    getIndustry(env, survey.industry_id),
    getLocation(env, survey.location_id),
  ]);
  const nextV = await nextReportVersion(env, survey.industry_id, survey.location_id);

  const body = `
    <h1>Upload finished PDF</h1>
    <p class="muted">${escape(industry?.name ?? '?')} · ${escape(location?.city ?? '?')}, ${escape(location?.state ?? '?')} · ${escape(survey.period)}</p>
    <p class="muted">This will be saved as <b>v${nextV}</b> of this report.</p>
    <form class="stack" method="post" enctype="multipart/form-data" action="/admin/surveys/${survey.id}/upload" style="max-width:520px;margin-top:20px">
      <label>PDF file
        <input type="file" name="pdf" accept="application/pdf" required>
      </label>
      <div style="display:flex;gap:10px">
        <button class="btn" type="submit">Upload</button>
        <a class="btn ghost" href="/admin">Cancel</a>
      </div>
    </form>`;

  return html(layout('Upload PDF', body));
}

async function uploadPdfHandler(req: Request, env: Env, surveyId: number): Promise<Response> {
  const survey = await getSurvey(env, surveyId);
  if (!survey) return new Response('Survey not found', { status: 404 });

  const form = await req.formData();
  const fileEntry = form.get('pdf');
  if (!fileEntry || typeof fileEntry === 'string') return new Response('Missing PDF file', { status: 400 });
  const file = fileEntry as unknown as { type: string; arrayBuffer(): Promise<ArrayBuffer> };
  if (file.type && file.type !== 'application/pdf') return new Response('File must be PDF', { status: 400 });

  const [industry, location] = await Promise.all([
    getIndustry(env, survey.industry_id),
    getLocation(env, survey.location_id),
  ]);
  if (!industry || !location) return new Response('Industry/location missing', { status: 500 });

  const version = await nextReportVersion(env, survey.industry_id, survey.location_id);
  const reportId = await createReport(env, survey.industry_id, survey.location_id, surveyId, version);

  const key = `reports/${industry.slug}-${location.slug}/v${version}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadPdf(env, key, bytes);

  await updateReportStatus(env, reportId, 'ready', {
    r2_key: key,
    generated_at: Math.floor(Date.now() / 1000),
  });

  return redirect(`/admin/reports/${reportId}`);
}

// ----------------------- reports -----------------------

async function reportsList(env: Env): Promise<Response> {
  const reports = await listReports(env);
  const rows = reports.length === 0
    ? `<div class="empty">No reports yet.</div>`
    : `<table><thead><tr><th>#</th><th>Industry × Location</th><th>v</th><th>Status</th><th>Uploaded</th><th></th></tr></thead><tbody>${
        reports.map(r => `<tr>
          <td>#${r.id}</td>
          <td>${escape(r.industry_name)} · ${escape(r.location_label)}</td>
          <td>v${r.version}</td>
          <td><span class="badge ${r.status}">${escape(r.status.replace(/_/g, ' '))}</span></td>
          <td class="muted">${r.generated_at ? new Date(r.generated_at * 1000).toLocaleString() : '—'}</td>
          <td><a class="btn ghost" href="/admin/reports/${r.id}">Open</a></td>
        </tr>`).join('')
      }</tbody></table>`;
  return html(layout('Reports', `<h1>Reports</h1>${rows}`, { activeNav: '/admin/reports' }));
}

async function reportDetailPage(env: Env, id: number): Promise<Response> {
  const report = await getReport(env, id);
  if (!report) return new Response('Report not found', { status: 404 });
  const [industry, location] = await Promise.all([
    getIndustry(env, report.industry_id),
    getLocation(env, report.location_id),
  ]);

  const statusBadge = `<span class="badge ${report.status}">${escape(report.status.replace(/_/g, ' '))}</span>`;
  const pdfLink = report.r2_key
    ? `<a class="btn" href="/admin/reports/${report.id}/pdf" target="_blank">View / download PDF</a>`
    : `<span class="muted">No PDF uploaded</span>`;

  const payhipForm = (report.status === 'ready' || report.status === 'sent_to_payhip')
    ? `<form class="stack" method="post" action="/admin/reports/${report.id}/payhip" style="margin-top:20px">
        <h2 style="margin:0">Payhip handoff</h2>
        <p class="muted">After uploading the PDF to Payhip, paste the public product URL here.</p>
        <label>Payhip URL<input name="payhip_url" type="url" value="${escape(report.payhip_url ?? '')}" placeholder="https://payhip.com/b/..."></label>
        <button class="btn" type="submit">${report.status === 'sent_to_payhip' ? 'Update Payhip URL' : 'Mark as sent to Payhip'}</button>
      </form>`
    : '';

  const body = `
    <h1>Report #${report.id} — ${escape(industry?.name ?? '?')} · ${escape(location?.city ?? '?')}, ${escape(location?.state ?? '?')}</h1>
    <p class="meta-line">Version v${report.version} · ${statusBadge}${report.generated_at ? ` · uploaded ${new Date(report.generated_at * 1000).toLocaleString()}` : ''}</p>
    <div style="margin-top:20px;display:flex;gap:10px">${pdfLink}<a class="btn ghost" href="/admin">← Back to dashboard</a></div>
    ${payhipForm}`;

  return html(layout(`Report #${report.id}`, body, { activeNav: '/admin/reports' }));
}

async function reportPdfHandler(env: Env, id: number): Promise<Response> {
  const report = await getReport(env, id);
  if (!report || !report.r2_key) return new Response('PDF not uploaded', { status: 404 });
  return fetchPdf(env, report.r2_key);
}

async function reportPayhipUpdate(req: Request, env: Env, id: number): Promise<Response> {
  const form = await req.formData();
  const payhipUrl = String(form.get('payhip_url') ?? '').trim();
  await updateReportStatus(env, id, 'sent_to_payhip', { payhip_url: payhipUrl || null });
  return redirect(`/admin/reports/${id}`);
}
