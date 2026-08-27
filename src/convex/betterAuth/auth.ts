// AUTH
import { createAuth } from './config.js';

// This static instance is used only by the Better Auth schema generator.
export const auth = createAuth(
	// SAFETY: Schema generation reads options without executing Convex context methods.
	{} as never
);
