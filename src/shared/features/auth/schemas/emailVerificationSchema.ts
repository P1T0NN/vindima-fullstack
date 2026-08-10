// Dual-runtime auth schema. Message convention: see `loginSchema.ts` — default error map
// covers the plain cases; bespoke messages are bare catalog keys.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/config';

/** Matches the OTP format Better Auth's `emailOTP` plugin generates. */
const otpPattern = new RegExp(`^[0-9]{${AUTH_DATA.OTP_LENGTH}}$`, 'u');

export const emailVerificationSchema = z.object({
	code: z.string().trim().min(1).regex(otpPattern, 'ValidationMessages.Auth.codeFormat'),
	email: z.string().trim().pipe(z.email()),
	flow: z.literal('email-verification')
});
