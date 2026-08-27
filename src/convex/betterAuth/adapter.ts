// LIBRARIES
import { createApi } from '@convex-dev/better-auth';

// CONFIG
import { createAuthOptions } from './config.js';

// SCHEMAS
import schema from './schema.js';

export const { create, findOne, findMany, updateOne, updateMany, deleteOne, deleteMany } =
	createApi(schema, createAuthOptions);
