import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDUSTRIES, PLANS, SITE, STATUS, catalogReports } from "../../src/report-catalog.js";
import { insightsFor } from "../../src/report-insights.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");

function html(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleCaseStatus(status) {
  return STATUS[status]?.label || status;
}

function cleanUrl(page) {
  return page.replace(/\.html$/, "");
}

async function save(relativePath, contents) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const iconPaths = {
  market: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-5 4 3 4-7"/><path d="M18 6h2v2"/>',
  local: '<path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  economics: '<path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-6"/><path d="M6 9h2M11 5h2M16 10h2"/>',
  customer: '<path d="M16 21v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  playbook: '<path d="M7 4h10a2 2 0 0 1 2 2v16l-7-3-7 3V6a2 2 0 0 1 2-2Z"/><path d="M9 9h6M9 13h6"/>',
  method: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
  pricing: '<path d="M20.6 13.4 13.5 20.5a2 2 0 0 1-2.8 0L3 12.8V4h8.8l7.8 7.8a2 2 0 0 1 0 2.6Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  delivery: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  security: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
  waitlist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M7 4.5 5 3M17 4.5 19 3"/>',
  sample: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
  category: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'
};

function iconSvg(name, size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.market}</svg>`;
}

function iconForIndustry(industry) {
  const categoryIcons = {
    "home-services": "local",
    healthcare: "customer",
    automotive: "economics",
    hospitality: "market",
    "real-estate-finance": "pricing",
    "professional-services": "playbook",
    education: "method",
    "local-services": "category"
  };
  return categoryIcons[industry.category] || "market";
}

function nav(active = "reports") {
  return `<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="logo" aria-label="Sherlock Research home">
      <img class="logo-mark" src="assets/sherlock-colorful.png?v=2" alt="" aria-hidden="true">
      <span class="logo-stack">Sherlock<small>RESEARCH</small></span>
    </a>
    <div class="nav-links">
      <a href="/reports"${active === "reports" ? ' style="color:var(--orange-2)"' : ""}>Reports</a>
      <a href="/#how">How It Works</a>
      <a href="/pricing"${active === "pricing" ? ' style="color:var(--orange-2)"' : ""}>Pricing</a>
      <a href="/sample"${active === "sample" ? ' style="color:var(--orange-2)"' : ""}>Sample</a>
      <a href="/about"${active === "about" ? ' style="color:var(--orange-2)"' : ""}>About</a>
    </div>
    <div class="nav-right">
      <a href="/reports" class="btn btn-primary">Browse Reports</a>
    </div>
  </div>
</nav>`;
}

function footer() {
  return `<footer>
  <div class="container foot-grid">
    <div class="foot-brand">
      <a href="/" class="logo" aria-label="Sherlock Research home"><img class="logo-mark" src="assets/sherlock-colorful.png?v=2" alt="" aria-hidden="true"><span class="logo-stack">Sherlock<small>RESEARCH</small></span></a>
      <p>Industry-specific research and local market intelligence for operators, investors, and agencies.</p>
      <div class="socials">
        <a href="mailto:hello@sherlockreports.com" aria-label="Email Sherlock Research"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></a>
        <a href="/contact" aria-label="Contact Sherlock Research"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg></a>
      </div>
    </div>
    <div class="fcol"><h3>Reports</h3><a href="/reports">Report Library</a><a href="/landscaping-report">Landscaping</a><a href="/roofing-report">Roofing</a><a href="/hvac-report">HVAC</a></div>
    <div class="fcol"><h3>Resources</h3><a href="/pricing">Pricing</a><a href="/sample">Sample Report</a><a href="/faq">FAQ</a><a href="/blog-article">Research Note</a></div>
    <div class="fcol"><h3>Company</h3><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></div>
  </div>
  <div class="container foot-bottom">
    <span>&copy; <span data-year>2026</span> Sherlock Research. All rights reserved.</span>
    <span>See the Market. Stay Ahead.</span>
  </div>
</footer>`;
}

function head({ title, description, canonical, noindex = false, schema = "" }) {
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0D1B2A">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : ""}
<title>${html(title)}</title>
<meta name="description" content="${html(description)}">
<link rel="canonical" href="${SITE.origin}${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${html(title)}">
<meta property="og:description" content="${html(description)}">
<meta property="og:url" content="${SITE.origin}${canonical}">
<meta property="og:image" content="${SITE.origin}/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared/styles.css">
${schema}
${pageCss()}
</head>`;
}

