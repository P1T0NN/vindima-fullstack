// LIBRARIES
import { parseAsStringLiteral, useQueryState } from 'nuqs-svelte';

// TYPES
import type { TabComponentContext, TabComponentItem, TabComponentQueryOptions } from './types.js';

type TabComponentStateConfig<Value extends string> = {
	// A readonly array (not the strict tuple) so non-tabs callers — e.g. a pill
	// filter built from a plain `{ value, label }[]` — can share this URL state.
	tabs: readonly TabComponentItem<Value>[];
	queryKey: string;
	defaultValue: Value;
	options: TabComponentQueryOptions;
};

export function createTabComponentState<Value extends string>(
	getConfig: () => TabComponentStateConfig<Value>
) {
	const { tabs, queryKey, defaultValue, options } = getConfig();
	const values = tabs.map((tab) => tab.value) as Value[];
	const state = useQueryState(
		queryKey,
		parseAsStringLiteral(values).withDefault(defaultValue).withOptions(options)
	);

	function isValue(value: string): value is Value {
		return values.includes(value as Value);
	}

	return {
		values,
		options,
		state,
		isValue
	};
}

export function createTabComponentContext<Value extends string>(
	tab: TabComponentItem<Value>,
	activeValue: Value
): TabComponentContext<Value> {
	return {
		tab,
		value: tab.value,
		activeValue
	};
}
