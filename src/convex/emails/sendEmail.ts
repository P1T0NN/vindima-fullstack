// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '@/convex/_generated/api';
import { internalAction } from '@/convex/_generated/server';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';
import { REWARDS_CONFIG } from '@/shared/features/rewards/config.js';

// EMAIL
import { sendViaResend } from './sendViaResend.js';

// TEMPLATES
import { newOrderOwnerEmail } from './templates/newOrderOwnerEmail';
import { orderCancelledEmail } from './templates/orderCancelledEmail';
import { orderPaidEmail } from './templates/orderPaidEmail';
import { orderReceivedEmail } from './templates/orderReceivedEmail';
import { orderRefundedEmail } from './templates/orderRefundedEmail';
import { orderShippedEmail } from './templates/orderShippedEmail';
import { rewardExpiryWarningEmail } from './templates/rewardExpiryWarningEmail';
import { rewardUnlockedEmail } from './templates/rewardUnlockedEmail';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent, RewardEmailData } from '@/shared/features/emails/types/emailsTypes';

/** Scheduled transactional-email seam used by order and rewards mutations. */
export const sendEmail = internalAction({
	args: {
		kind: v.union(
			v.literal('orderReceived'),
			v.literal('orderPaid'),
			v.literal('orderShipped'),
			v.literal('orderCancelled'),
			v.literal('orderRefunded'),
			v.literal('newOrderOwner'),
			v.literal('rewardUnlocked'),
			v.literal('rewardExpiryWarning')
		),
		orderId: v.optional(v.id('orders')),
		cancelReason: v.optional(v.union(v.literal('user'), v.literal('expired'))),
		paymentUrl: v.optional(v.string()),
		rewardStamps: v.optional(v.number()),
		rewardCompleted: v.optional(v.boolean()),
		userId: v.optional(v.string()),
		expiresAt: v.optional(v.number())
	},
	returns: v.null(),
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
					return null;
			}

			to = args.kind === 'newOrderOwner' ? COMPANY_DATA.EMAIL : order.email;
			idempotencyKey = `${args.kind}-${args.orderId}`;
		}

		try {
			await sendViaResend(to, content, idempotencyKey);
		} catch (error) {
			console.error('[emails] send failed', { kind: args.kind, error });
			throw error;
		}

		return null;
	}
});