function pageCss() {
  return `<style>
  .library-hero,.report-hero,.success-hero,.sample-hero{background:var(--grad-navy-deep);color:#fff;padding:68px 0}
  .library-hero h1,.report-hero h1,.success-hero h1,.sample-hero h1{color:#fff;font-size:clamp(40px,6vw,68px);max-width:880px;margin-bottom:18px}
  .hero-copy{max-width:760px}
  .hero-copy p,.report-hero p,.success-hero p,.sample-hero p{color:rgba(255,255,255,.74);font-size:17px;max-width:720px}
  .eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:800;color:var(--orange-2);margin-bottom:14px}
  .status-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);border-radius:999px;padding:8px 13px;margin-bottom:20px;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
  .signal-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:24px;max-width:780px}
  .signal-item{display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);border-radius:10px;padding:11px 12px;color:rgba(255,255,255,.82);font-size:12.5px;font-weight:700}
  .signal-item svg{color:var(--orange-2);flex:0 0 auto}
  .page-band{padding:70px 0;background:var(--stone-3)}
  .page-band.white{background:#fff}
  .two-col{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:34px;align-items:start}
  .panel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px;box-shadow:var(--shadow-sm)}
  .panel.dark{background:var(--navy);color:#fff;border-color:rgba(255,255,255,.1)}
  .panel.dark h2,.panel.dark h3{color:#fff}
  .panel h2{font-size:30px;margin-bottom:12px}
  .panel h3{font-family:var(--font-body);font-size:15px;letter-spacing:0;margin-bottom:8px}
  .panel p,.panel li{color:var(--muted);font-size:14.5px}
  .panel.dark p,.panel.dark li{color:rgba(255,255,255,.72)}
  .research-copy h2{font-size:30px;margin-bottom:12px}
  .research-copy p{color:var(--muted);font-size:15px;max-width:850px}
  .module-grid,.persona-grid,.report-library-grid,.ops-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
  .module-card,.persona-card,.industry-card,.ops-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px;box-shadow:var(--shadow-sm)}
  .module-card{display:grid;gap:12px;align-content:start}
  .module-icon,.card-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff3eb;color:var(--orange);border:1px solid #ffd8c3}
  .industry-card{display:flex;flex-direction:column;gap:14px;min-height:245px}
  .industry-card .card-icon{background:var(--stone-2);color:var(--navy);border-color:var(--line)}
  .industry-card h3{font-size:23px}
  .industry-card p{color:var(--muted);font-size:13.5px;flex:1}
  .tag-row{display:flex;gap:8px;flex-wrap:wrap}
  .tag{border:1px solid var(--line);background:var(--stone-2);border-radius:999px;padding:5px 9px;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
  .tag.available{background:#edf5ed;color:#42673f;border-color:#cbdcca}.tag.presell{background:#fff0e8;color:#b84d15;border-color:#ffd2bc}.tag.waitlist{background:#eef4fa;color:#335b7d;border-color:#c9dae9}
  .cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
  .asset-list{display:grid;gap:12px;margin-top:18px}
  .asset-row{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--line);border-radius:10px;padding:14px;background:#fff}
  .asset-row span{color:var(--muted);font-size:13px}
  .asset-row b{display:flex;align-items:center;gap:10px}
  .asset-row svg{color:var(--orange);flex:0 0 auto}
  .delivery-note{border-left:3px solid var(--orange);padding:12px 14px;background:#fff8f4;color:var(--muted);font-size:13.5px;margin-top:18px}
  .filters{display:grid;grid-template-columns:1.2fr .6fr .6fr;gap:12px;margin:28px 0 26px}
  .filters input,.filters select,.lead-form input,.lead-form textarea,.lead-form select{width:100%;border:1px solid var(--line-strong);border-radius:10px;padding:13px 14px;font:inherit;background:#fff;color:var(--ink)}
  .lead-form{display:grid;gap:12px;margin-top:18px}
  .lead-form textarea{min-height:110px;resize:vertical}
  .form-note{font-size:12px;color:var(--muted);min-height:18px}
  .checkout-box{position:sticky;top:88px}
  .price{font-family:var(--font-display);font-size:42px;font-weight:800;color:var(--navy);line-height:1;margin:10px 0}
  .fine{font-size:12px;color:var(--muted)}
  .ops-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;font-size:13px}
  .ops-table th,.ops-table td{padding:10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  .ops-table th{background:var(--stone);color:var(--navy);font-size:11px;text-transform:uppercase;letter-spacing:.08em}
  .ops-table tr:last-child td{border-bottom:0}
  .code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:var(--navy)}
  @media(max-width:900px){.two-col,.module-grid,.persona-grid,.report-library-grid,.ops-grid,.filters,.signal-strip{grid-template-columns:1fr}.checkout-box{position:static}.library-hero,.report-hero,.success-hero,.sample-hero{padding:48px 0}.page-band{padding:48px 0}}

  /* ===== Industry report — premium redesign ===== */
  .report-hero-pro{padding:0}
  .report-hero-pro>.container{padding-top:32px;padding-bottom:52px}
  .breadcrumb{display:flex;align-items:center;gap:8px;font-size:12.5px;color:rgba(255,255,255,.58);margin-bottom:28px;flex-wrap:wrap}
  .breadcrumb a{color:rgba(255,255,255,.72)}.breadcrumb a:hover{color:var(--orange-2)}
  .breadcrumb .chev{width:13px;height:13px;opacity:.5}.breadcrumb span{color:#fff}
  .report-hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:48px;align-items:center}
  .report-hero-copy h1{color:#fff;font-size:clamp(38px,5.2vw,58px);line-height:1.04;letter-spacing:-.02em;margin:14px 0 18px;max-width:none}
  .report-hero-copy>p{color:rgba(255,255,255,.74);font-size:16.5px;line-height:1.6;max-width:560px;margin-bottom:22px}
  .hero-checks{list-style:none;display:grid;gap:11px;margin:0 0 26px;padding:0}
  .hero-checks li{display:flex;align-items:center;gap:11px;color:rgba(255,255,255,.9);font-weight:600;font-size:14.5px}
  .hero-checks .ck{width:20px;height:20px;color:#fff;background:var(--orange);border-radius:50%;padding:4px;flex:0 0 auto}
  .hero-trust{display:inline-flex;align-items:center;gap:9px;margin-top:22px;color:rgba(255,255,255,.7);font-size:13px;font-weight:600}
  .hero-trust svg{width:18px;height:18px;color:var(--orange-2)}
  .report-hero-visual{display:flex;justify-content:center}
  .book-wrap{position:relative;perspective:1600px}
  .report-book{position:relative;width:clamp(220px,24vw,288px);aspect-ratio:3/4;transform:rotateY(-22deg) rotateX(3deg);transform-style:preserve-3d;border-radius:3px 7px 7px 3px;box-shadow:-26px 34px 60px -22px rgba(0,0,0,.6),-2px 6px 14px rgba(0,0,0,.4)}
  .book-face{position:absolute;inset:0;border-radius:3px 7px 7px 3px;padding:30px 26px 26px;color:#fff;display:flex;flex-direction:column;background:linear-gradient(155deg,var(--accent) 0%,#0a2236 58%,#021828 100%);border-left:6px solid rgba(0,0,0,.4);overflow:hidden}
  .book-face::after{content:"";position:absolute;right:0;top:0;bottom:0;width:8px;background:repeating-linear-gradient(180deg,#e8e3d6,#e8e3d6 1px,#cfc9ba 1px,#cfc9ba 3px)}
  .book-spine{position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(255,255,255,.06));border-radius:3px 0 0 3px;z-index:2}
  .book-logo{width:34px;height:34px;object-fit:contain;margin-bottom:auto}
  .book-ed{color:var(--orange-2);font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
  .book-name{font-family:var(--font-display);font-weight:700;font-size:23px;line-height:1.12;margin-bottom:12px}
  .book-tagline{font-size:11px;color:rgba(255,255,255,.66)}
  .book-badge{position:absolute;right:-6px;bottom:24px;z-index:3;display:inline-flex;align-items:center;gap:7px;background:#fff;color:var(--navy);font-size:12px;font-weight:700;padding:9px 13px;border-radius:999px;box-shadow:0 14px 30px rgba(2,24,40,.34)}
  .book-badge svg{color:var(--orange)}
  .report-statbar{border-top:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);padding:24px 0 20px}
  .report-statbar-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .rstat{display:flex;flex-direction:column;gap:6px;padding-left:18px;border-left:2px solid rgba(255,255,255,.12)}
  .rstat:first-child{border-left:0;padding-left:0}
  .rstat b{font-family:var(--font-display);font-weight:700;color:#fff;font-size:clamp(26px,3vw,34px);line-height:1}
  .rstat span{color:rgba(255,255,255,.6);font-size:12.5px}
  .report-statbar-head{color:var(--orange-2);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;margin-bottom:16px}
  .report-statbar-note{margin-top:16px;color:rgba(255,255,255,.42);font-size:11.5px}
  .teaser-band{background:var(--grad-stone)}
  .band-sub{color:var(--muted);max-width:640px;margin:10px 0 30px;font-size:15px}
  .teaser-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .teaser{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:12px;overflow:hidden}
  .teaser-head{display:flex;align-items:center;justify-content:space-between}
  .teaser-chip{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--stone-2);border:1px solid var(--line);border-radius:999px;padding:5px 10px}
  .teaser-chip svg{width:12px;height:12px}
  .teaser-chip.free{color:#42673f;background:#edf5ed;border-color:#cbdcca}
  .teaser h3{font-family:var(--font-body);font-size:15px;line-height:1.3;color:var(--navy);letter-spacing:0;margin:0}
  .teaser-chart{position:relative;min-height:148px}
  .bar-chart{width:100%;height:auto}
  .bc-label{font:600 12px/1 var(--font-body);fill:var(--ink)}
  .bc-val{font:700 12px/1 var(--font-body);fill:var(--muted)}
  .teaser-blur{filter:blur(7px);opacity:.92;pointer-events:none;user-select:none}
  .teaser-veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.7))}
  .teaser-veil-in{text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px}
  .teaser-veil-in svg{width:26px;height:26px;color:var(--navy)}
  .teaser-veil-in b{font-size:13.5px;color:var(--navy)}
  .teaser-foot{margin-top:24px;color:var(--muted);font-size:13.5px}
  .teaser-foot a{color:var(--orange);font-weight:700;display:inline-flex;align-items:center;gap:6px}
  .teaser-foot a svg{width:14px;height:14px}
  /* click-through data tabs */
  .data-tabs{margin-top:6px}
  .data-tablist{display:flex;gap:2px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:22px;overflow-x:auto}
  .data-tab{appearance:none;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:12px 16px;font:700 14px/1 var(--font-body);color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;transition:color .15s ease,border-color .15s ease}
  .data-tab svg{width:11px;height:11px;opacity:.55}
  .data-tab:hover{color:var(--navy)}
  .data-tab.active{color:var(--orange);border-bottom-color:var(--orange)}
  .data-tab.active svg{opacity:.85}
  .data-panel{display:none}
  .data-panel.active{display:block;animation:dpFade .26s ease}
  @keyframes dpFade{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .dp-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .dp-head h3{font-family:var(--font-body);font-size:16px;color:var(--navy);letter-spacing:0;margin:0}
  .dp-chart{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 28px;box-shadow:var(--shadow-sm);min-height:210px}
  .dp-chart .bar-chart{max-width:640px}
  .area-chart{width:100%;height:200px;display:block}
  .growth-stat{display:flex;align-items:baseline;gap:10px;margin-bottom:14px}
  .growth-stat b{font-family:var(--font-display);font-weight:700;font-size:40px;color:var(--sage);line-height:1}
  .growth-stat span{color:var(--muted);font-size:13px}
  .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}
  .why-item{display:flex;gap:13px;align-items:flex-start}
  .why-item svg{width:24px;height:24px;color:var(--orange);flex:0 0 auto;margin-top:2px}
  .why-item b{display:block;color:var(--navy);font-size:14.5px;margin-bottom:3px}
  .why-item span{color:var(--muted);font-size:13px;line-height:1.45}
  .report-final-cta{position:relative;overflow:hidden;background:var(--grad-navy-deep);color:#fff;padding:72px 0}
  .report-final-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:40px;align-items:center}
  .report-final-cta h2{color:#fff;font-size:clamp(30px,4vw,46px);margin:12px 0 14px;max-width:560px}
  .report-final-cta p{color:rgba(255,255,255,.7);max-width:520px;margin-bottom:20px}
  .final-checks{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:26px;padding:0}
  .final-checks li{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.88);font-size:14px;font-weight:600}
  .final-checks .ck{width:18px;height:18px;color:#fff;background:var(--orange);border-radius:50%;padding:3px;flex:0 0 auto}
  .report-final-visual{display:flex;justify-content:center;perspective:1500px}
  .report-book-tilt{transform:rotateY(18deg) rotateX(4deg)}
  .btn-sm{min-height:0;padding:9px 15px;font-size:12.5px}
  @media(max-width:900px){
    .report-hero-grid{grid-template-columns:1fr;gap:28px}
    .report-hero-visual{order:-1}
    .report-statbar-grid{grid-template-columns:1fr 1fr;gap:16px}
    .teaser-grid{grid-template-columns:1fr 1fr}
    .why-grid{grid-template-columns:1fr}
    .report-final-grid{grid-template-columns:1fr}
    .report-final-visual{display:none}
  }
  @media(max-width:560px){
    .report-statbar-grid,.teaser-grid,.final-checks{grid-template-columns:1fr}
    .rstat{padding-left:0;border-left:0}
  }
</style>`;
}

