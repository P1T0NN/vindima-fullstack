// Dual-runtime auth schema. The default error map covers the plain cases; bespoke messages
// stay as display-ready text in the schema.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/features/auth/config';

// HELPERS
import { isDeniedPassword } from '../utils/denyPasswordList.js';

const password = z
	.string()
	.min(1)
	.min(AUTH_DATA.PASSWORD_MIN_LENGTH)
	.refine((input) => !isDeniedPassword(input), 'Esa contraseña es demasiado común. Elige una más segura.');

const passwordsMustMatch = {
	path: ['confirmPassword'],
	error: 'Las contraseñas deben coincidir.'
};

/** Inline dialog/sheet sign-up: one `name` field. */
export const signUpSchema = z
	.object({
		name: z.string().trim().min(1),
		email: z.string().trim().min(1).pipe(z.email()),
		password,
		confirmPassword: z.string().min(1),
		flow: z.literal('signUp')
	})
	// The match rule lives IN the schema, not in a form model — one parse validates the
	// whole contract on either runtime.
	.refine((data) => data.password === data.confirmPassword, passwordsMustMatch);

/** Full `/signup` page: split name, optional phone, birthday. */
export const signUpPageSchema = z
	.object({
		firstName: z.string().trim().min(1),
		lastName: z.string().trim().min(1),
		email: z.string().trim().min(1).pipe(z.email()),
		password,
		confirmPassword: z.string().min(1),
		phone: z
			.string()
			.trim()
			.transform((value) => (value.length > 0 ? value : undefined))
			.optional(),
		birthday: z.string().trim().min(1),
		flow: z.literal('signUp')
	})
	.refine((data) => data.password === data.confirmPassword, passwordsMustMatch);
