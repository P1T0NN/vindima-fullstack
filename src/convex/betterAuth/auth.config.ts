// LIBRARIES
import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config';

// TYPES
import type { AuthConfig } from 'convex/server';

export default {
	providers: [getAuthConfigProvider()]
} satisfies AuthConfig;
