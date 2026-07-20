/**
 * Cart display types. Product resolution (ref → name/image/price) lives in the `products`
 * table: the client subscribes to `resolveCartProducts`, which returns this exact shape.
 * The catalog itself is DB-only — created and edited entirely in the admin UI.
 */

/** The resolved shape every cart/checkout component renders. */
export type ResolvedCartProduct = {
	productRef: string;
	name: string;
	imageUrl: string | null;
	/** Current unit price in minor units (cents). `null` = not purchasable (removed/unconfigured). */
	unitPriceMinor: number | null;
	/** ISO 4217. */
	currency: string;
};
