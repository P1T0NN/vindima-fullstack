// CONFIG
import { COMPANY_DATA, EMAIL_CONFIG } from '@/shared/config.js';

/**
 * Standalone HTML footer block for transactional emails. A centered 600px wide
 * panel with the tagline, contact links, and a legal line. Meant to sit below
 * the body content; always rendered identically. See `emailHeader`.
 */
export function emailFooter(): string {
	const year = new Date().getFullYear();
	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_CONFIG.BACKGROUND};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
        <tr>
          <td align="center" style="background-color:${EMAIL_CONFIG.SURFACE};padding:28px 24px;border-radius:0 0 12px 12px;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${EMAIL_CONFIG.MUTED_TEXT};">${COMPANY_DATA.DESCRIPTION}</p>
            <p style="margin:0 0 16px;font-size:13px;line-height:1.5;">
              <a href="mailto:${COMPANY_DATA.EMAIL}" style="color:${EMAIL_CONFIG.ACCENT};text-decoration:none;">${COMPANY_DATA.EMAIL}</a>
              &nbsp;·&nbsp;
              <a href="${COMPANY_DATA.WHATSAPP_CONTACT_URL}" style="color:${EMAIL_CONFIG.ACCENT};text-decoration:none;">WhatsApp</a>
              &nbsp;·&nbsp;
              <span style="color:${EMAIL_CONFIG.MUTED_TEXT};">${COMPANY_DATA.PHONE}</span>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_CONFIG.MUTED_TEXT};">
              © ${year} ${COMPANY_DATA.NAME}. Todos los derechos reservados.<br />
              <a href="https://${COMPANY_DATA.DOMAIN}" style="color:${EMAIL_CONFIG.MUTED_TEXT};text-decoration:underline;">${COMPANY_DATA.DOMAIN}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}
