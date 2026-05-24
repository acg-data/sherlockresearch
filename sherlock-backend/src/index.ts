import type { Env } from './lib/env';
import { handleAdmin } from './routes/admin';
import { html } from './lib/html';

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
};
