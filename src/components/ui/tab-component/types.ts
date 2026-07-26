import type { Options } from 'nuqs-svelte';
import type { Snippet } from 'svelte';

export type TabComponentItem<Value extends string = string> = {
	value: Value;
	label: string;
	disabled?: boolean;
};

export type TabComponentTabs<Value extends string = string> = readonly [
	TabComponentItem<Value>,
	...TabComponentItem<Value>[]
];

export type TabComponentContext<Value extends string = string> = {
	tab: TabComponentItem<Value>;
	value: Value;
	activeValue: Value;
};

export type TabComponentQueryOptions = Required<
	Pick<Options, 'history' | 'shallow' | 'scroll' | 'clearOnDefault'>
>;

export type TabComponentProps<Value extends string = string> = {
	tabs: TabComponentTabs<Value>;
	content: Snippet<[TabComponentContext<Value>]>;
	trigger?: Snippet<[TabComponentContext<Value>]>;
	queryKey?: string;
	defaultValue?: Value;
	history?: Options['history'];
	shallow?: boolean;
	scroll?: boolean;
	clearOnDefault?: boolean;
	activationMode?: 'automatic' | 'manual';
	loop?: boolean;
	disabled?: boolean;
	class?: string;
	listClass?: string;
	triggerClass?: string;
	contentClass?: string;
	onValueChange?: (value: Value) => void;
};
