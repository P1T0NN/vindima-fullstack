// LIBRARIES
import { v } from 'convex/values';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Payment provider seam (see `CheckoutPageSystemDesign.md` §8). Adding a provider =
 * one file implementing `PaymentProvider` + one registry entry + keys. The client only
 * ever learns the `PaymentInstruction` it must follow, never which provider is active.
 */

/** What the client must do after `placeOrder` succeeds. */
export type PaymentInstruction =
	| { kind: 'none' } // order placed; pay offline (manual provider)
	| { kind: 'redirect'; url: string }; // navigate to a hosted payment page

/** Convex validator mirror of {@link PaymentInstruction} (used in `placeOrder`'s returns). */
export const paymentInstructionValidator = v.union(
	v.object({ kind: v.literal('none') }),
	v.object({ kind: v.literal('redirect'), url: v.string() })
);

export type PaymentProvider = {
	/**
	 * Called inside `placeOrder` after the order is inserted. The `manual` provider returns
	 * `{ kind: 'none' }` synchronously; a hosted provider (Stripe) creates a session via an
	 * action and returns its redirect URL.
	 */
	createPayment(order: Doc<'orders'>): Promise<PaymentInstruction>;
};
