/**
 * Order schemas, shared by BOTH sides:
 *
 *   - `placeOrderSchema` — the WIRE shape `placeOrder` receives. The Convex mutation
 *     derives its args from it (`zodToConvexFields`) and re-runs `safeParse`
 *     authoritatively; semantic rules (feature flags, guest policy, idempotency, pricing)
 *     stay in the mutation.
 *   - `placeOrderFormSchema` — the flat FORM shape (one key per rendered field);
 *     `transformArgs` on the checkout form nests it into the wire shape. Address fields
 *     are only required when the delivery mode needs them, so they validate conditionally.
 */

// LIBRARIES
import { z } from 'zod';

/** Where/how the customer receives the order (mirrors `orderDeliveryValidator`). */
export const orderDeliverySchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('pickup') }),
	z.object({
		kind: z.literal('delivery'),
		address: z.object({
			line1: z.string().min(1),
			line2: z.string().optional(),
			city: z.string().min(1),
			postcode: z.string().min(1),
			country: z.string().min(1)
		})
	})
]);

/**
 * Wire shape — what `placeOrder` receives. Quantities are deliberately plain numbers: the
 * server CLAMPS them to cart limits rather than rejecting (forgiving to stale clients).
 */
export const placeOrderSchema = z.object({
	/** Client-generated idempotency key — a retry resolves to the same order. */
	attemptId: z.string().min(1),
	lines: z.array(z.object({ productRef: z.string().min(1), qty: z.number() })),
	contact: z.object({
		name: z.string().trim().min(1),
		email: z.email(),
		phone: z.string().optional()
	}),
	delivery: orderDeliverySchema,
	/** Shopper's chosen payment method — the server also checks it's enabled in config. */
	paymentMethod: z.enum(['cash', 'online']),
	note: z.string().optional()
});

export type PlaceOrderWireInput = z.infer<typeof placeOrderSchema>;

/** Address fields that must be filled in before a delivery order can be placed. */
const REQUIRED_ADDRESS_FIELDS = ['line1', 'city', 'postcode', 'country'] as const;

export const placeOrderFormSchema = z
	.object({
		name: z.string().min(1),
		email: z.email(),
		phone: z.string(),
		mode: z.enum(['pickup', 'delivery']),
		payment: z.enum(['cash', 'online']),
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
			ctx.addIssue({ code: 'custom', path: [field], message: 'Este campo es obligatorio' });
		}
	});

export type PlaceOrderFormInput = z.infer<typeof placeOrderFormSchema>;
