export type PreviewFile =
	| { id: string; file: File; url: string; key?: never }
	| { id: string; key: string; url: string; file?: never };
