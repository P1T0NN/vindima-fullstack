// TYPES
import type { RetryPaginationOptions } from '@/features/pagination/types/convexPaginationTypes.js';

/** Recreate the current Convex subscription so a failed page can be retried. */
export function retryPagination<Item>(options: RetryPaginationOptions<Item>): void {
	if (!options.queryEnabled || options.visibleError === undefined || options.retrying) return;

	const key = options.resetKey;
	let session = options.getSession();
	if (session.key !== key) {
		options.setSession(options.createSession(key));
		session = options.getSession();
	}
	session.retrying = true;
	options.setQueryEnabled(false);

	// Convex keeps a subscription for identical arguments. Toggle skip once so
	// retry explicitly creates a fresh server subscription for the same cursor.
	setTimeout(() => {
		if (options.getSession().key !== key) return;
		options.setQueryEnabled(true);
	}, 0);
}
