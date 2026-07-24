/**
 * Upsells app-facing types (UpsellsSystemDesign.md). The Convex queries return these exact
 * shapes; the client consumes them directly. Mirrors the `ResolvedCartProduct` discipline —
 * app-facing shapes live here, never in Convex files.
 */

/** What fires a rule. Mirrors `upsellTriggerValidator` (Convex) and `upsellTriggerSchema` (zod). */
export type UpsellTrigger =
	| { kind: 'product'; slug: string }
	| { kind: 'category'; category: string }
	| { kind: 'global' };

// ─── Shop side (fetchUpsellCatalog) ──────────────────────────────────────────

/** A resolved, live offer item — dead refs are dropped server-side, so price is never null. */
export type UpsellCatalogItem = {
	/** Variant ref — exactly what `cart.add()` takes. */
	ref: string;
	/** Product name, verbatim — the frontend composes the display name (`variantDisplayName.ts`). */
	productName: string;
	/** Variant label, verbatim. `null` = single-variant product. */
	variantLabel: string | null;
	/** Product description (one line under the name in the dialog). */
	description: string | null;
	imageUrl: string | null;
	priceMinor: number;
};

/** One enabled rule with its items resolved for the dialog. Empty-item rules are omitted. */
export type UpsellCatalogRule = {
	id: string;
	trigger: UpsellTrigger;
	items: UpsellCatalogItem[];
};

/** The whole shop-side payload (one-shot, streamed with the shop page — no subscription). */
export type UpsellCatalog = { rules: UpsellCatalogRule[] };

/** The product just added: `slug`/`category` match a rule (§5.2); `name` is shown in the dialog. */
export type AddedProduct = { slug: string; category: string; name: string };

// ─── Admin side (fetchUpsellRules) ───────────────────────────────────────────

/** Per-item health so the admin list can badge problems without breaking the rule. */
export type UpsellItemStatus = 'ok' | 'missing' | 'unavailable';

export type UpsellAdminItem = {
	ref: string;
	/** Product name, verbatim. `null` = the ref no longer resolves (frontend falls back to a readable ref). */
	productName: string | null;
	/** Variant label, verbatim. `null` = single-variant product (or unresolvable ref). */
	variantLabel: string | null;
	imageUrl: string | null;
	/** Null when the ref no longer resolves to a live price. */
	priceMinor: number | null;
	status: UpsellItemStatus;
};

/** Whether a product/category trigger still names something that exists. `global` is always ok. */
export type UpsellTriggerStatus = 'ok' | 'missing';

/** One rule as the admin list renders it — trigger resolved to a readable label + health. */
export type UpsellAdminRule = {
	id: string;
	trigger: UpsellTrigger;
	/** Product/category display name; empty for `global`. Falls back to the slug if missing. */
	triggerLabel: string;
	triggerStatus: UpsellTriggerStatus;
	items: UpsellAdminItem[];
	enabled: boolean;
};

export type UpsellAdminRules = { rules: UpsellAdminRule[] };
