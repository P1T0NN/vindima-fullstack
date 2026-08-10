// Dual-runtime auth schema. Message convention: see `loginSchema.ts` — default error map
// covers the plain cases; bespoke messages are bare catalog keys.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/config';

// HELPERS
import { isDeniedPassword } from '../utils/denyPasswordList.js';

/** Matches the OTP format Better Auth's `emailOTP` plugin generates. */
const otpPattern = new RegExp(`^[0-9]{${AUTH_DATA.OTP_LENGTH}}$`, 'u');

export const passwordResetVerifySchema = z
	.object({
		code: z.string().trim().min(1).regex(otpPattern, 'ValidationMessages.Auth.codeFormat'),
		newPassword: z
			.string()
			.min(1)
			.min(AUTH_DATA.PASSWORD_MIN_LENGTH)
			.refine((input) => !isDeniedPassword(input), 'ValidationMessages.Auth.passwordTooCommon'),
		confirmPassword: z.string().min(1),
		email: z.string().trim().pipe(z.email()),
		flow: z.literal('reset-verification')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		path: ['confirmPassword'],
		error: 'ValidationMessages.Auth.passwordsMustMatch'
	});
