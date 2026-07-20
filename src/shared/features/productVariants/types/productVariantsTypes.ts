// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** One `/admin/rewards` list row — a reward-eligible variant with its product attached,
 *  as returned by `fetchRewardItems`. `product` is null only if the parent doc vanished
 *  (defensive; the delete gates prevent it). */
export type RewardItemRow = Doc<'productVariants'> & { product: Doc<'products'> | null };
