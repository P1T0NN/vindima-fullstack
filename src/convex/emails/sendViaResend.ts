// LIBRARIES
import { Resend } from 'resend';

// CONFIG
import { COMPANY_DATA, FEATURES } from '@/shared/config.js';

// TYPES
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * THE single Resend call site (see `EmailSystemDesign.md` §3 + §7.2). Nothing else in the
 * codebase imports Resend. Used by both the `sendEmail` internal action (transactional
 * notifications) and the synchronous auth OTP hook — so one place owns the API key, the
 * `from` address, and the `FEATURES.EMAILS` gate.
 *
 * Not a Convex function — a plain async helper (Resend is `fetch`-based, so no `"use node"`).
 * Throws on send failure; callers decide whether that matters (the OTP hook surfaces it, the
 * action lets Convex retry). Pass `idempotencyKey` so a retry can't double-send.
 *
 * ⚠️ Deliverability: `COMPANY_DATA.RESEND_EMAIL` is still the Resend sandbox sender
 * (`onboarding@resend.dev`), which ONLY delivers to the account owner. Verify the domain and
 * switch it to a real sender before production (`EmailSystemDesign.md` §7.2 launch blocker).
 */
export async function sendViaResend(
	to: string,
	content: EmailContent,
	idempotencyKey?: string
): Promise<void> {
	if (!FEATURES.EMAILS) {
		console.log('[emails] skipped — FEATURES.EMAILS is off', { to, subject: content.subject });
		return;
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error('RESEND_API_KEY is not set');
	const resend = new Resend(apiKey);

	const { error } = await resend.emails.send(
		{
			from: `${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>`,
			to: [to],
			subject: content.subject,
			html: content.html,
			text: content.text
		},
		idempotencyKey ? { idempotencyKey } : undefined
	);

	if (error) {
		throw new Error(`Resend send failed: ${error.name} — ${error.message}`);
	}
}
