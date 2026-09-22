import { defineSchema } from 'convex/server';
import { tables } from './generatedSchema.js';

// The adapter sorts equality fields by name before selecting an index. Cover
// every combination exposed by the admin user filters; search remains a scan
// within the selected index because Better Auth uses `contains`.
const schema = defineSchema({
	...tables,
	user: tables.user
		.index('role', ['role'])
		.index('banned', ['banned'])
		.index('emailVerified', ['emailVerified'])
		.index('banned_role', ['banned', 'role'])
		.index('emailVerified_role', ['emailVerified', 'role'])
		.index('banned_emailVerified', ['banned', 'emailVerified'])
		.index('banned_emailVerified_role', ['banned', 'emailVerified', 'role'])
});

export default schema;
