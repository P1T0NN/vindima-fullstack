// LIBRARIES
import type { RateLimitConfig } from '@convex-dev/rate-limiter';

export type RateLimitScope = 'actor' | 'global';

export type FunctionRateLimit = {
	name: string;
	config?: RateLimitConfig;
	count?: number;
	scope?: RateLimitScope;
};

export type RateLimitedFunctionOptions = {
	rateLimit?: FunctionRateLimit;
};
