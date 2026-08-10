// Dual-runtime auth schema — `safeParse` it from Svelte forms AND Convex functions alike.
//
// MESSAGE CONVENTION (all schemas in this folder): no rendered text, ever. The default
// zod error map (`@/shared/features/validations`) already turns required/email/min/max
// into human message CODES; a bespoke message is just a bare catalog key string (or
// `JSON.stringify({ key, params })` when it needs params) — the frontend translates at
// render via `zodIssuesToFieldErrors`.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/config';

export const loginSchema = z.object({
	// `.pipe(z.email())` (v4's non-deprecated form) runs AFTER trim + min(1), so an empty
	// field reads "required" — not "invalid email" — and whitespace never fails the format.
	email: z.string().trim().min(1).pipe(z.email()),
	password: z.string().min(1).min(AUTH_DATA.PASSWORD_MIN_LENGTH),
	flow: z.literal('signIn')
});
