export interface Env {
  DB: D1Database;
  REPORTS: R2Bucket;
  REPORT_WORKFLOW: Workflow;
  BROWSER: Fetcher;
  ANTHROPIC_API_KEY: string;
  ADMIN_TOKEN: string;
  ENVIRONMENT: string;
  SITE_URL: string;
}
