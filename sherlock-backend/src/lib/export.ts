import type { Env } from './env';
import { getSurvey, getIndustry, getLocation, questionsForIndustry } from './d1';

// Build a clean Markdown blob that Justin pastes into Claude.ai along with
// sample report PDFs. Everything Claude needs to write the report.
export async function buildClaudeExport(env: Env, surveyId: number): Promise<string> {
  const survey = await getSurvey(env, surveyId);
  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  const [industry, location, questions] = await Promise.all([
    getIndustry(env, survey.industry_id),
    getLocation(env, survey.location_id),
    questionsForIndustry(env, survey.industry_id),
  ]);
  if (!industry || !location) throw new Error('Industry or location missing');

  const { results: responses } = await env.DB.prepare(`
    SELECT q.token_key, q.prompt, q.section_key, q.answer_type, q.sort_order, r.answer
    FROM survey_responses r
    JOIN questions q ON q.id = r.question_id
    WHERE r.survey_id = ?
    ORDER BY q.sort_order, q.id
  `).bind(surveyId).all<{ token_key: string; prompt: string; section_key: string; answer_type: string; sort_order: number; answer: string }>();

  const grouped = new Map<string, typeof responses>();
  for (const r of responses) {
    if (!grouped.has(r.section_key)) grouped.set(r.section_key, []);
    grouped.get(r.section_key)!.push(r);
  }

  const sections = [...grouped.entries()]
    .map(([key, rows]) => {
      const lines = rows.map(r => `- **${r.prompt}** (\`${r.token_key}\`, ${r.answer_type}): ${r.answer}`).join('\n');
      return `### ${key.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())}\n${lines}`;
    })
    .join('\n\n');

  const locationLabel = `${location.city}, ${location.state}`;
  const notes = survey.notes ? `\n\n**Notes:** ${survey.notes}` : '';

  return `# Sherlock Research — Report Inputs

**Industry:** ${industry.name}
**Location:** ${locationLabel}
**Period:** ${survey.period}
**Generated:** ${new Date().toISOString().slice(0, 10)}${notes}

---

## Task

Write a complete market intelligence report for the **${industry.name}** industry in **${locationLabel}**, data vintage **${survey.period}**. Use the structured inputs below. Match the tone, structure, and depth of the sample Sherlock Research PDFs I'm attaching to this conversation.

Audience: owners of small-to-mid-sized service businesses ($500k–$10M revenue). Voice: confident, plainspoken analyst. Specific. No marketing fluff. No hedging clauses. Every section should make at least one concrete claim a reader could act on.

Sections to include (in order):
1. Cover / executive summary
2. Market overview (with the headline stats)
3. Key industry insights (4 short blocks)
4. Competitive landscape (interpret the market-share breakdown)
5. Local outlook for ${locationLabel}
6. What's included / methodology

---

## Structured inputs

${sections}

---

## Notes for Claude

- Treat the values above as ground truth — don't invent additional statistics.
- When data is missing or empty, say so explicitly (e.g. "data not available for this period") rather than fabricating.
- Output should be a complete report I can paste into a design tool (Canva/Docs/InDesign) for final layout.
`;
}
