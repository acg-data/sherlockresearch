-- Seed: landscaping industry + Texas locations + question bank

INSERT INTO industries (slug, name, template_key) VALUES
  ('landscaping', 'Landscaping', 'landscaping');

INSERT INTO locations (slug, city, state, population) VALUES
  ('austin-tx',      'Austin',      'TX', 974447),
  ('dallas-tx',      'Dallas',      'TX', 1304379),
  ('houston-tx',     'Houston',     'TX', 2304580),
  ('san-antonio-tx', 'San Antonio', 'TX', 1495295);

-- Landscaping questions — one per token in the report template
-- token_key matches {{token_key}} placeholders in templates/landscaping/report.html

INSERT INTO questions (industry_id, section_key, token_key, prompt, answer_type, sort_order) VALUES
  (1, 'market_size',  'market_size_b',          'Total market size for landscaping services in this location (USD billions)',                          'currency', 10),
  (1, 'market_size',  'cagr_pct',               'Projected CAGR 2024–2028 (percent)',                                                                   'percent',  20),
  (1, 'market_size',  'job_growth_pct',         'Annual industry job growth in this market (percent)',                                                  'percent',  30),
  (1, 'market_size',  'maintenance_revenue_pct','Share of revenue from maintenance services (percent)',                                                 'percent',  40),
  (1, 'market_size',  'markets_count',          'Number of sub-markets / neighborhoods covered (e.g. 200+)',                                            'text',     50),

  (1, 'chart_national','national_history_json', 'National market size history as JSON array of {y:"2020",v:38.7,t:"actual"} entries',                   'json',     60),
  (1, 'chart_local',   'local_history_json',    'Local market size history as JSON array of {y:"2020",v:12.4,t:"actual"} entries',                     'json',     70),

  (1, 'competitive',  'share_small_pct',        'Market share — Small businesses (1–9 employees), percent',                                             'percent', 100),
  (1, 'competitive',  'share_mid_pct',          'Market share — Mid (10–49 employees), percent',                                                        'percent', 110),
  (1, 'competitive',  'share_large_pct',        'Market share — Large (50–249 employees), percent',                                                     'percent', 120),
  (1, 'competitive',  'share_enterprise_pct',   'Market share — Enterprise (250+ employees), percent',                                                  'percent', 130),

  (1, 'narrative',    'top_demand_driver',      'Top demand driver in plain English (e.g. "residential outdoor-living spend")',                         'text',    200),
  (1, 'narrative',    'top_challenge',          'Top industry challenge in plain English (e.g. "skilled labor shortage")',                              'text',    210),
  (1, 'narrative',    'emerging_trend',         'One emerging trend worth calling out (e.g. "drought-tolerant native plantings")',                      'text',    220),
  (1, 'narrative',    'local_context',          'Free-form local context for the LLM to weave in (climate, regulations, notable local players, etc.)', 'text',    230);
