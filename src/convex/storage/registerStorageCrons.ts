// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../_generated/api';

type InternalApi = typeof internal;

export function registerStorageCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Storage cleanup. Safety net for the manual-delete cases the upload pipeline
	 * can't catch (rows deleted via the Convex dashboard, objects deleted via the
	 * Cloudflare R2 UI). Daily is plenty for a safety net; tighten if humans actually
	 * mess with the store often.
	 */
	crons.daily(
		'cleanup R2 and uploadedFilesR2',
		{ hourUTC: 3, minuteUTC: 0 },
		internalApi.storage.crons.cleanupOrphanDataR2.cleanupOrphanDataR2
	);
}
