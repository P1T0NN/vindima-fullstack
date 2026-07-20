/** One inline validation message per field key. */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;
