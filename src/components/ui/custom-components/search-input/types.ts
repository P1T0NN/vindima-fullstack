// TYPES
import type { WithElementRef } from '@/utils/utils.js';
import type { HTMLInputAttributes } from 'svelte/elements';

export type SearchInputItem = {
	id: string;
	title: string;
	description?: string;
	category?: string;
	/** Thumbnail for the leading square. Falls back to the title's initial when absent. */
	imageUrl?: string;
};

export type SearchInputSelectHandler = (item: SearchInputItem) => void;

export type SearchInputBaseProps = WithElementRef<
	Omit<HTMLInputAttributes, 'type' | 'value' | 'onselect' | 'files'>,
	HTMLInputElement
> & {
	value?: string;
	dropdownClass?: string;
	minQueryLength?: number;
	maxResults?: number;
	loadingText?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	selectValueOnSelect?: boolean;
	/**
	 * Id of the item whose selection is still being processed. That row shows a spinner and
	 * stops responding; the rest of the list stays usable. Pair with {@link keepOpenOnSelect},
	 * otherwise the dropdown closes before the spinner can be seen.
	 */
	pendingId?: string | null;
	/** Keep the dropdown open after a selection — for pickers that act on the item in place. */
	keepOpenOnSelect?: boolean;
	onSelect?: SearchInputSelectHandler;
	/**
	 * Backward-compatible alias. Prefer `onSelect` for new usage because this is
	 * selection, not a raw pointer interaction.
	 */
	onClick?: SearchInputSelectHandler;
};

export type SearchInputProps = SearchInputBaseProps & {
	items?: SearchInputItem[];
	loading?: boolean;
	error?: string | null;
	showEmpty?: boolean;
};

export type SearchInputLocalProps = SearchInputBaseProps & {
	items: SearchInputItem[];
	filter?: (item: SearchInputItem, search: string) => boolean;
};

export type SearchInputResultPayload<TRow> =
	| SearchInputItem[]
	| TRow[]
	| {
			page?: TRow[];
	  };

export type SearchInputRemoteSearchParams = {
	search: string;
	maxResults: number;
	cursor?: string | null;
};

export type SearchInputRemoteCommandInput<Source extends string = string> =
	SearchInputRemoteSearchParams & {
		source: Source;
	};

export type SearchInputRemoteCommandResult = {
	page: SearchInputItem[];
	isDone: boolean;
	continueCursor: string;
};

export type SearchInputRemoteProps<TRow = SearchInputItem> = SearchInputBaseProps & {
	search: (params: SearchInputRemoteSearchParams) => Promise<SearchInputResultPayload<TRow>>;
	mapItem?: (row: TRow) => SearchInputItem;
	searchDebounceMs?: number;
	getErrorMessage?: (error: unknown) => string;
};

export type SearchDropdownProps = {
	listboxId: string;
	inputId: string;
	items: SearchInputItem[];
	activeIndex?: number;
	dropdownClass?: string;
	loading?: boolean;
	error?: string | null;
	loadingText?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	pendingId?: string | null;
	/** Inline `left/width` plus `top` or `bottom`, computed by the field (fixed positioning). */
	positionStyle?: string;
	/** Room available in the chosen direction — caps the scrollable result list. */
	maxHeight?: number;
	onActiveIndexChange?: (index: number) => void;
	onSelect: (item: SearchInputItem) => void;
};

export type SearchDropdownItemProps = {
	item: SearchInputItem;
	optionId: string;
	active: boolean;
	/** Selection is in flight for this row: spinner in place of the affordance, no re-entry. */
	pending?: boolean;
	onSelect: () => void;
	onHover: () => void;
};
