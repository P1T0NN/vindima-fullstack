// Dual-runtime auth schema. Message convention: see `loginSchema.ts` — default error map
// covers the plain cases; bespoke messages are bare catalog keys.

// LIBRARIES
import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
	email: z.string().trim().min(1).pipe(z.email()),
	flow: z.literal('reset')
});