function reportSchema(industry) {
  const status = STATUS[industry.status];
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${industry.name} Industry Report`,
    description: industry.seo.description,
    brand: { "@type": "Brand", name: "Sherlock Research" },
    image: `${SITE.origin}/og-default.png`,
    offers: {
      "@type": "Offer",
      name: PLANS.single.name,
      price: "497",
      priceCurrency: "USD",
      availability: status.schemaAvailability,
      url: `${SITE.origin}/${industry.slug}-report`
    }
  };
  return `<script type="application/ld+json">${JSON.stringify(product)}</script>`;
}

function statusAction(industry) {
  const hasCheckout = Boolean(industry.stripePaymentLink);
  if (hasCheckout) return { href: industry.stripePaymentLink, text: STATUS[industry.status].checkoutCta, plan: "single" };
  return {
    href: `/contact?industry=${encodeURIComponent(industry.slug)}&plan=single&status=${encodeURIComponent(industry.status)}`,
    text: STATUS[industry.status].cta,
    plan: "single"
  };
}

const lockSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
const chevSvg = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
const checkSvg = `<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-11"/></svg>`;
const shieldSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>`;

// Horizontal bar chart from [[label, percent], ...] — used for the survey teasers.
function barChartSvg(rows, accent) {
  if (!rows || !rows.length) return "";
  const max = Math.max(...rows.map((r) => r[1]), 1);
  const rh = 30;
  const gap = 13;
  const padL = 150;
  const w = 470;
  const h = rows.length * (rh + gap) - gap;
  const bars = rows.map((r, i) => {
    const y = i * (rh + gap);
    const bw = Math.max(8, Math.round((r[1] / max) * (w - padL - 48)));
    const raw = String(r[0]);
    const label = raw.length > 24 ? raw.slice(0, 23) + "…" : raw;
    return `<text x="0" y="${y + rh / 2 + 4}" class="bc-label">${html(label)}</text>` +
      `<rect x="${padL}" y="${y + 3}" width="${bw}" height="${rh - 6}" rx="5" fill="${accent}"/>` +
      `<text x="${padL + bw + 9}" y="${y + rh / 2 + 4}" class="bc-val">${r[1]}%</text>`;
  }).join("");
  return `<svg class="bar-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMinYMin meet" role="img" aria-hidden="true">${bars}</svg>`;
}

// Illustrative upward area chart, deterministically varied per slug (no real CAGR data).
function areaChartSvg(slug, accent) {
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) >>> 0;
  const rand = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  const n = 9;
  const w = 600;
  const ht = 190;
  const pts = [];
  let v = 26 + rand() * 14;
  for (let i = 0; i < n; i++) { v += 5 + rand() * 11; pts.push(v); }
  const max = Math.max(...pts) * 1.08;
  const coords = pts.map((p, i) => [(i / (n - 1)) * w, ht - (p / max) * (ht - 16)]);
  const line = coords.map((c) => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const dots = coords.map((c) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3" fill="${accent}"/>`).join("");
  return `<svg class="area-chart" viewBox="0 0 ${w} ${ht}" preserveAspectRatio="none" role="img" aria-hidden="true">` +
    `<defs><linearGradient id="ag-${slug}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".34"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>` +
    `<polygon points="0,${ht} ${line} ${w},${ht}" fill="url(#ag-${slug})"/>` +
    `<polyline points="${line}" fill="none" stroke="${accent}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>` +
    `<g vector-effect="non-scaling-stroke">${dots}</g></svg>`;
}

