// App-level mutation builders. CONVENTION: import `mutation` / `internalMutation` from
// THIS file, never from `_generated/server`. Queries/actions have no db writes — keep
// importing those from `_generated/server`.

// LIBRARIES
import { internalMutation, mutation } from './builders/convexFunctionBuilders.js';

export { internalMutation, mutation };
