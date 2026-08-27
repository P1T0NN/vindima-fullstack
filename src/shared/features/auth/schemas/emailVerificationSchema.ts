// Dual-runtime auth schema. The default error map covers the plain cases; bespoke messages
// stay as display-ready text in the schema.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/features/auth/config';

/** Matches the OTP format Better Auth's `emailOTP` plugin generates. */
const otpPattern = new RegExp(`^[0-9]{${AUTH_DATA.OTP_LENGTH}}$`, 'u');

export const emailVerificationSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1)
		.regex(otpPattern, `Usa el código de ${AUTH_DATA.OTP_LENGTH} dígitos de tu correo.`),
	email: z.string().trim().pipe(z.email()),
	flow: z.literal('email-verification')
});
