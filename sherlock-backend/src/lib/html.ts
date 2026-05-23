export function html(body: string, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { Location: location, ...extraHeaders } });
}

export function escape(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function layout(title: string, body: string, opts: { activeNav?: string } = {}): string {
  const navItems: Array<[string, string]> = [
    ['/admin', 'Dashboard'],
    ['/admin/industries', 'Industries'],
    ['/admin/reports', 'Reports'],
  ];
  const nav = navItems
    .map(([href, label]) => {
      const active = opts.activeNav === href ? ' style="font-weight:600;color:#E26C2C"' : '';
      return `<a href="${href}"${active}>${label}</a>`;
    })
    .join(' · ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Sherlock Admin</title>
<style>
  :root{--ink:#1A2330;--muted:#727C8A;--line:#E6DECF;--orange:#E26C2C;--navy:#0E1B2B;--paper:#FBF8F2;--ok:#3a7c4a;--warn:#b07a1f;--err:#9e2f2f}
  *{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:var(--paper);color:var(--ink);line-height:1.5}
  header{background:var(--navy);color:#fff;padding:14px 28px;display:flex;align-items:center;gap:24px}
  header b{font-size:1.05rem}header a{color:rgba(255,255,255,.85);text-decoration:none;font-size:.9rem}header a:hover{color:#fff}
  main{max-width:1100px;margin:0 auto;padding:30px 28px}
  h1{font-size:1.6rem;margin:0 0 6px}h2{font-size:1.15rem;margin:24px 0 10px}
  .muted{color:var(--muted);font-size:.88rem}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-top:14px}
  th,td{padding:11px 14px;text-align:left;font-size:.9rem;border-bottom:1px solid var(--line)}
  th{background:var(--paper);font-weight:600;color:var(--ink);font-size:.78rem;text-transform:uppercase;letter-spacing:.04em}
  tr:last-child td{border-bottom:none}
  .btn{display:inline-block;background:var(--orange);color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit}
  .btn:hover{background:#F2812E}
  .btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
  .btn.ghost:hover{border-color:var(--orange);color:var(--orange)}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .badge.queued{background:#eee}.badge.running{background:#fdf0d8;color:var(--warn)}.badge.ready{background:#e0f1e3;color:var(--ok)}
  .badge.failed{background:#fbe1e1;color:var(--err)}.badge.sent_to_payhip{background:#dfe7f4;color:#345887}
  form.stack{display:flex;flex-direction:column;gap:14px;max-width:560px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:24px}
  form.stack label{display:flex;flex-direction:column;gap:6px;font-size:.85rem;font-weight:600}
  form.stack input,form.stack select,form.stack textarea{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:6px;background:#fff}
  form.stack input:focus,form.stack select:focus,form.stack textarea:focus{outline:2px solid var(--orange);outline-offset:1px;border-color:var(--orange)}
  form.stack textarea{min-height:80px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.85rem}
  .row-actions{display:flex;gap:8px;flex-wrap:wrap}
  .meta-line{color:var(--muted);font-size:.8rem;margin-top:4px}
  a{color:var(--orange)}
  .empty{padding:30px;text-align:center;color:var(--muted);background:#fff;border:1px dashed var(--line);border-radius:8px}
</style>
</head>
<body>
<header>
  <b>Sherlock <span style="color:var(--orange)">Admin</span></b>
  <nav style="display:flex;gap:18px">${nav}</nav>
  <form method="post" action="/admin/logout" style="margin-left:auto"><button class="btn ghost" type="submit">Sign out</button></form>
</header>
<main>${body}</main>
</body>
</html>`;
}
