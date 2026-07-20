// TYPES
import type { ColumnDef, ColumnHideBelow } from './types.js';

export function breakpointTableClass(hideBelow: ColumnHideBelow | undefined): string {
	if (hideBelow === 'sm') return 'hidden sm:table-cell';
	if (hideBelow === 'md') return 'hidden md:table-cell';
	if (hideBelow === 'lg') return 'hidden lg:table-cell';
	return '';
}

export function showColumnInMobileCard<T>(col: ColumnDef<T>): boolean {
	return col.hideBelow !== 'md' && col.hideBelow !== 'lg';
}

export function formatCellValue(value: unknown): string {
	if (value === null || value === undefined) return '—';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (value instanceof Date) return value.toLocaleString();
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export function defaultRowKey<T extends Record<string, unknown>>(row: T, index: number): string {
	const id = row._id;
	if (typeof id === 'string') return id;
	const legacyId = row.id;
	if (typeof legacyId === 'string') return legacyId;
	return `row-${index}`;
}
