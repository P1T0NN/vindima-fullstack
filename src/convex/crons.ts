// LIBRARIES
import { cronJobs } from 'convex/server';

// CONFIG
import { internal } from './_generated/api';
import { STORAGE_CONFIG } from '@/shared/features/storage/config';

// CRONS
import { registerRewardAccountsCrons } from './tables/rewardAccounts/registerRewardAccountsCrons';
import { registerRewardLedgerCrons } from './tables/rewardLedger/registerRewardLedgerCrons';
import { registerOrdersCrons } from './tables/orders/registerOrdersCrons';

/**
 * Scheduled jobs. Convex requires this file at the convex root, default-exporting
 * the registry.
 */
const crons = cronJobs();

registerRewardAccountsCrons(crons, internal);
registerRewardLedgerCrons(crons, internal);
registerOrdersCrons(crons, internal);

crons.interval(
	'clean up abandoned R2 uploads',
	{ minutes: STORAGE_CONFIG.cleanupIntervalMinutes },
	internal.storage.r2.cleanupStaleUploads
);

export default crons;
