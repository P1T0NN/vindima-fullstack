// LIBRARIES
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from '../_generated/api';
import type { DataModel } from '../_generated/dataModel';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { admin, emailOTP } from 'better-auth/plugins';
import authConfig from './auth.config';
import { sendVerificationOTP } from './emails/sendVerificationOTP';
import authSchema from './component/schema';
import { convexCreateAuthRateLimitHook } from './convexCreateAuthRateLimitHook';

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema
	}
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: process.env.PUBLIC_SITE_URL,
		database: authComponent.adapter(ctx),
		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: true,
					defaultValue: 'user',
					// Block clients from setting role via signUp/updateUser — only
					// trusted server code can change it.
					input: false
				},
				phone: {
					type: 'string',
					required: false,
					input: true
				},
				birthday: {
					type: 'string',
					required: false,
					input: true
				}
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			maxPasswordLength: 128
		},
		// Auth HTTP limits live in {@link convexRateLimitRegistry} and are enforced via
		// {@link convexCreateAuthRateLimitHook} using `@convex-dev/rate-limiter`.
		rateLimit: {
			enabled: false
		},
		hooks: {
			before: convexCreateAuthRateLimitHook(ctx)
		},
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ['google', 'credential']
			}
		},
		// Real client IP is delivered via our SvelteKit auth proxy under `x-client-ip`
		// (see `routes/api/auth/[...all]/+server.ts`). Only that header is trusted —
		// `cf-connecting-ip` / `x-forwarded-for` on Convex are rewritten to the
		// immediate hop (Vercel egress), not the end user.
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['x-client-ip']
			}
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!
			}
		},
		plugins: [
			emailOTP({
				otpLength: 8,
				sendVerificationOnSignUp: true,
				sendVerificationOTP
			}),
			admin({
				defaultRole: 'user',
				adminRoles: ['admin']
			}),
			convex({ authConfig })
		]
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};
