import { INDUSTRIES, SITE, STATUS, industryBySlug } from "./report-catalog.js";

const textEncoder = new TextEncoder();
const API_PATHS = new Set([
  "/api/checkout",
  "/api/health",
  "/api/lead",
  "/api/payhip/webhook",
  "/api/resend",
  "/api/waitlist"
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return withSecurityHeaders(cors(new Response(null, { status: 204 }), request));
    }

    const previewBypass = url.pathname === "/api/payhip/webhook" || url.pathname === "/api/health";
    if (!previewBypass && !checkPreviewAuth(request, env)) {
      return withSecurityHeaders(new Response("Authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Sherlock Research private preview"',
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      }));
    }

    try {
      if (API_PATHS.has(url.pathname)) {
        if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, service: "sherlockresearch" });
        if (url.pathname === "/api/payhip/webhook" && request.method === "POST") return handlePayhipWebhook(request, env, ctx);
        if (url.pathname === "/api/checkout" && request.method === "POST") return handleCheckout(request, env);
        if ((url.pathname === "/api/lead" || url.pathname === "/api/waitlist") && request.method === "POST") return handleLead(request, env, "lead-form");
        if (url.pathname === "/api/resend" && request.method === "POST") return handleResend(request, env);
        return json({ error: "Method not allowed" }, 405);
      }

      if (url.pathname === "/success" && request.method === "GET") {
        return withSecurityHeaders(htmlResponse(successHtml({
          heading: "Check your Payhip receipt for the download.",
          message: "Payhip sends the report download after checkout. If you do not see the receipt or need a different buyer email, contact Sherlock support and we will help.",
          status: "complete"
        })));
      }

      const assetResponse = await env.ASSETS.fetch(request);
      return withSecurityHeaders(cacheAdjustedAsset(assetResponse));
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({
        level: "error",
        message: error?.message || "unknown worker error",
        path: url.pathname,
        at: new Date().toISOString()
      }));
      return json({ error: "Unexpected server error" }, 500);
    }
  }
};

function cacheAdjustedAsset(assetResponse) {
  const contentType = assetResponse.headers.get("content-type") || "";
  const headers = new Headers(assetResponse.headers);
  if (contentType.includes("text/html")) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("CDN-Cache-Control", "no-store");
  }
  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers
  });
}

function checkPreviewAuth(request, env) {
  const expected = env.PREVIEW_PASSWORD;
  if (!expected) return true;
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const password = decoded.slice(decoded.indexOf(":") + 1);
  return timingSafeEqual(password, expected);
}

async function handleCheckout(request, env) {
  if (!(await allowRequest(env, request, "checkout", 30, 60))) return json({ error: "Too many checkout attempts" }, 429);

  const payload = await readJson(request);
  const plan = String(payload.plan || "single").trim();
  const slug = String(payload.industry || payload.reportSlug || "").trim();
  const report = plan === "all" ? null : industryBySlug(slug);
  if (plan !== "all" && !report) return json({ error: "Known industry is required." }, 422);

  const checkoutUrl = plan === "all" ? "" : report.checkoutUrl;
  if (checkoutUrl) return json({ ok: true, provider: "payhip", url: checkoutUrl });

  const params = new URLSearchParams();
  params.set("subject", plan === "all" ? "Sherlock Research all-access checkout" : `Sherlock Research ${report.name} checkout`);
  if (report) {
    params.set("industry", report.slug);
    params.set("status", report.status);
  }
  params.set("plan", plan);
  return json({
    ok: false,
    error: "Payhip checkout link is not configured yet.",
    contactUrl: `/contact?${params.toString()}`
  }, 409);
}

