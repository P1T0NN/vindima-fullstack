// LIBRARIES
import { createAuthMiddleware } from 'better-auth/api';

// HELPERS
import { convexCreateRateLimit } from '../rateLimits/convexCreateRateLimit';
import { AUTH_ROUTE_LIMITS } from './authRoutes';

// UTILS
import { getEmailFromAuthBody } from './utils/getEmailFromAuthBody';
import { resolveAuthClientIp } from '@/shared/utils/clientAddress.js';

// TYPES
import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from '../_generated/dataModel';

/**
 * Better Auth `hooks.before` middleware that enforces {@link convexRateLimitRegistry}
 * for sensitive auth HTTP routes via `@convex-dev/rate-limiter`.
 *
 * Pass the Convex context from {@link createAuthOptions} so limits share the same
 * component storage as app mutations.
 */
export function convexCreateAuthRateLimitHook(ctx: GenericCtx<DataModel>) {
	return createAuthMiddleware(async (hookCtx) => {
		const rule = AUTH_ROUTE_LIMITS[hookCtx.path];
		if (!rule) return;

		const ipKey = resolveAuthClientIp(hookCtx.headers ?? new Headers());

		if (typeof rule === 'string') {
			await convexCreateRateLimit(ctx, rule, ipKey);
			return;
		}

		await convexCreateRateLimit(ctx, rule.ip, ipKey);

		if (rule.email) {
			const email = getEmailFromAuthBody(hookCtx.body);
			if (email) {
				await convexCreateRateLimit(ctx, rule.email, email);
			}
		}
	});
}
