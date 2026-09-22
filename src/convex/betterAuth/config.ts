// LIBRARIES
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { admin } from 'better-auth/plugins/admin';
import { emailOTP } from 'better-auth/plugins/email-otp';

// CONVEX
import { components } from '../_generated/api.js';

// SCHEMAS
import authSchema from './schema.js';

// CONFIG
import authConfig from './auth.config.js';
import { AUTH_DATA } from '@/shared/features/auth/config.js';

// EMAILS
import { sendVerificationOTPEmail } from './emails/sendVerificationOTPEmail.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';

const siteUrl = process.env.PUBLIC_ORIGIN!;

// The component client has methods needed for integrating Better Auth with
// Convex, as well as general auth-related helpers.
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: { schema: authSchema }
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
	({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!
			}
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			autoSignInAfterVerification: true
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			requireEmailVerification: true
		},
		rateLimit: {
			enabled: true,
			storage: 'database',
			customRules: {
				'/email-otp/send-verification-otp': {
					window: 60,
					max: 1
				}
			}
		},
		plugins: [
			admin(),
			emailOTP({
				otpLength: AUTH_DATA.OTP_LENGTH,
				storeOTP: 'hashed',
				overrideDefaultEmailVerification: true,
				sendVerificationOTP: async (data) => {
					await sendVerificationOTPEmail(data).catch((error) => {
						console.error('[emailOTP] send failed', error);
					});
				}
			}),
			// The Convex plugin is required for Convex compatibility.
			convex({ authConfig })
		]
	}) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