async function handlePayhipWebhook(request, env, ctx) {
  const rawBody = await request.text();
  const event = parseJson(rawBody);
  if (!event) return json({ error: "Invalid JSON payload" }, 400);

  const verified = await verifyPayhipSignature(event, env.PAYHIP_API_KEY);
  if (!verified) return json({ error: "Invalid Payhip signature" }, 400);

  if (event.type === "paid") {
    ctx.waitUntil(fulfillPayhipPurchase(event, env));
  } else if (event.type === "refunded") {
    ctx.waitUntil(recordPayhipRefund(event, env));
  } else if (event.type === "subscription.created" || event.type === "subscription.deleted") {
    ctx.waitUntil(recordAutomationEvent(env, {
      eventName: `sherlock.payhip.${event.type}`,
      email: event.customer_email || event.email || "",
      report: resolveReportFromPayhipEvent(event),
      plan: "subscription",
      tags: [`payhip_type:${event.type}`],
      source: "payhip-webhook",
      message: `Payhip subscription event ${event.subscription_id || ""}`.trim()
    }));
  }

  return json({ received: true });
}

async function fulfillPayhipPurchase(event, env) {
  const transactionId = String(event.id || "").trim();
  if (!transactionId) return { ok: false, status: "missing_transaction" };

  const key = `payhip-transaction:${transactionId}`;
  const existing = await kvGet(env, key);
  if (existing?.fulfilled) return { ok: true, status: "already_fulfilled" };

  const email = String(event.email || event.customer_email || "").trim();
  if (!isEmail(email)) {
    await kvPut(env, key, { fulfilled: false, status: "missing_email", event, recordedAt: new Date().toISOString() });
    return { ok: false, status: "missing_email" };
  }

  const report = resolveReportFromPayhipEvent(event);
  const plan = inferPlanFromPayhipEvent(event);
  const reportSlug = report?.slug || "unknown";
  const tags = [`industry:${reportSlug}`, `plan:${plan}`, "status:purchased", "source:payhip-webhook"];

  await recordAutomationEvent(env, {
    eventName: report?.email?.purchaseEvent || "sherlock.report.purchase",
    email,
    report,
    plan,
    tags,
    source: "payhip-webhook",
    message: `Payhip transaction ${transactionId}`
  });

  const delivery = await sendTransactionalEmail(env, {
    to: email,
    subject: report ? `Your ${report.name} report access` : "Your Sherlock Research report access",
    body: purchaseEmailBody({ report, plan, event, tags }),
    idempotencyKey: `payhip:${transactionId}:delivery`
  });

  await kvPut(env, key, {
    fulfilled: delivery.ok,
    status: delivery.ok ? "fulfilled" : "email_error",
    transactionId,
    email,
    plan,
    reportSlug,
    payhipType: event.type,
    payhipItems: event.items || [],
    emailMessage: delivery.message,
    fulfilledAt: delivery.ok ? new Date().toISOString() : "",
    recordedAt: new Date().toISOString()
  });

  return { ok: delivery.ok, status: delivery.ok ? "fulfilled" : "email_error" };
}

async function recordPayhipRefund(event, env) {
  const transactionId = String(event.id || "").trim();
  const report = resolveReportFromPayhipEvent(event);
  const email = String(event.email || event.customer_email || "").trim();
  const refundIdentity = [
    transactionId || "missing-transaction",
    event.refund_id || event.refund_transaction_id || event.date_refunded || event.date || "missing-refund-date",
    event.amount_refunded || event.price || "missing-amount",
    event.status || event.type || "refunded"
  ].join(":");
  const key = `payhip-refund:${await sha256Hex(refundIdentity)}`;
  await kvPut(env, key, {
    transactionId,
    refundKey: refundIdentity,
    reportSlug: report?.slug || "",
    email,
    amountRefunded: event.amount_refunded || "",
    price: event.price || "",
    recordedAt: new Date().toISOString()
  });

  await recordAutomationEvent(env, {
    eventName: "sherlock.payhip.refund",
    email,
    report,
    plan: "refund",
    tags: [`industry:${report?.slug || "unknown"}`, "status:refunded"],
    source: "payhip-webhook",
    message: `Payhip refund ${transactionId}`
  });
}

