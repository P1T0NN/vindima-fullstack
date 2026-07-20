<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Progress } from '@/components/ui/progress/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// HOOKS
	import { useProgress } from '@/features/uploadFile/utils/useProgress.svelte';

	// UTILS
	import { optimizeImages } from '@/features/uploadFile/utils/optimizeImages';
	import { uploadFileToR2 } from '@/utils/convexHelpers';

	type Props = {
		file: File | null;
		files: File[];
		multipleFiles: boolean;
	};

	let { file, files, multipleFiles }: Props = $props();

	let saving = $state(false);

	const convex = useConvexClient();
	const progress = useProgress();

	const hasSelection = $derived(multipleFiles ? files.length > 0 : file !== null);

	async function save() {
		const selected: File[] = multipleFiles ? [...files] : file ? [file] : [];
		if (!selected.length || saving) return;

		saving = true;
		progress.start();
		try {
			const n = selected.length;

			const optimizedImages = await optimizeImages(selected, undefined, progress.setOptimizeProgress);

			// R2 is the only storage backend (the Convex-storage path was removed).
			const uploadOne = uploadFileToR2;
			const uploaded: string[] = [];
			for (let j = 0; j < optimizedImages.length; j++) {
				const f = optimizedImages[j];
				const fileNum = j + 1;

				progress.beforeUploadFile(fileNum, n);
				const result = await uploadOne(convex, f);
				progress.afterUploadFile(fileNum, n);

				if (!result) return; // error already toasted by safeMutation
				uploaded.push(result);
			}

			progress.markDone();

			toast.success(
				multipleFiles
					? `Se guardaron ${uploaded.length} archivo(s)`
					: `Guardado: ${optimizedImages[0]?.name ?? 'archivo'}`
			);
		} finally {
			saving = false;
			progress.clear();
		}
	}
</script>

{#if saving}
	<div class="flex w-full flex-col gap-2">
		<Progress value={progress.percent} class="h-2" />
		<p class="text-muted-foreground text-xs tabular-nums">{progress.label}</p>
	</div>
{/if}

<Button type="button" class="w-full" disabled={!hasSelection || saving} onclick={save}>
	{#if saving}
		<Spinner />
	{/if}
	Guardar
</Button>
