/**
 * Closed registry of audit action keys.
 *
 * Add new actions here — `as const` keeps the union narrow so typos at call
 * sites become compile errors and downstream filters (admin UI, retention
 * rules) can exhaustively switch over the values.
 *
 * Convention: `domain.entity.verb` (lowercase, dotted). Keep stable — these
 * strings live in the database and any rename is a data migration.
 *
 * When adding an action, consider whether the 90-day default retention fits;
 * override it in {@link AUDIT_RETENTION_DAYS} below if not.
 */
export const AUDIT_ACTIONS = {
	// Auth / users
	USER_UPDATE: 'user.update',
	USER_DELETE: 'user.delete',
	USER_ROLE_UPDATE: 'user.role.update',
	USER_BAN: 'user.ban',
	USER_UNBAN: 'user.unban',
	USER_SESSION_REVOKE: 'user.session.revoke',
	USER_SESSIONS_REVOKE_ALL: 'user.sessions.revoke_all',

	// Generic admin
	ADMIN_ACTION: 'admin.action',

	// Products catalog
	PRODUCT_CREATE: 'product.create',
	PRODUCT_UPDATE: 'product.update',
	PRODUCT_STATUS: 'product.status',
	VARIANT_DELETE: 'product.variant.delete',
	VARIANT_RESTORE: 'product.variant.restore',
	REWARD_ITEM_SET: 'product.variant.reward_eligible',
	PRODUCT_DELETE: 'product.delete',

	// Product categories
	CATEGORY_CREATE: 'product.category.create',
	CATEGORY_UPDATE: 'product.category.update',
	CATEGORY_DELETE: 'product.category.delete',

	// Upsells (add-to-cart suggestions)
	UPSELL_CREATE: 'upsell.create',
	UPSELL_UPDATE: 'upsell.update',
	UPSELL_TOGGLE: 'upsell.toggle',
	UPSELL_DELETE: 'upsell.delete',

	// Orders
	ORDER_REFUND: 'order.refund',
	ORDER_MARK_PAID: 'order.mark_paid',
	ORDER_FULFILLMENT: 'order.fulfillment',

	// Rewards
	REWARD_ADJUST: 'reward.adjust',
	REWARD_ACCOUNT_REBUILD: 'reward.account.rebuild',

	// Files
	FILE_UPLOAD: 'file.upload',
	FILE_DELETE: 'file.delete'
} as const;

/**
 * Per-action retention in days. Anything not listed falls back to
 * `AUDIT_RETENTION_DEFAULT_DAYS`. Set to `Infinity` to keep forever.
 *
 * Tune per project: noisy actions short, security-critical actions long.
 */
export const AUDIT_RETENTION_DEFAULT_DAYS = 90;

export const AUDIT_RETENTION_DAYS: Partial<Record<AuditAction, number>> = {
	'user.role.update': 365 * 5,
	'user.delete': 365 * 5,
	'user.ban': 365 * 5,
	'user.unban': 365 * 5,
	'user.session.revoke': 365 * 5,
	'user.sessions.revoke_all': 365 * 5
};

/**
 * Hand-written call sites should use {@link AUDIT_ACTIONS} members and get
 * autocomplete; factory-generated keys (e.g. `createDeleteMutation`'s default
 * `${table}.delete`) are accepted as raw strings via the `(string & {})` trick
 * — TS keeps the literal union for autocomplete while still accepting any string.
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | (string & {});
