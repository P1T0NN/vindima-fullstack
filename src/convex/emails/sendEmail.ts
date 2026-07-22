// LIBRARIES
import { v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { COMPANY_DATA, REWARDS_CONFIG } from '@/shared/config.js';

// MUTATIONS
import { sendViaResend } from './sendViaResend';

// TEMPLATES
import { orderReceivedEmail } from './templates/orderReceivedEmail';
import { orderPaidEmail } from './templates/orderPaidEmail';
import { orderShippedEmail } from './templates/orderShippedEmail';
import { orderCancelledEmail } from './templates/orderCancelledEmail';
import { orderRefundedEmail } from './templates/orderRefundedEmail';
import { newOrderOwnerEmail } from './templates/newOrderOwnerEmail';
import { rewardUnlockedEmail } from './templates/rewardUnlockedEmail';
import { rewardExpiryWarningEmail } from './templates/rewardExpiryWarningEmail';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent, RewardEmailData } from '@/shared/features/emails/types/emailsTypes';

/**
 * THE transactional-email seam (see `EmailSystemDesign.md` §3 + §7.2). One internal action,
 * scheduled fire-and-forget from every mutation/cron event via `ctx.scheduler.runAfter(0, …)`.
 * It hydrates whatever the chosen template needs (order or reward data), builds the branded
 * sandwich, and hands off to `sendViaResend`. A failure here is logged and left for Convex's
 * action retry — it never propagates back into the money path that scheduled it.
 *
 * The auth OTP emails do NOT go through here — the user is actively waiting, so that hook
 * calls `sendViaResend` synchronously (see `auth/emails/sendVerificationOTP.ts`).
 */
export const sendEmail = internalAction({
	args: {
		kind: v.union(
			v.literal('orderReceived'), // O1
			v.literal('orderPaid'), // O2
			v.literal('orderShipped'), // O3 / O4
			v.literal('orderCancelled'), // O5 / O6
			v.literal('orderRefunded'), // O7
			v.literal('newOrderOwner'), // S1
			v.literal('rewardUnlocked'), // R1
			v.literal('rewardExpiryWarning') // R2
		),
		// Order kinds + owner.
		orderId: v.optional(v.id('orders')),
		cancelReason: v.optional(v.union(v.literal('user'), v.literal('expired'))),
		paymentUrl: v.optional(v.string()),
		// O2 reward line (computed at the settlement seam; omitted = no line).
		rewardStamps: v.optional(v.number()),
		rewardCompleted: v.optional(v.boolean()),
		// Reward kinds.
		userId: v.optional(v.string()),
		expiresAt: v.optional(v.number())
	},
	handler: async (ctx, args): Promise<null> => {
		let to: string;
		let content: EmailContent;
		let idempotencyKey: string;

		if (args.kind === 'rewardUnlocked' || args.kind === 'rewardExpiryWarning') {
			if (!args.userId) return null;
			const data: RewardEmailData | null = await ctx.runQuery(
				internal.emails.helpers.getRewardEmailData.getRewardEmailData,
				{ userId: args.userId }
			);
			if (!data) return null;
			to = data.email;

			if (args.kind === 'rewardUnlocked') {
				content = rewardUnlockedEmail(
					data.name,
					REWARDS_CONFIG.STAMPS_PER_REWARD,
					REWARDS_CONFIG.EXPIRY.INACTIVITY_MONTHS
				);
				idempotencyKey = `rewardUnlocked-${args.userId}-${data.availableRewards}`;
			} else {
				if (args.expiresAt === undefined) return null;
				content = rewardExpiryWarningEmail(
					data.name,
					data.stamps,
					data.availableRewards,
					args.expiresAt
				);
				idempotencyKey = `rewardExpiryWarning-${args.userId}-${args.expiresAt}`;
			}
		} else {
			// All remaining kinds are order-backed.
			if (!args.orderId) return null;
			const order: Doc<'orders'> | null = await ctx.runQuery(
				internal.emails.helpers.getOrderForEmail.getOrderForEmail,
				{ orderId: args.orderId }
			);
			if (!order) return null;

			switch (args.kind) {
				case 'orderReceived':
					content = orderReceivedEmail(order, args.paymentUrl);
					break;
				case 'orderPaid':
					content = orderPaidEmail(
						order,
						args.rewardStamps === undefined
							? undefined
							: {
									stamps: args.rewardStamps,
									perReward: REWARDS_CONFIG.STAMPS_PER_REWARD,
									completedCard: args.rewardCompleted ?? false
								}
					);
					break;
				case 'orderShipped':
					content = orderShippedEmail(order);
					break;
				case 'orderCancelled':
					content = orderCancelledEmail(order, args.cancelReason ?? 'user');
					break;
				case 'orderRefunded':
					content = orderRefundedEmail(order);
					break;
				case 'newOrderOwner':
					content = newOrderOwnerEmail(order);
					break;
				default:
					return null; // unreachable — keeps `content` definitely assigned
			}

			to = args.kind === 'newOrderOwner' ? COMPANY_DATA.EMAIL : order.email;
			idempotencyKey = `${args.kind}-${args.orderId}`;
		}

		try {
			await sendViaResend(to, content, idempotencyKey);
		} catch (err) {
			// Log and drop — an undelivered email is a shrug; never fail into the money path.
			console.error('[emails] send failed', { kind: args.kind, err });
			throw err; // let Convex retry the action; the idempotency key prevents doubles
		}
		return null;
	}
});
