// LIBRARIES
import { isRateLimitError } from '@convex-dev/rate-limiter';

// COMPONENTS
import { toast } from 'svelte-sonner';

type ToastSuccessMessage = {
	type: 'success';
	message: string;
};

type ToastErrorMessage<ErrorValue> = {
	type: 'error';
	error: ErrorValue;
	message: string;
};

type ToastMessageRequest<ErrorValue> = ToastSuccessMessage | ToastErrorMessage<ErrorValue>;

export function formatRateLimitMessage(
	input?: number | string | null,
	fallback = ''
): string {
	if (typeof input === 'string' && input) return input;
	if (typeof input !== 'number' || input <= 0) {
		return fallback || 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.';
	}

	if (input < 60_000) {
		const seconds = Math.ceil(input / 1000);
		return `Demasiadas solicitudes. Inténtalo de nuevo en ${seconds}s.`;
	}

	return `Demasiadas solicitudes. Inténtalo de nuevo en ${Math.ceil(input / 60_000)} min.`;
}

/** Route toast display while keeping all user-facing wording in the calling component. */
export function toastMessage<ErrorValue>(request: ToastMessageRequest<ErrorValue>): void {
	if (request.type === 'success') {
		toast.success(request.message);
		return;
	}

	if (isRateLimitError(request.error)) {
		toast.error(formatRateLimitMessage(request.error.data.retryAfter));
		return;
	}

	toast.error(request.message);
}
