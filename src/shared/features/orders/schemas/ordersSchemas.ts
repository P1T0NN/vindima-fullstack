/**
 * Order schemas, shared by BOTH sides:
 *
 *   - `placeOrderSchema` — the WIRE shape `placeOrder` receives. The Convex mutation
 *     derives its args from it (`zodToConvexFields`) and re-runs `safeParse`
 *     authoritatively; semantic rules (feature flags, guest policy, idempotency, pricing)
 *     stay in the mutation.
 *   - `placeOrderFormSchema` — the flat pickup-only FORM shape (one key per rendered field);
 *     `transformArgs` on the checkout form nests it into the wire shape.
 *   - `trackOrderFormSchema` — the guest tracking form. Client-only: `fetchOrderByNumber` is a
 *     query and declares its own `v.` args, so this schema exists to keep an unparseable number
 *     or a malformed address from ever becoming a round trip.
 */

// LIBRARIES
import { z } from 'zod';

// UTILS
import { isPickupDate } from '../../checkout/utils/isPickupDate';
import { isPickupTimeSlot } from '../../checkout/utils/isPickupTimeSlot';
import { normalizeOrderNumber } from '../utils/orderNumber';

/** Where/how the customer receives the order (mirrors `orderDeliveryValidator`). */
export const orderDeliverySchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('pickup'),
		pickupDate: z.string().refine(isPickupDate, 'Selecciona un día válido para recoger tu pedido.'),
		pickupTime: z
			.string()
			.refine(isPickupTimeSlot, 'Selecciona una hora válida para recoger tu pedido.')
	}),
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
		phone: z.string().trim().min(1)
	}),
	delivery: orderDeliverySchema,
	/** Shopper's chosen payment method — the server also checks it's enabled in config. */
	paymentMethod: z.literal('online'),
	note: z.string().optional()
});

export type PlaceOrderWireInput = z.infer<typeof placeOrderSchema>;

export const placeOrderFormSchema = z
	.object({
		name: z.string().min(1),
		email: z.email(),
		phone: z.string().trim().min(1),
		payment: z.literal('online'),
		pickupDate: z.string(),
		pickupTime: z.string(),
		note: z.string()
	})
	.superRefine((values, ctx) => {
		if (!isPickupDate(values.pickupDate)) {
			ctx.addIssue({
				code: 'custom',
				path: ['pickupDate'],
				message: 'Selecciona un día válido para recoger tu pedido.'
			});
		}
		if (!isPickupTimeSlot(values.pickupTime)) {
			ctx.addIssue({
				code: 'custom',
				path: ['pickupTime'],
				message: 'Selecciona una hora para recoger tu pedido.'
			});
		}
	});

export type PlaceOrderFormInput = z.infer<typeof placeOrderFormSchema>;

/**
 * Guest order lookup — the two things that together prove possession of a confirmation.
 *
 * `normalizeOrderNumber` is the same parser the query runs, so a number the server could never
 * match is rejected in the browser instead of costing a round trip. Both fields are required:
 * the query fails closed on a missing or mismatched email, and the form must say so first.
 */
export const trackOrderFormSchema = z.object({
	number: z.string().refine((value) => normalizeOrderNumber(value) !== ''),
	email: z.email()
});

export type TrackOrderFormInput = z.infer<typeof trackOrderFormSchema>;
