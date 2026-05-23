import puppeteer from '@cloudflare/puppeteer';
import type { Env } from './env';

// Render an HTML string to a PDF using Cloudflare Browser Rendering.
// Returns the PDF as a Uint8Array suitable for R2.put().
export async function htmlToPdf(env: Env, htmlString: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
      preferCSSPageSize: true,
    });
    return pdf as Uint8Array;
  } finally {
    await browser.close();
  }
}
