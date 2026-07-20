import { isRateLimitError } from '@convex-dev/rate-limiter';
import { APIError } from 'better-auth/api';
import type { GenericCtx } from '@convex-dev/better-auth';
import { internal } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';
import type { TranslatableMessage } from '../types/convexTypes';
import type { ConvexRateLimitName } from './registry';

type ConvexRateLimitRunnerCtx = GenericCtx<DataModel> & {
	runMutation: (
		mutation: typeof internal.rateLimits.convexCreateRateLimitInternal.convexCreateRateLimitInternal,
		args: { name: string; key: string }
	) => Promise<unknown>;
};

/** JSON `{ key, params }` for BA `APIError.message` — keep in sync with `rateLimitMessage` on the client. */
function convexRateLimitWireMessage(retryAfterMs: number | undefined): string {
	let message: TranslatableMessage;

	if (typeof retryAfterMs !== 'number' || retryAfterMs <= 0) {
		message = { key: 'GenericMessages.TOO_MANY_REQUESTS' };
	} else if (retryAfterMs < 60_000) {
		message = {
			key: 'GenericMessages.TOO_MANY_REQUESTS_SECONDS',
			params: { seconds: Math.ceil(retryAfterMs / 1000) }
		};
	} else {
		message = {
			key: 'GenericMessages.TOO_MANY_REQUESTS_MINUTES',
			params: { minutes: Math.ceil(retryAfterMs / 60_000) }
		};
	}

	return JSON.stringify(message);
}

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
			'[convexCreateRateLimit] Context lacks runMutation — auth rate limits require a mutation-capable Convex ctx.'
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

			throw new APIError('TOO_MANY_REQUESTS', {
				message: convexRateLimitWireMessage(ms)
			});
		}
		throw error;
	}
}
