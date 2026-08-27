<script lang="ts" generics="Value extends string">
	// COMPONENTS
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/index.js';

	// UTILS
	import { createTabComponentContext, createTabComponentState } from './tab-component.svelte.js';

	// TYPES
	import type { TabComponentContext, TabComponentItem, TabComponentProps } from './types.js';

	let {
		tabs,
		content,
		trigger,
		queryKey = 'tab',
		defaultValue = tabs[0].value,
		history = 'replace',
		shallow = true,
		scroll = false,
		clearOnDefault = false,
		activationMode = 'automatic',
		loop,
		disabled,
		class: className,
		listClass,
		triggerClass,
		contentClass = 'pt-4',
		onValueChange
	}: TabComponentProps<Value> = $props();

	const tabState = createTabComponentState(() => ({
		tabs,
		queryKey,
		defaultValue,
		options: { history, shallow, scroll, clearOnDefault }
	}));
	const activeValue = $derived(tabState.state.current);

	function contextFor(tab: TabComponentItem<Value>): TabComponentContext<Value> {
		return createTabComponentContext(tab, activeValue);
	}

	function handleValueChange(nextValue: string) {
		if (!tabState.isValue(nextValue)) return;

		void tabState.state.set(nextValue, tabState.options);
		onValueChange?.(nextValue);
	}
</script>

<Tabs
	value={activeValue}
	onValueChange={handleValueChange}
	{activationMode}
	{loop}
	{disabled}
	class={className}
>
	<TabsList class={listClass}>
		{#each tabs as tab (tab.value)}
			<TabsTrigger value={tab.value} disabled={tab.disabled} class={triggerClass}>
				{#if trigger}
					{@render trigger(contextFor(tab))}
				{:else}
					{tab.label}
				{/if}
			</TabsTrigger>
		{/each}
	</TabsList>

	{#each tabs as tab (tab.value)}
		<TabsContent value={tab.value} class={contentClass}>
			{@render content(contextFor(tab))}
		</TabsContent>
	{/each}
</Tabs>
