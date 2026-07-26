<script lang="ts">
	// SVELTE
	import { onMount, type Snippet } from 'svelte';

	// COMPONENTS (bits-ui fallback — imported directly to avoid a barrel import cycle)
	import Select from './select.svelte';
	import SelectTrigger from './select-trigger.svelte';
	import SelectContent from './select-content.svelte';
	import SelectItem from './select-item.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	export type SelectOption = {
		value: string;
		label: string;
		disabled?: boolean;
	};

	type Props = {
		/** Selected value (bindable). */
		value?: string;
		options: SelectOption[];
		/** Shown before a value is chosen. */
		placeholder?: string;
		name?: string;
		id?: string;
		disabled?: boolean;
		required?: boolean;
		/** Classes on the control (the closed select / trigger button). */
		class?: string;
		ariaLabel?: string;
		ariaInvalid?: boolean;
		ariaDescribedby?: string;
		onChange?: (value: string) => void;
		/** Custom content per option (rich markup); falls back to `label`. */
		option?: Snippet<[SelectOption]>;
	};

	let {
		value = $bindable(),
		options,
		placeholder,
		name,
		id,
		disabled = false,
		required = false,
		class: className,
		ariaLabel,
		ariaInvalid,
		ariaDescribedby,
		onChange,
		option
	}: Props = $props();

	// Render the native customizable <select> where the browser supports styling it, and
	// fall back to the bits-ui dropdown where it doesn't. Default to native (a real <select>
	// works everywhere), so SSR + hydration match and only unsupported browsers swap on mount.
	let useNative = $state(true);
	onMount(() => {
		useNative = CSS.supports('appearance', 'base-select');
	});

	const selectedOption = $derived(options.find((o) => o.value === value));
</script>

{#if useNative}
	<!--
		Everywhere: the OS-native dropdown (zero JS, accessible). Chromium / Safari 26+
		(appearance: base-select) additionally style the ::picker popup and each <option>
		via the @supports block below.
	-->
	<select
		bind:value
		{name}
		{id}
		{disabled}
		{required}
		aria-label={ariaLabel}
		aria-invalid={ariaInvalid}
		aria-describedby={ariaDescribedby}
		class={cn('select', className)}
		onchange={(e) => onChange?.(e.currentTarget.value)}
	>
		{#if placeholder}
			<option value="" disabled hidden>{placeholder}</option>
		{/if}

		{#each options as opt (opt.value)}
			<option value={opt.value} disabled={opt.disabled}>
				{#if option}
					{@render option(opt)}
				{:else}
					{opt.label}
				{/if}
			</option>
		{/each}
	</select>
{:else}
	<!-- Fallback for Firefox / older Safari: the bits-ui styled dropdown. -->
	<Select
		type="single"
		bind:value
		{name}
		{disabled}
		{required}
		onValueChange={(v: string) => onChange?.(v ?? '')}
	>
		<SelectTrigger
			{id}
			class={cn('w-full', className)}
			aria-label={ariaLabel}
			aria-invalid={ariaInvalid ? 'true' : undefined}
			aria-describedby={ariaDescribedby}
		>
			{#if selectedOption}
				{#if option}
					{@render option(selectedOption)}
				{:else}
					{selectedOption.label}
				{/if}
			{:else}
				<span class="text-muted-foreground">{placeholder ?? ''}</span>
			{/if}
		</SelectTrigger>

		<SelectContent>
			{#each options as opt (opt.value)}
				<SelectItem value={opt.value} label={opt.label} disabled={opt.disabled}>
					{#if option}
						{@render option(opt)}
					{:else}
						{opt.label}
					{/if}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>
{/if}

<style>
	/* ---- Baseline: works in every browser (native dropdown, styled closed state) ---- */
	.select {
		appearance: none;
		-webkit-appearance: none;
		display: inline-flex;
		align-items: center;
		width: 100%;
		min-height: 2.25rem;
		padding: 0.375rem 2rem 0.375rem 0.75rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: var(--foreground);
		background-color: var(--background);
		border: 1px solid var(--input, var(--border));
		border-radius: var(--radius, 0.5rem);
		cursor: pointer;
		outline: none;
		/* Chevron (native arrow is removed by appearance:none). */
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23510128' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
		background-repeat: no-repeat;
		background-position: right 0.625rem center;
	}

	.select:focus-visible {
		border-color: var(--ring);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 40%, transparent);
	}

	.select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ---- Enhancement: fully styleable native select where supported ---- */
	@supports (appearance: base-select) {
		.select,
		.select::picker(select) {
			appearance: base-select;
		}

		/* Hide the browser's default arrow; keep our single background chevron. */
		.select::picker-icon {
			display: none;
		}

		.select::picker(select) {
			border: 1px solid var(--border);
			border-radius: var(--radius, 0.5rem);
			background: var(--popover);
			color: var(--popover-foreground);
			box-shadow: var(--shadow-brand-elevated);
			padding: 0.25rem;
			margin-top: 0.25rem;
			/* Open/close animation. */
			opacity: 0;
			transition:
				opacity 0.15s ease,
				overlay 0.15s ease allow-discrete,
				display 0.15s ease allow-discrete;
		}

		.select:open::picker(select) {
			opacity: 1;
		}

		@starting-style {
			.select:open::picker(select) {
				opacity: 0;
			}
		}

		.select option {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.375rem 0.5rem;
			border-radius: 0.375rem;
			font-size: 0.875rem;
			cursor: pointer;
		}

		.select option:hover,
		.select option:focus {
			background: var(--accent);
			color: var(--accent-foreground);
			outline: none;
		}

		.select option:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* Native tick on the selected option, pushed to the right. The pseudo-element is
		   generated BEFORE the option's content, so it needs `order` to sit last — with
		   `margin-left: auto` alone the free space lands on its left and shoves every
		   label to the right edge. */
		.select option::checkmark {
			order: 1;
			margin-left: auto;
			color: var(--primary, currentColor);
		}
	}
</style>
