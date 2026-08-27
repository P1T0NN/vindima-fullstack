import Root from './tab-component.svelte';

export { Root, Root as TabComponent };

// The URL-sync state, decoupled from the Tabs UI — reuse it to back any
// filter control (e.g. the pill filter on the bookings table) with the same
// shareable `?key=value` query state.
export { createTabComponentState, createTabComponentContext } from './tab-component.svelte.js';

export type {
	TabComponentContext,
	TabComponentItem,
	TabComponentProps,
	TabComponentProps as Props,
	TabComponentQueryOptions,
	TabComponentTabs
} from './types.js';
