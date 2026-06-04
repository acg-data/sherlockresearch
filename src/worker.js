import { INDUSTRIES, SITE, STATUS, industryBySlug } from "./report-catalog.js";

const textEncoder = new TextEncoder();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Private-preview password gate (HTTP Basic Auth). Disabled automatically
    // when PREVIEW_PASSWORD is not set. Stripe webhooks must bypass it.
    if (url.pathname !== "/api/stripe/webhook" && !checkPreviewAuth(request, env)) {
      return new Response("Authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Sherlock Research — private preview"',
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env, ctx);
    }

    if (url.pathname === "/api/checkout" && request.method === "POST") {
      return handleCheckout(request, env);
    }

    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      return handleWaitlist(request, env);
    }

    if (url.pathname === "/success" && request.method === "GET") {
      return handleSuccess(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

// Basic-Auth gate for the private preview. Any username is accepted; only the
// password must match PREVIEW_PASSWORD. Returns true (open) when no password set.
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

const CHECKOUT_PLANS = {
  single: {
    name: "Standard Report",
    amount: 49700,
    mode: "payment",
    interval: "",
    description: "Full national Sherlock industry report."
  },
  quarterly: {
    name: "Quarterly + Coaching",
    amount: 200000,
    mode: "subscription",
    interval: "year",
    description: "Four quarterly updates plus four one-on-one coaching calls."
  },
  all: {
    name: "All-Access Pass",
    amount: 299700,
    mode: "payment",
    interval: "",
    description: "Every Sherlock industry report, current and future releases."
  }
};

async function handleCheckout(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const planKey = String(payload.plan || "single").trim();
  const plan = CHECKOUT_PLANS[planKey];
  if (!plan) return json({ error: "Known checkout plan is required." }, 422);

  const slug = String(payload.industry || payload.reportSlug || "").trim();
  const report = planKey === "all" ? null : industryBySlug(slug);
  if (planKey !== "all" && !report) return json({ error: "Known industry is required." }, 422);
  if (report?.status === "waitlist") {
    return json({
      error: "This report is waitlist-only right now.",
      contactUrl: `/contact?industry=${encodeURIComponent(report.slug)}&plan=${encodeURIComponent(planKey)}&status=waitlist`
    }, 409);
  }

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "STRIPE_SECRET_KEY is not configured." }, 500);
  }

  const currentOrigin = new URL(request.url).origin;
  const cancelPath = report ? `/${report.slug}-report` : "/pricing";
  const metadata = checkoutMetadata({ report, planKey });
  const session = await createStripeCheckoutSession(env, {
    origin: currentOrigin,
    cancelUrl: `${currentOrigin}${cancelPath}`,
    plan,
    planKey,
    report,
    metadata
  });

  if (!session.ok) return json({ error: session.message }, session.status || 502);
  return json({ ok: true, url: session.data.url, id: session.data.id });
}

async function handleStripeWebhook(request, env, ctx) {
  const body = await request.text();
  const signature = request.headers.get("Stripe-Signature") || "";

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, 500);
  }

  const verified = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ error: "Invalid Stripe signature" }, 400);

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const sessionId = event.data?.object?.id;
    if (sessionId) ctx.waitUntil(fulfillCheckout(sessionId, env, "webhook"));
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data?.object;
    const email = session?.customer_details?.email || session?.customer_email;
    if (email) ctx.waitUntil(sendTransactionalEmail(env, {
      to: email,
      subject: "Your Sherlock Research payment did not complete",
      body: `<p>Your delayed payment did not complete, so we have not granted report access yet.</p><p>Reply to this email if you need help with checkout.</p>`,
      tags: [{ name: "status", value: "payment_failed" }],
      idempotencyKey: session?.id ? `stripe:${session.id}:payment-failed` : ""
    }));
  }

  return json({ received: true });
}

async function handleSuccess(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return htmlResponse(successHtml({
      heading: "Checkout received.",
      message: "If you just completed checkout, the confirmation email is being prepared. If you do not see it shortly, contact Sherlock support.",
      status: "pending"
    }));
  }

  const result = await fulfillCheckout(sessionId, env, "success-page");
  const heading = result.ok ? "Your report access is being delivered." : "We could not confirm checkout yet.";
  const message = result.ok
    ? "The purchase confirmation and delivery instructions have been sent to the checkout email address."
    : result.message || "Stripe has not confirmed a paid Checkout Session yet. If payment succeeded, the webhook can still complete fulfillment.";

  return htmlResponse(successHtml({ heading, message, status: result.status || "pending" }));
}

