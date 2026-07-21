/**
 * Flat form shape for adding a reward-catalog item (`setVariantRewardEligible`).
 * `transformArgs` maps this to `{ variantId, eligible: true }` for the mutation.
 */

// LIBRARIES
import { z } from 'zod';

export const addRewardItemFormSchema = z.object({
	productId: z.string().min(1),
	variantId: z.string().min(1)
});

export type AddRewardItemFormInput = z.infer<typeof addRewardItemFormSchema>;
