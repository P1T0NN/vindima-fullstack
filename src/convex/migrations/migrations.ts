// LIBRARIES
import { Migrations } from '@convex-dev/migrations';

// CONVEX
import { components } from '../_generated/api.js';

// WRAPPERS
import { internalMutation } from '../builders/convexFunctionBuilders.js';

// SCHEMA
import schema from '../schema.js';

export const migrations = new Migrations(components.migrations, {
	schema,
	internalMutation
});

export const run = migrations.runner();
