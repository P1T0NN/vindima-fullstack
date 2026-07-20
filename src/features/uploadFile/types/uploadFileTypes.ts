/** One list entry — a freshly picked `File`, or an already-uploaded image's URL/ref
 *  (edit flows seed these so existing images can be reordered/removed without re-upload). */
export type UploadFileEntry = File | string;

export type UploadFileRow = {
	file: UploadFileEntry;
	index: number;
	previewUrl: string | null;
};
