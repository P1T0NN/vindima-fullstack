// Dual-runtime auth schema. The default error map covers the plain cases; bespoke messages
// stay as display-ready text in the schema.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/features/auth/config';

// HELPERS
import { isDeniedPassword } from '../utils/denyPasswordList.js';

/** Matches the OTP format Better Auth's `emailOTP` plugin generates. */
const otpPattern = new RegExp(`^[0-9]{${AUTH_DATA.OTP_LENGTH}}$`, 'u');

export const passwordResetVerifySchema = z
	.object({
		code: z
			.string()
			.trim()
			.min(1)
			.regex(otpPattern, `Usa el código de ${AUTH_DATA.OTP_LENGTH} dígitos de tu correo.`),
		newPassword: z
			.string()
			.min(1)
			.min(AUTH_DATA.PASSWORD_MIN_LENGTH)
			.refine(
				(input) => !isDeniedPassword(input),
				'Esa contraseña es demasiado común. Elige una más segura.'
			),
		confirmPassword: z.string().min(1),
		email: z.string().trim().pipe(z.email()),
		flow: z.literal('reset-verification')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		path: ['confirmPassword'],
		error: 'Las contraseñas deben coincidir.'
	});
