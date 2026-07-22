// CONFIG
import { COMPANY_DATA, EMAIL_CONFIG } from '@/shared/config.js';

// CHROME
import { emailHeader } from './emailHeader';
import { emailFooter } from './emailFooter';

/**
 * Shared, email-safe layout primitives (see `EmailSystemDesign.md` §3 "The sandwich").
 * Every template composes its body from these so no table/inline-style boilerplate is
 * repeated. Rules: table-based, inline hex only (no CSS vars, no `<style>` blocks — Gmail
 * strips them), no images for critical info, single 600px column.
 *
 * Serif stack matches the header wordmark; sans stack is the body default.
 */
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = 'Arial,Helvetica,sans-serif';

/** Absolute site URL for a path (emails need absolute links). e.g. `siteUrl('/shop')`. */
export function siteUrl(path: string): string {
	return `https://${COMPANY_DATA.DOMAIN}${path}`;
}

/** First name only for greetings; empty string when the name is blank (caller falls back to "Hola"). */
export function firstName(name: string): string {
	return name.trim().split(/\s+/)[0] ?? '';
}

/** Escape user-supplied strings (names, notes, addresses) before interpolating into HTML. */
export function esc(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** H1 — the one fact, ≤ 8 words. Serif, foreground color. */
export function h1(text: string): string {
	return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:24px;line-height:1.25;color:${EMAIL_CONFIG.TEXT};font-weight:bold;">${text}</h1>`;
}

/** Body paragraph. Pass `muted: true` for secondary lines. */
export function p(html: string, muted = false): string {
	const color = muted ? EMAIL_CONFIG.MUTED_TEXT : EMAIL_CONFIG.TEXT;
	return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${color};">${html}</p>`;
}

/** Tinted inner panel — the data block customers screenshot. `innerHtml` is caller-built. */
export function panel(innerHtml: string): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_CONFIG.SURFACE};border-radius:8px;margin:0 0 20px;">
  <tr><td style="padding:20px 24px;font-family:${SANS};">${innerHtml}</td></tr>
</table>`;
}

/** Single solid CTA button + the full URL printed underneath (button rendering fails in some clients). */
export function button(label: string, url: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
  <tr><td align="center" style="background-color:${EMAIL_CONFIG.ACCENT};border-radius:8px;">
    <a href="${url}" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:15px;font-weight:bold;color:${EMAIL_CONFIG.ON_ACCENT};text-decoration:none;">${label}</a>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-family:${SANS};font-size:12px;line-height:1.5;color:${EMAIL_CONFIG.MUTED_TEXT};word-break:break-all;">${url}</p>`;
}

/**
 * Assemble the full email: hidden preheader (inbox preview) → header → body card → footer.
 * `bodyHtml` is the caller's composed primitives; `preheader` is the ~80-char preview line
 * that should complete (not repeat) the subject.
 */
export function renderEmail(preheader: string, bodyHtml: string): string {
	const hiddenPreheader = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;">${preheader}</div>`;
	const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_CONFIG.BACKGROUND};margin:0;padding:0;">
  <tr><td align="center" style="padding:0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
      <tr><td style="background-color:${EMAIL_CONFIG.CARD};padding:32px 24px;">${bodyHtml}</td></tr>
    </table>
  </td></tr>
</table>`;
	return hiddenPreheader + emailHeader() + body + emailFooter();
}