async function handleWaitlist(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const email = String(payload.email || "").trim();
  const slug = String(payload.industry || payload.reportSlug || "").trim();
  const plan = String(payload.plan || "single").trim();
  const report = industryBySlug(slug);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email is required" }, 422);
  if (!report) return json({ error: "Known industry is required" }, 422);

  const tags = [`industry:${report.slug}`, `plan:${plan}`, `status:${report.status}`, "source:waitlist-form"];
  const automation = await recordAutomationEvent(env, {
    eventName: report.email?.waitlistEvent || "sherlock.report.waitlist",
    email,
    report,
    plan,
    tags,
    source: "waitlist-form",
    message: payload.message || ""
  });

  const confirmation = await sendTransactionalEmail(env, {
    to: email,
    subject: `${report.name} report request received`,
    body: `<p>Thanks for your interest in the ${escapeHtml(report.name)} Industry Report.</p>
<p>Status: <strong>${escapeHtml(STATUS[report.status].libraryLabel)}</strong>. We recorded your request with ${tags.map(escapeHtml).join(", ")} so Sherlock can follow up with the right report status.</p>
<p>You can review the report page here: <a href="${SITE.origin}/${report.slug}-report">${SITE.origin}/${report.slug}-report</a>.</p>`,
    tags: emailTags({ report, plan, status: report.status, source: "waitlist_form" })
  });

  if (!confirmation.ok) return json({ error: confirmation.message }, confirmation.status || 503);

  return json({ ok: true, industry: report.slug, status: report.status, eventRecorded: automation.ok });
}

async function fulfillCheckout(sessionId, env, source) {
  if (!env.STRIPE_SECRET_KEY) {
    return { ok: false, status: "configuration_missing", message: "STRIPE_SECRET_KEY is not configured." };
  }

  const key = `stripe-session:${sessionId}`;
  const existing = await kvGet(env, key);
  if (existing?.fulfilled) {
    return { ok: true, status: "already_fulfilled", message: "This Checkout Session has already been fulfilled." };
  }

  const session = await retrieveStripeSession(sessionId, env.STRIPE_SECRET_KEY);
  if (!session.ok) return { ok: false, status: "stripe_error", message: session.message };

  const checkout = session.session;
  if (checkout.payment_status === "unpaid") {
    return { ok: false, status: "unpaid", message: "Stripe reports this Checkout Session as unpaid." };
  }

  const email = checkout.customer_details?.email || checkout.customer_email;
  if (!email) return { ok: false, status: "missing_email", message: "Checkout Session has no customer email." };

  const report = resolveReport(checkout);
  const plan = checkout.metadata?.plan || "single";
  const reportSlug = report?.slug || checkout.metadata?.report_slug || "unknown";
  const tags = [
    `industry:${reportSlug}`,
    `plan:${plan}`,
    "status:purchased",
    `source:${source}`
  ];

  const automation = await recordAutomationEvent(env, {
    eventName: report?.email?.purchaseEvent || "sherlock.report.purchase",
    email,
    report,
    plan,
    tags,
    source,
    message: `Stripe Checkout Session ${sessionId}`
  });

  const delivery = await sendTransactionalEmail(env, {
    to: email,
    subject: report ? `Your ${report.name} report access` : "Your Sherlock Research report access",
    body: purchaseEmailBody({ report, plan, checkout, tags }),
    tags: emailTags({ report, plan, status: "purchased", source }),
    idempotencyKey: `stripe:${sessionId}:delivery`
  });

  if (!delivery.ok) return { ok: false, status: "email_error", message: delivery.message };

  await kvPut(env, key, {
    fulfilled: true,
    sessionId,
    source,
    email,
    plan,
    reportSlug,
    emailEvent: {
      ok: automation.ok,
      status: automation.status,
      message: automation.ok ? "sent" : automation.message
    },
    fulfilledAt: new Date().toISOString()
  });

  return { ok: true, status: "fulfilled", message: "Fulfillment email sent." };
}

function resolveReport(session) {
  const metadataSlug = session.metadata?.report_slug || session.metadata?.industry || "";
  if (metadataSlug) return industryBySlug(metadataSlug);
  const priceIds = new Set((session.line_items?.data || []).map((item) => item.price?.id).filter(Boolean));
  return INDUSTRIES.find((industry) => industry.stripePriceId && priceIds.has(industry.stripePriceId)) || null;
}

function checkoutMetadata({ report, planKey }) {
  return {
    report_slug: report?.slug || "all-access",
    report_name: report?.name || "All-Access Pass",
    report_status: report?.status || "available",
    plan: planKey,
    product_key: report
      ? `${report.slug}-${SITE.year}-${SITE.quarter.toLowerCase()}-${planKey}`
      : `all-access-${SITE.year}-${SITE.quarter.toLowerCase()}`
  };
}

