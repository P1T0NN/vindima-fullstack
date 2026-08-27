// HELPERS
import { sendOtpEmail } from '../helpers/sendOtpEmail.js';

// TYPES
import type { OtpEmailData } from '../../emails/types/emailTypes.js';

export function sendVerificationOTPEmail(data: OtpEmailData): Promise<void> {
	return sendOtpEmail(data);
}
