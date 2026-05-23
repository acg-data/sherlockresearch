import type { Env } from './env';

export async function uploadPdf(env: Env, key: string, pdf: Uint8Array): Promise<void> {
  await env.REPORTS.put(key, pdf, {
    httpMetadata: { contentType: 'application/pdf' },
  });
}

// Worker streams PDF straight from R2 (admin-authed route).
// Avoids per-bucket public URL config; works with the default R2 setup.
export async function fetchPdf(env: Env, key: string): Promise<Response> {
  const obj = await env.REPORTS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${key.split('/').pop()}"`,
      'Cache-Control': 'private, max-age=0, no-cache',
    },
  });
}