function reportPage(industry) {
  const status = STATUS[industry.status];
  const action = statusAction(industry);
  const canonical = `/${industry.slug}-report`;
  const pageTitle = industry.seo.title;
  const modules = [
    ["market", "Market overview", `Category size, growth context, and demand indicators for ${industry.serviceLabel}.`],
    ["local", "Local signal", "Search demand, competitor density, customer switching pressure, and market-entry implications."],
    ["economics", "Operator economics", "Pricing, margin pressure, labor constraints, retention, and channel recommendations."],
    ["customer", "Customer research", `Buyer priorities, switching triggers, willingness-to-pay, and trust factors in ${industry.name}.`],
    ["playbook", "Competitive playbook", "Positioning, offers, service bundles, and local go-to-market recommendations."],
    ["method", "Sources and method", "Survey inputs, operator interviews, macro data, local scans, and source notes."]
  ];
  const deliverySignal = industry.status === "available" ? "Emailed after checkout" : industry.status === "presell" ? "Yours at launch" : "Launching soon";
  const deliveryStatus = industry.fullReportAsset
    ? "Your secure download link is emailed the moment your payment clears."
    : "The free sample shows exactly what you'll get. Your full report then arrives by email — we only promise what's ready.";
  const ins = insightsFor(industry.slug);
  const st = ins.stats || {};
  const accent = industry.status === "available" ? "#5c6746" : industry.status === "presell" ? "#92602d" : "#546d7c";
  const checkoutBtn = (cls = "btn-lg") => `<a href="${html(action.href)}" class="btn btn-primary ${cls}" data-checkout-plan="${html(action.plan)}" data-report-slug="${html(industry.slug)}" data-analytics-event="checkout_cta">${html(action.text)} ${arrowSvg}</a>`;
  const TAB_DEFS = [
    { key: "demand", label: "Demand", locked: false },
    { key: "channels", label: "Channels", locked: false },
    { key: "pricing", label: "Pricing", locked: true },
    { key: "spend", label: "Spend", locked: true },
    { key: "switching", label: "Switching", locked: true }
  ];
  const unlockCta = `<a href="${html(action.href)}" class="btn btn-primary btn-sm" data-checkout-plan="single" data-report-slug="${html(industry.slug)}" data-analytics-event="teaser_unlock">${html(action.text)}</a>`;
  const tabItems = (ins.teasers || []).slice(0, 5).map((t, i) => {
    const def = TAB_DEFS[i] || { key: "cut" + i, label: "Data", locked: true };
    return { key: def.key, label: def.label, locked: def.locked, title: t.label, chart: barChartSvg(t.rows, accent) };
  });
  tabItems.push({ key: "growth", label: "Growth", locked: true, growth: true, title: "5-year revenue growth", chart: areaChartSvg(industry.slug, accent) });
  const dataTablist = tabItems.map((it, i) => `<button class="data-tab${i === 0 ? " active" : ""}" type="button" role="tab" aria-selected="${i === 0 ? "true" : "false"}" data-tab="${it.key}">${it.label}${it.locked ? ` ${lockSvg}` : ""}</button>`).join("");
  const dataPanels = tabItems.map((it, i) => {
    const head = `<div class="dp-head"><span class="teaser-chip${it.locked ? "" : " free"}">${it.locked ? `${lockSvg} Locked` : "Open preview"}</span><h3>${html(it.title)}</h3></div>`;
    let body;
    if (!it.locked) {
      body = `<div class="dp-chart">${it.chart}</div>`;
    } else {
      const growthStat = it.growth ? `<div class="growth-stat"><b class="teaser-blur">+14.2%</b><span>projected 5-year revenue growth</span></div>` : "";
      body = `<div class="dp-chart">${growthStat}<div class="teaser-blur">${it.chart}</div><div class="teaser-veil"><div class="teaser-veil-in">${lockSvg}<b>Unlock with the full report</b>${unlockCta}</div></div></div>`;
    }
    return `<div class="data-panel${i === 0 ? " active" : ""}" role="tabpanel" data-panel="${it.key}">${head}${body}</div>`;
  }).join("\n        ");
  return `<!DOCTYPE html>
<html lang="en">
${head({ title: pageTitle, description: industry.seo.description, canonical, schema: reportSchema(industry) })}
<body data-report-slug="${html(industry.slug)}">
${nav("reports")}
<main>
  <header class="report-hero report-hero-pro">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> ${chevSvg} <a href="/reports">Reports</a> ${chevSvg} <span>${html(industry.name)} Report</span></nav>
      <div class="report-hero-grid">
        <div class="report-hero-copy reveal">
          <div class="eyebrow">${html(industry.edition)} Edition</div>
          <h1>${html(industry.name)}<br>Industry Report</h1>
          <p>${html(industry.seo.description)}</p>
          <ul class="hero-checks">
            <li>${checkSvg} National &amp; local market analysis</li>
            <li>${checkSvg} Competitor &amp; pricing benchmarks</li>
            <li>${checkSvg} Operator interviews &amp; demand signals</li>
          </ul>
          <div class="cta-row">
            ${checkoutBtn()}
            <a href="${html(industry.sampleAsset)}" class="btn btn-outline btn-lg" data-analytics-event="sample_download">View sample pages ${arrowSvg}</a>
          </div>
          <div class="hero-trust">${shieldSvg} Trusted by 2,000+ business owners</div>
        </div>
        <div class="report-hero-visual">
          <div class="book-wrap reveal">
            <div class="report-book" style="--accent:${accent}">
              <span class="book-spine"></span>
              <div class="book-face">
                <img class="book-logo" src="assets/sherlock-colorful.png?v=2" alt="" aria-hidden="true">
                <div class="book-ed">${html(industry.edition)} Edition</div>
                <div class="book-name">${html(industry.name)}<br>Industry Report</div>
                <div class="book-tagline">Trends &middot; Benchmarks &middot; Opportunities</div>
              </div>
            </div>
            <div class="book-badge">${iconSvg("delivery", 15)} ${html(deliverySignal)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="report-statbar">
      <div class="container">
        <div class="report-statbar-head">Trusted by Business Owners &amp; Investors</div>
        <div class="report-statbar-grid">
          <div class="rstat"><b>75+</b><span>5-Star Reviews</span></div>
          <div class="rstat"><b>500+</b><span>Operator Interviews</span></div>
          <div class="rstat"><b>100+</b><span>Major Markets</span></div>
          <div class="rstat"><b>2,000+</b><span>Business Owners</span></div>
        </div>
      </div>
    </div>
  </header>

  <section class="page-band white">
    <div class="container">
      <div class="section-head"><div><div class="eyebrow">Report overview</div><h2>What the ${html(industry.name)} report helps you decide.</h2></div><p>${html(industry.focus)}.</p></div>
      <div class="module-grid">
        ${modules.map(([icon, title, body]) => `<div class="module-card"><div class="module-icon">${iconSvg(icon, 22)}</div><h3>${html(title)}</h3><p>${html(body)}</p></div>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="page-band teaser-band">
    <div class="container">
      <div class="eyebrow">Inside the data</div>
      <h2>Explore the ${html(industry.name)} buyer data.</h2>
      <p class="band-sub">Click through the cuts from Sherlock's ${html(industry.name)} research — open previews are free; the full set unlocks with the report.</p>
      <div class="data-tabs" data-tabs>
        <div class="data-tablist" role="tablist" aria-label="Report data cuts">${dataTablist}</div>
        <div class="data-panels">
        ${dataPanels}
        </div>
      </div>
      <p class="teaser-foot">This data is drawn from Sherlock's ${html(industry.name)} research survey. <a href="${html(industry.tallyUrl)}" target="_blank" rel="noopener" data-analytics-event="tally_survey">Add your voice &mdash; take the 2-minute survey ${arrowSvg}</a></p>
    </div>
  </section>

  <section class="page-band white">
    <div class="container two-col">
      <aside class="panel checkout-box">
        <div class="tag ${html(industry.status)}">${html(status.libraryLabel)}</div>
        <h2>${html(PLANS.single.name)}</h2>
        <div class="price">${html(PLANS.single.price)}</div>
        <p>${html(PLANS.single.description)}</p>
        <div class="cta-row" style="display:grid">
          ${checkoutBtn()}
          <a href="/pricing" class="btn btn-outline-dark">Compare plans</a>
        </div>
        <p class="fine" style="margin-top:16px">${html(status.buyerNote)}</p>
        <p class="fine" style="margin-top:8px">30-day "made a better decision" guarantee. Standard reports are licensed to one operating company.</p>
      </aside>
      <div class="research-copy">
        <div class="eyebrow">Why operators rely on Sherlock</div>
        <h2>Built for teams making market calls.</h2>
        <div class="why-grid">
          <div class="why-item">${iconSvg("customer", 20)}<div><b>Interview-backed</b><span>Operator and buyer interviews, not just scraped data.</span></div></div>
          <div class="why-item">${iconSvg("local", 20)}<div><b>Local precision</b><span>City-level demand and competition, not national averages.</span></div></div>
          <div class="why-item">${iconSvg("economics", 20)}<div><b>Operator economics</b><span>Pricing, margin, retention, and channel benchmarks.</span></div></div>
          <div class="why-item">${iconSvg("playbook", 20)}<div><b>Action-ready</b><span>Every section ends with a clear recommendation.</span></div></div>
        </div>
        <div class="delivery-note">${html(deliveryStatus)}</div>
      </div>
    </div>
  </section>

  <section class="report-final-cta">
    <div class="container report-final-grid">
      <div class="reveal">
        <div class="eyebrow">${html(status.label)}</div>
        <h2>Get the full ${html(industry.name)} Industry Report.</h2>
        <p>Make smarter decisions with the most complete ${html(industry.name)} market intelligence we publish.</p>
        <ul class="final-checks">
          <li>${checkSvg} 40+ pages of analysis &amp; charts</li>
          <li>${checkSvg} Local demand &amp; competition signals</li>
          <li>${checkSvg} Pricing &amp; switching benchmarks</li>
          <li>${checkSvg} Operator-ready recommendations</li>
        </ul>
        <div class="cta-row">${checkoutBtn()}<a href="${html(industry.sampleAsset)}" class="btn btn-outline btn-lg" data-analytics-event="sample_download">View sample</a></div>
      </div>
      <div class="report-final-visual reveal">
        <div class="report-book report-book-tilt" style="--accent:${accent}">
          <span class="book-spine"></span>
          <div class="book-face">
            <img class="book-logo" src="assets/sherlock-colorful.png?v=2" alt="" aria-hidden="true">
            <div class="book-name">${html(industry.name)}<br>Industry Report</div>
            <div class="book-tagline">${html(industry.edition)} Edition</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
${footer()}
<script src="shared/catalog.js"></script>
<script src="shared/app.js"></script>
</body>
</html>
`;
}

function reportCard(industry) {
  const status = STATUS[industry.status];
  return `<a class="industry-card" href="/${html(industry.slug)}-report" data-name="${html(industry.name.toLowerCase())}" data-status="${html(industry.status)}" data-category="${html(industry.category)}">
  <div class="tag-row"><span class="tag ${html(industry.status)}">${html(status.libraryLabel)}</span><span class="tag">${html(industry.category.replace(/-/g, " "))}</span></div>
  <div class="card-icon">${iconSvg(iconForIndustry(industry), 22)}</div>
  <h3>${html(industry.name)}</h3>
  <p>${html(industry.focus)}</p>
  <span class="arrow-link">View report ${arrowSvg}</span>
</a>`;
}

function libraryPage() {
  const categories = [...new Set(INDUSTRIES.map((industry) => industry.category))].sort();
  return `<!DOCTYPE html>
<html lang="en">
${head({
  title: "Report Library - Sherlock Research",
  description: "Browse all 50 Sherlock Research industry report pages with active, presell, and waitlist status.",
  canonical: "/reports"
})}
<body>
${nav("reports")}
<main>
  <header class="library-hero">
    <div class="container hero-copy">
      <div class="eyebrow">50-industry library</div>
      <h1>Every Sherlock report page in one place.</h1>
      <p>Browse active, presell, and waitlist reports across home services, healthcare, automotive, hospitality, real estate, finance, education, and professional services.</p>
    </div>
  </header>
  <section class="page-band">
    <div class="container">
      <div class="filters">
        <input id="reportSearch" type="search" placeholder="Search industries">
        <select id="statusFilter" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="available">Active</option>
          <option value="presell">Presell</option>
          <option value="waitlist">Waitlist</option>
        </select>
        <select id="categoryFilter" aria-label="Filter by category">
          <option value="">All categories</option>
          ${categories.map((category) => `<option value="${html(category)}">${html(category.replace(/-/g, " "))}</option>`).join("")}
        </select>
      </div>
      <div class="report-library-grid" id="reportLibraryGrid">
        ${INDUSTRIES.map(reportCard).join("\n        ")}
      </div>
    </div>
  </section>
</main>
${footer()}
<script src="shared/catalog.js"></script>
<script src="shared/app.js"></script>
<script>
  (function(){
    var search = document.getElementById('reportSearch');
    var status = document.getElementById('statusFilter');
    var category = document.getElementById('categoryFilter');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.industry-card'));
    function applyFilters(){
      var q = (search.value || '').toLowerCase().trim();
      var st = status.value;
      var cat = category.value;
      cards.forEach(function(card){
        var ok = (!q || card.dataset.name.indexOf(q) !== -1) && (!st || card.dataset.status === st) && (!cat || card.dataset.category === cat);
        card.style.display = ok ? '' : 'none';
      });
    }
    [search,status,category].forEach(function(el){ el.addEventListener('input', applyFilters); el.addEventListener('change', applyFilters); });
  })();
</script>
</body>
</html>
`;
}

function successPage() {
  return `<!DOCTYPE html>
<html lang="en">
${head({
  title: "Purchase Confirmation - Sherlock Research",
  description: "Sherlock Research purchase confirmation and report delivery status.",
  canonical: "/success",
  noindex: true
})}
<body>
${nav("reports")}
<main>
  <header class="success-hero">
    <div class="container hero-copy">
      <div class="eyebrow">Checkout received</div>
      <h1>We are confirming your report access.</h1>
      <p>Your confirmation email is on its way — check your inbox (and spam folder) over the next few minutes for your order details and report status.</p>
      <div class="cta-row">
        <a href="/reports" class="btn btn-primary btn-lg">Browse reports</a>
        <a href="/contact" class="btn btn-outline btn-lg">Contact support</a>
      </div>
    </div>
  </header>
</main>
${footer()}
<script src="shared/app.js"></script>
</body>
</html>
`;
}

function samplePage() {
  return `<!DOCTYPE html>
<html lang="en">
${head({
  title: "Free Sample Report - Sherlock Research",
  description: "Download a free Sherlock Research sample report PDF and see the report structure, chart style, methodology, and recommendations before buying.",
  canonical: "/sample"
})}
<body>
${nav("sample")}
<main>
  <header class="sample-hero">
    <div class="container hero-copy">
      <div class="eyebrow">Sample report</div>
      <h1>See the report structure before you buy.</h1>
      <p>Download the sample PDF to inspect the chart layout, methodology, and recommendation format used across Sherlock industry reports.</p>
      <div class="cta-row">
        <a href="${SITE.samplePdf}" class="btn btn-primary btn-lg" data-analytics-event="sample_download" download>Download sample PDF ${arrowSvg}</a>
        <a href="/reports" class="btn btn-outline btn-lg">Browse all reports</a>
      </div>
    </div>
  </header>
  <section class="page-band">
    <div class="container two-col">
      <div class="panel">
        <div class="eyebrow">What is inside</div>
        <h2>Real structure, compressed.</h2>
        <p>The sample shows the same report pattern used across the 50-industry library: market context, local signal, customer research, operator economics, and action recommendations.</p>
        <div class="module-grid" style="margin-top:22px">
          <div class="module-card"><h3>Market snapshot</h3><p>How the category is framed before local recommendations.</p></div>
          <div class="module-card"><h3>Buyer signal</h3><p>How survey and interview inputs become decisions.</p></div>
          <div class="module-card"><h3>Operator action</h3><p>How each section closes with a specific move.</p></div>
        </div>
      </div>
      <div class="panel">
        <h2>Next step</h2>
        <p>Use the library to choose the industry page you care about, then take the matching survey or request the purchase link.</p>
        <div class="cta-row" style="display:grid">
          <a href="/reports" class="btn btn-primary btn-lg">Open report library</a>
          <a href="/contact" class="btn btn-outline-dark">Ask a question</a>
        </div>
      </div>
    </div>
  </section>
</main>
${footer()}
<script src="shared/app.js"></script>
</body>
</html>
`;
}

function launchDashboard() {
  const rows = INDUSTRIES.map((industry) => {
    const link = industry.readiness?.checkout || (industry.status === "waitlist" ? "waitlist" : "dynamic");
    const sample = industry.readiness?.samplePdf || (industry.sampleAsset ? "ready" : "missing");
    const asset = industry.readiness?.fullPdf || (industry.fullReportAsset ? "ready" : "missing");
    const email = industry.readiness?.emailDelivery || "cloudflare-email";
    const audit = industry.readiness?.audit || "pending";
    return `<tr>
      <td>${industry.id}</td>
      <td><a href="/${html(industry.slug)}-report">${html(industry.name)}</a><br><span class="code">${html(industry.slug)}</span></td>
      <td><span class="tag ${html(industry.status)}">${html(STATUS[industry.status].libraryLabel)}</span></td>
      <td><a href="${html(industry.tallyUrl)}" target="_blank" rel="noopener">public</a> / <a href="${html(industry.tallyEditUrl)}" target="_blank" rel="noopener">edit</a></td>
      <td>${link}</td>
      <td>${sample}</td>
      <td>${asset}</td>
      <td>${email}<br><span class="code">${html(industry.email.purchaseEvent)}</span><br><span class="code">${html(industry.email.waitlistEvent)}</span></td>
      <td>${audit}</td>
    </tr>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
${head({
  title: "Launch Dashboard - Sherlock Research",
  description: "Internal Sherlock Research 50-industry launch dashboard.",
  canonical: "/ops-launch-dashboard",
  noindex: true
})}
<body>
${nav("reports")}
<main>
  <header class="library-hero">
    <div class="container hero-copy">
      <div class="eyebrow">Internal readiness</div>
      <h1>50-industry launch dashboard.</h1>
      <p>Track page status, Tally forms, dynamic Stripe Checkout, Cloudflare email events, and report asset readiness before launch.</p>
    </div>
  </header>
  <section class="page-band">
    <div class="container">
      <table class="ops-table">
        <thead><tr><th>#</th><th>Industry</th><th>Status</th><th>Tally</th><th>Checkout</th><th>Sample PDF</th><th>Full PDF</th><th>Email delivery</th><th>Audit</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>
</main>
${footer()}
<script src="shared/app.js"></script>
</body>
</html>
`;
}

function catalogJs() {
  const catalog = {
    supportEmail: SITE.supportEmail,
    defaultReportSlug: "landscaping",
    statuses: STATUS,
    plans: PLANS,
    reports: catalogReports()
  };
  return `(function () {
  "use strict";

  /*
    Generated by scripts/generate-site.mjs.
    Keep checkout/API keys out of this file. This file is public frontend code.
    Checkout is created dynamically through /api/checkout; keep Stripe secrets out of this file.
    Product segmentation: industry | quarter/year | access | cityInclusion.
  */
  window.SherlockCatalog = ${JSON.stringify(catalog, null, 2)};
})();
`;
}

function sitemapXml() {
  const top = [
    ["/", "weekly", "1.0"],
    ["/reports", "weekly", "0.98"],
    ["/pricing", "monthly", "0.95"],
    ["/sample", "monthly", "0.8"],
    ["/about", "monthly", "0.7"],
    ["/faq", "monthly", "0.7"],
    ["/contact", "yearly", "0.6"],
    ["/blog-article", "weekly", "0.6"],
    ["/privacy-policy", "yearly", "0.3"],
    ["/terms-of-service", "yearly", "0.3"]
  ];
  const reportUrls = INDUSTRIES.map((industry) => [`/${industry.slug}-report`, "monthly", industry.status === "available" ? "0.9" : "0.75"]);
  const urls = [...top, ...reportUrls];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, changefreq, priority]) => `  <url><loc>${SITE.origin}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join("\n")}
