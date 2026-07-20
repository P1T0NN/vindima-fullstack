// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { optimizeImages } from '@/features/uploadFile/utils/optimizeImages';

// TYPES
import type { MutationFormProgress, MutationFormSection } from './types.js';

export type MutationFormUploadOne = (file: File) => Promise<string | null>;

/**
 * Walks `sections`, finds upload-single / upload-multiple fields, optimizes and uploads
 * their Files, and replaces each entry in `args` with the resulting storage id(s).
 * Returns `false` if the submission should abort (errors are toasted internally).
 */
export async function processUploadFields(params: {
	sections: MutationFormSection[];
	args: Record<string, unknown>;
	progress: MutationFormProgress;
	uploadOne: MutationFormUploadOne;
}): Promise<boolean> {
	const { sections, args, progress, uploadOne } = params;

	for (const section of sections) {
		for (const f of section.fields) {
			if (f.kind !== 'upload-single' && f.kind !== 'upload-multiple') continue;

			const isSingle = f.kind === 'upload-single';
			const raw = args[f.id];
			const selected: File[] = isSingle
				? raw
					? [raw as File]
					: []
				: ((raw as File[] | undefined) ?? []);

			if (!selected.length) {
				args[f.id] = isSingle ? null : [];
				continue;
			}

			try {
				const optimized = await optimizeImages(selected, undefined, progress.setOptimizeProgress);

				const uploaded: string[] = [];
				const n = optimized.length;
				for (let j = 0; j < n; j++) {
					progress.beforeUploadFile(j + 1, n);
					const result = await uploadOne(optimized[j]);
					progress.afterUploadFile(j + 1, n);
					if (!result) return false;
					uploaded.push(result);
				}

				args[f.id] = isSingle ? (uploaded[0] ?? null) : uploaded;
			} catch (err) {
				toast.error(err instanceof Error ? err.message : String(err));
				return false;
			}
		}
	}

	return true;
}

export function hasUploadFields(sections: MutationFormSection[]): boolean {
	return sections.some((s) =>
		s.fields.some((f) => f.kind === 'upload-single' || f.kind === 'upload-multiple')
	);
}
