// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../_generated/api';

type InternalApi = typeof internal;

export function registerStorageCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Storage cleanup. Safety net for the manual-delete cases the upload pipeline
	 * can't catch (rows deleted via the Convex dashboard, blobs deleted via the Cloudflare
	 * R2 / Convex storage UIs). Daily is plenty for a safety net; tighten if humans
	 * actually mess with the stores often. Staggered so the two sweeps don't fight for
	 * the same mutation slot.
	 */
	crons.daily(
		'cleanup R2 and uploadedFilesR2',
		{ hourUTC: 3, minuteUTC: 0 },
		internalApi.storage.crons.cleanupOrphanDataR2.cleanupOrphanDataR2
	);

	crons.daily(
		'cleanup convex storage and uploadedFiles',
		{ hourUTC: 3, minuteUTC: 15 },
		internalApi.storage.crons.cleanupOrphanDataConvexStorage.cleanupOrphanDataConvexStorage
	);
}
