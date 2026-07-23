<script lang="ts">
	// Empty state for a ranked revenue list — shown when the period has no sales.

	// COMPONENTS
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		title,
		emptyText,
		class: className
	}: { title: string; emptyText: string; class?: string } = $props();
</script>

<Card class={cn('gap-3', className)}>
	<CardHeader>
		<CardTitle class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
			{title}
		</CardTitle>
	</CardHeader>
	<CardContent>
		<p class="flex h-24 items-center justify-center text-sm text-muted-foreground">
			{emptyText}
		</p>
	</CardContent>
</Card>
