<script lang="ts">
	// COMPONENTS
	import UploadFileSingle from '@/features/uploadFile/components/upload-file-single/upload-file-single.svelte';
	import UploadFileMultiple from '@/features/uploadFile/components/upload-file-multiple/upload-file-multiple.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/index.js';

	// TYPES
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue,
		invalid = false
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
		/** Schema validation failed for this field — paints the dropzone destructive. */
		invalid?: boolean;
	} = $props();

	/**
	 * Which source the admin is using. Local UI state only — the bound value is the same
	 * either way (a `File` to upload, or a URL string used verbatim), so switching tabs
	 * never discards what the other tab holds.
	 *
	 * Always starts on the picker: an edit form seeds an existing image as a URL string, and
	 * `UploadFileSingle` already renders that as a preview + "Reemplazar", which is friendlier
	 * than dropping the admin into a text box full of a long URL.
	 */
	let mode = $state<'upload' | 'url'>('upload');

	const urlText = $derived(typeof value === 'string' ? value : '');
</script>

{#if field.kind === 'upload-single' && field.allowUrl}
	<Tabs bind:value={mode} class="w-full max-w-md gap-3">
		<TabsList class="w-full">
			<TabsTrigger value="upload">Subir archivo</TabsTrigger>
			<TabsTrigger value="url">Usar una URL</TabsTrigger>
		</TabsList>

		<TabsContent value="upload">
			<UploadFileSingle
				id={inputId}
				accept={field.accept}
				disabled={field.disabled}
				{invalid}
				bind:file={() => (value as File | null) ?? null, (v) => setValue(v)}
			/>
		</TabsContent>

		<TabsContent value="url">
			<Input
				id="{inputId}-url"
				type="url"
				value={urlText}
				placeholder="/images/tabla.webp o https://…"
				disabled={field.disabled}
				aria-invalid={invalid ? 'true' : undefined}
				oninput={(e) => setValue(e.currentTarget.value.trim() || null)}
			/>
			<p class="mt-1.5 text-xs text-muted-foreground">
				Una imagen del proyecto (empieza con <code>/</code>) o una dirección completa
				(<code>https://…</code>). No se sube nada.
			</p>
		</TabsContent>
	</Tabs>
{:else if field.kind === 'upload-single'}
	<UploadFileSingle
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		{invalid}
		bind:file={() => (value as File | null) ?? null, (v) => setValue(v)}
	/>
{:else if field.kind === 'upload-multiple'}
	<UploadFileMultiple
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		hasCoverImage={field.hasCoverImage}
		{invalid}
		bind:files={() => (value as (File | string)[]) ?? [], (v) => setValue(v)}
	/>
{/if}
