<script lang="ts">
	// LIBRARIES
	import { onMount } from 'svelte';

	// COMPONENTS
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	type Option = { value: string; label: string };

	let {
		options,
		value = $bindable(''),
		onchange,
		placeholder = 'Select…',
		label,
		class: className
	}: {
		options: Option[];
		value?: string;
		onchange?: (value: string) => void;
		placeholder?: string;
		label?: string;
		class?: string;
	} = $props();

	let unsupported = $state(false);

	onMount(() => {
		unsupported = !CSS.supports('appearance', 'base-select');
	});

	const selectedLabel = $derived(
		options.find((option) => option.value === value)?.label ?? placeholder
	);
	const displayOptions = $derived(
		options.some((option) => option.value === '')
			? options
			: [{ value: '', label: placeholder }, ...options]
	);

	function setValue(nextValue: string): void {
		if (nextValue === value) return;

		value = nextValue;
		onchange?.(nextValue);
	}

	function handleNativeChange(event: Event): void {
		if (!(event.currentTarget instanceof HTMLSelectElement)) return;

		setValue(event.currentTarget.value);
	}
</script>

{#if unsupported}
	<Select type="single" {value} onValueChange={setValue}>
		<SelectTrigger class={cn('w-fit', className)} aria-label={label}>
			{selectedLabel}
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				{#each displayOptions as option (option.value)}
					<SelectItem value={option.value} label={option.label}>{option.label}</SelectItem>
				{/each}
			</SelectGroup>
		</SelectContent>
	</Select>
{:else}
	<select
		data-native-select
		{value}
		oninput={handleNativeChange}
		onchange={handleNativeChange}
		aria-label={label}
		class={cn('native-select', className)}
	>
		{#each displayOptions as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
{/if}

<style>
	:global(select.native-select) {
		height: 2.25rem;
		width: fit-content;
		cursor: pointer;
		border: 1px solid transparent;
		border-radius: var(--radius-3xl);
		background-color: color-mix(in oklab, var(--input) 50%, transparent);
		padding: 0 0.75rem;
		color: var(--foreground);
		font-size: 0.875rem;
		line-height: 1.25rem;
		outline: none;
		transition:
			color 150ms,
			box-shadow 150ms,
			background-color 150ms;
	}

	:global(select.native-select:hover) {
		background-color: color-mix(in oklab, var(--input) 70%, transparent);
	}

	:global(select.native-select:focus-visible) {
		border-color: var(--ring);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 40%, transparent);
	}

	@supports (appearance: base-select) {
		:global(select.native-select),
		:global(select.native-select::picker(select)) {
			appearance: base-select;
		}

		:global(select.native-select) {
			display: inline-flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 0.75rem;
		}

		:global(select.native-select::picker-icon) {
			width: 1rem;
			height: 1rem;
			flex-shrink: 0;
			background-color: var(--muted-foreground);
			transition: transform 150ms ease;
			mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
				center / contain no-repeat;
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
				center / contain no-repeat;
		}

		:global(select.native-select:open::picker-icon) {
			transform: rotate(180deg);
		}

		:global(select.native-select::picker(select)) {
			margin-top: 0.25rem;
			border: 1px solid var(--border);
			border-radius: var(--radius-3xl);
			background-color: var(--popover);
			padding: 0.25rem;
			color: var(--popover-foreground);
			box-shadow:
				0 10px 15px -3px rgb(0 0 0 / 0.1),
				0 4px 6px -4px rgb(0 0 0 / 0.1);
		}

		:global(select.native-select option) {
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-radius: var(--radius-2xl);
			padding: 0.5rem 0.75rem;
			color: var(--popover-foreground);
			font-size: 0.875rem;
			font-weight: 500;
			transition:
				background-color 150ms,
				color 150ms;
		}

		:global(select.native-select option:hover),
		:global(select.native-select option:focus) {
			background-color: var(--accent);
			color: var(--accent-foreground);
		}

		:global(select.native-select option::checkmark) {
			order: 2;
			color: var(--primary);
		}
	}
</style>
