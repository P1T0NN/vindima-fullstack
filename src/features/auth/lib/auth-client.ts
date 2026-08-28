// LIBRARIES
import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';

// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { formatRateLimitMessage } from '@/utils/toastMessage';

// The Better Auth `adminClient()` plugin isn't installed — there is no admin
// user-management surface here. Re-add it only if you need `authClient.admin.*`
// directly.

export const authClient = createAuthClient({
	sessionOptions: {
		refetchOnWindowFocus: false
	},
	plugins: [
		inferAdditionalFields({
			user: {
				phone: { type: 'string', required: false, input: true }
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

			toast.error(formatRateLimitMessage(retryAfterMs));
		}
	}
});