async function createStripeCheckoutSession(env, { origin, cancelUrl, plan, planKey, report, metadata }) {
  const reportLabel = report ? report.name : "All-Access";
  const productName = planKey === "all"
    ? "Sherlock Research All-Access Pass"
    : `Sherlock ${reportLabel} ${plan.name}`;
  const productDescription = report
    ? `${plan.description} Status: ${STATUS[report.status].libraryLabel}.`
    : plan.description;
  const body = new URLSearchParams();

  body.set("mode", plan.mode);
  body.set("success_url", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", cancelUrl);
  body.set("client_reference_id", `${metadata.report_slug}:${planKey}`);
  body.set("allow_promotion_codes", "true");
  body.set("billing_address_collection", "auto");
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(plan.amount));
  body.set("line_items[0][price_data][product_data][name]", productName);
  body.set("line_items[0][price_data][product_data][description]", productDescription);

  if (plan.interval) {
    body.set("line_items[0][price_data][recurring][interval]", plan.interval);
  }

  if (plan.mode === "payment") {
    body.set("customer_creation", "if_required");
  }

  Object.entries(metadata).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
    body.set(`line_items[0][price_data][product_data][metadata][${key}]`, value);
    if (plan.mode === "payment") body.set(`payment_intent_data[metadata][${key}]`, value);
    if (plan.mode === "subscription") body.set(`subscription_data[metadata][${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
    message: data?.error?.message || `Stripe returned HTTP ${response.status}`
  };
}

async function retrieveStripeSession(sessionId, secretKey) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, message: data?.error?.message || `Stripe returned HTTP ${response.status}` };
  }
  return { ok: true, session: data };
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
    await env.FULFILLMENTS.put(`email-event:${crypto.randomUUID()}`, JSON.stringify(record));
  }

  return { ok: true, status: 202, message: "Email event recorded in KV." };
}

async function sendTransactionalEmail(env, { to, subject, body, tags = [], idempotencyKey = "" }) {
  if (env.EMAIL) {
    return sendCloudflareEmail(env, { to, subject, body });
  }

  return { ok: false, status: 503, message: "Cloudflare EMAIL binding is not configured." };
}

async function sendCloudflareEmail(env, { to, subject, body }) {
  try {
    const result = await env.EMAIL.send({
      to,
      from: parseEmailAddress(SITE.supportFrom),
      replyTo: SITE.supportEmail,
      subject,
      html: body,
      text: htmlToText(body)
    });
    return { ok: true, status: 202, data: result, message: "Email sent through Cloudflare." };
  } catch (error) {
    return {
      ok: false,
      status: emailErrorStatus(error),
      data: null,
      message: `Cloudflare Email failed: ${error?.message || "unknown error"}`
    };
  }
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

function emailTags({ report, plan, status, source }) {
  return [
    { name: "report", value: tagValue(report?.slug || "unknown") },
    { name: "plan", value: tagValue(plan || "single") },
    { name: "status", value: tagValue(status || report?.status || "unknown") },
    { name: "source", value: tagValue(source || "site") }
  ];
}

function tagValue(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256);
}

function purchaseEmailBody({ report, plan, checkout, tags }) {
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
<p>Plan: ${escapeHtml(plan)}. Stripe session: ${escapeHtml(checkout.id)}.</p>
<p>Sherlock fulfillment tags: ${tags.map(escapeHtml).join(", ")}.</p>
<p>Reply to this email if you need a different buyer email, team access, or custom research help.</p>`;
}

function pendingDeliveryCopy(report) {
  if (!report) {
    return `<p>Your All-Access purchase is recorded. Sherlock support will send the access roster and available report links to this email address.</p>`;
  }

  if (report.status === "presell") {
    return `<p>Your presell is recorded. The final ${escapeHtml(report.name)} PDF is still in release prep, and Sherlock support will send the secure report link to this email address when it is ready.</p>`;
  }

  return `<p>Your purchase is recorded. The secure ${escapeHtml(report.name)} PDF link is pending final asset configuration, so Sherlock support will send the finished report link to this email address. In the meantime, use the sample PDF and report page below.</p>`;
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const signatures = header.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`);
  return signatures.some((candidate) => timingSafeEqual(expected, candidate));
}

async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function kvGet(env, key) {
  if (!env.FULFILLMENTS) return null;
  const value = await env.FULFILLMENTS.get(key, "json");
  return value || null;
}

async function kvPut(env, key, value) {
  if (!env.FULFILLMENTS) return;
  await env.FULFILLMENTS.put(key, JSON.stringify(value));
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

function json(payload, status = 200) {
  return cors(new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  }));
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}

function cors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Stripe-Signature");
  return response;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
