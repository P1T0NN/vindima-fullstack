// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { optimizeImages } from '@/features/uploadFile/utils/optimizeImages';

// TYPES
import type { MutationFormProgress, MutationFormSection } from './types.js';

export type MutationFormUploadOne = (file: File) => Promise<string | null>;

/**
 * Walks `sections`, finds upload-single / upload-multiple fields, optimizes and uploads
 * their `File` entries, and replaces each entry in `args` with an ordered string list.
 * Existing-image entries (URL/ref strings, seeded by edit flows) pass through IN PLACE —
 * order is preserved, so `entries[0]` stays the cover regardless of the mix.
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
			const entries: Array<File | string> = isSingle
				? raw
					? [raw as File]
					: []
				: ((raw as Array<File | string> | undefined) ?? []);

			if (!entries.length) {
				args[f.id] = isSingle ? null : [];
				continue;
			}

			try {
				// Split: strings keep their slot; Files get optimized + uploaded into theirs.
				const out: string[] = entries.map((e) => (typeof e === 'string' ? e : ''));
				const fileSlots: number[] = [];
				const files: File[] = [];
				entries.forEach((e, i) => {
					if (e instanceof File) {
						fileSlots.push(i);
						files.push(e);
					}
				});

				if (files.length) {
					const optimized = await optimizeImages(files, undefined, progress.setOptimizeProgress);

					const n = optimized.length;
					for (let j = 0; j < n; j++) {
						progress.beforeUploadFile(j + 1, n);
						const result = await uploadOne(optimized[j]);
						progress.afterUploadFile(j + 1, n);
						if (!result) return false;
						out[fileSlots[j]] = result;
					}
				}

				args[f.id] = isSingle ? (out[0] ?? null) : out;
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
