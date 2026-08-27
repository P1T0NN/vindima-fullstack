<script lang="ts">
		import * as InputGroup from '@/components/ui/input-group/index.js';
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof InputGroup.Input>, 'type' | 'value' | 'files'> & {
		value?: string;
		suggestedDomain?: string;
	};

	let {
		value = $bindable(''),
		ref = $bindable(null),
		placeholder = 'name@gmail.com',
		autocomplete = 'email',
		inputmode = 'email',
		suggestedDomain = '@gmail.com',
		disabled = false,
		class: className,
		...restProps
	}: Props = $props();

	const domainSuffix = $derived(
		suggestedDomain.trim()
			? suggestedDomain.trim().startsWith('@')
				? suggestedDomain.trim()
				: `@${suggestedDomain.trim()}`
			: ''
	);
	const canSuggestDomain = $derived(
		Boolean(value.trim() && !value.includes('@') && domainSuffix && !disabled)
	);

	function applySuggestedDomain() {
		const localPart = value.trim();

		if (!localPart || localPart.includes('@') || !domainSuffix) return;

		value = `${localPart}${domainSuffix}`;
	}
</script>

<InputGroup.Root class={className}>
	<InputGroup.Addon align="inline-start">
		<span class="icon-[lucide--mail]" aria-hidden="true" ></span>
	</InputGroup.Addon>

	<InputGroup.Input
		bind:ref
		bind:value
		type="email"
		{placeholder}
		{autocomplete}
		{inputmode}
		{disabled}
		{...restProps}
	/>

	{#if canSuggestDomain}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				type="button"
				aria-label={`Use ${domainSuffix}`}
				title={`Use ${domainSuffix}`}
				onclick={applySuggestedDomain}
			>
				{domainSuffix}
			</InputGroup.Button>
		</InputGroup.Addon>
	{/if}
</InputGroup.Root>

<style>
	/* Keep browser autofill from replacing the InputGroup surface with its blue fill. */
	:global(input[data-slot='input-group-control']:-webkit-autofill),
	:global(input[data-slot='input-group-control']:-webkit-autofill:hover),
	:global(input[data-slot='input-group-control']:-webkit-autofill:focus),
	:global(input[data-slot='input-group-control']:-webkit-autofill:active) {
		-webkit-text-fill-color: var(--foreground);
		-webkit-box-shadow: 0 0 0 1000px transparent inset;
		box-shadow: 0 0 0 1000px transparent inset;
		background-color: transparent !important;
		transition: background-color 9999s ease-in-out 0s;
	}
</style>