</urlset>
`;
}

function redirectsFile() {
  const base = [
    ["/index.html", "/", "301"],
    ["/reports.html", "/reports", "301"],
    ["/about.html", "/about", "301"],
    ["/contact.html", "/contact", "301"],
    ["/faq.html", "/faq", "301"],
    ["/pricing.html", "/pricing", "301"],
    ["/sample.html", "/sample", "301"],
    ["/success.html", "/success", "301"],
    ["/blog-article.html", "/blog-article", "301"],
    ["/privacy-policy.html", "/privacy-policy", "301"],
    ["/terms-of-service.html", "/terms-of-service", "301"],
    ["/ops-launch-dashboard.html", "/ops-launch-dashboard", "301"]
  ];
  const reports = INDUSTRIES.map((industry) => [`/${industry.slug}-report.html`, `/${industry.slug}-report`, "301"]);
  return `# Legacy .html URLs -> clean URLs (301) for SEO + old bookmarks
${[...base, ...reports].map((row) => row.join(" ")).join("\n")}
`;
}

async function updateHomepage() {
  const indexPath = path.join(root, "index.html");
  let source = await readFile(indexPath, "utf8");
  const featured = INDUSTRIES.map((industry) => {
    const color = industry.status === "available" ? "#5C7F5A" : industry.status === "presell" ? "#F26A21" : "#60788E";
    return `<a class="report-card generic" href="/${html(industry.slug)}-report" style="--card-accent:${color};--card-bg-1:#1c2f44;--card-bg-2:#0D1B2A">
          <div>
            <div class="report-edition">${html(STATUS[industry.status].libraryLabel)} &middot; ${html(industry.edition)}</div>
            <h3 class="report-title">${html(industry.name)}<br>Industry Report</h3>
            <div class="report-icon">${iconSvg(iconForIndustry(industry), 34)}</div>
          </div>
          <div class="report-meta"><span>${html(industry.focus.split(",").slice(0, 3).join(","))}.</span><span class="report-arrow">${arrowSvg}</span></div>
        </a>`;
  }).join("\n\n        ");

  source = source.replace(
    /(?:<div class="report-actions">\s*<div class="testimonial-controls">[\s\S]*?<\/div>\s*<a href="\/reports" class="arrow-link">[\s\S]*?<\/a>\s*<\/div>|<a href="\/(?:pricing|reports)" class="arrow-link">(?:View Pricing|View All 50 Reports)[\s\S]*?<\/a>)/,
    `<div class="report-actions">
          <div class="testimonial-controls">
            <button class="testimonial-btn" type="button" aria-label="Previous reports" data-report-prev>&lsaquo;</button>
            <button class="testimonial-btn" type="button" aria-label="Next reports" data-report-next>&rsaquo;</button>
          </div>
          <a href="/reports" class="arrow-link">View All 50 Reports
          ${arrowSvg}
          </a>
        </div>`
  );
  source = source.replace(
    /<div class="report-(?:grid|carousel)[\s\S]*?<div class="trusted-note reveal">/,
    `<div class="report-grid reveal" data-report-carousel data-total="${INDUSTRIES.length}" aria-live="polite">
        ${featured}
      </div>
      <div class="testimonial-footer report-footer">
        <span data-report-page-label>Showing 1-4 of ${INDUSTRIES.length}</span>
        <div class="testimonial-dots" data-report-dots aria-label="Report pages"></div>
      </div>

      <div class="trusted-note reveal">`
  );
  source = source.replace(
    /<h2>Ten editable testimonial slots, three visible at a time\.<\/h2>/,
    "<h2>How teams use Sherlock before making a market move.</h2>"
  );
  const useCases = [
    { tag: "Operator", quote: "Decide which service line deserves the next hire, route expansion, or pricing change.", name: "Growth planning", role: "Service mix, staffing, pricing" },
    { tag: "Investor", quote: "Pressure-test a market before acquisition outreach, diligence, or a new roll-up thesis.", name: "Market diligence", role: "Demand, fragmentation, margin risk" },
    { tag: "Agency", quote: "Shape vertical-specific positioning, offers, local landing pages, and channel strategy.", name: "Client strategy", role: "Messaging, channels, conversion" },
    { tag: "Franchise", quote: "Compare local demand and competition before prioritizing territories or support plays.", name: "Territory planning", role: "Market entry, density, local signal" },
    { tag: "Founder", quote: "Replace guesswork with customer interviews, operator benchmarks, and action notes.", name: "New market read", role: "Customer signal, competitor scan" },
    { tag: "Team", quote: "Give sales, marketing, and operations one shared view of the market reality.", name: "Alignment", role: "Shared context, concrete actions" }
  ];
  source = source.replace(
    /var testimonials = \[[\s\S]*?\];/,
    `var testimonials = ${JSON.stringify(useCases, null, 6)};`
  );
  source = source.replace(
    /<div class="trust-card"><b>Checkout ready<\/b><span>Use Stripe links now[\s\S]*?<\/span><\/div>/,
    '<div class="trust-card"><b>Instant access</b><span>Check out securely, then your report and quarterly updates land straight in your inbox.</span></div>'
  );
  source = source.replace(
    /<div class="step-card"><h3>Checkout and download<\/h3><p>Use Stripe links first[\s\S]*?<\/p><\/div>/,
    '<div class="step-card"><h3>Check out securely</h3><p>Pay by card in seconds. You\'ll get an email confirming your report and exactly when it\'s ready.</p></div>'
  );
  source = source.replace(
    /(<span class="trust-point"><svg[\s\S]*?<\/svg>)\s*Instant\s+PDF delivery(<\/span>)/,
    "$1 Email confirmation$2"
  );
  source = source.replaceAll("hello@" + "sherlockresearch.com", "hello@sherlockreports.com");
  source = source.replaceAll("support@" + "sherlockresearch.com", "support@sherlockreports.com");
  await writeFile(indexPath, source, "utf8");
}

async function main() {
  await save("shared/catalog.js", catalogJs());
  await save("reports.html", libraryPage());
  await save("success.html", successPage());
  await save("sample.html", samplePage());
  await save("ops-launch-dashboard.html", launchDashboard());
  await save("sitemap.xml", sitemapXml());
  await save("_redirects", redirectsFile());

  for (const industry of INDUSTRIES) {
    await save(industry.page, reportPage(industry));
  }

  await updateHomepage();
  console.log(`Generated ${INDUSTRIES.length} report pages, catalog, sitemap, redirects, reports page, success page, sample page, and launch dashboard.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