async function handleLead(request, env, source) {
  if (!(await allowRequest(env, request, source, 8, 60))) return json({ error: "Too many submissions" }, 429);

  const payload = await readJson(request);
  const email = String(payload.email || "").trim();
  const slug = String(payload.industry || payload.reportSlug || "").trim();
  const plan = String(payload.plan || "single").trim();
  const report = industryBySlug(slug);

  if (!isEmail(email)) return json({ error: "Valid email is required" }, 422);
  if (!report) return json({ error: "Known industry is required" }, 422);
  if (!(await verifyTurnstileIfConfigured(payload, request, env))) return json({ error: "Verification failed. Please retry." }, 400);

  const tags = [`industry:${report.slug}`, `plan:${plan}`, `status:${report.status}`, `source:${source}`];
  const automation = await recordAutomationEvent(env, {
    eventName: report.email?.waitlistEvent || "sherlock.report.waitlist",
    email,
    report,
    plan,
    tags,
    source,
    message: payload.message || ""
  });

  const confirmation = await sendTransactionalEmail(env, {
    to: email,
    subject: `${report.name} report request received`,
    body: `<p>Thanks for your interest in the ${escapeHtml(report.name)} Industry Report.</p>
<p>Status: <strong>${escapeHtml(STATUS[report.status].libraryLabel)}</strong>. We recorded your request and will follow up with the right report status.</p>
<p>You can review the report page here: <a href="${SITE.origin}/${report.slug}-report">${SITE.origin}/${report.slug}-report</a>.</p>`,
    idempotencyKey: `lead:${report.slug}:${email}`
  });

  if (!confirmation.ok) return json({ error: confirmation.message }, confirmation.status || 503);
  return json({ ok: true, industry: report.slug, status: report.status, eventRecorded: automation.ok });
}

async function handleResend(request, env) {
  if (!(await allowRequest(env, request, "resend", 5, 300))) return json({ error: "Too many resend attempts" }, 429);

  const payload = await readJson(request);
  const email = String(payload.email || "").trim();
  const slug = String(payload.industry || payload.reportSlug || "").trim();
  const report = industryBySlug(slug);
  if (!isEmail(email)) return json({ error: "Valid email is required" }, 422);
  if (!report) return json({ error: "Known industry is required" }, 422);
  if (!(await verifyTurnstileIfConfigured(payload, request, env))) return json({ error: "Verification failed. Please retry." }, 400);

  await recordAutomationEvent(env, {
    eventName: "sherlock.report.resend_requested",
    email,
    report,
    plan: "single",
    tags: [`industry:${report.slug}`, "source:resend"],
    source: "resend",
    message: "Customer requested report resend"
  });

  const response = await sendTransactionalEmail(env, {
    to: SITE.supportEmail,
    subject: `Resend requested: ${report.name}`,
    body: `<p>A customer requested report resend.</p><p>Email: ${escapeHtml(email)}</p><p>Report: ${escapeHtml(report.name)}</p>`,
    idempotencyKey: `resend:${report.slug}:${email}`
  });

  if (!response.ok) return json({ error: response.message }, response.status || 503);
  return json({ ok: true });
}

function resolveReportFromPayhipEvent(event) {
  const items = Array.isArray(event.items) ? event.items : [];
  for (const item of items) {
    const permalink = String(item.product_permalink || "");
    const productKey = String(item.product_key || "");
    const byUrl = INDUSTRIES.find((industry) => industry.checkoutUrl && permalink === industry.checkoutUrl);
    if (byUrl) return byUrl;
    const byKey = INDUSTRIES.find((industry) => industry.payhipProductKey && productKey === industry.payhipProductKey);
    if (byKey) return byKey;
  }

  const productText = [
    event.product_name,
    event.plan_name,
    ...items.map((item) => item.product_name)
  ].filter(Boolean).join(" ").toLowerCase();
  return INDUSTRIES.find((industry) => productText.includes(industry.name.toLowerCase())) || null;
}

function inferPlanFromPayhipEvent(event) {
  if (event.type?.startsWith("subscription.")) return "quarterly";
  const text = JSON.stringify(event).toLowerCase();
  if (text.includes("all-access") || text.includes("all access")) return "all";
  if (text.includes("quarterly") || text.includes("coaching")) return "quarterly";
  return "single";
}

async function verifyPayhipSignature(event, apiKey) {
  if (!apiKey) return false;
  const signature = String(event.signature || "").toLowerCase();
  if (!signature) return false;
  const expected = (await sha256Hex(apiKey)).toLowerCase();
  return timingSafeEqual(expected, signature);
}

