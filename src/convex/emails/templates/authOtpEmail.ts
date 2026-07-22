// CONFIG
import { COMPANY_DATA, EMAIL_CONFIG } from '@/shared/config.js';

// LAYOUT
import { renderEmail, h1, p } from './emailLayout';

// TYPES
import type { EmailContent, OtpEmailType } from '@/shared/features/emails/types/emailsTypes';

/**
 * A1–A4 — the four better-auth OTP flows share one layout; only the verb changes
 * (`EmailSystemDesign.md` §5 A1). The code is the action, so there is no CTA button —
 * the OTP itself, large and centered, is the whole email.
 *
 * ponytail: OTP validity is better-auth's `emailOTP.expiresIn`, which this project leaves
 * at the default 5 minutes. Hardcoded here with a comment; bump both together if config changes.
 */
const OTP_EXPIRY_MINUTES = 5;

/** Per-type copy: subject verb, H1, and the context sentence. `{n}` filled with the expiry. */
const COPY: Record<OtpEmailType, { subject: string; h1: string; context: string }> = {
	'sign-in': {
		subject: 'Tu código de acceso',
		h1: 'Tu código de acceso',
		context: `Usa este código para iniciar sesión en ${COMPANY_DATA.NAME}.`
	},
	'email-verification': {
		subject: 'Verifica tu correo',
		h1: 'Verifica tu correo',
		context: `Usa este código para verificar tu correo en ${COMPANY_DATA.NAME}.`
	},
	'forget-password': {
		subject: 'Restablece tu contraseña',
		h1: 'Restablece tu contraseña',
		context: `Usa este código para restablecer tu contraseña en ${COMPANY_DATA.NAME}.`
	},
	'change-email': {
		subject: 'Confirma tu nuevo correo',
		h1: 'Confirma tu nuevo correo',
		context: `Solicitaste cambiar tu correo a esta dirección en ${COMPANY_DATA.NAME}. Usa este código para confirmarlo.`
	}
};

export function authOtpEmail(otp: string, type: OtpEmailType): EmailContent {
	const copy = COPY[type];
	const context = `${copy.context} Expira en ${OTP_EXPIRY_MINUTES} minutos.`;

	const codeBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr><td align="center" style="background-color:${EMAIL_CONFIG.SURFACE};border-radius:8px;padding:24px;">
    <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:bold;letter-spacing:8px;color:${EMAIL_CONFIG.ACCENT};">${otp}</span>
  </td></tr>
</table>`;

	const bodyHtml =
		h1(copy.h1) +
		p(context) +
		codeBlock +
		p('¿No fuiste tú? Ignora este correo — nadie puede entrar sin el código.', true);

	const html = renderEmail(context, bodyHtml);
	const text = [
		copy.h1,
		'',
		context,
		'',
		`Código: ${otp}`,
		'',
		'¿No fuiste tú? Ignora este correo.'
	].join('\n');

	// Sign-in puts the code in the subject (zero-open sign-in from the notification shade —
	// `EmailSystemDesign.md` §5 A1). The other flows keep the code out of the subject.
	const subject = type === 'sign-in' ? `Tu código: ${otp}` : copy.subject;

	return { subject, html, text };
}
