// All storage types live here — consumers import from this file only.

/** Client-side image optimization (browser-image-compression → WebP). */
export type ClientOptimizeOptions = {
	/** Longest side in px after resize. */
	maxWidthOrHeight?: number;
	/** Target max output size in MB. */
	maxSizeMB?: number;
	/** Output quality 0–1. */
	quality?: number;
};
