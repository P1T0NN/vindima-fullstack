// LIBRARIES
import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';

// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';

// All admin actions (delete/ban/unban/role-change/session-revoke) go through
// Convex mutations in `src/convex/tables/users/userMutations.ts`, so the BA
// `adminClient()` plugin isn't installed here. Re-add it only if you need
// to call `authClient.admin.*` directly (e.g. a UI that can't take a Convex
// round-trip for the admin step) and pair it with `recordAdminAction` for
// the audit trail.

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields({
			user: {
				phone: { type: 'string', required: false, input: true },
				birthday: { type: 'string', required: false, input: true }
			}
		}),
		convexClient(),
		emailOTPClient()
	],
	fetchOptions: {
		onError: async (context) => {
			if (context.response.status !== 429) return;

			const retryAfterHeader = context.response.headers.get('X-Retry-After');
			const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
			const retryAfterMs =
				Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : undefined;

			toast.error(rateLimitMessage(retryAfterMs));
		}
	}
});
