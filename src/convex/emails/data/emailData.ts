// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN ?? `https://${COMPANY_DATA.DOMAIN}`;
const BRAND_MARK = COMPANY_DATA.NAME.trim().charAt(0).toUpperCase();

export const EMAIL_DATA = {
	BRAND: {
		NAME: COMPANY_DATA.NAME,
		MARK: BRAND_MARK,
		URL: PUBLIC_ORIGIN
	},
	COLORS: {
		// Light-theme equivalents of the tokens in src/routes/layout.css.
		BACKGROUND: '#ffffff',
		FOREGROUND: '#18181b',
		CARD: '#ffffff',
		CARD_FOREGROUND: '#18181b',
		PRIMARY: '#27272a',
		PRIMARY_FOREGROUND: '#fafafa',
		SECONDARY: '#f4f4f5',
		SECONDARY_FOREGROUND: '#27272a',
		MUTED: '#f4f4f5',
		MUTED_FOREGROUND: '#71717a',
		ACCENT: '#f4f4f5',
		ACCENT_FOREGROUND: '#27272a',
		DESTRUCTIVE: '#dc2626',
		BORDER: '#e4e4e7',
		INPUT: '#e4e4e7',
		RING: '#a1a1aa'
	},
	TYPOGRAPHY: {
		FONT_FAMILY: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		MONOSPACE: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
	},
	LAYOUT: {
		CONTENT_WIDTH: '600px',
		OUTER_PADDING: '24px',
		CARD_PADDING: '40px 32px',
		CARD_RADIUS: '12px'
	}
} as const;
