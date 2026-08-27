// EMAILS
import { sendViaResend } from '../../emails/sendViaResend.js';
import { authOtpEmail } from '../../emails/templates/authOtpEmail';

// TYPES
import type { OtpEmailData } from '../../emails/types/emailTypes.js';

export async function sendOtpEmail({ email, otp, type }: OtpEmailData): Promise<void> {
	await sendViaResend(email, authOtpEmail(otp, type));
}
