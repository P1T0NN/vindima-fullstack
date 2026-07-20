#!/usr/bin/env node
/**
 * Optimizes every image in one or more folders into responsive WebP variants.
 *
 * Usage:
 *   bun run optimize-images
 *   bun scripts/optimize-images.mjs <folder> [folder2 ...] [options]
 *
 * With no folders: scans ./static — each subfolder that contains images gets its
 * own <folder>/opt/ output; top-level static/*.png also uses static/opt/.
 *
 * Folders are resolved in this order: as given (absolute or relative to cwd),
 * then relative to ./static. So all of these work:
 *   bun scripts/optimize-images.mjs logo
 *   bun scripts/optimize-images.mjs static/root root/testimonials
 *   bun scripts/optimize-images.mjs "C:/some/abs/path"
 *
 * Options:
 *   --sizes 640,960,1280,1536   Responsive widths to emit (default below)
 *   --quality 75                WebP quality 1-100 (default 75)
 *   --out opt                   Output subfolder name (default "opt")
 *   --no-recursive              Only the top level of the folder, no subfolders
 *
 * For each image, widths larger than the source are skipped (no upscaling).
 * Output is written to <folder>/<out>/... mirroring any subfolder structure.
 */
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, relative, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATIC = join(ROOT, 'static');

const DEFAULT_SIZES = [640, 960, 1280, 1536];
const DEFAULT_QUALITY = 75;
const DEFAULT_OUT = 'opt';
const IMAGE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif', '.tiff', '.gif']);

function parseArgs(argv) {
	const folders = [];
	const opts = {
		sizes: DEFAULT_SIZES,
		quality: DEFAULT_QUALITY,
		out: DEFAULT_OUT,
		recursive: true
	};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--no-recursive') opts.recursive = false;
		else if (a === '--recursive') opts.recursive = true;
		else if (a === '--sizes')
			opts.sizes = argv[++i].split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
		else if (a === '--quality') opts.quality = parseInt(argv[++i], 10);
		else if (a === '--out') opts.out = argv[++i];
		else if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
		else folders.push(a);
	}
	return { folders, opts };
}

/** Resolve a folder arg against cwd, then against ./static. */
function resolveFolder(name) {
	const candidates = [name, join(STATIC, name)];
	for (const c of candidates) {
		if (existsSync(c)) return c;
	}
	return null;
}

/** Recursively collect image files, skipping the output subfolder. */
async function collectImages(dir, outName, recursive) {
	const found = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === outName) continue; // don't re-optimize our own output
			if (recursive) found.push(...(await collectImages(full, outName, recursive)));
		} else if (entry.isFile() && IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
			found.push(full);
		}
	}
	return found;
}

async function optimizeOne(src, baseDir, opts) {
	const rel = relative(baseDir, src); // e.g. "testimonials/sara.png"
	const name = basename(rel, extname(rel)); // "sara"
	const outDir = join(baseDir, opts.out, dirname(rel)); // "<base>/opt/testimonials"
	await mkdir(outDir, { recursive: true });

	const meta = await sharp(src).metadata();
	const srcWidth = meta.width ?? Math.max(...opts.sizes);

	// Emit each requested width that doesn't upscale, plus the source width
	// itself if it's smaller than the largest requested size.
	const widths = [...new Set(opts.sizes.filter((w) => w <= srcWidth))];
	if (widths.length === 0) widths.push(srcWidth);

	for (const w of widths) {
		await sharp(src)
			.resize(w, null, { withoutEnlargement: true })
			.webp({ quality: opts.quality })
			.toFile(join(outDir, `${name}-${w}w.webp`));
	}
	console.log(`  ✓ ${rel} → ${widths.map((w) => `${w}w`).join(', ')}`);
}

async function optimizeFolder(folderArg, opts, { topLevelOnly = false } = {}) {
	const dir = resolveFolder(folderArg);
	if (!dir) {
		console.warn(`⊘ "${folderArg}" not found (tried ./ and ./static), skipping`);
		return 0;
	}
	const info = await stat(dir);
	if (!info.isDirectory()) {
		console.warn(`⊘ "${folderArg}" is not a folder, skipping`);
		return 0;
	}

	const recursive = topLevelOnly ? false : opts.recursive;
	const images = await collectImages(dir, opts.out, recursive);
	if (images.length === 0) {
		console.warn(`⊘ ${folderArg}: no images found`);
		return 0;
	}

	console.log(`\nOptimizing ${images.length} image(s) in ${folderArg}/`);
	for (const src of images) {
		await optimizeOne(src, dir, opts);
	}
	return images.length;
}

/** Every static subfolder (plus static itself when it has top-level images). */
async function discoverStaticFolders(opts) {
	const found = [];

	const rootImages = await collectImages(STATIC, opts.out, false);
	if (rootImages.length > 0) found.push('static');

	for (const entry of await readdir(STATIC, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name === opts.out) continue;
		const sub = join(STATIC, entry.name);
		const images = await collectImages(sub, opts.out, opts.recursive);
		if (images.length > 0) found.push(entry.name);
	}

	return found;
}

async function main() {
	const { folders: folderArgs, opts } = parseArgs(process.argv.slice(2));
	const folders =
		folderArgs.length > 0 ? folderArgs : await discoverStaticFolders(opts);

	if (folders.length === 0) {
		console.warn('No images found under ./static');
		return;
	}

	if (folderArgs.length === 0) {
		console.log(`Auto-discovered ${folders.length} folder(s): ${folders.join(', ')}`);
	}

	console.log(
		`Sizes: ${opts.sizes.join(', ')} | quality: ${opts.quality} | out: ${opts.out}/ | recursive: ${opts.recursive}`
	);

	try {
		let total = 0;
		const autoStatic = folderArgs.length === 0;
		for (const f of folders) {
			total += await optimizeFolder(f, opts, { topLevelOnly: autoStatic && f === 'static' });
		}
		console.log(`\nDone! Optimized ${total} image(s).`);
	} catch (err) {
		console.error('Error:', err.message);
		process.exit(1);
	}
}

main();
