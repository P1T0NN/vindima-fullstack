// App-level mutation builders, wrapped so every `ctx.db` write runs the triggers that
// `counters.ts` registers on each `TableAggregate` (the counters stay exact automatically).
//
// CONVENTION: import `mutation` / `internalMutation` from THIS file, never from
// `_generated/server`. The raw builders bypass the triggers, and one bypassed write is
// enough to drift every counter registered for that table. Queries/actions have no db
// writes — keep importing those from `_generated/server`.
//
// Composed from `wrapDB` rather than `Triggers`' own `mutation` builder, so the builders
// stay bound to this app's `DataModel` (arg validators and `ctx.db` keep their precise
// types) — the composition path `convex-helpers` documents for apps that already have
// their own builders.
//
// The one deliberate exception is `counters.ts`'s own backfill, which seeds the B-tree
// directly and must not re-enter the triggers it is repairing.

// LIBRARIES
import { customCtx, customMutation } from 'convex-helpers/server/customFunctions';

// CONFIG
import {
	mutation as rawMutation,
	internalMutation as rawInternalMutation
} from './_generated/server';

// HELPERS
import { wrapDB } from './counters.js';

export const mutation = customMutation(rawMutation, customCtx(wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));
