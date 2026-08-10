/**
 * The better-auth component schema, extended with the indexes the admin surface needs.
 *
 * `generatedSchema.ts` is `npx auth generate` output and gets overwritten on regeneration —
 * so our custom indexes live HERE, layered on top of the generated table definitions (the
 * extension pattern the generated header itself prescribes). After regenerating, nothing in
 * this file needs to change unless BA renames a field we index.
 *
 * ## Why these indexes exist (TODO.md "THE WALL")
 *
 * `/admin/users` filters by role / banned / emailVerified and searches name/email. Post-index
 * `.filterWith()` scans die at scale — a rare filter walks the whole table under a live
 * subscription. So: one composite index per facet COMBINATION the UI offers (the same
 * discipline `fetchOptimized`'s `where` enforces for app tables), plus a search index per
 * searchable text field. `listUsersPaginated` picks the index that covers every active facet
 * and never filters outside an index.
 *
 * Copying this pattern to a new filtered table:
 *   1. one `by_<facets…>` index per facet combination the UI can request (fields in a fixed
 *      order; each index contains EXACTLY the facets of its combination, so every stream is
 *      fully equality-bound and merge-sortable by `_creationTime`);
 *   2. one `searchIndex` per text field users can search, with every facet as a
 *      `filterFields` entry;
 *   3. optional-field facets (like `banned`) match a UNION of their stored representations —
 *      see `NOT_BANNED_VALUES` in `userQueries.ts`.
 */

import { defineSchema } from 'convex/server';
import { tables } from './generatedSchema';

const FACET_FILTER_FIELDS = ['role', 'banned', 'emailVerified'] as const;

const user = tables.user
	// Facet combinations. `role` is an open string domain (projects add roles), so it can
	// never be enumerated — it appears only in combos where it is matched exactly, which is
	// why every combination gets its own dedicated index instead of prefix-sharing one.
	.index('by_role', ['role'])
	.index('by_banned', ['banned'])
	.index('by_emailVerified', ['emailVerified'])
	.index('by_role_banned', ['role', 'banned'])
	.index('by_role_emailVerified', ['role', 'emailVerified'])
	.index('by_banned_emailVerified', ['banned', 'emailVerified'])
	.index('by_role_banned_emailVerified', ['role', 'banned', 'emailVerified'])
	// Token-prefix text search at O(matches) — replaces the `.includes()` substring scan.
	.searchIndex('search_name', {
		searchField: 'name',
		filterFields: [...FACET_FILTER_FIELDS]
	})
	.searchIndex('search_email', {
		searchField: 'email',
		filterFields: [...FACET_FILTER_FIELDS]
	});

const schema = defineSchema({ ...tables, user });

export { tables };
export default schema;
