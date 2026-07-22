// TEMPLATE
import { authOtpEmail } from '@/convex/emails/templates/authOtpEmail';

// SEND SEAM
import { sendViaResend } from '@/convex/emails/sendViaResend';

// TYPES
import type { OtpEmailType } from '@/shared/features/emails/types/emailsTypes';

/**
 * better-auth OTP hook (A1–A4, see `EmailSystemDesign.md` §4.1). Unlike the transactional
 * emails, this is NOT fire-and-forget: the user is actively waiting on the code, so it sends
 * synchronously through the shared Resend seam (which also owns the `FEATURES.EMAILS` gate and
 * the `from` address). better-auth owns WHEN this fires — do not add trigger logic here.
 */
export async function sendVerificationOTP({
	email,
	otp,
	type
}: {
	email: string;
	otp: string;
	type: OtpEmailType;
}) {
	try {
		await sendViaResend(email, authOtpEmail(otp, type), `authOtp-${type}-${otp}`);
	} catch {
		// Surface a translatable failure to the auth flow (the user is waiting and can retry).
		throw new Error('No se pudo enviar el correo de verificación');
	}
}
