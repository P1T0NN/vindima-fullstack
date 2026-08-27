// CONFIG
import { COMPANY_DATA, FEATURES } from '@/shared/config.js';

// TYPES
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

const RESEND_API_URL = 'https://api.resend.com/emails';

/** Single Resend call site shared by scheduled notifications and auth OTP emails. */
export async function sendViaResend(
	to: string,
	content: EmailContent,
	idempotencyKey?: string
): Promise<void> {
	if (!FEATURES.EMAILS) {
		console.log('[emails] skipped - FEATURES.EMAILS is off', { to, subject: content.subject });
		return;
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error('RESEND_API_KEY is not set');

	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json'
	};
	if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

	const response = await fetch(RESEND_API_URL, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			from: `${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>`,
			to: [to],
			subject: content.subject,
			html: content.html,
			text: content.text
		})
	});

	if (!response.ok) {
		throw new Error(`Resend returned HTTP ${response.status}`);
	}
}
