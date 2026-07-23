// CONFIG
import { INTL_LOCALE } from '@/utils/intlLocale.js';

export const defaultXAxisFormat = (v: unknown) => {
	if (v instanceof Date) {
		return v.toLocaleDateString(INTL_LOCALE, { month: 'short' });
	}
	return String(v);
};

export const defaultLabelFormatter = (v: unknown) => {
	if (v instanceof Date) {
		return v.toLocaleDateString(INTL_LOCALE, { month: 'long' });
	}
	return String(v);
};
