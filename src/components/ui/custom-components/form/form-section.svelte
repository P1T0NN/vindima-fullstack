<script lang="ts">
	// COMPONENTS
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '@/components/ui/card/index.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FieldConfig, FormSection } from './formTypes.js';

	type Props = {
		field: FormSection;
		renderField: Snippet<[FieldConfig]>;
	};

	let { field, renderField }: Props = $props();

	const fieldKey = (field: FieldConfig, index: number) =>
		field.kind === 'section' ? `section-${index}` : field.name;
</script>

<Card class={field.class}>
	{#if field.title}
		<CardHeader>
			<CardTitle>{field.title}</CardTitle>
			{#if field.description}
				<CardDescription>{field.description}</CardDescription>
			{/if}
		</CardHeader>
	{/if}
	<CardContent>
		<div class="flex flex-col gap-6">
			{#each field.fields as sub, subIndex (fieldKey(sub, subIndex))}
				{@render renderField(sub)}
			{/each}
		</div>
	</CardContent>
</Card>
