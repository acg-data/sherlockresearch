-- Sherlock Research schema v1

CREATE TABLE IF NOT EXISTS industries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  template_key  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  population    INTEGER,
  meta          TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  industry_id   INTEGER REFERENCES industries(id),
  section_key   TEXT NOT NULL,
  token_key     TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  answer_type   TEXT NOT NULL CHECK(answer_type IN ('number','percent','currency','text','json')),
  required      INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(industry_id, token_key)
);

CREATE TABLE IF NOT EXISTS surveys (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  industry_id   INTEGER NOT NULL REFERENCES industries(id),
  location_id   INTEGER NOT NULL REFERENCES locations(id),
  period        TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  notes         TEXT,
  UNIQUE(industry_id, location_id, period)
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id     INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL REFERENCES questions(id),
  answer        TEXT NOT NULL,
  UNIQUE(survey_id, question_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  industry_id   INTEGER NOT NULL REFERENCES industries(id),
  location_id   INTEGER NOT NULL REFERENCES locations(id),
  survey_id     INTEGER NOT NULL REFERENCES surveys(id),
  version       INTEGER NOT NULL,
  status        TEXT NOT NULL CHECK(status IN ('queued','running','ready','failed','sent_to_payhip')),
  r2_key        TEXT,
  payhip_url    TEXT,
  generated_at  INTEGER,
  error         TEXT,
  UNIQUE(industry_id, location_id, version)
);

CREATE TABLE IF NOT EXISTS report_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id     INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  workflow_id   TEXT NOT NULL,
  started_at    INTEGER NOT NULL,
  finished_at   INTEGER,
  status        TEXT NOT NULL,
  log           TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_industry ON questions(industry_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_reports_industry_location ON reports(industry_id, location_id, version);
CREATE INDEX IF NOT EXISTS idx_report_runs_report ON report_runs(report_id, started_at);