async function verifyTurnstileIfConfigured(payload, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  const token = payload["cf-turnstile-response"] || payload.turnstileToken || "";
  if (!token) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  form.set("remoteip", request.headers.get("CF-Connecting-IP") || "");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });
  const result = await response.json().catch(() => null);
  return Boolean(result?.success);
}

async function allowRequest(env, request, bucket, max, windowSeconds) {
  if (!env.FULFILLMENTS) return true;
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "local";
    const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `rate:${bucket}:${ip}:${windowId}`;
    const current = Number(await env.FULFILLMENTS.get(key)) || 0;
    if (current >= max) return false;
    await env.FULFILLMENTS.put(key, String(current + 1), { expirationTtl: windowSeconds * 2 });
  } catch (error) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "rate limit check failed open",
      bucket,
      error: error?.message || "unknown"
    }));
  }
  return true;
}

async function recordAutomationEvent(env, { eventName, email, report, plan, tags, source, message }) {
  const record = {
    eventName,
    email,
    reportSlug: report?.slug || "",
    reportName: report?.name || "",
    reportStatus: report?.status || "",
    plan,
    source,
    tags,
    message: message || "",
    recordedAt: new Date().toISOString()
  };

  if (env.FULFILLMENTS) {
    try {
      await env.FULFILLMENTS.put(`event:${crypto.randomUUID()}`, JSON.stringify(record));
    } catch (error) {
      console.warn(JSON.stringify({
        level: "warn",
        message: "automation event record failed",
        eventName,
        error: error?.message || "unknown"
      }));
      return { ok: false, status: 202, message: "Event recording failed." };
    }
  }
  return { ok: true, status: 202, message: "Event recorded." };
}

async function sendTransactionalEmail(env, { to, subject, body, idempotencyKey }) {
  if (!env.EMAIL) return { ok: false, status: 503, message: "Cloudflare EMAIL binding is not configured." };
  const emailKey = idempotencyKey ? `email:${idempotencyKey}` : "";
  if (emailKey) {
    try {
      const existing = await kvGet(env, emailKey);
      if (existing?.sent) return { ok: true, status: 200, data: existing.data || null, message: "Email already sent." };
    } catch (error) {
      console.warn(JSON.stringify({
        level: "warn",
        message: "email idempotency read failed",
        idempotencyKey,
        error: error?.message || "unknown"
      }));
    }
  }

  try {
    const result = await env.EMAIL.send({
      to,
      from: parseEmailAddress(SITE.supportFrom),
      replyTo: SITE.supportEmail,
      subject,
      html: body,
      text: htmlToText(body)
    });
    if (emailKey) {
      try {
        await kvPut(env, emailKey, {
          sent: true,
          to,
          subject,
          sentAt: new Date().toISOString(),
          data: result || null
        });
      } catch (error) {
        console.warn(JSON.stringify({
          level: "warn",
          message: "email idempotency write failed after send",
          idempotencyKey,
          error: error?.message || "unknown"
        }));
      }
    }
    return { ok: true, status: 202, data: result, message: "Email sent." };
  } catch (error) {
    return {
      ok: false,
      status: emailErrorStatus(error),
      message: `Email failed: ${error?.message || "unknown error"}`
    };
  }
}

function purchaseEmailBody({ report, plan, event, tags }) {
  const reportName = report?.name || "Sherlock Research";
  const pageUrl = report ? `${SITE.origin}/${report.slug}-report` : SITE.origin;
  const sampleUrl = report?.sampleAsset ? `${SITE.origin}${report.sampleAsset}` : `${SITE.origin}/sample`;
  const fullAsset = report?.fullReportAsset ? `${SITE.origin}${report.fullReportAsset}` : "";
  const delivery = fullAsset
    ? `<p><a href="${fullAsset}">Open your secure full report link</a>.</p>`
    : pendingDeliveryCopy(report);

  return `<p>Thanks for purchasing the ${escapeHtml(reportName)} report.</p>
${delivery}
<p>Report page: <a href="${pageUrl}">${pageUrl}</a></p>
<p>Sample PDF: <a href="${sampleUrl}">${sampleUrl}</a></p>
<p>Plan: ${escapeHtml(plan)}. Payhip transaction: ${escapeHtml(event.id || "")}.</p>
<p>Support tags: ${tags.map(escapeHtml).join(", ")}.</p>
<p>Reply to this email if you need a different buyer email, team access, or custom research help.</p>`;
}

