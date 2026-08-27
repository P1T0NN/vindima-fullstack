// LIBRARIES
import { HOUR, MINUTE, type RateLimitConfig } from '@convex-dev/rate-limiter';

export const DEFAULT_RATE_LIMIT_NAME = 'publicFunction';

export const DEFAULT_RATE_LIMIT_CONFIGS = [
	{
		suffix: 'minute',
		config: { kind: 'fixed window', rate: 20, period: MINUTE, capacity: 20 }
	},
	{
		suffix: 'fiveMinutes',
		config: { kind: 'fixed window', rate: 60, period: 5 * MINUTE, capacity: 60 }
	},
	{
		suffix: 'hour',
		config: { kind: 'fixed window', rate: 300, period: HOUR, capacity: 300 }
	}
] as const satisfies ReadonlyArray<{ suffix: string; config: RateLimitConfig }>;
