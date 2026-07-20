<script lang="ts">
	// COMPONENTS
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '@/components/ui/card/index.js';
	import { TryAgainErrorButton } from '@/components/ui/try-again-error-button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';

	type ErrorComponentVariant =
		| 'card'
		| 'panel'
		| 'plain'
		| 'minimal'
		| 'alert'
		| 'header'
		| 'content';

	let {
		title,
		description,
		headerDescription,
		body,
		bodyDescription,
		variant = 'card',
		showRetry = true,
		retryLabel = 'Try again',
		message,
		class: className,
		children
	}: {
		title: string;
		description?: string;
		headerDescription?: string;
		body?: string;
		bodyDescription?: string;
		variant?: ErrorComponentVariant;
		showRetry?: boolean;
		retryLabel?: string;
		message?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	const resolvedHeaderDescription = $derived(headerDescription ?? description);
	const resolvedBody = $derived(body ?? (headerDescription ? description : undefined));
	const resolvedBodyDescription = $derived(message ?? bodyDescription);
	const showIcon = $derived(variant !== 'minimal' && variant !== 'header');
	const isEmbedded = $derived(variant === 'content');
	const showCardContent = $derived(
		variant !== 'header' &&
			(showIcon || resolvedBody || resolvedBodyDescription || showRetry || children)
	);
</script>

{#if isEmbedded}
	<div role="alert" class={cn('flex flex-col items-center gap-4 py-8 text-center', className)}>
		{#if showIcon}
			<div
				class="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				aria-hidden="true"
			>
				<AlertTriangleIcon class="size-5" />
			</div>
		{/if}

		<div>
			<p class="text-sm font-medium">{title}</p>
			<p class="mt-1 text-xs text-muted-foreground">{message ?? description}</p>
		</div>

		{#if showRetry}
			<TryAgainErrorButton label={retryLabel} />
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</div>
{:else if variant === 'plain' || variant === 'alert'}
	<div
		role="alert"
		class={cn(
			'flex flex-col items-center justify-center gap-4 p-8 text-center',
			variant === 'plain' && 'rounded-xl border border-border bg-card',
			variant === 'alert' &&
				'rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16',
			className
		)}
	>
		{#if showIcon}
			<div
				class="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				aria-hidden="true"
			>
				<AlertTriangleIcon class="size-6" />
			</div>
		{/if}

		<div class="flex flex-col gap-1">
			<h2 class="text-lg font-semibold">{title}</h2>
			<p class="max-w-sm text-sm text-muted-foreground">
				{message ?? description}
			</p>
			{#if bodyDescription && !message}
				<p class="max-w-sm text-sm text-muted-foreground">{bodyDescription}</p>
			{/if}
		</div>

		{#if showRetry}
			<TryAgainErrorButton label={retryLabel} />
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</div>
{:else if variant === 'minimal'}
	<div
		role="alert"
		class={cn('rounded-xl border border-border bg-card px-4 py-8 text-center', className)}
	>
		<h2 class="text-lg font-semibold">{title}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{message ?? description}</p>
		{#if showRetry}
			<div class="mt-4 flex justify-center">
				<TryAgainErrorButton label={retryLabel} />
			</div>
		{/if}
		{#if children}
			<div class="mt-4">{@render children()}</div>
		{/if}
	</div>
{:else}
	<Card
		class={cn('overflow-hidden py-0', variant === 'panel' && 'border-border', className)}
		role="alert"
	>
		<CardHeader class={cn(variant === 'panel' && 'border-b border-border/60 bg-muted/20')}>
			<CardTitle>{title}</CardTitle>
			<CardDescription>{resolvedHeaderDescription}</CardDescription>
		</CardHeader>

		{#if showCardContent}
			<CardContent
				class={cn(
					'flex flex-col items-center gap-4 py-8 text-center',
					variant === 'panel' && 'gap-5 px-6 py-10 sm:py-12'
				)}
			>
				{#if showIcon}
					<div
						class={cn(
							'flex items-center justify-center rounded-full bg-destructive/10 text-destructive',
							variant === 'panel' ? 'size-14' : 'size-12'
						)}
						aria-hidden="true"
					>
						<AlertTriangleIcon class={variant === 'panel' ? 'size-6' : 'size-5'} />
					</div>
				{/if}

				{#if resolvedBody || resolvedBodyDescription}
					<div class="flex max-w-md flex-col gap-2">
						{#if resolvedBody}
							<p class="text-sm font-medium text-foreground">{resolvedBody}</p>
						{/if}
						{#if resolvedBodyDescription}
							<p class="text-sm text-muted-foreground">{resolvedBodyDescription}</p>
						{/if}
					</div>
				{/if}

				{#if showRetry}
					<TryAgainErrorButton label={retryLabel} />
				{/if}

				{#if children}
					{@render children()}
				{/if}
			</CardContent>
		{/if}
	</Card>
{/if}
