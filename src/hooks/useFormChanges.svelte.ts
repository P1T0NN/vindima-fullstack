// SVELTEKIT IMPORTS
import { untrack } from 'svelte';

type FormValues = Record<string, unknown>;

type FormChanges<T extends FormValues> = {
	values: T;
	readonly isDirty: boolean;
	readonly changedValues: Partial<T>;
};

function areEqual(left: unknown, right: unknown, seen = new WeakMap<object, object>()): boolean {
	if (Object.is(left, right)) return true;
	if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
		return false;

	if (left instanceof Date || right instanceof Date) {
		return (
			left instanceof Date && right instanceof Date && Object.is(left.getTime(), right.getTime())
		);
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
		return left.every((value, index) => areEqual(value, right[index], seen));
	}

	if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;

	const matched = seen.get(left);
	if (matched) return matched === right;
	seen.set(left, right);

	const leftRecord = left as Record<string, unknown>;
	const rightRecord = right as Record<string, unknown>;
	const leftKeys = Object.keys(leftRecord);
	const rightKeys = Object.keys(rightRecord);
	if (leftKeys.length !== rightKeys.length) return false;

	return leftKeys.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(rightRecord, key) &&
			areEqual(leftRecord[key], rightRecord[key], seen)
	);
}

export function getChangedValues<T extends FormValues>(
	initialValues: T,
	currentValues: T
): Partial<T> {
	const changedValues: Partial<T> = {};
	const keys = Object.keys({ ...initialValues, ...currentValues }) as Array<keyof T>;

	for (const key of keys) {
		if (!areEqual(initialValues[key], currentValues[key])) changedValues[key] = currentValues[key];
	}

	return changedValues;
}

export function useFormChanges<T extends FormValues>(getInitialValues: () => T): FormChanges<T> {
	let values = $state(getInitialValues());
	const initialSnapshot = untrack(() => $state.snapshot(values) as T);
	const changedValues = $derived.by(() =>
		getChangedValues(initialSnapshot, $state.snapshot(values) as T)
	);

	return {
		get values() {
			return values;
		},
		set values(nextValues: T) {
			values = nextValues;
		},
		get isDirty() {
			return Object.keys(changedValues).length > 0;
		},
		get changedValues() {
			return changedValues;
		}
	};
}
