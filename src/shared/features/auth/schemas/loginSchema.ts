// Dual-runtime auth schema — `safeParse` it from Svelte forms AND Convex functions alike.
//
// MESSAGE CONVENTION (all schemas in this folder): validation messages are display-ready
// strings, whether they come from the shared zod error map or a schema-specific rule.

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { AUTH_DATA } from '@/shared/features/auth/config';

export const loginSchema = z.object({
	// `.pipe(z.email())` (v4's non-deprecated form) runs AFTER trim + min(1), so an empty
	// field reads "required" — not "invalid email" — and whitespace never fails the format.
	email: z.string().trim().min(1).pipe(z.email()),
	password: z.string().min(1).min(AUTH_DATA.PASSWORD_MIN_LENGTH),
	flow: z.literal('signIn')
});
