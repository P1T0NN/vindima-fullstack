// LIBRARIES
import { RateLimiter, type RateLimitArgs, type RunMutationCtx } from '@convex-dev/rate-limiter';
import { components } from '../../_generated/api.js';

// CONFIG
import { DEFAULT_RATE_LIMIT_CONFIGS, DEFAULT_RATE_LIMIT_NAME } from '../ratelimit.config.js';

// TYPES
import type { UserIdentity } from 'convex/server';
import type { MutationCtx } from '../../_generated/server.js';
import type { FunctionRateLimit } from '../types/rateLimitTypes.js';

type RateLimitContext = RunMutationCtx & Pick<MutationCtx, 'auth'>;

const rateLimiter = new RateLimiter(components.rateLimiter);

/** Consume a rate-limit token before a public mutation or action runs. */
export async function enforceRateLimit(
	ctx: RateLimitContext,
	rateLimit?: FunctionRateLimit,
	identity?: UserIdentity
): Promise<void> {
	const name = rateLimit?.name ?? DEFAULT_RATE_LIMIT_NAME;
	if (name.trim().length === 0) throw new Error('Rate-limit name must not be empty');

	const customConfig = rateLimit?.config;
	const limits =
		customConfig === undefined
			? DEFAULT_RATE_LIMIT_CONFIGS.map(({ suffix, config }) => ({
					name: `${name}:${suffix}`,
					config
				}))
			: [{ name, config: customConfig }];
	const count = rateLimit?.count;
	const scope = rateLimit?.scope ?? 'actor';
	let key: string | undefined;

	if (scope === 'actor') {
		const actorIdentity = identity ?? (await ctx.auth.getUserIdentity());
		if (actorIdentity === null) return;

		key = actorIdentity.tokenIdentifier;
	}

	for (const limit of limits) {
		const options: Omit<RateLimitArgs, 'name'> = {
			config: limit.config,
			throws: true
		};
		if (key !== undefined) options.key = key;
		if (count !== undefined) options.count = count;

		await rateLimiter.limit(ctx, limit.name, options);
	}
}
