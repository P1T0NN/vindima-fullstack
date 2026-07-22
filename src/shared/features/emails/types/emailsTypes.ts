/**
 * Shared email types (see `EmailSystemDesign.md`). Kept out of the Convex template/send
 * files per the project's "types live in feature type folders" rule.
 */

/** What every template builder returns: the three parts Resend needs. */
export type EmailContent = {
	subject: string;
	html: string;
	text: string;
};

/** The four better-auth OTP flows, shared by the auth hook and the `authOtpEmail` template. */
export type OtpEmailType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

/** Reward account owner + current card balance, hydrated for the reward emails (R1/R2). */
export type RewardEmailData = {
	email: string;
	name: string;
	stamps: number;
	availableRewards: number;
};
