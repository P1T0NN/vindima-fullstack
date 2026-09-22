import assert from 'node:assert/strict';
import schema from '../src/convex/betterAuth/schema';
import { buildUserWhere } from '../src/convex/betterAuth/utils/userFilters';

assert.deepEqual(
	buildUserWhere('  person@example.com  ', {
		role: 'user',
		status: 'active',
		verification: 'unverified'
	}),
	[
		{ field: 'role', operator: 'ne', value: 'admin' },
		{ field: 'banned', operator: 'ne', value: true },
		{ field: 'emailVerified', operator: 'eq', value: false },
		{ field: 'email', operator: 'contains', value: 'person@example.com' }
	]
);
assert.deepEqual(buildUserWhere('Alice', { role: 'owner', status: 'unknown' }), [
	{ field: 'name', operator: 'contains', value: 'Alice' }
]);

const indexes = new Set(schema.tables.user[' indexes']().map((index) => index.fields.join(',')));
for (const role of ['', 'admin', 'user']) {
	for (const status of ['', 'active', 'banned']) {
		for (const verification of ['', 'verified', 'unverified']) {
			const fields = buildUserWhere(undefined, { role, status, verification })
				.filter((condition) => condition.operator === 'eq')
				.map((condition) => condition.field)
				.sort()
				.join(',');
			if (fields) assert(indexes.has(fields), `Missing user index for ${fields}`);
		}
	}
}
