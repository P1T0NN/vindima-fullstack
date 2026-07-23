// LIBRARIES
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// TABLES
import { auditLogTable } from './tables/auditLog/schemas/auditLogSchema';
import { rewardAccountsTable } from './tables/rewardAccounts/schemas/rewardAccountsSchema';
import { rewardClaimsTable } from './tables/rewardClaims/schemas/rewardClaimsSchema';
import { rewardLedgerTable } from './tables/rewardLedger/schemas/rewardLedgerSchema';
import { firstPurchasesTable } from './tables/firstPurchases/schemas/firstPurchasesSchema';
import { cartsTable } from './tables/cart/schemas/cartSchema';
import { ordersTable } from './tables/orders/schemas/ordersSchema';
import { productsTable } from './tables/products/schemas/productsSchema';
import { productVariantsTable } from './tables/productVariants/schemas/productVariantsSchema';
import { productCategoriesTable } from './tables/productCategories/schemas/productCategoriesSchema';
import { upsellsTable } from './tables/upsells/schemas/upsellsSchema';

const schema = defineSchema({
	// Users (with `role` and other custom fields) live in the better-auth component;
	// access via `authComponent.getAuthUser(ctx)`. Foreign-key columns below store the
	// better-auth user id as a plain string.

	// Audit logs — toggle population via FEATURES.AUDIT_LOGS in shared/config.ts.
	// The table itself is always declared so flipping the flag needs no migration.
	auditLogs: auditLogTable,

	// In-app analytics (events + rollups) live inside the `@piton-/analytics-convex`
	// component now — it owns its own tables. See `./analytics/analytics.ts`.

	// Punch-card rewards — toggle population via FEATURES.REWARDS in shared/config.ts.
	// Tables are always declared so flipping the flag needs no migration. See RewardSystem.md.
	// `rewardLedger` is the append-only source of truth; `rewardAccounts` is a denormalized cache.
	rewardAccounts: rewardAccountsTable,
	rewardLedger: rewardLedgerTable,
	rewardClaims: rewardClaimsTable,

	// First-purchase discount ("welcome offer") — RewardSystem.md §15. Independent add-on to
	// the rewards module; one immutable row per user on their first paid order. Absence = eligible.
	firstPurchases: firstPurchasesTable,

	// Sidebar cart — one doc per user. See CartSystem.md. Guest carts live in
	// localStorage; this table only holds authenticated users' carts.
	carts: cartsTable,

	// Orders — one doc per order, prices snapshotted at placement. See
	// CheckoutPageSystemDesign.md. Toggle population via FEATURES.CHECKOUT (table always
	// declared so flipping needs no migration).
	orders: ordersTable,

	// Product catalog — `products` (display unit) + `productVariants` (sellable unit). The
	// single price/name/image authority; the variant `ref` is the opaque string the cart,
	// orders, and rewards store. See ProductsTableSystemDesign.md. No feature flag: an empty
	// table already behaves as "everything unavailable" (§2).
	products: productsTable,
	productVariants: productVariantsTable,

	// Category rows the admin picks from — `products.category` stores the slug verbatim,
	// validated at write time. See ProductCategorySystemDesign.md.
	productCategories: productCategoriesTable,

	// Add-to-cart upsell rules — one row per trigger, offering variant refs. See
	// UpsellsSystemDesign.md. Toggle population via FEATURES.UPSELLS (table always declared
	// so flipping needs no migration).
	upsells: upsellsTable,

	/** Cloudflare R2 file reference + cached download URL. Owner-stamped at upload. */
	uploadedFilesR2: defineTable({
		ownerId: v.string(),
		key: v.string(),
		url: v.string()
	})
		.index('by_key', ['key'])
		.index('by_owner', ['ownerId'])
});

export default schema;
