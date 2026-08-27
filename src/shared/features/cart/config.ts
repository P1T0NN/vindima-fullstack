/** Cart currency, storage, and safety limits. */
export const CART_CONFIG = {
	CURRENCY: 'MXN',
	MAX_QTY_PER_LINE: 20,
	MAX_LINES: 50,
	MAX_RESOLVE_REFS: 64,
	STORAGE_KEY: 'cart.v1',
	STEPPER_DEBOUNCE_MS: 400
} as const;
