/**
 * Cart display types. Product resolution (ref → raw fields/image/price) lives in the cart
 * feature: the client subscribes to `resolveCartProducts`, which returns this exact shape.
 * The catalog itself is DB-only — created and edited entirely in the admin UI.
 *
 * Raw fields only (GeneralSystemDesignRule.md § backend returns data): the frontend composes
 * the display name via `variantDisplayName.ts` — the backend never concatenates labels.
 */

/** The resolved shape every cart/checkout component renders. */
export type ResolvedCartProduct = {
	productRef: string;
	/** Product name, verbatim. `null` = the ref no longer resolves to a product (frontend falls back to a readable ref). */
	productName: string | null;
	/** Variant label ('Botella', 'M'), verbatim. `null` = single-variant product (no label). */
	variantLabel: string | null;
	imageUrl: string | null;
	/** Current unit price in minor units (cents). `null` = not purchasable (removed/unconfigured). */
	unitPriceMinor: number | null;
	/** ISO 4217. */
	currency: string;
};
