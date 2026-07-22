// UTILS
import { INTL_LOCALE } from './intlLocale';

/** Locale-aware currency formatting via `Intl` (major units, e.g. dollars). */
export function formatMoney(amount: number, currency = 'USD'): string {
	return new Intl.NumberFormat(INTL_LOCALE, { style: 'currency', currency }).format(amount);
}

/**
 * Minor-unit exponent for a currency via `Intl` — 2 for USD/EUR/MXN, 0 for JPY/KRW,
 * 3 for KWD. Never a hardcoded `100`.
 */
export function moneyMinorDigits(currency = 'USD'): number {
	return (
		new Intl.NumberFormat(INTL_LOCALE, { style: 'currency', currency }).resolvedOptions()
			.maximumFractionDigits ?? 2
	);
}

/** Major → integer minor units for a currency (e.g. 12.5 USD → 1250). */
export function toMinorUnits(major: number, currency = 'USD'): number {
	return Math.round(major * 10 ** moneyMinorDigits(currency));
}

/** Integer minor units → major for a currency (e.g. 1250 USD → 12.5). */
export function fromMinorUnits(minor: number, currency = 'USD'): number {
	return minor / 10 ** moneyMinorDigits(currency);
}

/** Long-form localized date from an epoch-ms timestamp, e.g. "22 de julio de 2026". */
export function formatDateLong(epochMs: number): string {
	return new Intl.DateTimeFormat(INTL_LOCALE, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(epochMs));
}

/**
 * Locale-aware currency formatting from MINOR units (e.g. cents). The minor-unit
 * exponent is derived from the currency via `Intl`, so this is correct for
 * 2-decimal currencies (USD/EUR/MXN), 0-decimal (JPY/KRW), and 3-decimal (KWD)
 * alike — never a hardcoded `/100`.
 */
export function formatMoneyMinor(minor: number, currency = 'USD'): string {
	return new Intl.NumberFormat(INTL_LOCALE, { style: 'currency', currency }).format(
		fromMinorUnits(minor, currency)
	);
}