function pendingDeliveryCopy(report) {
  if (!report) return "<p>Your All-Access purchase is recorded. Sherlock support will send the access roster and available report links to this email address.</p>";
  if (report.readiness?.fullPdf === "payhip-file") return `<p>Your Payhip receipt includes the ${escapeHtml(report.name)} report download. Keep that receipt for access, and reply to Sherlock support if you need help with the buyer email or a resend.</p>`;
  if (report.status === "presell") return `<p>Your presell is recorded. The final ${escapeHtml(report.name)} PDF is still in release prep, and Sherlock support will send the secure report link to this email address when it is ready.</p>`;
  return `<p>Your purchase is recorded. The secure ${escapeHtml(report.name)} PDF link is pending final asset configuration, so Sherlock support will send the finished report link to this email address. In the meantime, use the sample PDF and report page below.</p>`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Invalid JSON payload", 400);
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function kvGet(env, key) {
  if (!env.FULFILLMENTS) return null;
  return (await env.FULFILLMENTS.get(key, "json")) || null;
}

async function kvPut(env, key, value) {
  if (!env.FULFILLMENTS) return;
  await env.FULFILLMENTS.put(key, JSON.stringify(value));
}

function parseEmailAddress(value) {
  const source = String(value || "");
  const match = source.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) return source;
  return { name: match[1].replace(/^"|"$/g, ""), email: match[2] };
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function emailErrorStatus(error) {
  if (error?.code === "E_RATE_LIMIT_EXCEEDED" || error?.code === "E_DAILY_LIMIT_EXCEEDED") return 429;
  if (error?.code === "E_SENDER_NOT_VERIFIED" || error?.code === "E_RECIPIENT_NOT_ALLOWED") return 400;
  return 502;
}

function isEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || ""));
}

function json(payload, status = 200) {
  return withSecurityHeaders(cors(new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  })));
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}

function cors(response, request) {
  const origin = request?.headers.get("Origin") || "";
  const allowedOrigin = allowedCorsOrigin(origin);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.append("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

function allowedCorsOrigin(origin) {
  if (!origin) return "";
  if (origin === SITE.origin) return origin;
  try {
    const parsed = new URL(origin);
    if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) return origin;
  } catch {
    return "";
  }
  return "";
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://payhip.com https://*.payhip.com https://challenges.cloudflare.com https://www.clarity.ms https://*.clarity.ms",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://payhip.com https://*.payhip.com https://challenges.cloudflare.com https://*.clarity.ms https://c.bing.com",
    "worker-src 'self' blob:",
    "frame-src https://tally.so https://payhip.com https://*.payhip.com https://challenges.cloudflare.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https://payhip.com https://*.payhip.com",
    "upgrade-insecure-requests"
  ].join("; "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function successHtml({ heading, message, status }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>Purchase Confirmation - Sherlock Research</title>
<link rel="stylesheet" href="/shared/styles.css">
<style>
body{background:#0D1B2A;color:#fff;font-family:Inter,Arial,sans-serif;margin:0}.wrap{max-width:760px;margin:0 auto;padding:80px 22px}.card{background:#fff;color:#1a1a1a;border-radius:18px;padding:34px;box-shadow:0 28px 70px rgba(0,0,0,.25)}h1{font-family:Georgia,serif;color:#0D1B2A;font-size:42px;line-height:1.05;margin:0 0 14px}.status{display:inline-flex;border-radius:999px;background:#fef2eb;color:#b84d15;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:18px}.btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.btns a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-radius:10px;padding:10px 16px;font-weight:800;text-decoration:none}.primary{background:#F26A21;color:#fff}.outline{border:1px solid #d7d2c4;color:#0D1B2A}
</style>
</head>
<body><main class="wrap"><section class="card"><div class="status">${escapeHtml(status)}</div><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(message)}</p><div class="btns"><a class="primary" href="/reports">Browse reports</a><a class="outline" href="/contact">Contact support</a></div></section></main></body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
