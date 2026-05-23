import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import type { Env } from '../lib/env';
import {
  getReport, getSurvey, getIndustry, getLocation,
  responsesForSurvey, updateReportStatus, logRunStart, logRunFinish,
} from '../lib/d1';
import { renderTokens, spliceNarrative, dropUnfilledNarratives } from '../lib/template';
import { narrate } from '../lib/anthropic';
import { htmlToPdf } from '../lib/pdf';
import { uploadPdf } from '../lib/r2';

// Templates registered by industry template_key.
import landscapingTemplate from '../templates/landscaping/report.html';
import { sections as landscapingSections } from '../templates/landscaping/sections';

const REGISTRY: Record<string, { template: string; sections: typeof landscapingSections }> = {
  landscaping: { template: landscapingTemplate, sections: landscapingSections },
};

export interface ReportParams {
  reportId: number;
}

export class GenerateReportWorkflow extends WorkflowEntrypoint<Env, ReportParams> {
  async run(event: WorkflowEvent<ReportParams>, step: WorkflowStep) {
    const { reportId } = event.payload;
    const env = this.env;

    const runId = await step.do('record-run-start', async () => {
      return logRunStart(env, reportId, event.instanceId);
    });

    try {
      // ---- 1. Load inputs ------------------------------------------------
      const inputs = await step.do('load-inputs', async () => {
        const report = await getReport(env, reportId);
        if (!report) throw new Error(`Report ${reportId} not found`);
        await updateReportStatus(env, reportId, 'running');

        const survey = await getSurvey(env, report.survey_id);
        if (!survey) throw new Error(`Survey ${report.survey_id} not found`);

        const industry = await getIndustry(env, report.industry_id);
        const location = await getLocation(env, report.location_id);
        if (!industry || !location) throw new Error('Industry or location missing');

        const responses = await responsesForSurvey(env, report.survey_id);
        return {
          report,
          survey,
          industry,
          location,
          responses: Object.fromEntries(responses),
        };
      });

      // ---- 2. Compute derived values ------------------------------------
      const tokens = await step.do('compute-derived', async () => {
        const t: Record<string, string> = { ...inputs.responses };
        t.industry_name = inputs.industry.name;
        t.industry_name_lower = inputs.industry.name.toLowerCase();
        t.location_label = `${inputs.location.city}, ${inputs.location.state}`;
        t.period = inputs.survey.period;
        t.version = String(inputs.report.version);
        t.report_id = String(inputs.report.id);
        t.generated_date = new Date().toISOString().slice(0, 10);
        return t;
      });

      const registry = REGISTRY[inputs.industry.template_key];
      if (!registry) throw new Error(`No template registered for ${inputs.industry.template_key}`);

      // ---- 3. Render the token-substituted base HTML --------------------
      const baseHtml = await step.do('render-base', async () => {
        return renderTokens(registry.template, new Map(Object.entries(tokens)));
      });

      // ---- 4. Generate narrative sections sequentially -----------------
      let html = baseHtml;
      for (const section of registry.sections) {
        if (!section.llm) continue;
        const narrativeHtml = await step.do(`narrate-${section.key}`, async () => {
          const userPrompt = section.prompt({
            industryName: inputs.industry.name,
            locationLabel: tokens.location_label,
            period: tokens.period,
            tokens,
          });
          const text = await narrate({
            apiKey: env.ANTHROPIC_API_KEY,
            systemPrompt: section.system,
            userPrompt,
            maxTokens: section.maxTokens ?? 800,
          });
          // Defensive: if model returned text without <p>, wrap it.
          return text.trim().startsWith('<p') ? text : `<p>${text.replace(/\n\n+/g, '</p><p>')}</p>`;
        });
        html = spliceNarrative(html, section.key, narrativeHtml);
      }
      html = dropUnfilledNarratives(html);

      // ---- 5. Render PDF ------------------------------------------------
      const pdfKey = `reports/${inputs.industry.slug}-${inputs.location.slug}/v${inputs.report.version}.pdf`;
      await step.do('render-and-upload-pdf', async () => {
        const pdf = await htmlToPdf(env, html);
        await uploadPdf(env, pdfKey, pdf);
        return { bytes: pdf.byteLength };
      });

      // ---- 6. Finalize --------------------------------------------------
      await step.do('finalize', async () => {
        await updateReportStatus(env, reportId, 'ready', {
          r2_key: pdfKey,
          generated_at: Math.floor(Date.now() / 1000),
          error: null,
        });
        await logRunFinish(env, runId, 'success', { pdfKey });
      });

      return { reportId, pdfKey };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await step.do('mark-failed', async () => {
        await updateReportStatus(env, reportId, 'failed', { error: message });
        await logRunFinish(env, runId, 'failed', { error: message });
      });
      throw err;
    }
  }
}
