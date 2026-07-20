/**
 * Zod schema + types for the order-placement form.
 *
 * The form model is flat (one key per rendered field) — `transformArgs` on the checkout form nests
 * it into `placeOrder`'s `{ contact, delivery, ... }` args, so this is the *form* shape, not the
 * mutation's arg shape. Address fields are only required when the delivery mode needs them, so they
 * validate conditionally rather than via `required`.
 *
 * The schema is the single source of truth; the types are inferred from it.
 */

// LIBRARIES
import { z } from 'zod';

/** Address fields that must be filled in before a delivery order can be placed. */
const REQUIRED_ADDRESS_FIELDS = ['line1', 'city', 'postcode', 'country'] as const;

export const placeOrderFormSchema = z
	.object({
		name: z.string().min(1),
		email: z.email(),
		phone: z.string(),
		mode: z.enum(['pickup', 'delivery']),
		line1: z.string(),
		line2: z.string(),
		city: z.string(),
		postcode: z.string(),
		country: z.string(),
		note: z.string()
	})
	.superRefine((values, ctx) => {
		if (values.mode !== 'delivery') return;
		for (const field of REQUIRED_ADDRESS_FIELDS) {
			if (values[field].trim()) continue;
			ctx.addIssue({ code: 'custom', path: [field], message: 'This field is required' });
		}
	});

export type PlaceOrderFormInput = z.infer<typeof placeOrderFormSchema>;
