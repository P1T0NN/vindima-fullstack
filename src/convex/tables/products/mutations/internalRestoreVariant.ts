/**
 * Restore a tombstoned variant (DeleteVariantSystemDesign.md §9 R7) — the recovery path
 * for an accidental deletion. Internal-only: run from the dashboard or
 * `bunx convex run tables/products/mutations/internalRestoreVariant:internalRestoreVariant '{"variantId":"…"}'`.
 * No UI, no rate-limit entry. Clearing `deletedAt` makes the ref purchasable again
 * (subject to the usual `available` + product-status resolution rule).
 */

// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// AUDIT
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { logAudit } from '@/convex/tables/auditLog/helpers/logAudit';

export const internalRestoreVariant = internalMutation({
	args: { variantId: v.id('productVariants') },
	returns: v.object({ restored: v.boolean() }),
	handler: async (ctx, args) => {
		const variant = await ctx.db.get(args.variantId);
		if (!variant || variant.deletedAt === undefined) return { restored: false };

		await ctx.db.patch(args.variantId, { deletedAt: undefined });

		// System action — no userId (operator-run from the dashboard/CLI).
		logAudit(ctx, AUDIT_ACTIONS.VARIANT_RESTORE, {
			resource: { table: 'productVariants', id: args.variantId },
			before: { deletedAt: variant.deletedAt },
			after: { ref: variant.ref }
		});

		return { restored: true };
	}
});
