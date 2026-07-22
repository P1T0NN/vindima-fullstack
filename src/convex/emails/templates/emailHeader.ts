// CONFIG
import { COMPANY_DATA, EMAIL_CONFIG } from '@/shared/config.js';

/**
 * Standalone HTML header block for transactional emails. A centered 600px wide
 * burgundy bar with the company wordmark. Meant to sit above the body content;
 * always rendered identically. See `emailFooter`.
 *
 * ponytail: text wordmark, not a logo image — webp (COMPANY_DATA.LOGO) doesn't
 * render in Outlook/many clients. Swap to a hosted PNG <img> if a logo is required.
 */
export function emailHeader(): string {
	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_CONFIG.BACKGROUND};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
        <tr>
          <td align="center" style="background-color:${EMAIL_CONFIG.ACCENT};padding:28px 24px;border-radius:12px 12px 0 0;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:2px;color:${EMAIL_CONFIG.GOLD};font-weight:bold;text-transform:uppercase;">${COMPANY_DATA.NAME}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}
