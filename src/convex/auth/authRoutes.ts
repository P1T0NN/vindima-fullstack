// TYPES
import type { ConvexRateLimitName } from '../rateLimits/registry';

/**
 * Better Auth route path → rate-limit bucket(s).
 *
 * Keys are BA endpoint paths (no `/api/auth` prefix). Routes omitted here are
 * intentionally unmetered (`/get-session`, JWKS, etc.).
 */
export type AuthRouteLimitRule =
	| ConvexRateLimitName
	| {
			/** Per-IP bucket (required). */
			ip: ConvexRateLimitName;
			/** Optional per-email bucket when `body.email` is present. */
			email?: ConvexRateLimitName;
	  };

export const AUTH_ROUTE_LIMITS: Record<string, AuthRouteLimitRule> = {
	'/sign-in/email': 'signInEmail',
	'/sign-up/email': 'signUpEmail',
	'/email-otp/send-verification-otp': {
		ip: 'sendVerificationOtp',
		email: 'sendVerificationOtpByEmail'
	},
	'/email-otp/verify-email': {
		ip: 'verifyEmailOtp',
		email: 'verifyEmailOtpByEmail'
	},
	'/email-otp/request-password-reset': {
		ip: 'requestPasswordReset',
		email: 'requestPasswordResetByEmail'
	},
	'/reset-password': {
		ip: 'resetPassword',
		email: 'resetPasswordByEmail'
	},
	'/sign-in/social': 'signInSocial'
};
