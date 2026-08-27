// Dual-runtime auth schema. Message convention: see `loginSchema.ts` — the shared default
// error map covers the plain cases and bespoke messages stay display-ready.

// LIBRARIES
import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
	email: z.string().trim().min(1).pipe(z.email()),
	flow: z.literal('reset')
});
