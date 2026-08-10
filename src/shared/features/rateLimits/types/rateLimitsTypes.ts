// TYPES — derived from the registry data; import the name union from here, never re-export
// it through another module.

// CONFIG
import type { convexRateLimitRegistry } from '../data/rateLimitsRegistry';

/** Names of all configured rate-limit buckets (= Convex export names). */
export type ConvexRateLimitName = keyof typeof convexRateLimitRegistry;
