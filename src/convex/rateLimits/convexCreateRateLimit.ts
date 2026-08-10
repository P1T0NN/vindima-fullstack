import { isRateLimitError } from '@convex-dev/rate-limiter';
import { APIError } from 'better-auth/api';
import type { GenericCtx } from '@convex-dev/better-auth';
import { internal } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';
import { rateLimitDescriptor } from '@/shared/features/validations/utils/translatableMessage';
import type { ConvexRateLimitName } from '@/shared/features/rateLimits/types/rateLimitsTypes';

type ConvexRateLimitRunnerCtx = GenericCtx<DataModel> & {
	runMutation: (
		mutation: typeof internal.rateLimits.convexCreateRateLimitInternal.convexCreateRateLimitInternal,
		args: { name: string; key: string }
	) => Promise<unknown>;
};

/**
 * Charge a named bucket and map `@convex-dev/rate-limiter` failures to a BA `429`.
 *
 * Uses {@link convexCreateRateLimitInternal} because Better Auth hooks receive a
 * {@link GenericCtx} that may not satisfy `convexRateLimiter.limit`'s mutation context.
 *
 * @throws `APIError` with code `TOO_MANY_REQUESTS` when the bucket is empty.
 */
export async function convexCreateRateLimit(
	ctx: GenericCtx<DataModel>,
	name: ConvexRateLimitName,
	key: string
): Promise<void> {
	if (!('runMutation' in ctx)) {
		throw new Error(
			'[convexCreateRateLimit] Context lacks runMutation - auth rate limits require a mutation-capable Convex ctx.'
		);
	}

	try {
		await (ctx as ConvexRateLimitRunnerCtx).runMutation(
			internal.rateLimits.convexCreateRateLimitInternal.convexCreateRateLimitInternal,
			{ name, key }
		);
	} catch (error) {
		if (isRateLimitError(error)) {
			const retryAfterMs = error.data.retryAfter;
			const ms = typeof retryAfterMs === 'number' && retryAfterMs > 0 ? retryAfterMs : undefined;

			// JSON `{ key, params }` for BA's string-only `APIError.message`; the client's
			// `rateLimitMessage` parses it back and renders it in the user's locale.
			throw new APIError('TOO_MANY_REQUESTS', {
				message: JSON.stringify(rateLimitDescriptor(ms))
			});
		}
		throw error;
	}
}
