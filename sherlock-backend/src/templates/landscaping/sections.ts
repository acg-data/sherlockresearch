// Definitions for LLM-narrated sections in the landscaping report template.
// Each section corresponds to a <!-- NARRATIVE:key --> marker in report.html.
// Sections are sequenced in order and run sequentially in the Workflow.

export interface SectionContext {
  industryName: string;        // "Landscaping"
  locationLabel: string;       // "Austin, TX"
  period: string;              // "Q2-2026"
  tokens: Record<string, string>;  // every token_key from the survey
}

export interface SectionDef {
  key: string;                                       // matches <!-- NARRATIVE:key -->
  llm: boolean;                                      // false = leave marker as empty (template-only)
  system: string;                                    // shared system prompt
  prompt: (ctx: SectionContext) => string;           // builds the user prompt
  maxTokens?: number;
}

const SYSTEM = `You write market intelligence narrative for Sherlock Research reports.
Audience: owners of small-to-mid-sized service businesses ($500k–$10M revenue).
Voice: confident, plainspoken analyst. Specific. No marketing fluff. No hedging clauses ("it is important to note..."). No headings — your output is spliced into a section that already has a heading.
Output: 2–3 short paragraphs as plain HTML <p>...</p> tags. No other markup. ~120–200 words total.`;

export const sections: SectionDef[] = [
  {
    key: 'market_overview',
    llm: true,
    system: SYSTEM,
    prompt: (ctx) => `Write the Market Overview narrative for a ${ctx.industryName} industry report covering ${ctx.locationLabel}, data vintage ${ctx.period}.

Structured data to interpret:
- Market size: $${ctx.tokens.market_size_b}B
- Projected CAGR 2024–2028: ${ctx.tokens.cagr_pct}%
- Annual job growth: ${ctx.tokens.job_growth_pct}%
- Maintenance share of revenue: ${ctx.tokens.maintenance_revenue_pct}%
- Top demand driver: ${ctx.tokens.top_demand_driver}
- Top challenge: ${ctx.tokens.top_challenge}

Frame these numbers for an operator deciding where to invest. Open with the headline read (growing/flat/contracting), then connect the demand driver and challenge to a concrete strategic implication. End with one specific opportunity the data suggests.`,
  },
  {
    key: 'competitive_landscape',
    llm: true,
    system: SYSTEM,
    prompt: (ctx) => `Write the Competitive Landscape narrative for the ${ctx.industryName} report (${ctx.locationLabel}).

Market share breakdown:
- Small (1–9 employees): ${ctx.tokens.share_small_pct}%
- Mid (10–49): ${ctx.tokens.share_mid_pct}%
- Large (50–249): ${ctx.tokens.share_large_pct}%
- Enterprise (250+): ${ctx.tokens.share_enterprise_pct}%

Explain what this fragmentation pattern means for a small operator: where the competitive friction lives, what differentiation actually moves the needle in this segment, and which adjacent segment is most likely to encroach. Be concrete about local-vs-national dynamics.`,
  },
  {
    key: 'local_outlook',
    llm: true,
    system: SYSTEM,
    prompt: (ctx) => `Write the Local Outlook narrative for ${ctx.locationLabel} (${ctx.industryName} industry, ${ctx.period}).

Local context to incorporate: ${ctx.tokens.local_context || '(none provided — infer from city characteristics)'}

Emerging trend to call out: ${ctx.tokens.emerging_trend}

Cover: what's specific about operating in this market (climate, housing stock, regulation, seasonality, competition density), how the emerging trend is likely to play out locally, and one prediction for the next 12 months an operator should be positioning for. Stay grounded in what an analyst would actually say — no future-tense vague predictions like "the market will continue to evolve".`,
  },
];
