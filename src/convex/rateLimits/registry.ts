// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';

/**
 * Reusable token-bucket shapes. Pick a preset when registering a function, or
 * define custom values inline in {@link convexRateLimitRegistry}.
 *
 * - `rate` = sustained refill (tokens per `period`)
 * - `capacity` = max burst before throttling
 */
export const limitPresets = {
	/** Fast interactive writes — form autosaves, click bursts, batch ops. 2/s sustained, burst 60. */
	interactiveWrite: {
		kind: 'token bucket' as const,
		rate: 120,
		period: MINUTE,
		capacity: 60
	},
	/** External / long-running actions. 1/s sustained, burst 20. */
	externalAction: {
		kind: 'token bucket' as const,
		rate: 60,
		period: MINUTE,
		capacity: 20
	},
	/** Bulk deletes — weighted by `ids.length` at call time. 200/min sustained, burst 100. */
	bulkDelete: {
		kind: 'token bucket' as const,
		rate: 200,
		period: MINUTE,
		capacity: 100
	},
	/** File uploads — mints storage URL + row insert. 30/min sustained, burst 10. */
	fileUpload: {
		kind: 'token bucket' as const,
		rate: 30,
		period: MINUTE,
		capacity: 10
	},
	/** Expensive read endpoints (search). Advisory in queries unless charged by a trusted remote. 60/min sustained, burst 30. */
	searchQuery: {
		kind: 'token bucket' as const,
		rate: 60,
		period: MINUTE,
		capacity: 30
	},
	/** Better Auth — credential sign-in. 5/min per IP. */
	authSignIn: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — sign-up. 3/min per IP. */
	authSignUp: {
		kind: 'token bucket' as const,
		rate: 3,
		period: MINUTE,
		capacity: 3
	},
	/** Better Auth — OTP send (email cost). 2/min per IP or email. */
	authOtpSend: {
		kind: 'token bucket' as const,
		rate: 2,
		period: MINUTE,
		capacity: 2
	},
	/** Better Auth — OTP verify. 5/min per IP or email. */
	authOtpVerify: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — password reset request. 3/min per IP or email. */
	authPasswordResetRequest: {
		kind: 'token bucket' as const,
		rate: 3,
		period: MINUTE,
		capacity: 3
	},
	/** Better Auth — password reset submit. 5/min per IP or email. */
	authPasswordReset: {
		kind: 'token bucket' as const,
		rate: 5,
		period: MINUTE,
		capacity: 5
	},
	/** Better Auth — OAuth start. 10/min per IP. */
	authOAuth: {
		kind: 'token bucket' as const,
		rate: 10,
		period: MINUTE,
		capacity: 10
	}
} as const;

/**
 * Per-function and trusted server-route rate limits.
 *
 * When adding a protected endpoint:
 * 1. Add an entry here (preset or custom).
 * 2. Pass the same name to `authMutation` / `adminMutation` / `createDeleteMutation` /
 *    `fetchOptimized`, use it in a trusted remote search source, or add a route mapping in
 *    {@link AUTH_ROUTE_LIMITS} for Better Auth.
 */
export const convexRateLimitRegistry = {
	// Admin user management
	setUserRole: limitPresets.interactiveWrite,
	banUser: limitPresets.interactiveWrite,
	unbanUser: limitPresets.interactiveWrite,
	revokeSession: limitPresets.interactiveWrite,
	revokeAllSessions: limitPresets.interactiveWrite,
	deleteUser: limitPresets.bulkDelete,

	// R2 uploads
	generateR2UploadUrl: limitPresets.fileUpload,

	// Bulk deletes
	deleteUploadedFileR2: limitPresets.bulkDelete,

	// Rewards (punch card) — user-facing claim lifecycle
	claimReward: limitPresets.interactiveWrite,
	cancelRewardClaim: limitPresets.interactiveWrite,

	// Rewards — admin corrections
	adminAdjustReward: limitPresets.interactiveWrite,
	rebuildRewardAccount: limitPresets.interactiveWrite,

	// Cart — authenticated cart writes (guest carts hit no backend)
	addLine: limitPresets.interactiveWrite,
	setLineQty: limitPresets.interactiveWrite,
	clearCart: limitPresets.interactiveWrite,
	mergeGuestCart: limitPresets.interactiveWrite,

	// Checkout / orders — placement is charged per authed user; guest placement is bounded
	// by attemptId idempotency + the pending-expiry cron (no per-user key exists for guests).
	placeOrder: limitPresets.interactiveWrite,
	cancelMyOrder: limitPresets.interactiveWrite,
	refundOrder: limitPresets.interactiveWrite,

	// Products catalog — admin-managed writes
	createProduct: limitPresets.interactiveWrite,
	editProduct: limitPresets.interactiveWrite,
	setProductStatus: limitPresets.interactiveWrite,
	deleteProduct: limitPresets.interactiveWrite,

	// Reward items — admin-managed free-item pool (RewardItemsSystemDesign.md)
	setVariantRewardEligible: limitPresets.interactiveWrite,

	// Product categories — admin-managed grouping keys
	createCategory: limitPresets.interactiveWrite,
	editCategory: limitPresets.interactiveWrite,
	deleteCategory: limitPresets.interactiveWrite,

	// Better Auth HTTP routes (enforced in hooks.before — see auth/authRoutes.ts)
	signInEmail: limitPresets.authSignIn,
	signUpEmail: limitPresets.authSignUp,
	sendVerificationOtp: limitPresets.authOtpSend,
	sendVerificationOtpByEmail: limitPresets.authOtpSend,
	verifyEmailOtp: limitPresets.authOtpVerify,
	verifyEmailOtpByEmail: limitPresets.authOtpVerify,
	requestPasswordReset: limitPresets.authPasswordResetRequest,
	requestPasswordResetByEmail: limitPresets.authPasswordResetRequest,
	resetPassword: limitPresets.authPasswordReset,
	resetPasswordByEmail: limitPresets.authPasswordReset,
	signInSocial: limitPresets.authOAuth
} as const;

/** Names of all configured rate-limit buckets (= Convex export names). */
export type ConvexRateLimitName = keyof typeof convexRateLimitRegistry;
